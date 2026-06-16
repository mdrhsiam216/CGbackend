## Chat API

Comprehensive documentation for all chat endpoints exposed by `ChatController` (`/chat`). The system uses Twilio Conversations API for real-time messaging, with messages sent directly from the frontend using Twilio's client SDK.

### Conventions

- **Base URL**: `/chat`
- **Protected endpoints** use JWT via either:
  - `Authorization: Bearer <accessToken>` header, or
  - `access_token` httpOnly cookie (set by server on login/refresh)
- **Twilio Integration**: Messages are sent/received through Twilio Conversations API using the Twilio client SDK
- **Real-time Messaging**: Messages are delivered in real-time through Twilio's infrastructure
- **Message Persistence**: Messages are automatically saved to the database via webhook callbacks from Twilio
- **Response format**: All routes include a response message via a global response wrapper/interceptor
- **Message encryption**: Stored and returned message `content` is AES-256-GCM encrypted (base64). Decrypt on the client to show plaintext. See [Decrypting Chat Messages in React Native](./chat-message-decrypt-react-native.md) for a React Native example.

### Architecture Overview

The chat system uses a hybrid approach:

1. **Frontend** sends/receives messages directly through Twilio Conversations SDK
2. **Backend** manages conversations, retrieves message history, and handles webhooks
3. **Twilio** handles real-time message delivery and synchronization
4. **Database** stores message history for offline access and pagination

### Twilio Setup

Before using the chat feature, you need to:

1. Get a Twilio access token from `/chat/token`
2. Initialize Twilio Conversations SDK in your frontend
3. Use Twilio SDK to send/receive messages in real-time
4. Use backend APIs to retrieve message history and manage conversations

---

## Endpoints

### GET /chat/token

Get Twilio access token for the authenticated user. This token is required to initialize the Twilio Conversations SDK in the frontend.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Twilio access token generated successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "identity": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response Fields:**

- `token`: JWT token for Twilio Conversations SDK (expires in 1 hour)
- `identity`: User ID used as identity in Twilio (same as authenticated user's ID)

**Errors:**

- `401 Unauthorized`: Missing or invalid access token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to generate Twilio token

**Notes:**

- Token expires in 1 hour (3600 seconds)
- Token should be refreshed before expiration
- Identity is the user's UUID, used to identify the user in Twilio conversations
- Store token securely in memory (not localStorage) for security

---

### POST /chat/conversation

Create a new conversation with another user or retrieve an existing conversation if one already exists between the two users.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

```json
{
  "receiverId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Field Validation:**

- `receiverId`: Required, must be a valid UUID of an existing user

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "twilioConversationSid": "CHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "participantOneId": "550e8400-e29b-41d4-a716-446655440000",
    "participantTwoId": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2025-11-16T14:20:00.000Z",
    "updatedAt": "2025-11-16T14:20:00.000Z"
  }
}
```

**Response Fields:**

- `id`: Internal conversation UUID
- `twilioConversationSid`: Twilio conversation SID (used with Twilio SDK)
- `participantOneId`: UUID of first participant (current user)
- `participantTwoId`: UUID of second participant (receiver)
- `createdAt`: Conversation creation timestamp
- `updatedAt`: Last update timestamp

**Errors:**

- `400 Bad Request`:
  - Invalid UUID format for `receiverId`
  - Missing `receiverId` field
- `404 Not Found`: Receiver user not found
- `500 Internal Server Error`: Failed to create conversation in Twilio or database

**Notes:**

- If a conversation already exists between the two users, it is returned instead of creating a new one
- Both participants are automatically added to the Twilio conversation
- Use `twilioConversationSid` to join the conversation in Twilio SDK
- Conversation is created in both Twilio and the local database

---

### GET /chat/conversations

Get all conversations for the authenticated user, ordered by most recently updated first. Includes participant information for each conversation.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "twilioConversationSid": "CHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "participantOneId": "550e8400-e29b-41d4-a716-446655440000",
      "participantTwoId": "550e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2025-11-16T14:20:00.000Z",
      "updatedAt": "2025-11-16T14:25:00.000Z",
      "otherParticipant": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "fullName": "Jane Doe",
        "email": "jane@example.com"
      },
      "unreadCount": 2,
      "lastMessage": {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "content": "I'm doing great, thanks!",
        "createdAt": "2025-11-16T14:21:00.000Z",
        "senderId": "550e8400-e29b-41d4-a716-446655440001"
      }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "twilioConversationSid": "CHyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
      "participantOneId": "550e8400-e29b-41d4-a716-446655440000",
      "participantTwoId": "550e8400-e29b-41d4-a716-446655440002",
      "createdAt": "2025-11-15T10:15:00.000Z",
      "updatedAt": "2025-11-15T10:20:00.000Z",
      "otherParticipant": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "fullName": "John Smith",
        "email": "john@example.com"
      }
    }
  ]
}
```

**Response Fields:**

- `id`: Internal conversation UUID
- `twilioConversationSid`: Twilio conversation SID
- `participantOneId`: UUID of first participant
- `participantTwoId`: UUID of second participant
- `createdAt`: Conversation creation timestamp
- `updatedAt`: Last update timestamp
- `otherParticipant`: Information about the other participant (not the current user)
  - `id`: Participant UUID
  - `fullName`: Participant's full name
  - `email`: Participant's email
- `unreadCount`: Number of unread messages in this conversation (messages not sent by current user)
- `lastMessage`: Last message in the conversation (optional, null if no messages)
  - `id`: Message UUID
  - `content`: Message content
  - `createdAt`: Message creation timestamp
  - `senderId`: UUID of the message sender

**Errors:**

- `401 Unauthorized`: Missing or invalid access token
- `500 Internal Server Error`: Server error during conversation retrieval

**Notes:**

- Conversations are ordered by `updatedAt` in descending order (most recent first)
- `otherParticipant` always refers to the participant who is not the current authenticated user
- If participant information cannot be retrieved, `otherParticipant` will have `fullName: "Unknown User"` and empty `email`
- `unreadCount` shows the number of unread messages (messages not sent by the current user)
- `lastMessage` contains the most recent message in the conversation, or `null` if there are no messages
- Use this endpoint to display the user's conversation list with unread badges and message previews

---

### GET /chat/conversation/:id/messages

Get paginated messages for a specific conversation. Messages are ordered by creation date (oldest first).

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Path Parameters:**

- `id`: Conversation UUID

**Query Parameters:**

- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Number of messages per page (default: 50, minimum: 1, maximum: 100)

**Request Body:**

None required

**Example Request:**

```
GET /chat/conversation/660e8400-e29b-41d4-a716-446655440000/messages?page=1&limit=50
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "conversationId": "660e8400-e29b-41d4-a716-446655440000",
        "senderId": "550e8400-e29b-41d4-a716-446655440000",
        "content": "Hello! How are you?",
        "seen": true,
        "createdAt": "2025-11-16T14:20:00.000Z",
        "sender": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "fullName": "John Doe",
          "email": "john@example.com"
        }
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "conversationId": "660e8400-e29b-41d4-a716-446655440000",
        "senderId": "550e8400-e29b-41d4-a716-446655440001",
        "content": "I'm doing great, thanks!",
        "seen": true,
        "createdAt": "2025-11-16T14:21:00.000Z",
        "sender": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "fullName": "Jane Doe",
          "email": "jane@example.com"
        }
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

**Response Fields:**

- `messages`: Array of message objects
  - `id`: Message UUID
  - `conversationId`: Conversation UUID this message belongs to
  - `senderId`: UUID of the message sender
  - `content`: Message text content
  - `seen`: Whether the message has been seen by the recipient
  - `createdAt`: Message creation timestamp
  - `sender`: Sender information
    - `id`: Sender UUID
    - `fullName`: Sender's full name
    - `email`: Sender's email
- `total`: Total number of messages in the conversation
- `page`: Current page number
- `limit`: Number of messages per page
- `totalPages`: Total number of pages

**Errors:**

- `400 Bad Request`:
  - Invalid conversation ID format
  - Invalid page or limit values
- `401 Unauthorized`: Missing or invalid access token
- `404 Not Found`: Conversation not found or user is not a participant
- `500 Internal Server Error`: Server error during message retrieval

**Notes:**

- Messages are ordered by `createdAt` in ascending order (oldest first)
- Use pagination to load message history efficiently
- For infinite scroll, load page 1 first, then load previous pages as user scrolls up
- `seen` status indicates if the message has been marked as seen by the recipient
- Only participants of the conversation can retrieve messages

---

### PATCH /chat/conversation/:id/mark-seen

Mark all unread messages in a conversation as seen. This should be called when the user opens or views a conversation.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Path Parameters:**

- `id`: Conversation UUID

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Messages marked as seen",
  "data": {
    "message": "Messages marked as seen successfully"
  }
}
```

**Errors:**

- `400 Bad Request`: Invalid conversation ID format
- `401 Unauthorized`: Missing or invalid access token
- `404 Not Found`: Conversation not found or user is not a participant
- `500 Internal Server Error`: Server error during update

**Notes:**

- Only marks messages sent by the other participant as seen
- Messages sent by the current user are not affected
- Should be called when:
  - User opens a conversation
  - User scrolls through messages in a conversation
  - User is actively viewing a conversation
- Use this to update unread message indicators in the UI

---

### DELETE /chat/message/:id

Delete a message. Only the sender of the message can delete it.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Path Parameters:**

- `id`: Message UUID

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": {
    "message": "Message deleted successfully"
  }
}
```

**Errors:**

- `400 Bad Request`: Invalid message ID format
- `401 Unauthorized`:
  - Missing or invalid access token
  - User is not the sender of the message
  - User is not a participant in the conversation
- `404 Not Found`: Message not found
- `500 Internal Server Error`: Server error during deletion

**Notes:**

- Only the sender of the message can delete it
- Message is permanently deleted from the database
- This action cannot be undone
- User must be a participant in the conversation containing the message
- After deletion, the message will no longer appear in message history

---

### GET /chat/messages/search

Search messages across all conversations or within a specific conversation. Returns messages matching the search query.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Query Parameters:**

- `query` (required): Search query string (1-100 characters)
- `conversationId` (optional): Limit search to a specific conversation

**Request Body:**

None required

**Example Request:**

```
GET /chat/messages/search?query=hello&conversationId=660e8400-e29b-41d4-a716-446655440000
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Messages found successfully",
  "data": {
    "messages": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "conversationId": "660e8400-e29b-41d4-a716-446655440000",
        "senderId": "550e8400-e29b-41d4-a716-446655440000",
        "content": "Hello! How are you?",
        "seen": true,
        "createdAt": "2025-11-16T14:20:00.000Z",
        "sender": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "fullName": "John Doe",
          "email": "john@example.com"
        }
      }
    ]
  }
}
```

**Response Fields:**

- `messages`: Array of message objects matching the search query
  - Same structure as messages in `GET /chat/conversation/:id/messages`

**Errors:**

- `400 Bad Request`:
  - Missing `query` parameter
  - Invalid `query` length (must be 1-100 characters)
  - Invalid `conversationId` format
- `401 Unauthorized`: Missing or invalid access token
- `500 Internal Server Error`: Server error during search

**Notes:**

- Search is case-insensitive
- Returns up to 50 matching messages
- Messages are ordered by creation date (newest first)
- Only searches messages in conversations where the user is a participant
- If `conversationId` is provided, search is limited to that conversation only
- Returns empty array if no messages match the query

---

## Webhook Endpoint (Internal)

### POST /webhooks/twilio/message

**Note:** This endpoint is for Twilio webhooks only and should not be called directly from the frontend. It receives message events from Twilio and saves them to the database.

**Critical:** This webhook must be configured in Twilio Console for messages to be saved to your database. Without this webhook, messages sent through Twilio SDK will appear in real-time but will not persist in your database.

**Configuration Required:**

- Configure in Twilio Console → Conversations → Services → [Your Service] → Configuration → Webhooks
- Event: `onMessageAdded`
- URL: `https://your-domain.com/webhooks/twilio/message`
- Must be publicly accessible (use ngrok for local development)

See **Troubleshooting** section below for detailed setup instructions.

---

## Frontend Integration Guide

### 1. Initialize Twilio Conversations SDK

First, install the Twilio Conversations SDK:

```bash
npm install @twilio/conversations
```

Then, initialize it in your application:

```typescript
import { Client } from '@twilio/conversations';

// Get token from your backend
const response = await fetch('/chat/token', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
const { data } = await response.json();
const { token, identity } = data;

// Initialize Twilio client
const client = new Client(token);

// Wait for client to be ready
await new Promise((resolve) => {
  client.on('stateChanged', (state) => {
    if (state === 'initialized') {
      resolve(null);
    }
  });
});
```

### 2. Create or Get Conversation

Before sending messages, create or retrieve a conversation:

```typescript
// Create/get conversation
const response = await fetch('/chat/conversation', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    receiverId: '550e8400-e29b-41d4-a716-446655440001',
  }),
});

const { data } = await response.json();
const { twilioConversationSid } = data;

// Get conversation from Twilio SDK
const conversation = await client.getConversationBySid(twilioConversationSid);
```

### 3. Send Messages

Send messages using Twilio SDK:

```typescript
// Send a message
await conversation.sendMessage('Hello! How are you?');
```

### 4. Receive Messages in Real-time

Listen for new messages:

```typescript
// Listen for new messages
conversation.on('messageAdded', (message) => {
  console.log('New message:', message.body);
  // Update your UI with the new message
});

// Listen for message updates (e.g., read receipts)
conversation.on('messageUpdated', (message) => {
  console.log('Message updated:', message);
});
```

### 5. Load Message History

Load paginated message history from your backend:

```typescript
// Load messages
const response = await fetch(
  `/chat/conversation/${conversationId}/messages?page=1&limit=50`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

const { data } = await response.json();
const { messages, total, page, totalPages } = data;

// Display messages in your UI
messages.forEach((message) => {
  console.log(`${message.sender.fullName}: ${message.content}`);
});
```

### 6. Mark Messages as Seen

When user views a conversation, mark messages as seen:

```typescript
// Mark messages as seen
await fetch(`/chat/conversation/${conversationId}/mark-seen`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### 7. Delete a Message

Delete a message (only by sender):

```typescript
// Delete a message
await fetch(`/chat/message/${messageId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### 8. Get All Conversations

Load user's conversation list:

```typescript
// Get all conversations
const response = await fetch('/chat/conversations', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const { data } = await response.json();
// data is an array of conversations with participant info
data.forEach((conversation) => {
  console.log(`Conversation with: ${conversation.otherParticipant.fullName}`);
});
```

### 9. Search Messages

Search for messages across conversations:

```typescript
// Search all messages
const response = await fetch(`/chat/messages/search?query=hello`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

// Search within a specific conversation
const response = await fetch(
  `/chat/messages/search?query=hello&conversationId=${conversationId}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

const { data } = await response.json();
// data.messages contains matching messages
```

### 10. Handle Token Refresh

Twilio tokens expire after 1 hour. Refresh them before expiration:

```typescript
// Refresh token before expiration (e.g., every 50 minutes)
setInterval(
  async () => {
    const response = await fetch('/chat/token', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const { data } = await response.json();

    // Update client with new token
    await client.updateToken(data.token);
  },
  50 * 60 * 1000,
); // 50 minutes
```

---

## Complete Frontend Example

Here's a complete example of a chat component:

```typescript
import { Client, Conversation } from '@twilio/conversations';
import { useEffect, useState } from 'react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
  };
  seen: boolean;
  createdAt: Date;
}

export function ChatComponent({
  conversationId,
  accessToken
}: {
  conversationId: string;
  accessToken: string;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Initialize Twilio client
  useEffect(() => {
    async function initTwilio() {
      // Get token
      const tokenResponse = await fetch('/chat/token', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const { data } = await tokenResponse.json();

      // Initialize client
      const twilioClient = new Client(data.token);
      await new Promise((resolve) => {
        twilioClient.on('stateChanged', (state) => {
          if (state === 'initialized') resolve(null);
        });
      });

      setClient(twilioClient);

      // Get conversation from backend
      const convResponse = await fetch(
        `/chat/conversation/${conversationId}/messages?page=1&limit=50`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const { data: convData } = await convResponse.json();
      setMessages(convData.messages);

      // Get Twilio conversation
      const conversationsResponse = await fetch('/chat/conversations', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const { data: conversations } = await conversationsResponse.json();
      const currentConv = conversations.find(
        (c: any) => c.id === conversationId
      );

      if (currentConv) {
        const twilioConv = await twilioClient.getConversationBySid(
          currentConv.twilioConversationSid
        );
        setConversation(twilioConv);

        // Listen for new messages
        twilioConv.on('messageAdded', (message) => {
          // Fetch updated messages from backend
          fetch(`/chat/conversation/${conversationId}/messages?page=1&limit=50`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
            .then(res => res.json())
            .then(({ data }) => setMessages(data.messages));
        });
      }

      // Mark messages as seen
      await fetch(`/chat/conversation/${conversationId}/mark-seen`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    }

    initTwilio();

    // Delete message handler
    const deleteMessage = async (messageId: string) => {
      await fetch(`/chat/message/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      // Refresh messages after deletion
      const convResponse = await fetch(
        `/chat/conversation/${conversationId}/messages?page=1&limit=50`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const { data: convData } = await convResponse.json();
      setMessages(convData.messages);
    };

    return () => {
      client?.shutdown();
    };
  }, [conversationId, accessToken]);

  const sendMessage = async () => {
    if (!conversation || !newMessage.trim()) return;

    await conversation.sendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender.fullName}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": {
    "name": "ErrorType",
    "stack": "Error stack trace (development only)"
  },
  "timestamp": "2025-11-16T14:24:50.456Z",
  "path": "/chat/conversation",
  "statusCode": 400
}
```

Common HTTP status codes:

- `400 Bad Request`: Validation errors, invalid input
- `401 Unauthorized`: Authentication required, invalid credentials
- `404 Not Found`: Resource not found (conversation, user, etc.)
- `500 Internal Server Error`: Server error

---

## Environment Variables

Required environment variables for chat system:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret
TWILIO_CHAT_SERVICE_SID=your_twilio_chat_service_sid

# Webhook URL (configure in Twilio Console)
TWILIO_WEBHOOK_URL=https://your-domain.com/webhooks/twilio/message
```

---

## Best Practices

### Security

1. **Token Management**
   - Store Twilio tokens in memory only (not localStorage)
   - Refresh tokens before expiration (every 50 minutes)
   - Never expose Twilio credentials to frontend

2. **Authentication**
   - Always include access token in API requests
   - Validate user permissions before allowing conversation access
   - Verify user is participant before retrieving messages

### Performance

1. **Message Loading**
   - Use pagination for message history
   - Load messages on-demand (lazy loading)
   - Cache conversation list locally

2. **Real-time Updates**
   - Use Twilio SDK events for real-time message delivery
   - Poll backend only for initial load and pagination
   - Debounce mark-as-seen requests

### User Experience

1. **Message Status**
   - Show "sending" state while message is being sent
   - Display read receipts when messages are seen
   - Handle offline scenarios gracefully

2. **Error Handling**
   - Show user-friendly error messages
   - Retry failed message sends
   - Handle token expiration gracefully

---

## Limitations and Considerations

1. **Message Size**: Twilio has limits on message size (typically 16KB)
2. **Rate Limiting**: Twilio may rate limit message sending
3. **Token Expiration**: Tokens expire after 1 hour and must be refreshed
4. **Offline Support**: Messages sent while offline may fail; implement retry logic
5. **File Attachments**: Current implementation supports text only; file attachments require additional setup

---

## Troubleshooting

### Messages Not Saving to Database

**Problem:** Messages sent through Twilio SDK appear in real-time but are not saved to the database (empty array when fetching from `/chat/conversation/:id/messages`).

**Root Cause:** Messages are saved to the database via Twilio webhooks. When you send a message through Twilio SDK, Twilio sends a webhook event to your backend. If the webhook is not configured or not accessible, messages won't be saved.

**Solution:**

1. **Configure Webhook in Twilio Console:**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Navigate to **Conversations** → **Services** → Select your Chat Service
   - Go to **Configuration** → **Webhooks**
   - Under **POST Event Webhooks**, add:
     - **Event:** `onMessageAdded`
     - **URL:** `https://your-domain.com/webhooks/twilio/message`
   - Save the configuration

2. **For Local Development:**
   - Use a tunneling service like [ngrok](https://ngrok.com/) to expose your local server:
     ```bash
     ngrok http 3000  # Replace 3000 with your backend port
     ```
   - Use the ngrok HTTPS URL in Twilio webhook configuration:
     ```
     https://your-ngrok-url.ngrok.io/webhooks/twilio/message
     ```
   - **Important:** Update the webhook URL in Twilio Console whenever ngrok restarts (URL changes)

3. **Verify Webhook is Working:**
   - Check your backend logs for webhook events:
     ```
     Received Twilio webhook event { eventType: 'onMessageAdded' }
     ```
   - If you don't see webhook logs, the webhook is not reaching your server
   - Check Twilio Console → **Monitor** → **Logs** → **Webhooks** for delivery status

4. **Common Issues:**
   - **Webhook URL not accessible:** Ensure your server is running and accessible
   - **HTTPS required:** Twilio requires HTTPS for webhooks (use ngrok for local dev)
   - **Wrong webhook URL:** Verify the URL matches exactly: `/webhooks/twilio/message`
   - **Webhook signature validation:** Currently disabled in code, but should be enabled in production

5. **Testing Webhook Manually:**
   - You can test if your webhook endpoint is accessible:
     ```bash
     curl -X POST https://your-domain.com/webhooks/twilio/message \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "EventType=onMessageAdded&ConversationSid=CHxxx&MessageSid=IMxxx&Body=Test&Author=user-id"
     ```

**Note:** Messages sent through Twilio SDK will appear in real-time via `messageAdded` events, but they will only be saved to your database when the webhook successfully reaches your backend.

---

## Support

For issues or questions:

1. Check error messages in response
2. Verify environment variables are set correctly
3. Check Twilio service configuration (Account SID, Auth Token, Chat Service SID)
4. Review server logs for detailed error information
5. Verify webhook URL is configured correctly in Twilio Console
6. See **Troubleshooting** section above for common issues
