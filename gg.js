#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import axios from 'axios';
import * as tar from 'tar'
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import gitUrlParse from 'git-url-parse';


const GITHUB_API = 'https://api.github.com/search/repositories';
const RESULTS_PER_PAGE = 10;
const TOKEN = process.env.GITHUB_TOKEN;

function getIdeCommand() {
    const ides = [
        { name: 'Cursor', cmd: 'cursor' },
        { name: 'Windsurf', cmd: 'windsurf' },
        { name: 'VSCode', cmd: 'code' },
        { name: 'Code Server', cmd: 'code-server' },
        { name: 'Neovim', cmd: 'nvim' }
    ];

    for (const ide of ides) {
        try {
            execSync(
                process.platform === 'win32'
                    ? `where ${ide.cmd}`
                    : `command -v ${ide.cmd}`,
                { stdio: 'ignore' }
            );
            return ide;
        } catch (error) {
            continue;
        }
    }
    return null;
}

export function openInIDE(targetDir) {
    const ide = getIdeCommand();
    if (!ide) {
        console.log(chalk.yellow('⚠️  No supported IDE found'));
        return;
    }

    try {
        const args = ide.cmd === 'code-server'
            ? [targetDir, '--open']
            : [targetDir];

        spawn(ide.cmd, args, {
            detached: true,
            stdio: 'ignore',
            shell: process.platform === 'win32'
        }).unref();

        console.log(chalk.green(`🚀 Opening ${path.basename(targetDir)} in ${ide.name}`));
    } catch (error) {
        console.error(chalk.red(`❌ Failed to open ${ide.name}:`), error.message);
    }
}

export async function installDependencies(targetDir) {
    process.chdir(targetDir);

    // Project type detection
    const detectors = {
        nodejs: () => fs.existsSync('package.json'),
        docker: () => fs.existsSync('Dockerfile'),
        python: () => fs.existsSync('requirements.txt') || fs.existsSync('setup.py'),
        rust: () => fs.existsSync('Cargo.toml'),
        go: () => fs.existsSync('go.mod')
    };

    // Install commands for each project type
    const installers = {

        nodejs: () => {
            try {
                execSync(
                    process.platform === 'win32'
                        ? `where bun`
                        : `command -v bun`,
                    { stdio: 'ignore' }
                );
                runCommand('bun install');
                runCommand('bun run dev; bun run start');
            } catch (error) {
                runCommand('npm install');
                runCommand('npm run dev; npm run start');
            }
        },
        docker: () => {
            if (fs.existsSync('docker-compose.yml')) {
                runCommand('sudo docker-compose up -d');
            } else if (fs.existsSync('Dockerfile')) {
                runCommand('sudo docker build -t project .');
            }
        },
        python: () => {
            runCommand('python -m venv .venv');
            runCommand('source .venv/bin/activate');

            if (fs.existsSync('requirements.txt')) {
                runCommand('pip install -r requirements.txt');
            }
            if (fs.existsSync('setup.py')) {
                runCommand('pip install -e .');
            }
        },
        rust: () => runCommand('cargo build'),
        go: () => runCommand('go mod tidy')
    };

    // Run detections and installations
    Object.entries(detectors).forEach(([name, check]) => {
        if (check()) {
            console.log(chalk.yellow(`⚙️  Detected ${name} project`));
            installers[name]?.();
        }
    });
}

function runCommand(cmd) {
    console.log(chalk.cyan(`🚀 Running: ${cmd}`));
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
        console.error(chalk.red(`❌ Failed: ${cmd}`));
    }
}
export async function searchRepositories(query) {
    try {
        const response = await axios.get(GITHUB_API, {
            params: {
                q: `${query} in:name`,
                sort: 'stars',
                order: 'desc',
                per_page: RESULTS_PER_PAGE
            },
            headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {}
        });
        return response.data.items;
    } catch (error) {
        console.error(chalk.red('Search failed:'), error.response?.data?.message || error.message);
        process.exit(1);
    }
}
export async function downloadRepo(repo) {
    const parsed = gitUrlParse(`https://github.com/${repo}`);
    const defaultDir = path.resolve(process.cwd(), parsed.name);
    const extractPath = getAvailableDirectoryName(defaultDir);

    fs.mkdirSync(extractPath, { recursive: true });
    console.log(chalk.blue(`📦 Downloading ${parsed.full_name} into ${path.basename(extractPath)}...`));
    const url = `${parsed.owner}/${parsed.name}/tarball/${parsed.default_branch || 'main'}`;

    fs.mkdirSync(extractPath, { recursive: true });
    console.log(chalk.blue(`📦 Downloading ${parsed.full_name} into ${repo.name}...`));

    console.log(url);
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {}
        });

        await pipeline(
            response.data,
            tar.x({
                C: extractPath,
                strip: 1
            })
        );

        setTimeout(() => {
            openInIDE(extractPath);
        }, 1000);
        installDependencies(extractPath); // Add this line
    } catch (error) {
        console.error(chalk.red('Download failed:'), error.message);
        process.exit(1);
    }
}

function getAvailableDirectoryName(basePath) {
    if (!fs.existsSync(basePath)) return basePath;
    let counter = 2;
    let newPath;
    while (true) {
        newPath = `${basePath}-${counter}`;
        if (!fs.existsSync(newPath)) return newPath;
        counter++;
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (!args.length) {
        console.log(chalk.yellow('Usage: gg <search-query>'));
        process.exit(1);
    }

    const query = args.join(' ');

    let repoUrl = null;

    // Try parsing as a GitHub URL or shorthand
    let parsed = null;

    if (query.includes('github.com') || query.startsWith('git@github.com:') || query.startsWith('https://') || query.startsWith('git://')) {
        parsed = gitUrlParse(query);
    } else if (/^[\w-]+\/[\w.-]+$/.test(query)) {
        // Shorthand owner/repo
        parsed = gitUrlParse(`https://github.com/${query}`);
    }

    if (parsed && parsed.resource === 'github.com' && parsed.owner && parsed.name) {
        // Reconstruct the canonical HTTPS URL for download
        repoUrl = `https://github.com/${parsed.owner}/${parsed.name}`;
        console.log(chalk.green(`Detected GitHub repo: ${repoUrl}`));
        await downloadRepo(repoUrl);
        return;
    }

    const results = await searchRepositories(query);

    if (!results.length) {
        console.log(chalk.yellow('No repositories found'));
        return;
    }

    const { selectedRepo } = await inquirer.prompt({
        type: 'list',
        name: 'selectedRepo',
        message: 'Select a repository to download:',
        choices: results.map(repo => ({
            name: `${chalk.bold(repo.full_name)} - ${chalk.gray(repo.description || 'No description')}
      ${chalk.yellow(`★ ${repo.stargazers_count}`)} | ${chalk.blue(repo.language || 'Unknown')}`,
            value: repo
        }))
    });

    await downloadRepo(selectedRepo.url);
}

main();
