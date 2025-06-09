<p align="center">
    <img  src="https://i.imgur.com/poOtI3N.png" />
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

# Git0: Download Git Repo on Step Zero 
CLI tool to search GitHub repositories, download source & releases for your system, and instantly set up, then install dependencies and open code editor.

## 🚀 Installation

```bash
npm install -g git0
```

```bash
bun install -g git0
```

![livepreview](https://i.imgur.com/Io3ukRC.gif)
![preview](https://i.imgur.com/K22NiBq.png)

## ✨ Features

- **Search GitHub repositories** by name with fuzzy matching
- **Download repositories** directly from GitHub URLs or owner/repo shortcuts. Skip the manual git clone, cd, install dance
- **Get Releases** instantly download latest release for your system or all systems
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
## gg and git0 both work
git0 facebook/react

## Use without installing
npx git0 react starter
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

For higher API rate limits, set [your GitHub token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token):

```bash
export GITHUB_TOKEN=your_github_token_here
```

Without a token, you're limited to 60 requests per hour. With a token, you get 5,000 requests per hour.

### What Happens After Download

1. **Repository is downloaded** to your current directory
2. **Project type is detected** automatically
3. **Dependencies are installed** based on project type
4. **IDE is launched** automatically (if available)
5. **Development server starts** (for Node.js projects)

If a directory with the same name exists, GG automatically appends a number (e.g., `react-2`, `react-3`).
