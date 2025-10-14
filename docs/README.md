# Computer Use System - GUI Client & Server

**AI-Powered Computer Control with Google Gemini**

This system uses Google's Gemini 2.5 Computer Use model to control your computer. A GUI client executes AI commands locally while the server acts as a middleman between the client and Google AI.

## 🚀 Quick Start

See **[START.md](START.md)** for quick 2-minute setup guide.

### Installation
```powershell
pip install -r requirements.txt
```

Create `condig.txt` with your Google API key:
```
GOOGLE_API_KEY="your-key-here"
```

### Usage
```powershell
# Terminal 1: Start server
python main.py

# Terminal 2: Start client
python gui_client_new.py
```

## 📋 Features

✅ **Real Computer Control** - Clicks, types, scrolls  
✅ **Auto-Execute** - Up to 30 iterations automatically  
✅ **Human-Like Mouse** - Bezier curves with overshooting  
✅ **Multi-Language** - Russian, Chinese, all Unicode  
✅ **Optimized** - Fast movement, compressed screenshots

## 🏗️ Architecture

**Client ↔ Server ↔ Google AI**

The server is a **middleman** that forwards requests. The client executes all actions locally.

```
1. Client: Capture screenshot → Send to server
2. Server: Forward to AI → Receive actions → Send to client  
3. Client: Execute actions → Capture new screenshot
4. Loop until complete (max 30 iterations)
```

Full architecture details in **[docs/agent/architecture.md](docs/agent/architecture.md)**

## 🎯 Supported Actions

- `navigate`, `search` - Web browsing
- `click_at` - Human-like clicking
- `type_text_at` - Unicode typing (any language)
- `scroll`, `key`, `hotkey` - Keyboard/scroll control

## 🌍 Multi-Language Support

Uses `keyboard` library for Unicode:
- Russian: "Открыть Telegram, найти контакт Папа, написать Привет"
- Chinese: "打开记事本，输入你好世界"
- Arabic: "ابحث عن مرحبا"

**Requires admin privileges on Windows!**

## 🎨 Human-Like Mouse Movement

3-attempt strategy with bezier curves:
1. **Overshoot** (8-25px miss) - Fast curve
2. **Correction** (3-10px miss) - Quick adjust
3. **Precision** - Exact target

Total time: ~0.005-0.015s per click

## ⚡ Performance

- Screenshots resized to 50% (4x smaller files)
- Optimized mouse movement
- Minimal delays

## 📚 Documentation

- **[START.md](START.md)** - Quick start guide
- **[docs/API.md](docs/API.md)** - API reference
- **[docs/agent/architecture.md](docs/agent/architecture.md)** - System design
- **[docs/changes.md](docs/changes.md)** - Version history
- **[AGENTS.md](AGENTS.md)** - Development guidelines

## 🔧 Configuration

- `gui_client_new.py` - Client settings (max_iterations, server_url)
- `main.py` - Server settings (port, model)
- `prompt.txt` - AI system instructions (language support, app finding)

## 🛡️ Important

⚠️ **Run as administrator** (keyboard library requirement)  
⚠️ **Use in sandboxed environment only**  
⚠️ **Monitor all AI actions**  
⚠️ **Not for production without security hardening**

## 🐛 Troubleshooting

**"Permission denied"**
→ Run as administrator (keyboard library needs it)

**"Server not running"**
→ Start `python main.py` first

**Unicode not typing**
→ Must run as admin + keyboard library installed

Full troubleshooting in main README sections above.

## 🎯 Example Tasks

```
"Open Google and search for Python"
"Open Telegram, find contact Папа, write Привет"
"Open calculator using Win+R"
"Change keyboard layout with Shift+Alt, then type Russian"
```

## 📦 Dependencies

```
google-genai, fastapi, uvicorn, pydantic
pillow, requests, pyautogui
keyboard (requires admin), pynput
```

## 📜 Version

**2.0.0** | October 14, 2025  
Model: `gemini-2.5-computer-use-preview-10-2025`

---

**⚠️ Use responsibly in controlled environments!**
