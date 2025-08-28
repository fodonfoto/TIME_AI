# Time AI Hub

A modern AI chat platform with ChatGPT-like design, OpenRouter API integration, and dataset connectivity.

## Features

- 🎨 **Dark Mode Design**: ChatGPT-inspired interface with responsive design
- 🤖 **Multiple AI Models**: Choose from various OpenRouter models
- 📁 **Dataset Integration**: Connect Google Drive and GitHub repositories
- 🌍 **Multi-Environment**: Development, UAT, and Production configurations
- ⚡ **Real-time Chat**: Instant messaging with typing indicators

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.development` and update API keys
   - Set up Google OAuth credentials
   - Configure GitHub token

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open http://localhost:3000
   - Select AI model from sidebar
   - Connect datasets and start chatting

## Environment Setup

### Development
```bash
npm run dev
```

### UAT
```bash
npm run uat
```

### Production
```bash
npm start
```

## API Endpoints

- `POST /api/chat` - Send messages to AI models
- `GET /api/models` - List available models
- `GET /api/datasets/google-drive/files` - List Google Drive files
- `GET /api/datasets/github/repos` - List GitHub repositories

## Configuration

Update environment files with your API keys:

- **OpenRouter API**: Get key from https://openrouter.ai
- **Google Drive API**: Set up OAuth in Google Console
- **GitHub API**: Generate personal access token

## Architecture

```
ai-agent-hub/
├── routes/          # API endpoints
├── public/          # Frontend files
├── services/        # Business logic
├── .env.*          # Environment configs
└── server.js       # Main server
```