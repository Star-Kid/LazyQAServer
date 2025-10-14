# Quick Setup Script
# Run this to install dependencies

Write-Host "=== Computer Use System - Installation ===" -ForegroundColor Green
Write-Host ""

# Install Python packages
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create condig.txt with your Google API key:"
Write-Host '   GOOGLE_API_KEY="your-key-here"'
Write-Host ""
Write-Host "2. Start server: python main_simple.py"
Write-Host "3. Start client: python gui_client_new.py"
Write-Host ""
Write-Host "WARNING: AI will control your mouse and keyboard!" -ForegroundColor Red
Write-Host "Move mouse to top-left corner to emergency stop" -ForegroundColor Red
