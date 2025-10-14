# Computer Use Server Architecture

## Overview

The Computer Use Server is a FastAPI-based REST API server that enables remote computer control using Google's Gemini 2.5 Computer Use Preview model. The server acts as an intermediary between clients and the AI model, analyzing screenshots and user goals to generate sequences of UI actions.

## System Architecture

```
┌─────────────┐          ┌──────────────────┐          ┌─────────────────┐
│   Client    │ ◄──────► │  Server (FastAPI)│ ◄──────► │  Gemini AI      │
│             │  HTTP    │                  │   API    │  Computer Use   │
│  - Browser  │          │  - Session Mgmt  │          │  Model          │
│  - Desktop  │          │  - Image Process │          │                 │
│  - Mobile   │          │  - Action Parse  │          │                 │
└─────────────┘          └──────────────────┘          └─────────────────┘
```

## Core Components

### 1. FastAPI Application Layer

**Purpose**: Handles HTTP requests, routing, and response formatting.

**Key Features**:
- RESTful API endpoints
- CORS middleware for cross-origin support
- Request/response validation using Pydantic models
- Error handling and logging

**Endpoints**:
- `GET /` - Health check and API information
- `POST /api/v1/start` - Initialize new session
- `POST /api/v1/continue` - Continue existing session
- `GET /api/v1/session/{session_id}` - Get session info
- `DELETE /api/v1/session/{session_id}` - Terminate session
- `GET /api/v1/sessions` - List all sessions

### 2. Session Management

**Purpose**: Maintain state across multiple interaction turns.

**Implementation**:
```python
sessions: Dict[str, Dict[str, Any]] = {
    "session_id": {
        "chat": ChatSession,           # Gemini chat object
        "created_at": str,              # ISO timestamp
        "turns": int,                   # Interaction count
        "is_active": bool,              # Session status
        "screen_size": tuple,           # (width, height)
        "excluded_actions": list,       # Disabled actions
        "history": list                 # Action history
    }
}
```

**Note**: Current implementation uses in-memory storage. For production:
- Use Redis for distributed caching
- Use PostgreSQL/MongoDB for persistent storage
- Implement session expiration and cleanup

### 3. Gemini AI Integration

**Model**: `gemini-2.5-computer-use-preview-10-2025`

**Tool Configuration**:
```python
{
    "computer_use": {
        "excluded_predefined_functions": [...]  # Optional
    }
}
```

**Communication Flow**:
1. Client sends screenshot (base64) + prompt
2. Server decodes image to bytes
3. Server sends to Gemini with tool configuration
4. Gemini analyzes and returns function calls
5. Server parses and sends to client
6. Client executes actions
7. Client sends results + new screenshot
8. Loop continues until task complete

### 4. Image Processing

**Format**: Base64-encoded PNG images

**Process**:
1. Receive base64 string from client
2. Remove data URI prefix if present
3. Decode to bytes
4. Validate image data
5. Pass to Gemini API

**Recommended Resolution**: 1440x900 (can work with any resolution)

### 5. Action Parser

**Purpose**: Extract and structure AI model responses.

**Parsed Elements**:
- **Actions**: List of function calls (name + arguments)
- **Reasoning**: Model's explanation text
- **Completion Status**: Whether task is finished
- **Safety Decision**: Whether confirmation is required
- **Safety Explanation**: Why confirmation is needed

**Action Format**:
```json
{
    "name": "click_at",
    "args": {
        "x": 500,
        "y": 300
    }
}
```

### 6. Safety System

**Built-in Safety Checks**:
- Model includes safety_decision in responses
- Two levels: "regular" (allowed) and "require_confirmation"

**Confirmation Flow**:
1. Model detects risky action
2. Server sets `requires_confirmation: true`
3. Client prompts user
4. User confirms/denies
5. Client sends confirmation in next request
6. Model proceeds or adjusts plan

**Safety Best Practices**:
- Run in sandboxed environment
- Implement allowlist/blocklist for URLs
- Log all actions for audit
- Sanitize user inputs
- Use content safety APIs

## Data Models

### InitialRequest
```python
{
    "prompt": str,              # User's goal
    "screenshot": str,          # Base64 image
    "screen_width": int,        # Default: 1440
    "screen_height": int,       # Default: 900
    "excluded_actions": list    # Optional
}
```

### ActionResponse
```python
{
    "session_id": str,
    "actions": [
        {"name": str, "args": dict}
    ],
    "reasoning": str,           # Optional
    "is_complete": bool,
    "requires_confirmation": bool,
    "safety_explanation": str   # Optional
}
```

### FunctionResponse
```python
{
    "session_id": str,
    "screenshot": str,          # New screenshot
    "function_responses": [
        {
            "name": str,
            "success": bool,
            "result": str
        }
    ],
    "user_confirmed": bool,     # Optional
    "current_url": str          # Optional
}
```

## Supported Actions

The Computer Use model supports the following UI actions:

| Action | Description | Parameters |
|--------|-------------|------------|
| `open_web_browser` | Opens browser | None |
| `wait_5_seconds` | Pause execution | None |
| `go_back` | Browser back | None |
| `go_forward` | Browser forward | None |
| `search` | Open search engine | None |
| `navigate` | Go to URL | url: str |
| `click_at` | Click coordinates | x: int, y: int |
| `hover_at` | Hover coordinates | x: int, y: int |
| `type_text_at` | Type text | x: int, y: int, text: str, press_enter: bool, clear_before_typing: bool |
| `key_combination` | Press keys | keys: str |
| `scroll_document` | Scroll page | direction: str |
| `scroll_at` | Scroll element | x: int, y: int, direction: str, magnitude: int |
| `drag_and_drop` | Drag element | x: int, y: int, destination_x: int, destination_y: int |

**Coordinate System**: All coordinates use 0-999 scale, mapped to actual screen dimensions.

## Security Considerations

### 1. Execution Environment
- Run server in isolated container/VM
- Limit network access
- Use separate browser profiles

### 2. Input Validation
- Validate all user inputs
- Check image format and size
- Sanitize prompts for injection

### 3. Rate Limiting
- Implement per-session limits
- Throttle API requests
- Prevent abuse

### 4. Authentication (TODO)
- Add API key authentication
- Implement user authorization
- Session token validation

### 5. Logging & Monitoring
- Log all requests and responses
- Monitor for suspicious patterns
- Alert on security events

## Scalability

### Current Limitations
- In-memory session storage
- Single-server deployment
- No load balancing

### Production Improvements
1. **Horizontal Scaling**:
   - Deploy multiple server instances
   - Use load balancer (nginx/HAProxy)
   - Share sessions via Redis

2. **Database Integration**:
   - PostgreSQL for session persistence
   - MongoDB for action history
   - S3 for screenshot storage

3. **Caching**:
   - Redis for session data
   - CDN for static content
   - Cache model responses

4. **Queue System**:
   - RabbitMQ/Kafka for async processing
   - Worker pools for action execution
   - Priority queues for urgent tasks

## Error Handling

### Exception Types
1. **API Errors**: Invalid API key, rate limits
2. **Model Errors**: Response parsing, invalid actions
3. **Session Errors**: Not found, expired, invalid state
4. **Image Errors**: Decode failure, invalid format
5. **Network Errors**: Timeout, connection issues

### Error Response Format
```json
{
    "detail": "Error description",
    "status_code": 500,
    "timestamp": "2025-10-14T10:30:00Z"
}
```

## Configuration

### Environment Variables (Recommended)
```bash
GEMINI_API_KEY=your_api_key_here
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
LOG_LEVEL=INFO
MAX_SESSIONS=1000
SESSION_TIMEOUT=3600
```

### Current Configuration
- API key loaded from `condig.txt`
- Default port: 8000
- Default host: 0.0.0.0
- Log level: INFO

## Future Enhancements

1. **Authentication System**
   - JWT tokens
   - OAuth2 integration
   - Role-based access

2. **Custom Actions**
   - User-defined functions
   - Platform-specific actions (mobile, desktop)
   - Plugin system

3. **Advanced Features**
   - Multi-model support
   - Action recording/replay
   - Visual debugging tools

4. **Performance**
   - Response caching
   - Image compression
   - Parallel action execution

5. **Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Real-time alerts

## Dependencies

### Core
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `google-generativeai` - Gemini API client
- `pydantic` - Data validation

### Optional
- `redis` - Session storage
- `sqlalchemy` - Database ORM
- `prometheus-client` - Metrics
- `sentry-sdk` - Error tracking

## Testing

### Unit Tests
- Test action parsing
- Test image decoding
- Test session management

### Integration Tests
- Test API endpoints
- Test Gemini integration
- Test error handling

### Load Tests
- Concurrent sessions
- Large screenshots
- Long-running tasks

## Deployment

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Kubernetes
- Deploy as microservice
- Use ConfigMap for config
- Use Secrets for API keys
- Horizontal Pod Autoscaler

## Monitoring & Logging

### Logs
- Request/response logs
- Error logs
- Performance logs
- Security audit logs

### Metrics
- Requests per second
- Average response time
- Active sessions
- Error rate
- Model API usage

## Conclusion

This architecture provides a robust foundation for remote computer control using AI. The modular design allows for easy extension and scaling as requirements grow.
