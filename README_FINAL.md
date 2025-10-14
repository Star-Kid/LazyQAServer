# Computer Use System - Final Version

## Overview

A **client-server system** that uses Google's Gemini Computer Use AI model to control your computer.

- **Server** (`main_simple.py`) - Middleman between client and Google AI
- **Client** (`gui_client_new.py`) - Executes AI commands (clicks, typing, etc.) using `pyautogui`

## Key Features

✅ **Real Computer Control** - Actually clicks, types, scrolls on your screen
✅ **Auto-Execute Loop** - Runs until task completes
✅ **Computer Use Functions** - Uses official Google Computer Use actions
✅ **Visual Feedback** - See every action in execution log

## Installation

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

This installs:
- `google-genai` - Google AI SDK
- `fastapi` + `uvicorn` - Web server
- `pydantic` - Data validation
- `pillow` - Screenshot capture
- `requests` - HTTP client
- `pyautogui` - Mouse/keyboard control

### 2. Configure API Key

Create `condig.txt`:
```
GOOGLE_API_KEY="your-api-key-here"
```

Get key: https://aistudio.google.com/apikey

## Usage

### Start Server
```powershell
python main_simple.py
```

Should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8080
```

### Start Client
```powershell
python gui_client_new.py
```

### Run Task
1. Enter task (e.g., "Click at the center of the screen")
2. Click **▶ Start Task**
3. Watch AI control your computer!

## Computer Use Actions

The AI can execute these actions:

### ✅ Fully Implemented

| Action | Description | Example Args |
|--------|-------------|--------------|
| `open_web_browser` | No-op (browser context) | `{}` |
| `navigate` | Open URL in browser | `{"url": "https://google.com"}` |
| `click_at` / `click` | Click at coordinates | `{"x": 500, "y": 300}` |
| `type_text_at` / `type` | Type text at location | `{"x": 500, "y": 300, "text": "Hello", "press_enter": true}` |
| `scroll` | Scroll page | `{"direction": "down", "amount": 3}` |
| `key` / `press_key` | Press single key | `{"key": "enter"}` |
| `hotkey` | Press key combination | `{"keys": ["ctrl", "c"]}` |
| `search` | Google search | `{"query": "Python programming"}` |

### Coordinate System

- **Normalized (0-1000)**: AI uses normalized coordinates
  - `x=500, y=500` = center of screen
  - `x=0, y=0` = top-left corner
  - `x=1000, y=1000` = bottom-right corner
  
- **Conversion**: Client automatically converts to pixel coordinates
  ```python
  actual_x = int(x / 1000 * screen_width)
  actual_y = int(y / 1000 * screen_height)
  ```

## Example Tasks

### Basic Actions
```
"Click at the center of the screen"
"Press the Enter key"
"Scroll down 5 times"
"Press Ctrl+C"
```

### Browser Tasks
```
"Navigate to https://google.com"
"Search for Python programming"
"Open GitHub"
```

### Complex Tasks
```
"Click at coordinates 500,300 and type 'Hello World'"
"Type 'test@email.com' at the center and press enter"
"Scroll down, then click at 800,400"
```

## Execution Flow

```
1. User enters task
   ↓
2. Client captures screenshot
   ↓
3. Client → Server → Google AI
   ↓
4. AI analyzes screenshot + task
   ↓
5. AI returns actions (e.g., click_at, type_text_at)
   ↓
6. Client executes actions with pyautogui
   ↓
7. Client captures new screenshot
   ↓
8. Client → Server → AI
   ↓
9. AI sees result, returns next actions
   ↓
10. LOOP until task complete
```

## Example Session

```
=== STARTING NEW TASK ===
Task: Click at the center of the screen
Screen: 1920x1080

📸 Capturing screenshot...
📤 Sending request to AI server...

============================================================
ITERATION 1
============================================================
📋 Session ID: abc-123...

🤖 AI Response:
I'll click at the center of the screen (500, 500).

📝 Received 1 actions to execute

Action 1/1:
  🔧 CLICK_AT
     Args: {
        "x": 500,
        "y": 500
     }
     ✓ Clicking at (960, 540)

📸 Capturing new screenshot...
📤 Sending execution results to AI...

============================================================
ITERATION 2
============================================================

🤖 AI Response:
Task complete! I've clicked at the center of the screen.

============================================================
✅ TASK COMPLETE!
============================================================
```

## Safety Features

⚠️ **Warning**: The AI can control your mouse and keyboard!

### Recommendations:
1. **Test with simple tasks first**
2. **Don't run untrusted tasks**
3. **Keep mouse on corner** to emergency stop (pyautogui failsafe)
4. **Close important apps** before testing

### PyAutoGUI Failsafe:
Move mouse to **top-left corner** to raise `FailSafeException` and stop execution.

## Troubleshooting

### "Import pyautogui could not be resolved"
```powershell
pip install pyautogui
```

### Mouse/keyboard not working
- Check pyautogui is installed
- Run as administrator (Windows)
- Disable accessibility restrictions (macOS)

### AI not understanding task
- Be specific: "Click at coordinates 500,500"
- Include details: "Type 'hello' at center and press enter"
- Break complex tasks into steps

### Task never completes
- Check max_iterations (default: 20)
- AI might be stuck - check logs
- Task might be unclear

## Configuration

### Client Settings (`gui_client_new.py`)

```python
# Max iterations before stopping
max_iterations=20

# Wait time between actions (seconds)
time.sleep(0.5)  # After click
time.sleep(2)    # After navigation

# PyAutoGUI settings
pyautogui.PAUSE = 0.5  # Pause between pyautogui calls
pyautogui.FAILSAFE = True  # Enable failsafe
```

### Server Settings (`main_simple.py`)

```python
MODEL_NAME = "gemini-2.5-computer-use-preview-10-2025"
temperature = 1.0  # AI creativity (0-2)
```

## API Reference

### POST /api/v1/start
Start new session

**Request:**
```json
{
  "prompt": "Click at center",
  "screenshot": "base64_image"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "actions": [{"name": "click_at", "args": {"x": 500, "y": 500}}],
  "reasoning": "I'll click at center...",
  "is_complete": false
}
```

### POST /api/v1/continue
Continue session with results

**Request:**
```json
{
  "session_id": "uuid",
  "screenshot": "base64_image",
  "current_url": "about:blank",
  "function_results": [{"name": "click_at", "success": true, "result": "success"}]
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "actions": [...],
  "reasoning": "...",
  "is_complete": true
}
```

## Files

- `main_simple.py` - FastAPI server
- `gui_client_new.py` - GUI client with pyautogui
- `requirements.txt` - All dependencies
- `condig.txt` - Your API key (create this)

## Advanced Usage

### Add Custom Actions

In `gui_client_new.py`:

```python
elif name == "my_custom_action":
    arg1 = args.get("arg1", "default")
    # Your code here
    result = "success"
```

### Browser Automation

For full browser control, use Playwright:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    # Full control
```

### Multi-Monitor Support

```python
# Get all monitors
from screeninfo import get_monitors
monitors = get_monitors()

# Calculate coordinates across monitors
```

## License

MIT - Use at your own risk!
