/**
 * Puter.js Service Wrapper
 * Provides safe access to Puter.js functionality with error handling
 */

class PuterService {
  constructor() {
    this.isAvailable = false;
    this.isAuthenticated = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      // Wait for Puter.js to load
      await this.waitForPuter();
      
      // Disable auto-authentication to prevent 401 errors
      if (window.puter && window.puter.auth) {
        // Override whoami to prevent auto-auth calls
        const originalWhoami = window.puter.auth.whoami;
        window.puter.auth.whoami = () => Promise.resolve(null);
      }
      
      this.isAvailable = true;
      console.log('✅ PuterService initialized successfully');
    } catch (error) {
      console.warn('⚠️ PuterService initialization failed:', error.message);
      this.isAvailable = false;
    }
  }

  waitForPuter(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (window.puter) {
        resolve(window.puter);
        return;
      }

      const checkInterval = setInterval(() => {
        if (window.puter) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          resolve(window.puter);
        }
      }, 100);

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Puter.js load timeout'));
      }, timeout);
    });
  }

  async ensureReady() {
    await this.initPromise;
    if (!this.isAvailable) {
      throw new Error('Puter.js is not available');
    }
  }

  // AI Services
  async chatWithAI(message, options = {}) {
    try {
      await this.ensureReady();
      
      const defaultOptions = {
        model: 'gpt-4o-mini',
        stream: false
      };
      
      const finalOptions = { ...defaultOptions, ...options };
      
      if (!window.puter.ai) {
        throw new Error('Puter AI service not available');
      }
      
      const response = await window.puter.ai.chat(message, finalOptions);
      return response;
    } catch (error) {
      console.error('PuterService AI chat error:', error);
      throw new Error(`AI chat failed: ${error.message}`);
    }
  }

  // Cloud Storage Services
  async writeFile(path, content) {
    try {
      await this.ensureReady();
      
      if (!window.puter.fs) {
        throw new Error('Puter filesystem not available');
      }
      
      return await window.puter.fs.write(path, content);
    } catch (error) {
      console.error('PuterService file write error:', error);
      throw new Error(`File write failed: ${error.message}`);
    }
  }

  async readFile(path) {
    try {
      await this.ensureReady();
      
      if (!window.puter.fs) {
        throw new Error('Puter filesystem not available');
      }
      
      const file = await window.puter.fs.read(path);
      return await file.text();
    } catch (error) {
      console.error('PuterService file read error:', error);
      throw new Error(`File read failed: ${error.message}`);
    }
  }

  // Key-Value Store Services
  async setValue(key, value) {
    try {
      await this.ensureReady();
      
      if (!window.puter.kv) {
        throw new Error('Puter KV store not available');
      }
      
      return await window.puter.kv.set(key, value);
    } catch (error) {
      console.error('PuterService KV set error:', error);
      throw new Error(`KV set failed: ${error.message}`);
    }
  }

  async getValue(key) {
    try {
      await this.ensureReady();
      
      if (!window.puter.kv) {
        throw new Error('Puter KV store not available');
      }
      
      return await window.puter.kv.get(key);
    } catch (error) {
      console.error('PuterService KV get error:', error);
      throw new Error(`KV get failed: ${error.message}`);
    }
  }

  // Authentication Services (manual only)
  async signIn() {
    try {
      await this.ensureReady();
      
      if (!window.puter.auth) {
        throw new Error('Puter auth not available');
      }
      
      const user = await window.puter.auth.signIn();
      this.isAuthenticated = true;
      return user;
    } catch (error) {
      console.error('PuterService sign in error:', error);
      throw new Error(`Sign in failed: ${error.message}`);
    }
  }

  async getUser() {
    try {
      await this.ensureReady();
      
      if (!this.isAuthenticated) {
        return null;
      }
      
      if (!window.puter.auth) {
        throw new Error('Puter auth not available');
      }
      
      return await window.puter.auth.getUser();
    } catch (error) {
      console.error('PuterService get user error:', error);
      return null;
    }
  }

  // Utility methods
  isServiceAvailable() {
    return this.isAvailable;
  }

  getAvailableModels() {
    return [
      'gpt-4o-mini',
      'claude-sonnet-4',
      'openrouter:meta-llama/llama-3.1-8b-instruct'
    ];
  }
}

// Export singleton instance
const puterService = new PuterService();
export default puterService;