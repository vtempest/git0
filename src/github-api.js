import grab from 'grab-api.js';
import chalk from 'chalk';
import gitUrlParse from 'git-url-parse';
import os from 'os';
import fs from 'fs';
import * as tar from 'tar';
import path from 'path';

/**
 * GitHub API client for downloading repositories, searching, and managing releases
 * @class GithubAPI
 * @example
 * const github = new GithubAPI();
 * const repos = await github.searchRepositories('nodejs');
 * await github.downloadRepo('user/repo', './my-downloads');
 */
class GithubAPI {
    /** @constant {number} Number of results to return per page for repository searches */
    static DEFAULT_RESULTS_PER_PAGE = 10;

    /**
     * Creates a new GithubAPI instance
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.token] - GitHub personal access token (defaults to GITHUB_TOKEN env var)
     * @param {boolean} [options.debug=false] - Enable debug logging
     * @param {string} [options.baseURL='https://api.github.com'] - GitHub API base URL
     * @example
     * // Use default settings with environment token
     * 
     * // Use custom token
     * const github = new GithubAPI({ token: 'ghp_xxxxxxxxxxxx' });
     * 
     * // Enable debug mode
     * const github = new GithubAPI({ debug: true });
     */
    constructor(options = {}) {
        this.token = options.token || process.env.GITHUB_TOKEN;
        this.debug = options.debug || false;
        this.baseURL = options.baseURL || 'https://api.github.com';

        this.client = grab.instance({
            debug: this.debug,
            baseURL: this.baseURL,
            headers: this.token ? { Authorization: `token ${this.token}` } : {},
            onError: (error) => {
                if (error.includes('403')) {
                    const githubHelpUrl = 'https://github.com/settings/personal-access-tokens/new';
                    console.log(chalk.red('Rate limit exceeded. Please set env var GITHUB_TOKEN. Help:\n' + githubHelpUrl));
                    process.exit(1);
                }
            }
        });
    }

    /**
     * Downloads a GitHub repository as a tarball and extracts it to a local directory
     * @param {string} repo - Repository URL or owner/name format
     * @param {string|null} [targetDir=null] - Target directory name (defaults to repo name)
     * @returns {Promise<string>} Path to the extracted repository directory
     * @throws {Error} When repository download fails
     * @example
     * 
     * // Download repository to current directory
     * const repoPath = await github.downloadRepo('https://github.com/user/repo');
     * 
     * // Download to specific directory
     * const repoPath = await github.downloadRepo('user/repo', 'my-custom-dir');
     */
    async downloadRepo(repo, targetDir = null) {
        const parsed = gitUrlParse(repo);
        const defaultDir = path.resolve(process.cwd(), targetDir?.length ? targetDir : parsed.name);
        const extractPath = this._getAvailableDirectoryName(defaultDir);

        // if it picks up a larger owner name, slice to the last part
        if (parsed.owner.includes('/')) {
            parsed.owner = parsed.owner.split('/').slice(-1).join('');
        }

        fs.mkdirSync(extractPath, { recursive: true });

        let url = `/repos/${parsed.owner}/${parsed.name}/tarball/${parsed.default_branch || 'master'}`;

        console.log(chalk.blue(`📦 Downloading ${parsed.name} into ${path.basename(extractPath)}...`));

        const params = {
            onStream: async (res) => {
                const nodeStream = (await import('stream'))?.Readable.fromWeb(res);
                await new Promise((resolve, reject) => {
                    nodeStream.pipe(tar.x({
                        C: extractPath,
                        strip: 1
                    })).on('finish', resolve).on('error', reject);
                });
            }
        };

        let response = await this.client(url, params);

        if (response.error) {
            response = await this.client(url.replace("/master", "/main"), params);
        }

        return extractPath;
    }

    /**
     * Searches for GitHub repositories by name and enriches results with release information
     * @param {string} query - Search query for repository names
     * @param {Object} [options={}] - Search options
     * 
     * @param {number} [options.perPage] - Number of results per page (defaults to DEFAULT_RESULTS_PER_PAGE)
     * @param {string} [options.sort='stars'] - Sort field (stars, forks, updated)
     * @param {string} [options.order='desc'] - Sort order (asc, desc)
     * @returns {Promise<Array<Object>>} Array of repository objects with release information
     * @throws {Error} When search fails
     * @example
     * 
     * const repos = await github.searchRepositories('nodejs');
     * repos.forEach(repo => {
     *   console.log(`${repo.name}: ${repo.hasReleases ? 'Has releases' : 'No releases'}`);
     * });
     * 
     * // Custom search options
     * const repos = await github.searchRepositories('react', {
     *   perPage: 5,
     *   sort: 'updated',
     *   order: 'desc'
     * });
     */
    async searchRepositories(query, options = {}) {
        try {
            const {
                perPage = GithubAPI.DEFAULT_RESULTS_PER_PAGE,
                sort = 'stars',
                order = 'desc',
                getReleaseInfo = true
            } = options;

            const response = await this.client('/search/repositories', {
                q: `${query} in:name`,
                sort,
                order,
                per_page: perPage,
            });

            if (response.error || !response.items) {
                console.log("No response");
                return [];
            }

            return !getReleaseInfo ? response :
                // Check for releases for each repository
                await Promise.all(
                    response.items.map(async (repo) => {
                        const releases = await this.client(`/repos/${repo.owner.login}/${repo.name}/releases`);

                        const currentPlatform = this.getCurrentPlatform();
                        const compatibleReleases = this._filterReleasesByPlatform(releases, currentPlatform);
                        const categorizedReleases = this._categorizeReleasesByPlatform(releases);

                        return {
                            ...repo,
                            hasReleases: releases?.length > 0,
                            hasCompatibleReleases: compatibleReleases.length > 0,
                            releases: compatibleReleases,
                            allReleases: categorizedReleases
                        };
                    })
                );

        } catch (error) {
            console.error(chalk.red('Search failed:'), error.message);
            throw error;
        }
    }

    /**
     * Downloads a release asset from GitHub and provides installation instructions
     * @param {Object} packageURL - Download URL for the asset
     * @param {string} downloadPath - Directory to download the asset to
     * @returns {Promise<string>} Path to the downloaded file
     * @throws {Error} When download fails
     * @example
     * 
     * const asset = 'https://github.com/user/repo/releases/download/v1.0.0/myapp-v1.0.0-linux-x64'
     * const downloadPath = await github.downloadPackage(asset, './downloads/myapp');
     */
    async downloadPackage(packageURL, downloadPath) {
        const fileName = downloadPath.split('/').slice(-1)?.[0];

        console.log(chalk.blue(`📦 Downloading ${fileName}...`));

        try {
            await this.client(packageURL, {
                onStream: async (res) => {
                    const nodeStream = (await import('stream'))?.Readable.fromWeb(res);
                    await new Promise((resolve, reject) => {
                        nodeStream.pipe(fs.createWriteStream(downloadPath)).on('finish', resolve).on('error', reject);
                    });
                }
            });

            console.log(chalk.green(`✅ Downloaded ${fileName} to ${downloadPath}`));

            // Try to make executable if it's a binary
            if (process.platform !== 'win32' && !fileName.includes('.')) {
                try {
                    fs.chmodSync(downloadPath, '755');
                    console.log(chalk.green(`✅ Made ${fileName} executable`));
                } catch (error) {
                    console.log(chalk.yellow(`⚠️  Could not make ${fileName} executable`));
                }
            }

            // Provide installation instructions
            this._provideInstallationInstructions(downloadPath, asset);

            return downloadPath;
        } catch (error) {
            console.error(chalk.red(`❌ Failed to download ${fileName}:`), error.message);
            throw error;
        }
    }

    /**
     * Parses a GitHub URL or shorthand repository reference
     * @param {string} query - GitHub URL or owner/repo format
     * @returns {Object|false} Parsed git URL object or false if invalid
     * @example
     * 
     * // Parse full URL
     * const parsed = github.parseURL('https://github.com/user/repo');
     * 
     * // Parse shorthand
     * const parsed = github.parseURL('user/repo');
     * 
     * if (parsed) {
     *   console.log(`Owner: ${parsed.owner}, Name: ${parsed.name}`);
     * }
     */
    parseURL(query) {
        if (query.includes('github.com') || query.startsWith('git@github.com:') ||
            query.startsWith('https://') || query.startsWith('git://')) {
            return gitUrlParse(query);
        } else if (/^[\w-]+\/[\w.-]+$/.test(query)) {
            return gitUrlParse(`https://github.com/${query}`);
        }
        return false;
    }

    /**
     * Detects the current operating system and architecture
     * @returns {Object} Platform information object
     * @returns {string} returns.os - Normalized OS name (windows, macos, linux)
     * @returns {string} returns.arch - Normalized architecture (x86_64, arm64, arm, i386)
     * @returns {string} returns.platform - Raw Node.js platform string
     * @returns {string} returns.architecture - Raw Node.js architecture string
     * @example
     * const platform = github.getCurrentPlatform();
     * console.log(`Running on ${platform.os} ${platform.arch}`);
     */
    getCurrentPlatform() {
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

    /**
     * Gets repository releases with platform categorization
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Array<Object>>} Array of categorized releases
     * @example
     * const releases = await github.getReleases('microsoft', 'vscode');
     * console.log(`Found ${releases.length} releases`);
     */
    async getReleases(owner, repo) {
        const releases = await this.client(`/repos/${owner}/${repo}/releases`);
        return this._categorizeReleasesByPlatform(releases);
    }

    /**
     * Gets releases compatible with the current platform
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Array<Object>>} Array of compatible releases
     * @example
     * const compatible = await github.getCompatibleReleases('user', 'repo');
     * console.log(`Found ${compatible.length} compatible releases`);
     */
    async getCompatibleReleases(owner, repo) {
        const releases = await this.client(`/repos/${owner}/${repo}/releases`);
        const currentPlatform = this.getCurrentPlatform();
        return this._filterReleasesByPlatform(releases, currentPlatform);
    }

    /**
     * Generates an available directory name by appending a counter if the base path exists
     * @private
     * @param {string} basePath - The desired base directory path
     * @returns {string} An available directory path
     */
    _getAvailableDirectoryName(basePath) {
        if (!fs.existsSync(basePath)) return basePath;
        let counter = 2;
        let newPath;
        while (true) {
            newPath = `${basePath}-${counter}`;
            if (!fs.existsSync(newPath)) return newPath;
            counter++;
        }
    }

    /**
     * Categorizes GitHub releases by platform and architecture based on asset names
     * @private
     * @param {Array<Object>} releases - Array of GitHub release objects
     * @returns {Array<Object>} Releases with platformAssets property containing categorized assets
     */
    _categorizeReleasesByPlatform(releases) {
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

            release?.assets?.forEach(asset => {
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

    /**
     * Filters releases to only include those compatible with the specified platform
     * @private
     * @param {Array<Object>} releases - Array of GitHub release objects
     * @param {Object} currentPlatform - Platform information from getCurrentPlatform()
     * @returns {Array<Object>} Filtered array of compatible releases
     */
    _filterReleasesByPlatform(releases, currentPlatform) {
        const categorized = this._categorizeReleasesByPlatform(releases);
        return categorized.filter(release =>
            release.platformAssets[currentPlatform.os].length > 0 ||
            release.platformAssets.universal.length > 0
        );
    }

    /**
     * Provides platform-specific installation instructions for a downloaded asset
     * @private
     * @param {string} filePath - Path to the downloaded file
     * @param {Object} asset - GitHub release asset object
     * @param {string} asset.name - Name of the asset file
     */
    _provideInstallationInstructions(filePath, asset) {
        const fileName = asset.name;
        const platform = this.getCurrentPlatform();

        if (platform.platform === 'win32') {
            if (fileName.endsWith('.exe')) {
                console.log(chalk.white('  Run the executable:'));
                console.log(chalk.gray(`  ${filePath}`));
            } else if (fileName.endsWith('.msi')) {
                console.log(chalk.white('  Install the MSI package:'));
                console.log(chalk.gray(`  msiexec /i "${filePath}"`));
            }
        } else if (platform.platform === 'darwin') {
            if (fileName.endsWith('.dmg')) {
                console.log(chalk.white('  Mount and install the DMG:'));
                console.log(chalk.gray(`  open "${filePath}"`));
            } else if (fileName.endsWith('.pkg')) {
                console.log(chalk.white('  Install the package:'));
                console.log(chalk.gray(`  sudo installer -pkg "${filePath}" -target /`));
            }
        } else {
            if (fileName.endsWith('.deb')) {
                console.log(chalk.white('  Install the DEB package:'));
                console.log(chalk.gray(`  sudo dpkg -i "${filePath}"`));
            } else if (fileName.endsWith('.rpm')) {
                console.log(chalk.white('  Install the RPM package:'));
                console.log(chalk.gray(`  sudo rpm -i "${filePath}"`));
            } else if (fileName.endsWith('.AppImage')) {
                console.log(chalk.white('  Run the AppImage:'));
                console.log(chalk.gray(`  chmod +x "${filePath}" && "${filePath}"`));
            } else if (!fileName.includes('.')) {
                console.log(chalk.white('  Binary is ready to use:'));
                console.log(chalk.gray(`  "${filePath}"`));
                console.log(chalk.white('  Consider moving to PATH:'));
                console.log(chalk.gray(`  sudo mv "${filePath}" /usr/local/bin/`));
            }
        }
    }
}

export default GithubAPI;