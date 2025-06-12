#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import GithubAPI from './github-api.js'

const Github = new GithubAPI({ debug: false })

/**
 * Prints the git0 ASCII logo to the console
 */
function printLogo() {
    console.log(chalk.cyan(`                ___  
    __ _(_)‾|_ / _ \\ 
   / _  | | __| | | |
  | (_| | | |_| |_| |
   \\__, |_|\\__|\\___/ 
   |___/`))
}

/**
 * Shows an interactive menu for selecting packages from GitHub releases
 * Organizes packages by platform and highlights the user's current platform
 * @param {Object} selectedRepo - The selected repository object containing release information
 * @param {Array} selectedRepo.allReleases - Array of release objects
 * @param {string} selectedRepo.allReleases[].tag_name - Release tag name
 * @param {Object} selectedRepo.allReleases[].platformAssets - Assets organized by platform
 * @returns {Promise<void>}
 */
async function showPackageMenu(selectedRepo) {
    const currentPlatform = Github.getCurrentPlatform();
    const releaseChoices = [];
    const limitReleases = 2;

    // Add section headers and organize by platform
    selectedRepo.allReleases.slice(0, limitReleases).forEach(release => {
        const platforms = ['windows', 'macos', 'linux', 'universal'];

        platforms.forEach(platform => {
            const assets = release.platformAssets[platform];
            if (assets?.length > 0) {
                // Add platform header
                const platformEmoji = {
                    windows: '🪟',
                    macos: '🍎',
                    linux: '🐧',
                    universal: '🌐'
                };

                const platformName = {
                    windows: 'Windows',
                    macos: 'macOS',
                    linux: 'Linux',
                    universal: 'Universal'
                };

                const isCurrentPlatform = platform === currentPlatform.os || platform === 'universal';
                const platformHeader = isCurrentPlatform
                    ? chalk.green(`${platformEmoji[platform]} ${platformName[platform]} (Your Platform)`)
                    : chalk.gray(`${platformEmoji[platform]} ${platformName[platform]}`);

                // Add separator if not first platform in this release
                const needsSeparator = releaseChoices?.length > 0 &&
                    !releaseChoices[releaseChoices.length - 1].name.includes('────');

                if (needsSeparator) {
                    releaseChoices.push({
                        name: chalk.gray('────────────────────────────────'),
                        disabled: true
                    });
                }

                releaseChoices.push({
                    name: `${chalk.bold(release.tag_name)} - ${platformHeader}`,
                    disabled: true
                });

                // Add assets for this platform
                assets.forEach(asset => {
                    const sizeStr = (asset.size / 1024 / 1024).toFixed(2);
                    const archInfo = asset.detectedArch !== 'unknown' && asset.detectedArch !== 'universal'
                        ? chalk.cyan(`[${asset.detectedArch}]`)
                        : '';

                    const highlight = isCurrentPlatform ? chalk.white : chalk.gray;

                    releaseChoices.push({
                        name: `  ${highlight(`${asset.name} ${archInfo} (${sizeStr} MB)`)}`,
                        value: { release, asset }
                    });
                });
            }
        });
    });

    if (releaseChoices.filter(choice => !choice.disabled)?.length === 0) {
        log(chalk.yellow('No packages found for download.'));
        return;
    }

    const { selectedPackage } = await inquirer.prompt({
        type: 'list',
        name: 'selectedPackage',
        message: 'Select a package to download:',
        choices: releaseChoices,
        pageSize: 15
    });

    const downloadDir = path.resolve(process.cwd());
    fs.mkdirSync(downloadDir, { recursive: true });

    const downloadPath = path.join(downloadDir, selectedPackage.asset.name);
    await Github.downloadPackage(selectedPackage.asset.browser_download_url, downloadPath);
}

/**
 * Detects available IDE/editor commands on the system
 * Checks for popular code editors in priority order
 * @returns {Object|null} IDE object with name and command, or null if none found
 * @returns {string} returns.name - Human-readable name of the IDE
 * @returns {string} returns.cmd - Command to execute the IDE
 */
function getIdeCommand() {
    const ides = [
        { name: 'Cursor', cmd: 'cursor' },
        { name: 'Windsurf', cmd: 'windsurf' },
        { name: 'VSCode', cmd: 'code' },
        { name: 'Code Server', cmd: 'code-server' },
        { name: 'Neovim', cmd: 'nvim' },
        { name: 'Webstorm', cmd: 'webstorm' }
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

/**
 * Opens a directory in the first available IDE/editor
 * Also attempts to open a README or package.json file after 3 seconds
 * @export
 * @param {string} targetDir - Path to the directory to open
 */
export function openInIDE(targetDir) {
    const ide = getIdeCommand();
    if (!ide) {
        log(chalk.yellow('⚠️  No supported IDE found'));
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

        // open readme after 3 seconds
        setTimeout(() => {

            const readme = fs.existsSync('./readme.md') ? './readme.md' :
                fs.existsSync('./Readme.md') ? './Readme.md' :
                    fs.existsSync('./README.md') ? './README.md' :
                        fs.existsSync('./package.json') ? './package.json' :
                            null;

            if (readme)
                spawn(ide.cmd, ide.cmd === 'code-server'
                    ? [readme, '--open']
                    : [readme], {
                    detached: true,
                    stdio: 'ignore',
                    shell: process.platform === 'win32'
                }).unref();
        }, 3000);

        log(chalk.green(`🚀 Opening ${path.basename(targetDir)} in ${ide.name}`));
    } catch (error) {
        // console.error(chalk.red(`❌ Failed to open ${ide.name}:`), error.message);
    }
}

/**
 * Automatically detects project type and installs dependencies
 * Supports Node.js, Docker, Python, Rust, and Go projects
 * @export
 * @async
 * @param {string} targetDir - Path to the project directory
 */
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
                exec('bun install');
                exec('bun run dev; bun run start');
            } catch (error) {
                exec('npm install');
                exec('npm run dev; npm run start');
            }
        },
        docker: () => {
            if (fs.existsSync('docker-compose.yml')) {
                exec('sudo docker-compose up -d');
            } else if (fs.existsSync('Dockerfile')) {
                exec('sudo docker build -t project .');
            }
        },
        python: () => {
            exec('python -m venv .venv');
            exec('source .venv/bin/activate');

            if (fs.existsSync('requirements.txt')) {
                exec('pip install -r requirements.txt');
            }
            if (fs.existsSync('setup.py')) {
                exec('pip install -e .');
            }
        },
        rust: () => exec('cargo build'),
        go: () => exec('go mod tidy')
    };

    // Run detections and installations
    Object.entries(detectors).forEach(([name, check]) => {
        if (check()) {
            // log(chalk.yellow(`⚙️  Detected ${name} project`));
            installers[name]?.();
        }
    });
}

/**
 * Executes a shell command with error handling
 * @param {string} cmd - Command to execute
 * @param {boolean} [showError=false] - Whether to display error messages
 */
function exec(cmd, showError = false) {
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
        if (showError)
            console.error(chalk.red(`❌ Failed: ${cmd}`));
    }
}

/**
 * Downloads a GitHub repository and sets it up for development
 * Opens the project in an IDE and installs dependencies automatically
 * @async
 * @param {string} repo - Repository URL or identifier
 * @param {string|null} [folderPath=null] - Optional custom folder path for extraction
 */
async function downloadRepoAndSetup(repo, folderPath = null) {

    printLogo()

    var extractPath = await Github.downloadRepo(repo, folderPath)

    setTimeout(() => {
        openInIDE(extractPath);
    }, 500);
    installDependencies(extractPath);
}

/**
 * Main CLI function that handles argument parsing and repository selection
 * Supports both download of direct GitHub URLs and search queries
 * @async
 * @throws {Error} When no search query is provided or no repositories are found
 */
async function main() {

    printLogo()
    const args = process.argv.slice(2);
    if (!args.length) {
        log(chalk.yellow('Usage: git0 <search-query>'));
        process.exit(1);
    }

    const query = args.join(' ');
    // Try parsing as a GitHub URL or shorthand
    let parsed = Github.parseURL(query)
    if (parsed && parsed.owner && parsed.name) {
        if (typeof args[1] !== 'undefined')
            await downloadRepoAndSetup(parsed.href, args[1]);
        else
            await downloadRepoAndSetup(parsed.href);

        return;
    }

    const results = await Github.searchRepositories(query);

    if (!results || !results.length) {
        log(chalk.yellow('No repositories found'));
        process.exit(1);
    }

    const { selectedRepo } = await inquirer.prompt({
        type: 'list',
        name: 'selectedRepo',
        message: 'Select a repository to download:',
        choices: results.map(repo => {
            const packageInfo = repo.hasCompatibleReleases
                ? chalk.green(' 📦 Packages available')
                : repo.hasReleases
                    ? chalk.yellow(' 📦 Packages (other platforms)')
                    : '';

            return {
                name: `${chalk.bold(repo.full_name)} - ${chalk.gray(repo.description || 'No description')}
      ${chalk.yellow(`★ ${repo.stargazers_count}`)} | ${chalk.blue(repo.language || 'Unknown')}${packageInfo}`,
                value: repo
            };
        })
    });

    // If the selected repo has any releases, show download options
    if (selectedRepo.hasReleases || selectedRepo.hasCompatibleReleases) {
        const { downloadChoice } = await inquirer.prompt({
            type: 'list',
            name: 'downloadChoice',
            message: 'This repository has downloadable packages. What would you like to do?',
            choices: [
                { name: '📦 Download package/binary', value: 'package' },
                { name: '📂 Download source code', value: 'source' },
                { name: '📦📂 Download both package and source', value: 'both' }
            ]
        });

        if (downloadChoice === 'package' || downloadChoice === 'both') {
            await showPackageMenu(selectedRepo);
        }

        if (downloadChoice === 'source' || downloadChoice === 'both') {
            await downloadRepoAndSetup(selectedRepo.url);
        }
    } else {
        // No packages, just download source
        await downloadRepoAndSetup(selectedRepo.url);
    }
}

main();