import express from 'express';
import axios from 'axios';

const router = express.Router();

// Tools Registry
const TOOLS_REGISTRY = {
  "get_figma_file": {
    description: "Get Figma file data and components",
    parameters: {
      type: "object",
      properties: {
        fileId: { type: "string", description: "Figma file ID" }
      },
      required: ["fileId"]
    }
  },
  "search_github_repos": {
    description: "Search GitHub repositories", 
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Number of results", default: 10 }
      },
      required: ["query"]
    }
  },
  "get_jira_issues": {
    description: "Get Jira issues from project",
    parameters: {
      type: "object",
      properties: {
        projectKey: { type: "string", description: "Jira project key" },
        status: { type: "string", description: "Issue status filter" }
      },
      required: ["projectKey"]
    }
  }
};

// Tool Executors
const executeTools = {
  async get_figma_file({ fileId }, apiKeys) {
    const response = await axios.get(`https://api.figma.com/v1/files/${fileId}`, {
      headers: { 'X-Figma-Token': apiKeys.figma }
    });
    return response.data;
  },

  async search_github_repos({ query, limit = 10 }, apiKeys) {
    const response = await axios.get(`https://api.github.com/search/repositories`, {
      params: { q: query, per_page: limit },
      headers: { 'Authorization': `token ${apiKeys.github}` }
    });
    return response.data;
  },

  async get_jira_issues({ projectKey, status }, apiKeys) {
    const jql = status ? `project=${projectKey} AND status="${status}"` : `project=${projectKey}`;
    const response = await axios.get(`${apiKeys.jiraDomain}/rest/api/2/search`, {
      params: { jql },
      headers: { 
        'Authorization': `Basic ${Buffer.from(`${apiKeys.jiraEmail}:${apiKeys.jiraToken}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
};

// Extract tool calls from AI response
function extractToolCalls(content) {
  const toolCallRegex = /```tool_call\n([\s\S]*?)\n```/g;
  const calls = [];
  let match;
  
  while ((match = toolCallRegex.exec(content)) !== null) {
    try {
      const toolCall = JSON.parse(match[1]);
      calls.push(toolCall);
    } catch (e) {
      console.error('Failed to parse tool call:', e);
    }
  }
  
  return calls;
}

// Main chat endpoint with tools
router.post('/', async (req, res) => {
  try {
    const { messages, model = 'gpt-5-mini', apiKeys = {} } = req.body;
    
    // Check for required environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }
    
    // Step 1: Send request with available tools
    const systemPrompt = {
      role: "system",
      content: `You have access to these tools. When you need to use a tool, format it as:
\`\`\`tool_call
{
  "name": "tool_name", 
  "parameters": { "param": "value" }
}
\`\`\`

Available tools:
${JSON.stringify(TOOLS_REGISTRY, null, 2)}`
    };

    const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [systemPrompt, ...messages],
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiMessage = aiResponse.data.choices[0].message.content;
    
    // Step 2: Extract and execute tool calls
    const toolCalls = extractToolCalls(aiMessage);
    
    if (toolCalls.length === 0) {
      return res.json(aiResponse.data);
    }

    // Step 3: Execute tools
    const toolResults = [];
    for (const call of toolCalls) {
      try {
        const executor = executeTools[call.name];
        if (executor) {
          const result = await executor(call.parameters, apiKeys);
          toolResults.push({
            tool: call.name,
            parameters: call.parameters,
            result: result
          });
        }
      } catch (error) {
        toolResults.push({
          tool: call.name,
          parameters: call.parameters,
          error: error.message
        });
      }
    }

    // Step 4: Send results back to AI
    const finalResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [
        systemPrompt,
        ...messages,
        { role: "assistant", content: aiMessage },
        { 
          role: "user", 
          content: `Tool execution results:\n${JSON.stringify(toolResults, null, 2)}\n\nPlease provide a response based on these results.`
        }
      ],
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(finalResponse.data);

  } catch (error) {
    console.error('Chat with tools error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Chat with tools request failed' });
  }
});

// Get available tools
router.get('/tools', (req, res) => {
  res.json({ tools: TOOLS_REGISTRY });
});

export default router;