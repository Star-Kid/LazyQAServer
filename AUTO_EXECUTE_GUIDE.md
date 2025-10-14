# Auto-Execute Mode - Complete Guide

## 🎯 What is Auto-Execute Mode?

**Auto-Execute Mode** is a new feature that allows the server to automatically handle the entire task execution loop. Instead of requiring the client to manually execute actions and send continue requests, the server does everything internally until the task is complete.

## 🔄 Traditional vs Auto-Execute

### Traditional Manual Mode ❌
```
Client → Server: "Open Google"
Client ← Server: [open_web_browser, navigate]

Client executes actions...
Client captures screenshot...

Client → Server: "Actions done, here's new screenshot"
Client ← Server: [click_at, type_text]

Client executes actions...
Client captures screenshot...

... repeat until complete
```
**Problem**: Requires continuous back-and-forth communication.

### Auto-Execute Mode ✅
```
Client → Server: "Open Google" (auto_execute=true)

Server internally:
  - Generates actions
  - Simulates execution
  - Requests next steps
  - Repeats until complete

Client ← Server: Complete execution log + result
```
**Benefit**: One request, automatic completion!

## 🚀 How to Use

### Basic Usage

```python
import requests
import base64

# Prepare screenshot
with open("screenshot.png", "rb") as f:
    screenshot = base64.b64encode(f.read()).decode()

# Send ONE request - server handles everything!
response = requests.post(
    "http://localhost:8000/api/v1/start",
    json={
        "prompt": "Open Google and search for Python tutorials",
        "screenshot": f"data:image/png;base64,{screenshot}",
        "auto_execute": True,  # This is the key!
        "max_iterations": 20
    },
    timeout=120  # Longer timeout for full execution
)

result = response.json()

# Check if task completed
if result['is_complete']:
    print("✓ Task completed successfully!")
else:
    print(f"✗ Task incomplete: {result['error']}")

# View what happened
print(f"Total iterations: {result['iterations']}")
for entry in result['execution_log']:
    print(f"\nStep {entry['iteration']}:")
    print(f"  Reasoning: {entry['reasoning']}")
    print(f"  Actions: {len(entry['actions'])}")
```

### With Progress Callbacks

```python
# Your callback server endpoint
CALLBACK_URL = "http://your-server.com/progress"

response = requests.post(
    "http://localhost:8000/api/v1/start",
    json={
        "prompt": "Navigate to wikipedia.org and search for Python",
        "screenshot": screenshot,
        "auto_execute": True,
        "callback_url": CALLBACK_URL,  # Receive real-time updates!
        "max_iterations": 30
    }
)

# Server will POST to your callback URL at each iteration:
# {
#   "session_id": "...",
#   "iteration": 3,
#   "status": "executing",
#   "actions": [...],
#   "reasoning": "..."
# }
```

### Manual Mode (Original Behavior)

```python
# For step-by-step control
response = requests.post(
    "http://localhost:8000/api/v1/start",
    json={
        "prompt": "Open Google",
        "screenshot": screenshot,
        "auto_execute": False  # Disable auto-execute
    }
)

# Now you must handle the loop yourself
session_id = response.json()["session_id"]
actions = response.json()["actions"]

# Execute actions on your side
# Then continue...
```

## 📊 Response Format

### Auto-Execute Response

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "actions": [
    {
      "name": "open_web_browser",
      "args": {}
    }
  ],
  "reasoning": "I will open the browser and navigate to Google",
  "is_complete": true,
  "requires_confirmation": false,
  "safety_explanation": null,
  "execution_log": [
    {
      "iteration": 1,
      "reasoning": "Opening browser and navigating to Google",
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
        {"name": "type_text_at", "args": {"x": 500, "y": 300, "text": "Python tutorials", "press_enter": true}}
      ],
      "timestamp": "2025-10-14T10:30:02.500000"
    },
    {
      "iteration": 3,
      "reasoning": "Task completed successfully",
      "actions": [],
      "status": "complete",
      "timestamp": "2025-10-14T10:30:05.000000"
    }
  ],
  "iterations": 3,
  "error": null
}
```

### Error Response

```json
{
  "session_id": "...",
  "is_complete": false,
  "iterations": 20,
  "error": "Maximum iterations (20) reached without task completion",
  "execution_log": [...]
}
```

### Confirmation Required Response

```json
{
  "session_id": "...",
  "is_complete": false,
  "iterations": 5,
  "error": "User confirmation required: I need to click on a cookie banner",
  "execution_log": [...]
}
```

## ⚙️ Configuration Parameters

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | string | Task description (e.g., "Open Google") |
| `screenshot` | string | Base64-encoded PNG image |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `auto_execute` | boolean | `true` | Enable automatic loop execution |
| `max_iterations` | integer | `20` | Maximum number of loop iterations |
| `screen_width` | integer | `1440` | Screen width in pixels |
| `screen_height` | integer | `900` | Screen height in pixels |
| `excluded_actions` | array | `[]` | Actions to exclude (e.g., `["drag_and_drop"]`) |
| `callback_url` | string | `null` | URL to POST progress updates to |

## 🎯 Use Cases

### 1. Automated Testing
```python
# Test a complete user flow
response = auto_execute({
    "prompt": "Go to login page, enter credentials, and verify dashboard loads",
    "screenshot": screenshot,
    "max_iterations": 15
})
```

### 2. Data Entry
```python
# Fill multiple forms
response = auto_execute({
    "prompt": "Fill contact form with name 'John Doe', email 'john@example.com', submit",
    "screenshot": screenshot
})
```

### 3. Research Tasks
```python
# Multi-step navigation
response = auto_execute({
    "prompt": "Search for 'AI trends 2025' on Google, click first 3 results, extract headlines",
    "screenshot": screenshot,
    "max_iterations": 25
})
```

### 4. Comparison Shopping
```python
# Compare prices across sites
response = auto_execute({
    "prompt": "Find iPhone 15 price on Amazon and Best Buy, compare",
    "screenshot": screenshot,
    "max_iterations": 30
})
```

## 🔍 How It Works Internally

### Step-by-Step Process

1. **Initialization**
   - Client sends request with `auto_execute: true`
   - Server generates session ID
   - Server analyzes screenshot with AI

2. **First Iteration**
   - AI generates initial action plan
   - Server logs actions and reasoning

3. **Auto-Loop Begins**
   - Server simulates action execution
   - Server builds "actions completed" message
   - Server sends to AI: "I executed these actions, what's next?"

4. **Subsequent Iterations**
   - AI analyzes simulated state
   - AI provides next actions or completion signal
   - Server logs each iteration
   - Optional: Server POSTs to callback URL

5. **Completion**
   - Task marked complete OR
   - Max iterations reached OR
   - Confirmation required OR
   - Error occurred

6. **Return to Client**
   - Complete execution log
   - Success/failure status
   - Total iterations
   - Any errors

### Internal Loop Code Flow

```python
async def auto_execute_loop(...):
    execution_log = []
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        
        # Log current step
        execution_log.append({
            "iteration": iteration,
            "reasoning": current_reasoning,
            "actions": current_actions,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Simulate execution
        function_responses = []
        for action in current_actions:
            function_responses.append({
                "name": action["name"],
                "success": True,
                "result": "Executed (simulated)"
            })
        
        # Ask AI for next steps
        response = chat.send_message([
            function_responses,
            "Actions completed. What's next?"
        ])
        
        # Parse AI response
        actions, reasoning, is_complete, ... = parse_response(response)
        
        # Check completion
        if is_complete or not actions:
            return success, execution_log, None, iteration
        
        # Continue loop...
    
    return failure, execution_log, "Max iterations", iteration
```

## 🛡️ Safety & Limitations

### Safety Features
- ✅ Max iterations limit (prevents infinite loops)
- ✅ Confirmation detection (pauses if risky action)
- ✅ Error handling (graceful failures)
- ✅ Complete logging (full audit trail)
- ✅ Timeout support (client-side timeout)

### Current Limitations
- ❌ Simulated execution only (no real browser control in loop)
- ❌ No screenshot updates (uses initial screenshot for all iterations)
- ❌ No actual DOM interaction (AI generates actions based on reasoning)
- ❌ Cannot handle dynamic content changes

### When to Use Manual Mode Instead
- Real browser execution required
- Dynamic content that changes
- Complex interactions needing verification
- Step-by-step debugging needed
- Screenshot updates between actions critical

## 💡 Best Practices

### 1. Set Appropriate Max Iterations
```python
# Simple task: 10 iterations
# Medium task: 20 iterations (default)
# Complex task: 30-50 iterations
```

### 2. Use Descriptive Prompts
```python
# ✓ Good
"Open Google, search for 'Python tutorials', click first result, read article title"

# ✗ Too vague
"Find Python info"
```

### 3. Handle Errors Gracefully
```python
result = auto_execute(...)

if result['is_complete']:
    print("Success!")
elif result['error']:
    if "max iterations" in result['error']:
        print("Task too complex, increase max_iterations")
    elif "confirmation required" in result['error']:
        print("Manual intervention needed")
else:
    print("Unknown error")
```

### 4. Use Callbacks for Long Tasks
```python
# For tasks that take >30 seconds
response = auto_execute({
    "prompt": "...",
    "screenshot": screenshot,
    "callback_url": "http://your-server/progress",
    "max_iterations": 50
})
```

### 5. Review Execution Logs
```python
# Always check what happened
for entry in result['execution_log']:
    print(f"Step {entry['iteration']}: {entry['reasoning']}")
    for action in entry['actions']:
        print(f"  - {action['name']}")
```

## 📊 Performance Metrics

### Typical Performance
- Simple task (3-5 actions): 5-15 seconds
- Medium task (10-15 actions): 15-45 seconds
- Complex task (20+ actions): 45-120 seconds

### Factors Affecting Speed
- AI model response time (2-5 seconds per iteration)
- Number of actions per iteration
- Network latency
- Server load

## 🐛 Troubleshooting

### Task Never Completes
```python
# Increase max_iterations
"max_iterations": 50
```

### Timeout Errors
```python
# Increase client timeout
timeout=300  # 5 minutes
```

### "Confirmation Required" Error
```python
# Use manual mode for tasks requiring confirmation
"auto_execute": False
```

### Empty Execution Log
```python
# Check if task failed early
if not result['execution_log']:
    print(f"Error: {result['error']}")
```

## 🔗 Related Documentation

- [README.md](README.md) - Quick start guide
- [API Documentation](docs/API.md) - Full API reference
- [Examples](docs/examples/) - Code examples
- [Architecture](docs/agent/architecture.md) - System design

---

**Version**: 1.1.0  
**Date**: October 14, 2025  
**Author**: LazyQA Team

**🎯 Auto-Execute Mode - The easiest way to automate tasks with AI!**
