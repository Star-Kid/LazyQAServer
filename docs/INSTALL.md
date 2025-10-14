# Installation Guide

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Internet connection for package installation
- Google AI API key with Gemini 2.5 Computer Use Preview access

## Step-by-Step Installation

### 1. Verify Python Version

```bash
python --version
```

Should output Python 3.11.x or higher.

### 2. Create Virtual Environment (Recommended)

**Windows (PowerShell)**:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt)**:
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**Linux/Mac**:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Upgrade pip

```bash
python -m pip install --upgrade pip
```

### 4. Install Dependencies

```bash
pip install fastapi uvicorn google-generativeai pydantic python-multipart
```

Or use requirements.txt:

```bash
pip install -r requirements.txt
```

### 5. Configure API Key

Create/edit `condig.txt` in the project root:

```
AI_API = "your_google_ai_api_key_here"
```

Get your API key from: https://aistudio.google.com/apikey

### 6. Verify Installation

```bash
python -c "import fastapi; import google.generativeai; print('All dependencies installed successfully!')"
```

### 7. Run the Server

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 8. Test the Server

Open browser and visit: http://localhost:8000

You should see:
```json
{
    "service": "Computer Use Server",
    "status": "running",
    "version": "1.0.0",
    "model": "gemini-2.5-computer-use-preview-10-2025",
    "timestamp": "2025-10-14T10:30:00.000000"
}
```

## Troubleshooting

### Import Errors

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
pip install fastapi uvicorn
```

### API Key Errors

**Problem**: `ValueError: Configuration file not found`

**Solution**: Create `condig.txt` with your API key.

### Port Already in Use

**Problem**: `OSError: [Errno 48] Address already in use`

**Solution**: Use a different port:
```bash
uvicorn main:app --port 8001
```

### Python Version Issues

**Problem**: Python 3.10 or lower

**Solution**: Upgrade Python to 3.11+:
- Windows: Download from https://python.org
- Linux: Use package manager (e.g., `apt install python3.11`)
- Mac: Use homebrew (`brew install python@3.11`)

## Optional: Client Installation

For running the example client:

```bash
pip install playwright requests pillow
playwright install chromium
```

## Development Installation

For development with testing and linting tools:

```bash
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx black flake8 mypy
```

## Docker Installation (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t computer-use-server .
docker run -p 8000:8000 -v $(pwd)/condig.txt:/app/condig.txt computer-use-server
```

## Verification Checklist

- [ ] Python 3.11+ installed
- [ ] Virtual environment created and activated
- [ ] All dependencies installed
- [ ] API key configured in condig.txt
- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Logs show "Gemini API configured successfully"

## Next Steps

1. Read [API Documentation](docs/API.md)
2. Review [Architecture Documentation](docs/agent/architecture.md)
3. Try [Example Client](docs/examples/example_client.py)
4. Check [README](README.md) for usage examples

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify all dependencies are installed
3. Ensure API key is valid
4. Check firewall/antivirus settings
5. Review troubleshooting section above

## System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 2 GB
- Disk: 1 GB free space
- Network: Internet connection

**Recommended**:
- CPU: 4+ cores
- RAM: 4+ GB
- Disk: 10 GB free space
- Network: High-speed internet
