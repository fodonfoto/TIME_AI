class SyncQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject, retries: 0 });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const currentTask = this.queue[0];

    try {
      const result = await this.executeWithRetry(currentTask);
      currentTask.resolve(result);
      this.queue.shift();
      this.processQueue();
    } catch (error) {
      console.error('Task failed after retries:', error);
      currentTask.reject(error);
      this.queue.shift();
      this.processQueue();
    }
  }

  async executeWithRetry(task) {
    let lastError;
    
    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        const result = await task.task();
        return result;
      } catch (error) {
        lastError = error;
        if (i < this.maxRetries) {
          console.log(`Retry ${i + 1}/${this.maxRetries} for task`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }
}

export const syncQueue = new SyncQueue();
