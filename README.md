# 🤖 Time AI - Complete AI Agent Platform

[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.55.0-purple.svg)](https://playwright.dev/)

## 📋 **Project Overview**

Time AI is a comprehensive AI agent platform built with React and Firebase, featuring:

- **8 Core Systems**: Login, Dashboard, Chat AI, History, Sidebar, Settings, Agent Hub, New Chat
- **Complete Documentation**: End-to-end PRD documentation for all systems
- **Modern Tech Stack**: React 18+, Firebase, Node.js, Vite
- **Testing Framework**: Playwright automation testing
- **Production Ready**: Deployment guides and security compliance

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Firebase CLI (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/fodonfoto/TIME_AI.git
cd TIME_AI
```

2. **Install root dependencies** (for testing tools)
```bash
npm install
```

3. **Install app dependencies**
```bash
cd time-ai
npm install
```

4. **Setup environment**
```bash
# Copy environment template
cp .env.example .env

# Add your Firebase configuration to .env
```

5. **Start development server**
```bash
npm run dev
```

## 🏗️ **Project Structure**

```
TIME_AI/
├── 📁 time-ai/                    # Main React application
│   ├── 📁 src/
│   │   ├── 📁 components/         # React components
│   │   ├── 📁 services/           # Firebase & API services
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 utils/              # Utility functions
│   │   └── 📁 styles/             # CSS styles
│   ├── 📁 functions/              # Firebase Cloud Functions
│   ├── 📁 tests/                  # Test files
│   └── 📄 package.json            # App dependencies
├── 📁 agents/                     # AI agent configurations
├── 📁 tasks/                      # Development tasks
├── 📁 workflows/                  # CI/CD workflows
├── 📄 PROJECT-FILES-SUMMARY.md    # Project overview
├── 📄 DATABASE_ARCHITECTURE_SUMMARY.md # Database design
└── 📄 *_SYSTEM_PRD.md             # System documentation
```

## 🎯 **Core Features**

### 🔐 **Authentication System**
- Google OAuth integration
- Firebase Authentication
- Protected routes and security

### 💬 **Chat AI System**
- Real-time AI conversations
- Message history management
- Usage tracking and limits
- Puter.ai integration

### 📊 **Dashboard System**
- Usage analytics
- 30-day period tracking
- Subscription management
- Performance metrics

### 📚 **History System**
- Conversation search
- Chat organization
- Rename/delete functionality
- Real-time updates

### ⚙️ **Settings System**
- User preferences
- Theme management
- Account settings
- Privacy controls

### 🤖 **Agent System**
- AI agent configuration
- Tool integrations (GitHub, Figma, etc.)
- API key management
- Multi-tool orchestration

## 🛠️ **Development**

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run Playwright tests
npx playwright test

# Install Playwright browsers
npx playwright install
```

### Environment Variables

Create `.env` files based on `.env.example`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Analytics
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 🧪 **Testing**

### Unit Tests
```bash
cd time-ai
npm test
```

### E2E Tests (Playwright)
```bash
cd time-ai
npx playwright test
```

### Manual Testing
- Browser console testing utilities
- Interactive test runners
- Debug mode for step-by-step execution

## 🚀 **Deployment**

### Firebase Hosting
```bash
cd time-ai
npm run build
firebase deploy
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Firebase project setup
- [ ] Security rules deployed
- [ ] Database indexes created
- [ ] Build optimized
- [ ] Testing completed

## 📖 **Documentation**

### System Documentation
- `PROJECT-FILES-SUMMARY.md` - Complete project overview
- `DATABASE_ARCHITECTURE_SUMMARY.md` - Database design
- `*_SYSTEM_PRD.md` - Individual system documentation

### Key Documents
- `time-ai/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `time-ai/FIREBASE-CONSOLE-SETUP.md` - Firebase setup
- `time-ai/PRODUCTION_DB_COMPLIANCE.md` - Database compliance

## 🔧 **Technology Stack**

### Frontend
- **React 18+** - UI framework
- **Vite** - Build tool
- **React Router v6** - Navigation
- **CSS Variables** - Styling
- **Lottie React** - Animations

### Backend & Database
- **Firebase Auth** - Authentication
- **Firestore** - Database
- **Firebase Functions** - Serverless functions
- **Firebase Hosting** - Static hosting

### Testing & Development
- **Playwright** - E2E testing
- **Jest** - Unit testing
- **Playwright HTML Reporter** - Test reporting
- **Firebase Emulator** - Local development

### External Integrations
- **Puter.ai** - AI models
- **GitHub API** - Code integration
- **Figma API** - Design integration
- **Various APIs** - Tool ecosystem

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is private and proprietary.

## 🆘 **Support**

- Check the documentation in the `docs/` folder
- Review system PRD files for detailed specifications
- Refer to `DEPLOYMENT_GUIDE.md` for setup issues

## 🔄 **Recent Updates**

- ✅ Project cleanup completed
- ✅ Sensitive files secured
- ✅ Documentation consolidated
- ✅ Testing framework optimized
- ✅ Ready for GitHub deployment

---

**Built with ❤️ by the Time AI team**