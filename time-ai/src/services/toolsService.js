// Frontend Tools Service
import { getAuth } from 'firebase/auth';

class ToolsService {
  constructor() {
    this.apiKeys = this.loadApiKeys();
  }

  loadApiKeys() {
    const stored = localStorage.getItem('aiAgentApiKeys');
    return stored ? JSON.parse(stored) : {};
  }

  saveApiKeys(keys) {
    this.apiKeys = { ...this.apiKeys, ...keys };
    localStorage.setItem('aiAgentApiKeys', JSON.stringify(this.apiKeys));
  }

  async getAvailableTools() {
    try {
      const response = await fetch('/api/chat-with-tools/tools');
      const data = await response.json();
      return data.tools;
    } catch (error) {
      console.error('Failed to get tools:', error);
      return {};
    }
  }

  async sendMessageWithTools(messages, model = 'gpt-5-mini') {
    try {
      // ตรวจสอบว่า Puter.js โหลดแล้วหรือยัง
      if (typeof window.puter === 'undefined') {
        throw new Error('Puter.js not loaded. Please refresh the page.');
      }
      
      if (typeof window.puter.ai?.chat !== 'function') {
        throw new Error('Puter.ai chat function not available.');
      }
      
      // ใช้ Puter.js AI chat โดยตรง
      const response = await window.puter.ai.chat(messages, {
        model,
        max_tokens: 2000
      });
      
      // ตรวจสอบ response
      if (!response) {
        throw new Error('Empty response from Puter.ai');
      }
      
      // แปลงผลลัพธ์ให้เป็นรูปแบบที่ frontend คาดหวัง
      return {
        choices: [{
          message: {
            content: response
          }
        }]
      };
    } catch (error) {
      console.error('Puter.js AI chat error:', error);
      
      // Fallback error message
      const fallbackResponse = {
        choices: [{
          message: {
            content: `❌ เกิดข้อผิดพลาด: ${error.message}\n\n🔧 วิธีแก้ไข:\n1. รีเฟรชหน้าเว็บ\n2. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต\n3. ลองใหม่อีกครั้ง\n\nหากปัญหายังคงอยู่ กรุณาไปที่ /chat-debug เพื่อตรวจสอบ`
          }
        }]
      };
      
      return fallbackResponse;
    }
  }

  async validateApiKey(toolName, apiKey) {
    try {
      switch (toolName) {
        case 'figma':
          const figmaResponse = await fetch('https://api.figma.com/v1/me', {
            headers: { 'X-Figma-Token': apiKey }
          });
          return figmaResponse.ok;
          
        case 'github':
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${apiKey}` }
          });
          return githubResponse.ok;
          
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }
}

export default new ToolsService();