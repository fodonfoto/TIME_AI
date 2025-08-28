import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load base .env then overlay mode-specific .env if present
dotenv.config();
const MODE = process.env.NODE_ENV || 'development';
const modeEnvPath = path.join(__dirname, `.env.${MODE}`);
if (fs.existsSync(modeEnvPath)) {
  dotenv.config({ path: modeEnvPath, override: true });
}

const app = express();
// Use environment variable for port or default to 3002
const PORT = parseInt(process.env.PORT) || 3002;

// Import http module using ES modules
import { createServer } from 'http';

// Function to get an available port
const getPort = (defaultPort) => {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(defaultPort, '0.0.0.0');
    server.on('listening', () => {
      server.close();
      resolve(defaultPort);
    });
    server.on('error', () => {
      // If port is in use, try the next port
      resolve(getPort(defaultPort + 1));
    });
  });
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// Global error handler for Firebase errors
app.use((err, req, res, next) => {
  if (err.code === 'failed-precondition') {
    return res.status(400).json({ error: 'Database configuration error', message: 'Please try again' });
  }
  next(err);
});

// Routes
app.use('/api/chat', (await import('./routes/chat.js')).default);
app.use('/api/chat-with-tools', (await import('./routes/chat-with-tools.js')).default);
app.use('/api/models', (await import('./routes/models.js')).default);
app.use('/api/datasets', (await import('./routes/datasets.js')).default);
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/subscriptions', (await import('./routes/subscriptions.js')).default);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server with dynamic port handling
const startServer = async () => {
  try {
    const availablePort = await getPort(PORT);
    app.listen(availablePort, '0.0.0.0', () => {
      console.log(`Server running on port ${availablePort}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();