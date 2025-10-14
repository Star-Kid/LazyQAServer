# Quick Start Guide

## What is this?

A **client-server system** where:
- **Server** (`main_simple.py`) = Middleman between you and Google AI
- **Client** (`gui_client_new.py`) = GUI app that executes AI instructions on your computer

## Setup (5 minutes)

### 1. Install dependencies
```powershell
pip install -r requirements.txt
```

### 2. Add your Google API key
Create `condig.txt`:
```
GOOGLE_API_KEY="your-key-here"
```

Get key from: https://aistudio.google.com/apikey

## Usage

### Step 1: Start Server
```powershell
python main_simple.py
```
Leave this running. You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8080
```

### Step 2: Start Client
Open NEW terminal:
```powershell
python gui_client_new.py
```

### Step 3: Run Tasks

In the GUI:
1. Enter task (e.g., "Open Google and search for Python")
2. Click **Start Task**
3. Watch AI decide actions
4. Click **Continue** after each step
5. Repeat until "TASK COMPLETE"

## Example Output

```
=== STARTING NEW TASK ===
Task: Open Google and search for Python
Capturing screenshot...
Sending to AI server...

--- Iteration 1 ---
Session ID: abc-123
AI Reasoning: I need to navigate to Google first...
Received 1 actions to execute

Action 1/1:
Executing: navigate with args: {"url": "https://google.com"}

[Click Continue]

--- Iteration 2 ---
AI Reasoning: Now I'll search for Python...
Received 1 actions to execute

Action 1/1:
Executing: search with args: {"query": "Python"}

[Click Continue]

--- Iteration 3 ---
AI Reasoning: Task is complete!
✅ TASK COMPLETE!
```

## How It Works

```
YOU (GUI Client)              SERVER              GOOGLE AI
     |                          |                     |
     |-- Task + Screenshot ---->|                     |
     |                          |-- Forward --------->|
     |                          |<-- Actions ---------|
     |<-- Actions to Execute ---|                     |
     |                          |                     |
  [Execute                      |                     |
   Actions]                     |                     |
     |                          |                     |
     |-- Results + Screenshot ->|                     |
     |                          |-- Forward --------->|
     |                          |<-- Next Actions ----|
     |<-- Next Actions ---------|                     |
     |                          |                     |
  [Execute                      |                     |
   Actions]                     |                     |
     |                          |                     |
    ...repeat until complete...
```

## Troubleshooting

### "Server not running!"
- Make sure you started `python main_simple.py` first
- Check that port 8080 is not in use

### "Failed to capture screenshot"
- Make sure you have a display (not headless)
- PIL/Pillow should be installed

### Actions not executing
- Currently `click` and `type` are simulated (logged only)
- `navigate` and `search` work via browser
- To fully implement, add `pyautogui` or `playwright`

## Current Limitations

- Click/Type actions are simulated (shown in log, not executed)
- You must manually click "Continue" between steps
- Works best with browser-based tasks

## Next Steps

To make it fully automated:
1. Add real click/type execution with `pyautogui`
2. Auto-continue instead of manual button clicks
3. Add more action handlers (scroll, drag, etc.)

## Files

- `main_simple.py` - Server (don't edit)
- `gui_client_new.py` - Client GUI (edit to add action handlers)
- `requirements.txt` - Dependencies
- `condig.txt` - Your API key (create this!)
- `README_CORRECT.md` - Full documentation
