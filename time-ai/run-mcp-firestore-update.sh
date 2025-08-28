#!/bin/bash

# Run MCP Firestore Update Script
# สคริปต์สำหรับรัน Firebase MCP Server เพื่ออัพเดท Firestore

echo "🚀 Starting Firebase MCP Server for Firestore update..."
echo "📍 Project: ready-ai-niwat"
echo ""

# Set environment variables
export FIREBASE_PROJECT_ID="ready-ai-niwat"

# Change to project directory
cd "$(dirname "$0")"

echo "📂 Current directory: $(pwd)"
echo "🔧 Environment: FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
echo ""

# Check if MCP server exists
if [ ! -f "mcp-servers/firebase-mcp-server.js" ]; then
    echo "❌ Firebase MCP Server not found!"
    echo "   Expected: mcp-servers/firebase-mcp-server.js"
    exit 1
fi

echo "✅ Firebase MCP Server found"
echo ""

# Run the update script
echo "🔄 Running Firestore update via MCP..."
node update-firestore-via-mcp.js mcp

echo ""
echo "🏁 Script completed!"