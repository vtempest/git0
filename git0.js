#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import grab from 'grab-api.js';
import * as tar from 'tar'
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import gitUrlParse from 'git-url-parse';
import os from 'os';

const GITHUB_API = 'https://api.github.com/search/repositories';
const RESULTS_PER_PAGE = 10;
const TOKEN = process.env.GITHUB_TOKEN;

const githubHelpUrl = 'https://github.com/settings/personal-access-tokens/new'
grab('', {
    setDefaults: true,
    debug: false,
    onError: (error) => {
        if (error.includes('403')) {
            log(chalk.red('Rate limit exceeded. Please set env var GITHUB_TOKEN. Help:\n' + githubHelpUrl));
            process.exit(1);

        }
    }
}
)

function printLogo() {
    console.log(chalk.cyan(`                ___  
    __ _(_)‾|_ / _ \\ 
   / _  | | __| | | |
  | (_| | | |_| |_| |
   \\__, |_|\\__|\\___/ 
   |___/`))
}

// Detect current operating system and architecture
function getCurrentPlatform() {
    const platform = os.platform();
    const arch = os.arch();

    const platformMap = {
        'win32': 'windows',
        'darwin': 'macos',
        'linux': 'linux'
    };

    const archMap = {
        'x64': 'x86_64',
        'arm64': 'arm64',
        'arm': 'arm',
        'ia32': 'i386'
    };

    return {
        os: platformMap[platform] || platform,
        arch: archMap[arch] || arch,
        platform,
        architecture: arch
    };
}

// Get releases for a repository
async function getRepositoryReleases(owner, repo) {
    try {
        const response = await grab(`https://api.github.com/repos/${owner}/${repo}/releases`, {
            headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {},
            per_page: 5 // Get latest 5 releases

        });

        return response;
    } catch (error) {
        return [];
    }
}

// Categorize releases by platform
function categorizeReleasesByPlatform(releases) {
    const platformKeywords = {
        windows: ['win', 'windows', 'win32', 'win64', '.exe', '.msi'],
        macos: ['mac', 'macos', 'darwin', 'osx', '.dmg', '.pkg'],
        linux: ['linux', 'ubuntu', 'debian', '.deb', '.rpm', '.tar.gz', '.AppImage']
    };

    const archKeywords = {
        x86_64: ['x86_64', 'x64', 'amd64', '64'],
        arm64: ['arm64', 'aarch64'],
        arm: ['arm', 'armv7'],
        i386: ['i386', 'x86', '32']
    };

    const categorizedReleases = [];

    Object.entries(releases).forEach(([key, release]) => {
        const platformAssets = {
            windows: [],
            macos: [],
            linux: [],
            universal: []
        };

        release.assets.forEach(asset => {
            const name = asset.name.toLowerCase();
            let categorized = false;

            // Check each platform
            Object.entries(platformKeywords).forEach(([platform, keywords]) => {
                if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
                    // Determine architecture
                    let detectedArch = 'unknown';
                    Object.entries(archKeywords).forEach(([arch, archKeys]) => {
                        if (archKeys.some(archKey => name.includes(archKey.toLowerCase()))) {
                            detectedArch = arch;
                        }
                    });

                    platformAssets[platform].push({
                        ...asset,
                        detectedArch,
                        platform
                    });
                    categorized = true;
                }
            });

            // If not categorized, check for universal binaries
            if (!categorized && (name.includes('universal') || name.includes('all') ||
                (!name.includes('win') && !name.includes('mac') && !name.includes('linux')))) {
                platformAssets.universal.push({
                    ...asset,
                    detectedArch: 'universal',
                    platform: 'universal'
                });
            }
        });

        // Only include releases that have assets
        const hasAssets = Object.values(platformAssets).some(assets => assets.length > 0);
        if (hasAssets) {
            categorizedReleases.push({
                ...release,
                platformAssets
            });
        }
    });

    return categorizedReleases;
}

// Filter releases for current platform (for compatibility indicator)
function filterReleasesByPlatform(releases, currentPlatform) {
    const categorized = categorizeReleasesByPlatform(releases);
    return categorized.filter(release =>
        release.platformAssets[currentPlatform.os].length > 0 ||
        release.platformAssets.universal.length > 0
    );
}


// Download and install package
async function downloadPackage(asset, targetDir) {
    const fileName = asset.name;
    const downloadPath = path.join(targetDir, fileName);

    log(chalk.blue(`📦 Downloading ${fileName}...`));
    printLogo()
    try {
        const response = await grab(asset.browser_download_url, {
            headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {},
            onStream: async (res) => {
                const nodeStream = (await import('stream'))?.Readable.fromWeb(res);
                await new Promise((resolve, reject) => {
                    nodeStream.pipe(fs.createWriteStream(downloadPath)).on('finish', resolve).on('error', reject);
                });
            }
        });

        log(chalk.green(`✅ Downloaded ${fileName} to ${downloadPath}`));

        // Try to make executable if it's a binary
        if (process.platform !== 'win32' && !fileName.includes('.')) {
            try {
                fs.chmodSync(downloadPath, '755');
                log(chalk.green(`✅ Made ${fileName} executable`));
            } catch (error) {
                log(chalk.yellow(`⚠️  Could not make ${fileName} executable`));
            }
        }

        // Provide installation instructions
        provideInstallationInstructions(downloadPath, asset);

    } catch (error) {
        console.error(chalk.red(`❌ Failed to download ${fileName}:`), error.message);
    }
}

// Provide platform-specific installation instructions
function provideInstallationInstructions(filePath, asset) {
    const fileName = asset.name;
    const platform = getCurrentPlatform();

    if (platform.platform === 'win32') {
        if (fileName.endsWith('.exe')) {
            log(chalk.white('  Run the executable:'));
            log(chalk.gray(`  ${filePath}`));
        } else if (fileName.endsWith('.msi')) {
            log(chalk.white('  Install the MSI package:'));
            log(chalk.gray(`  msiexec /i "${filePath}"`));
        }
    } else if (platform.platform === 'darwin') {
        if (fileName.endsWith('.dmg')) {
            log(chalk.white('  Mount and install the DMG:'));
            log(chalk.gray(`  open "${filePath}"`));
        } else if (fileName.endsWith('.pkg')) {
            log(chalk.white('  Install the package:'));
            log(chalk.gray(`  sudo installer -pkg "${filePath}" -target /`));
        }
    } else {
        if (fileName.endsWith('.deb')) {
            log(chalk.white('  Install the DEB package:'));
            log(chalk.gray(`  sudo dpkg -i "${filePath}"`));
        } else if (fileName.endsWith('.rpm')) {
            log(chalk.white('  Install the RPM package:'));
            log(chalk.gray(`  sudo rpm -i "${filePath}"`));
        } else if (fileName.endsWith('.AppImage')) {
            log(chalk.white('  Run the AppImage:'));
            log(chalk.gray(`  chmod +x "${filePath}" && "${filePath}"`));
        } else if (!fileName.includes('.')) {
            log(chalk.white('  Binary is ready to use:'));
            log(chalk.gray(`  "${filePath}"`));
            log(chalk.white('  Consider moving to PATH:'));
            log(chalk.gray(`  sudo mv "${filePath}" /usr/local/bin/`));
        }
    }
}

// Show package selection menu organized by platform
async function showPackageMenu(selectedRepo) {
    const currentPlatform = getCurrentPlatform();
    const releaseChoices = [];
    const limitReleases = 2;

    // Add section headers and organize by platform
    selectedRepo.allReleases.slice(0, limitReleases).forEach(release => {
        const platforms = ['windows', 'macos', 'linux', 'universal'];

        platforms.forEach(platform => {
            const assets = release.platformAssets[platform];
            if (assets.length > 0) {
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
                const needsSeparator = releaseChoices.length > 0 &&
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

    if (releaseChoices.filter(choice => !choice.disabled).length === 0) {
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
    await downloadPackage(selectedPackage.asset, downloadDir);
}

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
            // log(chalk.yellow(`⚙️  Detected ${name} project`));
            installers[name]?.();
        }
    });
}

function runCommand(cmd) {
    log(chalk.cyan(`🚀 Running: ${cmd}`));
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
        console.error(chalk.red(`❌ Failed: ${cmd}`));
    }
}

export async function searchRepositories(query) {
    try {
        const response = await grab(GITHUB_API, {
            q: `${query} in:name`,
            sort: 'stars',
            order: 'desc',
            per_page: RESULTS_PER_PAGE,
            debug: false,
            headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {}
        });

        if (response.error || !response.items)
            return log("No response")

        // Check for releases for each repository
        const reposWithReleases = await Promise.all(
            response.items.map(async (repo) => {
                const releases = await getRepositoryReleases(repo.owner.login, repo.name);
                const currentPlatform = getCurrentPlatform();
                const compatibleReleases = filterReleasesByPlatform(releases, currentPlatform);
                const categorizedReleases = categorizeReleasesByPlatform(releases);

                return {
                    ...repo,
                    hasReleases: releases.length > 0,
                    hasCompatibleReleases: compatibleReleases.length > 0,
                    releases: compatibleReleases,
                    allReleases: categorizedReleases
                };
            })
        );

        return reposWithReleases;
    } catch (error) {
        console.error(chalk.red('Search failed:'), error.message);
        process.exit(1);
    }
}

export async function downloadRepo(repo) {
    const parsed = gitUrlParse(repo);
    const defaultDir = path.resolve(process.cwd(), parsed.name);
    const extractPath = getAvailableDirectoryName(defaultDir);

    // if it picks up a larger owner name, slice to the last part
    if (parsed.owner.includes('/'))
        parsed.owner = parsed.owner.split('/').slice(-1).join('');

    fs.mkdirSync(extractPath, { recursive: true });
    log(chalk.blue(`📦 Downloading ${parsed.name} into ${path.basename(extractPath)}...`));
    printLogo()

    let url = `https://api.github.com/repos/${parsed.owner}/${parsed.name}/tarball/${parsed.default_branch || 'master'}`;

    try {

        var params = {
            headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {},
            onStream: async (res) => {

                const nodeStream = (await import('stream'))?.Readable.fromWeb(res);
                await new Promise((resolve, reject) => {
                    nodeStream.pipe(tar.x({
                        C: extractPath,
                        strip: 1
                    })).on('finish', resolve).on('error', reject);
                });
            }
        }

        var response = await grab(url, params);

        if (response.error)
            response = await grab(url.replace("/master", "/main"), params);


        setTimeout(() => {
            openInIDE(extractPath);
        }, 1000);
        installDependencies(extractPath);
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
    printLogo()
    const args = process.argv.slice(2);
    if (!args.length) {
        log(chalk.yellow('Usage: gg <search-query>'));
        process.exit(1);
    }

    const query = args.join(' ');
    const currentPlatform = getCurrentPlatform();


    let repoUrl = null;

    // Try parsing as a GitHub URL or shorthand
    let parsed = null;

    if (query.includes('github.com') || query.startsWith('git@github.com:') || query.startsWith('https://') || query.startsWith('git://')) {
        parsed = gitUrlParse(query);
    } else if (/^[\w-]+\/[\w.-]+$/.test(query)) {
        // Shorthand owner/repo
        parsed = gitUrlParse(`https://github.com/${query}`);
    }

    if (parsed && parsed.owner && parsed.name) {
        await downloadRepo(parsed.href);
        return;
    }

    const results = await searchRepositories(query);

    if (!results || !results.length) {
        log(chalk.yellow('No repositories found'));
        return;
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
            await downloadRepo(selectedRepo.url);
        }
    } else {
        // No packages, just download source
        await downloadRepo(selectedRepo.url);
    }
}

main();