// Mock Firebase service for development
class MockFirebaseService {
  constructor() {
    this.mockData = JSON.parse(localStorage.getItem('mockChatHistory') || '[]');
  }

  async saveChatHistory(userId, chatData) {
    const newChat = {
      id: Date.now().toString(),
      ...chatData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockData.unshift(newChat);
    localStorage.setItem('mockChatHistory', JSON.stringify(this.mockData));
    return newChat.id;
  }

  async getChatHistory(userId) {
    return this.mockData.filter(chat => chat.userId === userId);
  }

  async updateChatTitle(chatId, newTitle) {
    const chatIndex = this.mockData.findIndex(chat => chat.id === chatId);
    if (chatIndex !== -1) {
      this.mockData[chatIndex].title = newTitle;
      this.mockData[chatIndex].updatedAt = new Date();
      localStorage.setItem('mockChatHistory', JSON.stringify(this.mockData));
    }
  }

  async deleteChat(chatId) {
    this.mockData = this.mockData.filter(chat => chat.id !== chatId);
    localStorage.setItem('mockChatHistory', JSON.stringify(this.mockData));
  }

  subscribeToChatHistory(userId, callback) {
    callback(this.mockData.filter(chat => chat.userId === userId));
    return () => {};
  }
}

export default new MockFirebaseService();