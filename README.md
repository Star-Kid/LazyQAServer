# Computer Use Server - Auto-Loop Mode

**AI-Powered Computer Control with Automatic Task Execution**

This server uses Google's Gemini 2.5 Computer Use model to automatically control computers. Send one request with your task, and the server handles everything in a continuous loop until completion!

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install fastapi uvicorn google-generativeai pydantic python-multipart
```

### 2. Configure API Key
Edit `condig.txt`:
```
AI_API = "your_google_ai_api_key_here"
```
Get key from: https://aistudio.google.com/apikey

### 3. Run Server
```bash
python main.py
```

Server starts at: `http://localhost:8000`

## ✨ Key Feature: Auto-Execute Mode

**The server now runs in automatic loop mode!** Just send one request and it handles the entire task:

```python
import requests
import base64

# Prepare screenshot
with open("screenshot.png", "rb") as f:
    screenshot = base64.b64encode(f.read()).decode()

# Send request - server auto-executes until complete!
response = requests.post(
    "http://localhost:8000/api/v1/start",
    json={
        "prompt": "Open Google and search for Python tutorials",
        "screenshot": f"data:image/png;base64,{screenshot}",
        "auto_execute": True,  # Default - runs automatically!
        "max_iterations": 20
    },
    timeout=120
)

result = response.json()
print(f"✓ Task completed: {result['is_complete']}")
print(f"Iterations: {result['iterations']}")

# View what happened
for step in result['execution_log']:
    print(f"Step {step['iteration']}: {step['reasoning']}")
```

## 🔄 How It Works

```
┌──────────────────────────────────────────────────────────┐
│                     Auto-Execute Loop                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Client sends: prompt + screenshot                    │
│                    ↓                                      │
│  2. Server → AI: Analyzes and generates action plan      │
│                    ↓                                      │
│  3. Server: Simulates action execution                   │
│                    ↓                                      │
│  4. Server → AI: "Actions done, what's next?"            │
│                    ↓                                      │
│  5. AI responds: Next actions or "task complete"         │
│                    ↓                                      │
│  6. Repeat steps 3-5 until task is done                  │
│                    ↓                                      │
│  7. Server returns: Complete execution log to client     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**No need for back-and-forth communication!** The server handles the entire loop internally.

## 📊 Response Format

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "is_complete": true,
  "iterations": 5,
  "execution_log": [
    {
      "iteration": 1,
      "reasoning": "Opening web browser and navigating to Google",
      "actions": [
        {"name": "open_web_browser", "args": {}},
        {"name": "navigate", "args": {"url": "https://google.com"}}
      ],
      "timestamp": "2025-10-14T10:30:00.000000"
    },
    {
      "iteration": 2,
      "reasoning": "Clicking search box and typing query",
      "actions": [
        {"name": "click_at", "args": {"x": 500, "y": 300}},
        {"name": "type_text_at", "args": {"x": 500, "y": 300, "text": "Python tutorials"}}
      ],
      "timestamp": "2025-10-14T10:30:02.500000"
    }
  ],
  "error": null
}
```

## 🎯 Use Cases

### ✅ Perfect For:
- **Automated testing** - Full user flow automation
- **Data entry** - Repetitive form filling
- **Research tasks** - Multi-step web navigation
- **Content gathering** - Extracting information from multiple pages
- **Workflow automation** - Complex multi-step processes

### Example Tasks:
```python
# Task 1: Search and gather info
"Open Google, search for 'AI news', click the first result, and read the article"

# Task 2: Form automation
"Fill out the contact form with name 'John', email 'john@example.com', and submit"

# Task 3: Multi-site research
"Compare prices for iPhone 15 on Amazon and Best Buy"

# Task 4: Data extraction
"Go to Wikipedia, search for 'Python programming', and extract the introduction"
```

## 🎮 Manual Mode (Optional)

For step-by-step control, disable auto-execute:

```python
response = requests.post(
    "http://localhost:8000/api/v1/start",
    json={
        "prompt": "Open Google",
        "screenshot": screenshot,
        "auto_execute": False  # Client handles each step
    }
)

# Get actions
actions = response.json()["actions"]

# Execute actions yourself
# Then call /api/v1/continue with results
```

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/start` | Start session (auto-executes by default) |
| POST | `/api/v1/continue` | Continue session (manual mode only) |
| GET | `/api/v1/session/{id}` | Get session info |
| DELETE | `/api/v1/session/{id}` | Delete session |
| GET | `/api/v1/sessions` | List all sessions |

## 🔧 Configuration Options

```python
{
    "prompt": "Your task description",
    "screenshot": "base64_encoded_image",
    "auto_execute": True,        # Enable auto-loop (default)
    "max_iterations": 20,         # Max loop iterations (default: 20)
    "screen_width": 1440,         # Screen width (default: 1440)
    "screen_height": 900,         # Screen height (default: 900)
    "excluded_actions": [],       # Actions to exclude (optional)
    "callback_url": "http://..."  # Progress updates URL (optional)
}
```

## 🛡️ Safety Features

- ✅ **Automatic safety checks** - AI evaluates risky actions
- ✅ **Confirmation requests** - Pauses for user approval when needed
- ✅ **Execution logging** - Complete audit trail
- ✅ **Max iterations limit** - Prevents infinite loops
- ✅ **Error handling** - Graceful failure recovery

## 📖 Examples

See `docs/examples/` for complete examples:
- **`auto_execute_example.py`** - Full auto-execute demonstration
- **`example_client.py`** - Playwright integration
- **`simple_client_example.py`** - Basic REST client

## 📋 Supported Actions

The AI can perform these actions:
- **Browser**: open, navigate, back, forward, search
- **Mouse**: click, hover, drag & drop
- **Keyboard**: type text, key combinations
- **Scroll**: document scroll, element scroll
- **Utility**: wait, delays

## 🚨 Important Notes

⚠️ **This is experimental technology**
- Use in **sandboxed environments** only
- **Monitor all actions** carefully
- Not for production without security hardening
- Follow Google's terms of service

⚠️ **Current Limitations**
- In-memory sessions (lost on restart)
- No authentication (add before production)
- Simulated execution (not real browser control)
- Preview model may change

## 📚 Documentation

- **[Full Documentation](docs/)** - Complete guides
- **[API Reference](docs/API.md)** - Detailed API docs
- **[Architecture](docs/agent/architecture.md)** - System design
- **[Installation](INSTALL.md)** - Detailed setup
- **[Changes](changes.md)** - Version history

## 🔮 Next Steps

1. ✅ Auto-execute mode implemented
2. 🔄 Real browser integration (Playwright)
3. 🔄 WebSocket for real-time updates
4. 🔄 Authentication system
5. 🔄 Persistent storage
6. 🔄 Rate limiting

## 💡 Quick Test

```bash
# Start server
python main.py

# In another terminal, run example
cd docs/examples
python auto_execute_example.py
```

## 📞 Support

- Check logs for errors
- See `/docs` for detailed documentation
- Review execution logs for debugging

## 📜 License

[Your License Here]

---

**Version**: 1.1.0 (Auto-Execute)  
**Date**: October 14, 2025  
**Author**: LazyQA Team

🎯 **Now with automatic task execution - just send and wait!**
