# Computer Use System - Usage Guide

## What Changed

✅ **Auto-Execute Loop** - Client now automatically continues until task completes
✅ **Better Logging** - Clear iteration markers and AI reasoning display
✅ **Request/Response Tracking** - See exactly what's sent and received
✅ **One Button** - Just click "Start Task" and watch it go!

## Quick Start

### 1. Start Server
```powershell
python main_simple.py
```

Leave running. Should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8080
```

### 2. Start Client
```powershell
python gui_client_new.py
```

### 3. Execute Task
1. Enter task (e.g., "Open Google and search for Python")
2. Click **▶ Start Task**
3. Watch automatic execution!

## What You'll See

```
=== STARTING NEW TASK ===
Task: Open Google and search for Python

📸 Capturing screenshot...
📤 Sending request to AI server...

============================================================
ITERATION 1
============================================================
📋 Session ID: abc-123...

🤖 AI Response:
I'll navigate to Google first...

📝 Received 1 actions to execute

Action 1/1:
  🔧 NAVIGATE
     Args: {"url": "https://google.com"}
     ✓ Navigated to: https://google.com

📸 Capturing new screenshot...
📤 Sending execution results to AI...

============================================================
ITERATION 2
============================================================

🤖 AI Response:
Now I'll search for Python...

📝 Received 1 actions to execute

Action 1/1:
  🔧 SEARCH
     Args: {"query": "Python"}
     ✓ Searched for: Python

📸 Capturing new screenshot...
📤 Sending execution results to AI...

============================================================
ITERATION 3
============================================================

🤖 AI Response:
Task complete! Search results are displayed.

============================================================
✅ TASK COMPLETE!
============================================================
```

## Architecture

```
CLIENT (gui_client_new.py)
    ↓
1. Capture screenshot
    ↓
2. Send to server → SERVER (main_simple.py)
                        ↓
                    3. Forward to AI → GOOGLE GEMINI
                                            ↓
                    4. Receive actions ← AI returns actions
                        ↓
5. Get actions ← Server forwards
    ↓
6. Execute actions locally
    ↓
7. Capture new screenshot
    ↓
8. Send results to server → SERVER
                        ↓
                    9. Forward to AI → GOOGLE GEMINI
                                            ↓
                   10. Receive actions ← AI returns actions
                        ↓
11. Get actions ← Server forwards
    ↓
[LOOP UNTIL COMPLETE]
```

## Execution Log Structure

Each iteration shows:

1. **Request Phase**:
   - 📸 Screenshot capture
   - 📤 Sending to server
   
2. **Response Phase**:
   - 🤖 AI reasoning/explanation
   - 📝 Number of actions received
   
3. **Execution Phase**:
   - 🔧 Action name (NAVIGATE, SEARCH, CLICK, etc.)
   - ✓ Success or ⚠ Simulated
   
4. **Completion**:
   - ✅ Task complete or ⚠ Max iterations

## Action Types

### ✅ Fully Working
- `navigate` - Opens URL in browser
- `search` - Google search
- `open_web_browser` - Opens blank page

### ⚠️ Simulated (logged but not executed)
- `click` - Would click at coordinates
- `type` - Would type text
- Others - Logged for debugging

To implement click/type, add `pyautogui` or `playwright`.

## Configuration

Edit in `gui_client_new.py`:

```python
# Maximum iterations before stopping
max_iterations=20  # in auto_continue_loop()

# Delay between iterations (seconds)
time.sleep(1)  # Adjust for slower/faster systems

# Wait after navigation/search (seconds)
time.sleep(2)  # After opening browser
```

## Troubleshooting

### "Task incomplete" after many iterations
- AI might be stuck in a loop
- Check execution log for repeated actions
- Task might need clearer instructions

### Browser doesn't open
- Check default browser is set
- `webbrowser` module uses system default
- Try: `webbrowser.open('https://google.com')` in Python shell

### Actions are simulated
- Click/type require additional libraries
- Add `pyautogui` for mouse/keyboard control
- Or use `playwright` for browser automation

### Server timeout
- Increase timeout in requests.post():
  ```python
  timeout=120  # 2 minutes instead of 60 seconds
  ```

## Example Tasks

### ✅ Good Tasks
- "Open Google and search for Python"
- "Navigate to github.com"
- "Open YouTube"

### ⚠️ Limited Tasks (click/type simulated)
- "Search for Python and click first result"
- "Type a message and click send"
- "Fill out a form"

### ❌ Won't Work
- Tasks requiring file system access
- Desktop application control
- Complex multi-step workflows

## Files

- `main_simple.py` - Server (AI middleman)
- `gui_client_new.py` - Client (auto-execute)
- `gui_client_simple.py` - Old manual version
- `requirements.txt` - Dependencies
- `condig.txt` - Your API key

## Next Steps

1. **Add Real Click/Type**:
   ```python
   import pyautogui
   
   # In execute_action()
   elif name == "click":
       x, y = args.get("x", 0), args.get("y", 0)
       pyautogui.click(x, y)
   ```

2. **Add Browser Automation**:
   ```python
   from playwright.sync_api import sync_playwright
   # Full browser control
   ```

3. **Add Error Recovery**:
   - Retry failed actions
   - Handle timeouts
   - Fallback strategies
