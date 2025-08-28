# Firebase MCP Server

Custom Firebase MCP Server for Time AI project.

## Installation

```bash
cd time-ai/mcp-servers
npm install
```

## Configuration

Update your MCP configuration to use the local Firebase server:

```json
{
  "mcpServers": {
    "firebase": {
      "command": "node",
      "args": ["./time-ai/mcp-servers/firebase-mcp-server.js"],
      "env": {
        "FIREBASE_PROJECT_ID": "ready-ai-niwat",
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account-key.json"
      },
      "disabled": false,
      "autoApprove": ["list_users", "check_user_exists", "check_name_duplicate"]
    }
  }
}
```

## Available Tools

### `list_users`
List all users in Firestore
- `limit` (optional): Maximum number of users to return (default: 10)

### `delete_user`
Delete a user by email
- `email` (required): Email of user to delete

### `check_user_exists`
Check if user exists by email
- `email` (required): Email to check

### `check_name_duplicate`
Check if name combination already exists
- `firstName` (required): First name to check
- `lastName` (required): Last name to check

## Usage Examples

```javascript
// List users
await mcp_firebase_list_users({ limit: 5 })

// Check if user exists
await mcp_firebase_check_user_exists({ email: "test@example.com" })

// Check name duplicate
await mcp_firebase_check_name_duplicate({ 
  firstName: "John", 
  lastName: "Smith" 
})

// Delete user
await mcp_firebase_delete_user({ email: "test@example.com" })
```

## Environment Variables

- `FIREBASE_PROJECT_ID`: Firebase project ID (default: ready-ai-niwat)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account key file

## Authentication

The server uses Firebase Admin SDK with Application Default Credentials or service account key file.

For local development, you can use:
```bash
# Using gcloud CLI
gcloud auth application-default login

# Or set service account key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```