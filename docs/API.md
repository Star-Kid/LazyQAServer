# Computer Use Server API Documentation

## Overview

The Computer Use Server provides a REST API for remote computer control using Google's Gemini Computer Use model. Clients send screenshots and prompts, and receive AI-generated actions to execute.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the server does not require authentication. In production, implement API key authentication.

## Endpoints

### 1. Health Check

Check server status and get API information.

**Endpoint**: `GET /`

**Response**:
```json
{
    "service": "Computer Use Server",
    "status": "running",
    "version": "1.0.0",
    "model": "gemini-2.5-computer-use-preview-10-2025",
    "timestamp": "2025-10-14T10:30:00.000000"
}
```

**Status Codes**:
- `200 OK` - Server is running

---

### 2. Start Session

Initialize a new computer use session with an initial prompt and screenshot.

**Endpoint**: `POST /api/v1/start`

**Request Body**:
```json
{
    "prompt": "Open Google and search for Python tutorials",
    "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
    "screen_width": 1440,
    "screen_height": 900,
    "excluded_actions": ["drag_and_drop"]
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | User's goal or task description |
| `screenshot` | string | Yes | Base64-encoded screenshot (PNG format) |
| `screen_width` | integer | No | Screen width in pixels (default: 1440) |
| `screen_height` | integer | No | Screen height in pixels (default: 900) |
| `excluded_actions` | array | No | List of actions to exclude |

**Response**:
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "actions": [
        {
            "name": "open_web_browser",
            "args": {}
        },
        {
            "name": "navigate",
            "args": {
                "url": "https://www.google.com"
            }
        }
    ],
    "reasoning": "I will open the web browser and navigate to Google's homepage.",
    "is_complete": false,
    "requires_confirmation": false,
    "safety_explanation": null
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | Unique session identifier (UUID) |
| `actions` | array | List of actions to execute |
| `reasoning` | string | Model's explanation of its plan |
| `is_complete` | boolean | Whether the task is finished |
| `requires_confirmation` | boolean | Whether user confirmation is needed |
| `safety_explanation` | string | Explanation if confirmation required |

**Status Codes**:
- `200 OK` - Session created successfully
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server processing error

---

### 3. Continue Session

Send action execution results and continue the session.

**Endpoint**: `POST /api/v1/continue`

**Request Body**:
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
    "function_responses": [
        {
            "name": "open_web_browser",
            "success": true,
            "result": "Browser opened successfully"
        },
        {
            "name": "navigate",
            "success": true,
            "result": "Navigated to https://www.google.com"
        }
    ],
    "user_confirmed": null,
    "current_url": "https://www.google.com"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | Yes | Session identifier from start request |
| `screenshot` | string | Yes | New screenshot after executing actions |
| `function_responses` | array | Yes | Results of executed actions |
| `user_confirmed` | boolean | No | User confirmation (required if requested) |
| `current_url` | string | No | Current browser URL |

**Function Response Format**:
```json
{
    "name": "action_name",
    "success": true,
    "result": "Execution result description"
}
```

**Response**: Same format as Start Session response

**Status Codes**:
- `200 OK` - Session continued successfully
- `400 Bad Request` - Invalid request or inactive session
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Server processing error

---

### 4. Get Session Info

Retrieve information about a specific session.

**Endpoint**: `GET /api/v1/session/{session_id}`

**Path Parameters**:
- `session_id` - Unique session identifier

**Response**:
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-10-14T10:30:00.000000",
    "turns": 5,
    "is_active": true
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | Session identifier |
| `created_at` | string | Creation timestamp (ISO 8601) |
| `turns` | integer | Number of interaction turns |
| `is_active` | boolean | Whether session is still active |

**Status Codes**:
- `200 OK` - Session info retrieved
- `404 Not Found` - Session not found

---

### 5. Delete Session

Terminate and delete a session.

**Endpoint**: `DELETE /api/v1/session/{session_id}`

**Path Parameters**:
- `session_id` - Unique session identifier

**Response**:
```json
{
    "message": "Session deleted successfully",
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status Codes**:
- `200 OK` - Session deleted
- `404 Not Found` - Session not found

---

### 6. List Sessions

List all active and inactive sessions.

**Endpoint**: `GET /api/v1/sessions`

**Response**:
```json
{
    "total_sessions": 3,
    "sessions": [
        {
            "session_id": "550e8400-e29b-41d4-a716-446655440000",
            "created_at": "2025-10-14T10:30:00.000000",
            "turns": 5,
            "is_active": true
        },
        {
            "session_id": "660e8400-e29b-41d4-a716-446655440001",
            "created_at": "2025-10-14T11:00:00.000000",
            "turns": 2,
            "is_active": false
        }
    ]
}
```

**Status Codes**:
- `200 OK` - Sessions listed successfully

---

## Action Types

The model can return the following action types:

### Browser Control

#### open_web_browser
```json
{
    "name": "open_web_browser",
    "args": {}
}
```

#### navigate
```json
{
    "name": "navigate",
    "args": {
        "url": "https://example.com"
    }
}
```

#### go_back
```json
{
    "name": "go_back",
    "args": {}
}
```

#### go_forward
```json
{
    "name": "go_forward",
    "args": {}
}
```

#### search
```json
{
    "name": "search",
    "args": {}
}
```

### Mouse Actions

#### click_at
```json
{
    "name": "click_at",
    "args": {
        "x": 500,
        "y": 300
    }
}
```
- `x`, `y`: Coordinates (0-999 scale)

#### hover_at
```json
{
    "name": "hover_at",
    "args": {
        "x": 250,
        "y": 150
    }
}
```

#### drag_and_drop
```json
{
    "name": "drag_and_drop",
    "args": {
        "x": 100,
        "y": 100,
        "destination_x": 500,
        "destination_y": 500
    }
}
```

### Keyboard Actions

#### type_text_at
```json
{
    "name": "type_text_at",
    "args": {
        "x": 400,
        "y": 250,
        "text": "search query",
        "press_enter": true,
        "clear_before_typing": true
    }
}
```

#### key_combination
```json
{
    "name": "key_combination",
    "args": {
        "keys": "Control+C"
    }
}
```

### Scroll Actions

#### scroll_document
```json
{
    "name": "scroll_document",
    "args": {
        "direction": "down"
    }
}
```
- `direction`: "up", "down", "left", or "right"

#### scroll_at
```json
{
    "name": "scroll_at",
    "args": {
        "x": 500,
        "y": 500,
        "direction": "down",
        "magnitude": 400
    }
}
```

### Utility Actions

#### wait_5_seconds
```json
{
    "name": "wait_5_seconds",
    "args": {}
}
```

---

## Safety & Confirmation

When the model detects a potentially risky action, it will set `requires_confirmation: true` in the response.

**Example Response with Confirmation**:
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "actions": [
        {
            "name": "click_at",
            "args": {
                "x": 60,
                "y": 100
            }
        }
    ],
    "reasoning": "I need to click the 'Accept Cookies' button.",
    "is_complete": false,
    "requires_confirmation": true,
    "safety_explanation": "I am about to click on a cookie acceptance banner. Please confirm."
}
```

**Client Response**:
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "screenshot": "...",
    "function_responses": [
        {
            "name": "click_at",
            "success": true,
            "result": "Action executed"
        }
    ],
    "user_confirmed": true
}
```

---

## Error Responses

All errors follow this format:

```json
{
    "detail": "Error description message"
}
```

**Common Errors**:

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid request data, missing fields, or inactive session |
| 404 | Session not found |
| 500 | Server error, API failure, or processing error |

---

## Usage Examples

### Example 1: Open Google

**Step 1 - Start Session**:
```bash
curl -X POST http://localhost:8000/api/v1/start \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Open Google",
    "screenshot": "data:image/png;base64,iVBORw0KGgo..."
  }'
```

**Response**:
```json
{
    "session_id": "abc-123",
    "actions": [
        {"name": "open_web_browser", "args": {}},
        {"name": "navigate", "args": {"url": "https://www.google.com"}}
    ],
    "reasoning": "Opening browser and navigating to Google.",
    "is_complete": false,
    "requires_confirmation": false
}
```

**Step 2 - Execute Actions & Continue**:
```bash
curl -X POST http://localhost:8000/api/v1/continue \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "screenshot": "data:image/png;base64,iVBORw0KGgo...",
    "function_responses": [
        {"name": "open_web_browser", "success": true, "result": "Done"},
        {"name": "navigate", "success": true, "result": "Done"}
    ],
    "current_url": "https://www.google.com"
  }'
```

**Response**:
```json
{
    "session_id": "abc-123",
    "actions": [],
    "reasoning": "Task completed successfully.",
    "is_complete": true,
    "requires_confirmation": false
}
```

### Example 2: Search Query

**Initial Request**:
```json
{
    "prompt": "Search for 'Python tutorials' on Google",
    "screenshot": "..."
}
```

**Expected Actions**:
1. `open_web_browser`
2. `navigate` to Google
3. `click_at` search box
4. `type_text_at` with "Python tutorials" and press enter

---

## Best Practices

1. **Screenshot Quality**:
   - Use PNG format
   - Recommended size: 1440x900
   - Ensure UI elements are clearly visible

2. **Error Handling**:
   - Always check `success` in function responses
   - Handle network timeouts gracefully
   - Retry failed actions with exponential backoff

3. **Safety**:
   - Always respect `requires_confirmation` flag
   - Prompt user before executing risky actions
   - Log all actions for audit

4. **Performance**:
   - Compress screenshots before encoding
   - Reuse sessions for multi-step tasks
   - Clean up completed sessions

5. **Session Management**:
   - Store session_id for multi-turn interactions
   - Delete sessions when tasks complete
   - Handle session expiration

---

## Rate Limits

Current implementation has no rate limits. For production:
- Implement per-IP rate limiting
- Limit concurrent sessions per user
- Set maximum screenshot size
- Set session timeout (e.g., 1 hour)

---

## WebSocket Support (Future)

Real-time bidirectional communication for streaming updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle real-time updates
};
```

---

## Support

For issues or questions:
- Check server logs: `/var/log/computer-use-server.log`
- GitHub Issues: [repository URL]
- Email: support@example.com

---

## Changelog

See `changes.md` for version history and updates.
