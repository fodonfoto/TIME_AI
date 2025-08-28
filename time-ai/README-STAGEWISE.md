# Stagewise Integration Guide

## What is Stagewise?

Stagewise is a frontend coding agent for production codebases that works as a CLI tool alongside your development environment.

## Features

- 💬 Tell the agent what you want to change
- 🧠 Click on element(s) to let the agent know where a change should happen
- 💡 Let stagewise do the magic!
- ⚡ Works out of the box
- 🧩 Customize and extend functionality with Plugins
- 📖 Open source
- ⛓️ Compatible with all kinds of frameworks

## How to Use Stagewise with This Project

### 1. Start your development server

First, start your AI Agent Hub in development mode:

```bash
npm run dev
```

This will start both the client and server on their respective ports.

### 2. Start Stagewise (in a separate terminal)

Open a new terminal window **in the root of this project** and run:

```bash
npx stagewise@latest
```

or if you're using pnpm:

```bash
pnpm dlx stagewise@latest
```

### 3. Follow the setup guide

The CLI will guide you through:
- Setting up your stagewise account
- Configuring the tool for your project
- Connecting to the stagewise agent

### 4. Start coding with AI assistance

Once set up, you can:
- Click on elements in your browser to select them
- Tell the agent what changes you want to make
- Let stagewise generate and apply the code changes

## Supported Agents

Stagewise works with various coding agents:

- ✅⭐️ stagewise agent (recommended)
- ✅ Cursor
- ✅ GitHub Copilot
- ✅ Windsurf
- ✅ Cline
- ✅ Roo Code
- ✅ Kilo Code
- ✅ Trae

## Important Notes

- Stagewise is NOT a React library - it's a CLI tool
- It works alongside your existing development setup
- No code changes are needed in your React application
- The tool provides a web interface that overlays on your app during development

## Troubleshooting

If you encounter issues:

1. Make sure your development server is running first
2. Ensure you're running stagewise from the project root directory
3. Check that you have the latest version: `npx stagewise@latest`
4. Visit the [GitHub repository](https://github.com/stagewise-io/stagewise) for more help

## License

Stagewise is offered under the AGPLv3 license.