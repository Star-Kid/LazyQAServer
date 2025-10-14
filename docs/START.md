# Computer Use System - Quick Start

**AI-Powered Computer Control with Google Gemini**

## What This Does

A GUI client + server system that uses Google's Gemini AI to control your computer:
- **Server** (main.py) - Middleman between client and Google AI
- **Client** (gui_client_new.py) - Executes AI commands on your computer

## Installation (2 minutes)

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Add Your Google API Key
Create `condig.txt`:
```
GOOGLE_API_KEY="your-api-key-here"
```

Get key: https://aistudio.google.com/apikey

## Usage

### Step 1: Start Server
```powershell
python main.py
```
Leave this running. Should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8080
```

### Step 2: Start Client (New Terminal)
```powershell
python gui_client_new.py
```

### Step 3: Execute Tasks
1. Enter task (e.g., "Open Google and search for Python")  
2. Click **▶ Start Task**
3. Watch AI execute automatically!

## What You'll See

```
=== STARTING NEW TASK ===
Task: Open Google and search for Python

📸 Capturing screenshot...
📤 Sending request to AI server...

============================================================
ITERATION 1
============================================================

🤖 AI Response:
I'll navigate to Google...

📝 Received 1 actions to execute

Action 1/1:
  🔧 NAVIGATE
     ✓ Navigated to: https://google.com

[Auto-continues...]

============================================================
ITERATION 2
============================================================

🤖 AI Response:
Now searching for Python...

📝 Received 1 actions to execute

Action 1/1:
  🔧 SEARCH
     ✓ Searched for: Python

============================================================
✅ TASK COMPLETE!
============================================================
```

## Features

✅ **Real Control** - Actually clicks, types, scrolls  
✅ **Auto-Execute** - Runs up to 30 iterations automatically  
✅ **Human-Like Mouse** - Smooth bezier curves with overshooting  
✅ **Multi-Language** - Types Russian, Chinese, all Unicode  
✅ **Fast** - Optimized mouse movement and screenshot compression

## Actions Supported

- `navigate` - Opens URLs
- `search` - Google search
- `click_at` - Human-like clicking
- `type_text_at` - Types any language
- `scroll` - Page scrolling
- `key` - Key presses
- `hotkey` - Combinations (Ctrl+C, Win+R, etc.)

## Troubleshooting

**"Server not running"**
- Start `python main.py` first

**"Permission denied"**
- Run as administrator (keyboard library needs it)

**Russian text not typing**
- Requires admin privileges
- Make sure keyboard library is installed

## Configuration

Edit in files:
- `gui_client_new.py` - Max iterations (default: 30)
- `prompt.txt` - AI system instructions
- Server URL defaults to `http://127.0.0.1:8080`

## Documentation

- **[README.md](README.md)** - Full documentation
- **[API.md](docs/API.md)** - API reference
- **[architecture.md](docs/agent/architecture.md)** - System design
- **[changes.md](docs/changes.md)** - Version history

## Important

⚠️ Run in sandboxed environment only  
⚠️ Requires administrator privileges  
⚠️ Monitor all AI actions  
⚠️ Not for production without security hardening

---

**Version**: 2.0.0  
**Model**: gemini-2.5-computer-use-preview-10-2025
