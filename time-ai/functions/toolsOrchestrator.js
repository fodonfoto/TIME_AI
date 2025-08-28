// Tools Orchestrator for AI Agent Hub
import { onRequest } from 'firebase-functions/v2/https';

// Available Tools Registry
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
  },
  "get_google_sheets_data": {
    description: "Read data from Google Sheets",
    parameters: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string", description: "Google Sheets ID" },
        range: { type: "string", description: "Cell range (e.g., A1:C10)" }
      },
      required: ["spreadsheetId", "range"]
    }
  }
};

// Tool Executors
const executeTools = {
  async get_figma_file({ fileId }, apiKeys) {
    const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: { 'X-Figma-Token': apiKeys.figma }
    });
    return await response.json();
  },

  async search_github_repos({ query, limit = 10 }, apiKeys) {
    const response = await fetch(`https://api.github.com/search/repositories?q=${query}&per_page=${limit}`, {
      headers: { 'Authorization': `token ${apiKeys.github}` }
    });
    return await response.json();
  },

  async get_jira_issues({ projectKey, status }, apiKeys) {
    const jql = status ? `project=${projectKey} AND status="${status}"` : `project=${projectKey}`;
    const response = await fetch(`${apiKeys.jiraDomain}/rest/api/2/search?jql=${jql}`, {
      headers: { 
        'Authorization': `Basic ${Buffer.from(`${apiKeys.jiraEmail}:${apiKeys.jiraToken}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async get_google_sheets_data({ spreadsheetId, range }, apiKeys) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKeys.googleSheets}`
    );
    return await response.json();
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

// Main orchestrator function
export const chatWithTools = onRequest(async (req, res) => {
  try {
    const { messages, model = "openai/gpt-4-turbo", apiKeys = {} } = req.body;
    
    // Step 1: Send initial request with available tools
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

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [systemPrompt, ...messages]
      })
    });

    const result = await aiResponse.json();
    const aiMessage = result.choices[0].message.content;
    
    // Step 2: Extract and execute tool calls
    const toolCalls = extractToolCalls(aiMessage);
    
    if (toolCalls.length === 0) {
      return res.json(result);
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
    const finalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          systemPrompt,
          ...messages,
          { role: "assistant", content: aiMessage },
          { 
            role: "user", 
            content: `Tool execution results:\n${JSON.stringify(toolResults, null, 2)}\n\nPlease provide a response based on these results.`
          }
        ]
      })
    });

    const finalResult = await finalResponse.json();
    res.json(finalResult);

  } catch (error) {
    console.error('Orchestration error:', error);
    res.status(500).json({ error: 'Tool orchestration failed' });
  }
});

// Get available tools endpoint
export const getAvailableTools = onRequest((req, res) => {
  res.json({ tools: TOOLS_REGISTRY });
});