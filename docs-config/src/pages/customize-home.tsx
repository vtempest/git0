import { 
    Github, 
    Download, 
    Search, 
    Zap, 
    Terminal, 
    Code, 
    Star, 
    GitBranch, 
    Users, 
    Activity, 
    Copy, 
    Check,
    ArrowRight,
    Sparkles,
    Rocket,
    Shield,
    Globe,
    Cpu,
    Database,
    Cloud,
    Lock,
    Layers,
    FileCode,
    Package,
    Play,
    Settings,
    Workflow,
    GitMerge,
    Eye,
    Folder,
    Command,
    FolderOpen,
    Wrench,
    MonitorSpeaker,
    ExternalLink
  } from 'lucide-react';

  export const installCommands = {
    npm: 'npm install -g git0',
    bun: 'bun install -g git0',
    npx: 'npx git0 react starter'
}, coreFeatures = [
    {
        icon: Search,
        title: 'Search GitHub Repositories',
        description: 'Search repositories by name with intelligent fuzzy matching and instant results',
        gradient: 'from-blue-500 via-cyan-500 to-teal-500',
        example: 'git0 react starter'
    },
    {
        icon: Download,
        title: 'Direct Repository Download',
        description: 'Download from GitHub URLs or owner/repo shortcuts. Skip the manual git clone dance',
        gradient: 'from-purple-500 via-pink-500 to-rose-500',
        example: 'git0 facebook/react'
    },
    {
        icon: Package,
        title: 'Git Release Package Manager',
        description: 'Instantly download latest release binaries for your system or all platforms',
        gradient: 'from-green-500 via-emerald-500 to-cyan-500',
        example: 'gg user/repo'
    },
    {
        icon: Zap,
        title: 'Automatic Dependency Installation',
        description: 'Smart detection and installation of dependencies for multiple project types',
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        example: 'Auto-detects package.json, requirements.txt, Cargo.toml'
    },
    {
        icon: Code,
        title: 'Smart IDE Integration',
        description: 'Automatically opens projects in Cursor, Windsurf, VS Code, or your preferred editor',
        gradient: 'from-indigo-500 via-purple-500 to-blue-500',
        example: 'Opens in cursor, windsurf, code, nvim'
    },
    {
        icon: Shield,
        title: 'Conflict Resolution',
        description: 'Handles directory naming conflicts automatically with smart numbering',
        gradient: 'from-yellow-500 via-orange-500 to-red-500',
        example: 'react → react-2 → react-3'
    }
], projectTypes = [
    {
        name: 'Node.js',
        file: 'package.json',
        install: 'bun install (fallback to npm)',
        color: 'text-green-400',
        icon: Package
    },
    {
        name: 'Docker',
        file: 'Dockerfile, docker-compose.yml',
        install: 'docker-compose up -d',
        color: 'text-blue-400',
        icon: Layers
    },
    {
        name: 'Python',
        file: 'requirements.txt, setup.py',
        install: 'Virtual env + pip install',
        color: 'text-yellow-400',
        icon: FileCode
    },
    {
        name: 'Rust',
        file: 'Cargo.toml',
        install: 'cargo build',
        color: 'text-orange-400',
        icon: Settings
    },
    {
        name: 'Go',
        file: 'go.mod',
        install: 'go mod tidy',
        color: 'text-cyan-400',
        icon: Play
    }
], supportedIDEs = [
    { name: 'Cursor', command: 'cursor', color: 'text-blue-400' },
    { name: 'Windsurf', command: 'windsurf', color: 'text-purple-400' },
    { name: 'VS Code', command: 'code', color: 'text-blue-300' },
    { name: 'Code Server', command: 'code-server', color: 'text-green-400' },
    { name: 'Neovim', command: 'nvim', color: 'text-orange-400' }
], featuresList = [
    { title: 'Search Repositories', command: 'git0 react starter', desc: 'Find repositories by name with fuzzy matching' },
    { title: 'Direct Download', command: 'gg facebook/react', desc: 'Download using owner/repo shorthand' },
    { title: 'From GitHub URL', command: 'git0 https://github.com/user/repo', desc: 'Download from any GitHub URL' }
], workflowSteps = [
    { step: '1', title: 'Repository Downloaded', desc: 'To your current directory', icon: Download },
    { step: '2', title: 'Project Type Detected', desc: 'Automatically identified', icon: Search },
    { step: '3', title: 'Dependencies Installed', desc: 'Based on project type', icon: Package },
    { step: '4', title: 'IDE Launched', desc: 'Opens in preferred editor', icon: Code },
    { step: '5', title: 'Dev Server Started', desc: 'For Node.js projects', icon: Play }
],
urlDocs = "https://git0.js.org/functions",
urlSupport =  "https://discord.gg/SJdBqBz3tV",
urlGithub = "https://github.com/vtempest/git0",
urlGithubChat = "https://github.com/vtempest/git0/discussions",
urlLogo = "https://i.imgur.com/857meew.png",
name = "git0",
urlAuthor = "https://github.com/vtempest",
author = "vtempest",
copyrightHTML = `&copy; 2025 Get git0. <a href="https://github.com/vtempest/git0">Star this on GitHub</a> so it can grow!`