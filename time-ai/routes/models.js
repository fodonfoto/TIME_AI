import express from 'express';
import axios from 'axios';

const router = express.Router();

const AVAILABLE_MODELS = [
  { id: 'gpt-5-mini', name: 'GPT-5 Mini (Free)', provider: 'Puter.js' },
  { id: 'claude-sonnet-4', name: 'Claude-4 Sonnet (Free)', provider: 'Puter.js' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B', provider: 'Meta' }
];

router.get('/', (req, res) => {
  res.json({ models: AVAILABLE_MODELS });
});

router.get('/info/:modelId', async (req, res) => {
  try {
    const response = await axios.get(`https://openrouter.ai/api/v1/models/${req.params.modelId}`, {
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(404).json({ error: 'Model not found' });
  }
});

export default router;