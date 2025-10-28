#!/bin/bash

echo "🧪 Testing SOFIA Field Extraction Fix..."

# Test the API directly
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-chat-'$(date +%s)",
    "message": {
      "id": "msg-'$(date +%s)",
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "i want a registartion developer with viewing tomorrow at 3pm the client is Margarita dimova"
        }
      ]
    },
    "selectedChatModel": "chat-model-small",
    "selectedVisibilityType": "private"
  }' \
  --no-buffer | head -30