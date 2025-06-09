<p align="center">
    <img  src="https://i.imgur.com/zG1QI1q.png" />
</p>
<p align="center">
    <a href="https://discord.gg/SJdBqBz3tV">
        <img src="https://img.shields.io/discord/1110227955554209923.svg?label=Chat&logo=Discord&colorB=7289da&style=flat"
            alt="Join Discord" />
    </a>
     <a href="https://github.com/vtempest/gg/discussions">
     <img alt="GitHub Stars" src="https://img.shields.io/github/stars/vtempest/gg" /></a>
    <a href="https://github.com/vtempest/gg/discussions">
    <img alt="GitHub Discussions"
        src="https://img.shields.io/github/discussions/vtempest/gg" />
    </a>
    <a href="https://github.com/vtempest/gg/pulse" alt="Activity">
        <img src="https://img.shields.io/github/commit-activity/m/vtempest/gg" />
    </a>
    <img src="https://img.shields.io/github/last-commit/vtempest/gg.svg?style=flat-square" alt="GitHub last commit" />
</p>
<p align="center">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square"
            alt="PRs Welcome" />
    <a href="https://codespaces.new/vtempest/gg">
    <img src="https://github.com/codespaces/badge.svg" width="150" height="20" />
    </a>
</p>  


# GG - GitHub Repo Downloader

A fast and smart CLI tool to search, download, and instantly set up GitHub repositories with automatic dependency installation and IDE integration.

## 🚀 Installation

```bash
npm install -g git-gg
```

```bash
bun install -g git-gg
```

## ✨ Features

- **Search GitHub repositories** by name with fuzzy matching
- **Download repositories** directly from GitHub URLs or owner/repo shortcuts
- **Automatic dependency detection** and installation for multiple project types
- **Smart IDE integration** - automatically opens projects in your preferred editor
- **Cross-platform support** - works on Windows, macOS, and Linux
- **Conflict resolution** - handles directory naming conflicts automatically

## 🎯 Usage

### Search and Download
```bash
# Search for repositories by name
gg react starter

# Direct download from GitHub URL
gg https://github.com/facebook/react

# Download using owner/repo shorthand
gg facebook/react

## Use without installing
npx git-gg react starter
```

### Supported Project Types

GG automatically detects and sets up the following project types:

| Project Type | Detection | Installation |
|-------------|-----------|-------------|
| **Node.js** | `package.json` | `bun install` (fallback to `npm install`) |
| **Docker** | `Dockerfile`, `docker-compose.yml` | `docker-compose up -d` or `docker build` |
| **Python** | `requirements.txt`, `setup.py` | Virtual environment + pip install |
| **Rust** | `Cargo.toml` | `cargo build` |
| **Go** | `go.mod` | `go mod tidy` |

### Supported IDEs

GG automatically detects and opens projects in your preferred IDE:

- **Cursor** (`cursor`)
- **Windsurf** (`windsurf`) 
- **VS Code** (`code`)
- **Code Server** (`code-server`)
- **Neovim** (`nvim`)

## 🔧 Configuration

### GitHub Token (Optional)

For higher API rate limits, set your GitHub token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

Without a token, you're limited to 60 requests per hour. With a token, you get 5,000 requests per hour.

## 📋 Examples

### Search and Select
```bash
gg machine learning
```
This will show you a list of repositories matching "machine learning" sorted by stars, with descriptions and metadata.

### Direct Download
```bash
# Clone and setup a specific repository
gg microsoft/vscode

# Works with full URLs too
gg https://github.com/vercel/next.js
```

### What Happens After Download

1. **Repository is downloaded** to your current directory
2. **Project type is detected** automatically
3. **Dependencies are installed** based on project type
4. **IDE is launched** automatically (if available)
5. **Development server starts** (for Node.js projects)

## 🛠️ Technical Details

### Project Detection Logic

GG uses file-based detection to identify project types:

- **Node.js**: Looks for `package.json`
- **Docker**: Checks for `Dockerfile` or `docker-compose.yml`
- **Python**: Finds `requirements.txt` or `setup.py`
- **Rust**: Detects `Cargo.toml`
- **Go**: Looks for `go.mod`

### Smart Installation

- **Node.js**: Prefers Bun over npm for faster installs, attempts to start dev server
- **Docker**: Prioritizes docker-compose, falls back to docker build
- **Python**: Creates virtual environment and installs dependencies
- **Rust/Go**: Runs standard build/dependency commands

### Directory Naming

If a directory with the same name exists, GG automatically appends a number (e.g., `react-2`, `react-3`).

## 🤝 Contributing

This is a utility tool designed for quick GitHub repository setup. Feel free to submit issues or pull requests for improvements.

## 📄 License

MIT License - feel free to use this tool in your projects.

## 🎉 Why GG?

- **Fast**: Skip the manual git clone, cd, install dance
- **Smart**: Automatically detects what kind of project you're working with
- **Convenient**: Opens your IDE and starts development servers automatically
- **Reliable**: Handles edge cases like directory conflicts and missing dependencies

Perfect for developers who frequently explore GitHub repositories and want to get up and running quickly!