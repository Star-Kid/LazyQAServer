"""
Simplified Computer Use Server
Middleman between client and Google Gemini Computer Use AI
Server sends actions to client, client executes and sends results back
"""

import base64
import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Computer Use Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API key
def load_api_key() -> str:
    with open('condig.txt', 'r') as f:
        content = f.read().strip()
        return content.split('=')[1].strip().strip('"') if '=' in content else content

# Configure Gemini
API_KEY = load_api_key()
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-computer-use-preview-10-2025"

# Session storage - stores conversation history
sessions: Dict[str, Any] = {}


# === Models ===

class StartRequest(BaseModel):
    prompt: str
    screenshot: str


class ContinueRequest(BaseModel):
    session_id: str
    screenshot: str
    current_url: str
    function_results: List[Dict[str, Any]]  # Results from client executing actions


class ActionResponse(BaseModel):
    session_id: str
    actions: List[Dict[str, Any]]
    reasoning: Optional[str] = None
    is_complete: bool


# === Helper Functions ===

def decode_image(base64_string: str) -> bytes:
    """Decode base64 image"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    return base64.b64decode(base64_string)


def has_function_calls(response) -> bool:
    """Check if response contains any function calls"""
    if not hasattr(response, 'candidates') or not response.candidates:
        return False
    candidate = response.candidates[0]
    return any(hasattr(part, 'function_call') and part.function_call
               for part in candidate.content.parts)


def extract_actions(response) -> tuple[List[Dict], str, bool]:
    """Extract actions from model response"""
    actions = []
    reasoning = ""
    is_complete = not has_function_calls(response)
    
    if hasattr(response, 'candidates') and response.candidates:
        candidate = response.candidates[0]
        
        if hasattr(candidate.content, 'parts'):
            for part in candidate.content.parts:
                # Extract text reasoning
                if hasattr(part, 'text') and part.text:
                    reasoning = part.text
                
                # Extract function calls - with safety check
                if hasattr(part, 'function_call') and part.function_call:
                    fc = part.function_call
                    if hasattr(fc, 'name') and fc.name:  # Check if name exists
                        action = {"name": fc.name, "args": dict(fc.args) if hasattr(fc, 'args') else {}}
                        actions.append(action)
    
    return actions, reasoning, is_complete


# === API Endpoints ===

@app.get("/")
async def health_check():
    """Health check"""
    return {
        "service": "Computer Use Server",
        "status": "running",
        "model": MODEL_NAME,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/v1/start", response_model=ActionResponse)
async def start_session(request: StartRequest):
    """
    Start a new session - send initial prompt and screenshot to AI
    Returns actions for client to execute
    """
    session_id = str(uuid.uuid4())
    logger.info(f"Starting session {session_id}: {request.prompt[:50]}...")
    
    try:
        # Decode screenshot
        screenshot_data = decode_image(request.screenshot)
        
        # Create system instruction for Computer Use
        system_instruction = """You are a computer control assistant with VISION. You can see the entire screen and interact with ANY application on Windows.

LANGUAGE SUPPORT:
- Detect the language of the user's task automatically
- Support text in ANY language (English, Russian, Chinese, Arabic, etc.)
- When typing text, preserve the EXACT characters from the user's command
- To switch keyboard layout: use hotkey(["shift", "alt"]) or hotkey(["alt", "shift"])
- Switch layout BEFORE typing non-English text (Russian, Chinese, etc.)
- You may need to switch layout multiple times if mixing languages

KEYBOARD LAYOUT SWITCHING:
- Default layout is usually English
- To type Russian (Cyrillic): hotkey(["shift", "alt"]) → then type
- To type back in English: hotkey(["shift", "alt"]) again
- Watch the language indicator on taskbar (usually bottom-right) after switching
- If text appears wrong, you switched to wrong layout - switch again

AVAILABLE ACTIONS:
- click_at(x, y) - Click at coordinates (0-1000 normalized, where 500,500 is center)
- type_text_at(x, y, text, press_enter, clear_before_typing) - Click location and type text
- key(key) - Press single key (enter, escape, tab, space, etc.)
- hotkey(keys) - Press key combination (["win"], ["win", "r"], ["ctrl", "c"], ["alt", "shift"], etc.)
- scroll(direction, amount) - Scroll up/down
- navigate(url) - Open URL in browser (ONLY for web tasks)

WORKFLOW FOR EACH STEP:
1. LOOK at the current screenshot carefully
2. ANALYZE what you see (apps, windows, icons, text) - recognize text in ANY language
3. DECIDE the next action based on what's visible
4. If target app/window is NOT visible:
   a. Try Windows Start Menu: hotkey(["win"]) then type app name
   b. Try Windows Run: hotkey(["win", "r"]) then type command
   c. Try Alt+Tab to switch: hotkey(["alt", "tab"])
   d. Try taskbar icons: look at bottom of screen

TYPING IN DIFFERENT LANGUAGES:
1. Click where you want to type: click_at(x, y)
2. Check current keyboard layout (look at taskbar language indicator)
3. If need to type non-English: hotkey(["shift", "alt"]) to switch layout
4. Wait for next screenshot to confirm layout changed
5. Type the text: type_text_at(x, y, "текст", press_enter)
6. If need English again: hotkey(["shift", "alt"]) to switch back

FINDING APPLICATIONS:
- Desktop apps (Telegram, Discord, etc.):
  * First check if already open (look for window or taskbar icon)
  * If not visible, press Win key and type app name
  * Or use Win+R and type executable name
  * Click the result to open

- Windows Search:
  * Press Win key
  * Type application name (in ANY language - English, Russian, etc.)
  * Wait for search results
  * Click the application

IMPORTANT RULES:
- NEVER use navigate() for desktop applications
- ALWAYS analyze the screenshot before each action
- If you don't see what you need, search for it (Win key + type)
- Use normalized coordinates (0-1000), where center = (500, 500)
- After each action, WAIT for next screenshot to see the result
- Be patient - some apps take time to open
- Recognize and read text in ALL languages from screenshots
- ALWAYS switch keyboard layout (Shift+Alt) before typing non-English text
- Check language indicator on taskbar to confirm correct layout

USER TASK:"""

        # Prepare initial content with system instruction, prompt and screenshot
        contents = [
            types.Content(parts=[
                types.Part(text=f"{system_instruction}\n{request.prompt}"),
                types.Part(inline_data={"mime_type": "image/png", "data": screenshot_data})
            ])
        ]
        
        # Configure with Computer Use tool
        config = types.GenerateContentConfig(
            tools=[types.Tool(computer_use={})],
            temperature=1.0,
            # Automatic Function Calling - allow up to 20 function calls per response
            # This lets AI chain multiple actions before waiting for feedback
            response_modalities=["TEXT"]
        )
        
        # Send to AI
        logger.info("Sending request to AI...")
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=config
        )
        
        # Add AI response to conversation
        contents.append(response.candidates[0].content)
        
        # Extract actions for client to execute
        actions, reasoning, is_complete = extract_actions(response)
        
        # Store session
        sessions[session_id] = {
            "contents": contents,
            "config": config,
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Session {session_id}: Returning {len(actions)} actions to client")
        
        return ActionResponse(
            session_id=session_id,
            actions=actions,
            reasoning=reasoning,
            is_complete=is_complete
        )
        
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/continue", response_model=ActionResponse)
async def continue_session(request: ContinueRequest):
    """
    Continue existing session - client sends back execution results
    Returns next actions for client to execute
    """
    logger.info(f"Continuing session {request.session_id}")
    logger.info(f"Received {len(request.function_results)} function results")
    logger.info(f"Current URL: {request.current_url}")
    
    # Get session
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[request.session_id]
    contents = session["contents"]
    config = session["config"]
    
    logger.info(f"Session has {len(contents)} content items")
    
    try:
        # Decode new screenshot
        logger.info("Decoding screenshot...")
        screenshot_data = decode_image(request.screenshot)
        logger.info(f"Screenshot decoded: {len(screenshot_data)} bytes")
        
        # Build function response parts from client's execution results
        response_parts = []
        logger.info("Building function response parts...")
        for result in request.function_results:
            func_response = types.Part(
                function_response={
                    "name": result["name"],
                    "response": {
                        "url": request.current_url  # Current page URL after execution
                    }
                }
            )
            response_parts.append(func_response)
            logger.info(f"  Action: {result['name']}, Success: {result.get('success', True)}")
        
        # Add new screenshot
        logger.info("Adding screenshot to response parts...")
        response_parts.append(
            types.Part(inline_data={"mime_type": "image/png", "data": screenshot_data})
        )
        
        # Add client's feedback to conversation
        logger.info("Appending to conversation history...")
        contents.append(types.Content(parts=response_parts))
        
        # Log conversation structure
        logger.info(f"Conversation now has {len(contents)} items:")
        for i, content in enumerate(contents):
            if hasattr(content, 'parts'):
                logger.info(f"  Item {i}: {len(content.parts)} parts")
                for j, part in enumerate(content.parts):
                    part_type = []
                    if hasattr(part, 'text'): part_type.append('text')
                    if hasattr(part, 'inline_data'): part_type.append('image')
                    if hasattr(part, 'function_call'): part_type.append('function_call')
                    if hasattr(part, 'function_response'): part_type.append('function_response')
                    logger.info(f"    Part {j}: {', '.join(part_type)}")
        
        # Send to AI for next actions
        logger.info("Sending execution results to AI...")
        logger.info(f"Total conversation parts: {len(contents)}")
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=config
        )
        
        logger.info("Received AI response")
        
        # Check if response is valid
        if not response:
            logger.error("Response is None!")
            raise HTTPException(status_code=500, detail="AI returned empty response")
        
        if not hasattr(response, 'candidates') or not response.candidates:
            logger.error("Response has no candidates!")
            logger.error(f"Response object: {response}")
            raise HTTPException(status_code=500, detail="AI returned no candidates")
        
        # Debug: Log response structure
        logger.info(f"Response has {len(response.candidates)} candidates")
        candidate = response.candidates[0]
        
        if not candidate or not hasattr(candidate, 'content'):
            logger.error(f"Candidate has no content! Candidate: {candidate}")
            raise HTTPException(status_code=500, detail="AI candidate has no content")
        
        if hasattr(candidate.content, 'parts'):
            logger.info(f"Candidate has {len(candidate.content.parts)} parts")
            for i, part in enumerate(candidate.content.parts):
                if hasattr(part, 'text'):
                    logger.info(f"  Part {i}: text = {part.text[:100] if part.text else 'None'}...")
                if hasattr(part, 'function_call'):
                    logger.info(f"  Part {i}: function_call = {part.function_call}")
        
        # Add AI response to conversation
        contents.append(candidate.content)
        
        # Extract next actions
        actions, reasoning, is_complete = extract_actions(response)
        
        logger.info(f"Session {request.session_id}: Returning {len(actions)} actions to client")
        
        return ActionResponse(
            session_id=request.session_id,
            actions=actions,
            reasoning=reasoning,
            is_complete=is_complete
        )
        
    except Exception as e:
        logger.error(f"Error in continue_session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/sessions")
async def list_sessions():
    """List all sessions"""
    return {
        "total_sessions": len(sessions),
        "sessions": [
            {
                "session_id": sid,
                "created_at": data["created_at"]
            }
            for sid, data in sessions.items()
        ]
    }


@app.delete("/api/v1/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id in sessions:
        del sessions[session_id]
        return {"message": "Session deleted"}
    raise HTTPException(status_code=404, detail="Session not found")


# === Main ===

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Computer Use Server...")
    uvicorn.run(app, host="127.0.0.1", port=8080, log_level="info")
