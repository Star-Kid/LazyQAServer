"""
GUI Client for Computer Use Server
Client executes actions locally and sends results back to server
"""

import tkinter as tk
from tkinter import scrolledtext, messagebox
import requests
import base64
from PIL import ImageGrab
import json
import time
import pyautogui
import keyboard


class ComputerUseClient:
    def __init__(self, root):
        self.root = root
        self.root.title("Computer Use Client")
        self.root.geometry("900x700")
        
        self.server_url = "http://127.0.0.1:8080"
        self.session_id = None
        self.current_url = "about:blank"
        self.iteration = 0
        
        # Get screen dimensions
        self.screen_width = pyautogui.size()[0]
        self.screen_height = pyautogui.size()[1]
        
        self.setup_ui()
        
    def normalize_x(self, x: int) -> int:
        """Convert normalized x coordinate (0-1000) to actual pixel coordinate."""
        return int(x / 1000 * self.screen_width)
    
    def normalize_y(self, y: int) -> int:
        """Convert normalized y coordinate (0-1000) to actual pixel coordinate."""
        return int(y / 1000 * self.screen_height)
        
    def setup_ui(self):
        # Task input
        tk.Label(self.root, text="Task:", font=("Arial", 12, "bold")).pack(pady=5)
        self.task_entry = tk.Entry(self.root, width=90, font=("Arial", 10))
        self.task_entry.pack(pady=5)
        self.task_entry.insert(0, "Open Google and search for Python programming")
        
        # Buttons frame
        btn_frame = tk.Frame(self.root)
        btn_frame.pack(pady=10)
        
        # Start button
        self.start_btn = tk.Button(
            btn_frame, 
            text="▶ Start Task", 
            command=self.start_task,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 14, "bold"),
            padx=30,
            pady=12
        )
        self.start_btn.pack(side=tk.LEFT, padx=5)
        
        # Current URL display
        url_frame = tk.Frame(self.root)
        url_frame.pack(pady=5)
        tk.Label(url_frame, text="Current URL:", font=("Arial", 10, "bold")).pack(side=tk.LEFT)
        self.url_label = tk.Label(url_frame, text=self.current_url, font=("Arial", 10), fg="blue")
        self.url_label.pack(side=tk.LEFT, padx=5)
        
        # Execution log
        tk.Label(self.root, text="Execution Log:", font=("Arial", 12, "bold")).pack(pady=5)
        self.log_text = scrolledtext.ScrolledText(
            self.root, 
            width=100, 
            height=28,
            font=("Courier", 9)
        )
        self.log_text.pack(pady=5, padx=10)
        
        # Status label
        self.status_label = tk.Label(
            self.root, 
            text="Ready - Enter task and click Start", 
            font=("Arial", 11, "bold"),
            fg="green"
        )
        self.status_label.pack(pady=5)
        
    def log(self, message, level="INFO"):
        """Add message to log"""
        colors = {
            "INFO": "black",
            "SUCCESS": "green",
            "ERROR": "red",
            "WARNING": "orange",
            "ACTION": "blue"
        }
        color = colors.get(level, "black")
        
        self.log_text.insert(tk.END, f"[{level}] {message}\n")
        self.log_text.tag_add(level, "end-2l", "end-1l")
        self.log_text.tag_config(level, foreground=color)
        self.log_text.see(tk.END)
        self.root.update()
        
    def capture_screenshot(self):
        """Capture and encode screenshot"""
        try:
            screenshot = ImageGrab.grab()
            from io import BytesIO
            buffer = BytesIO()
            screenshot.save(buffer, format="PNG")
            img_bytes = buffer.getvalue()
            return base64.b64encode(img_bytes).decode('utf-8')
        except Exception as e:
            self.log(f"Screenshot error: {e}", "ERROR")
            return None
    
    def check_server(self):
        """Check if server is running"""
        try:
            response = requests.get(f"{self.server_url}/", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def execute_action(self, action):
        """Execute a single action locally using Computer Use functions"""
        name = action["name"]
        args = action.get("args", {})
        
        self.log(f"  🔧 {name.upper()}", "ACTION")
        self.log(f"     Args: {json.dumps(args, indent=8)}", "ACTION")
        
        try:
            if name == "open_web_browser":
                self.log(f"     ✓ Browser already open", "SUCCESS")
                result = "success"
                
            elif name == "navigate":
                url = args.get("url", "")
                import webbrowser
                webbrowser.open(url)
                self.current_url = url
                self.log(f"     ✓ Navigated to: {url}", "SUCCESS")
                time.sleep(2)
                result = "success"
                
            elif name == "click_at" or name == "click":
                # Handle both normalized (0-1000) and direct pixel coordinates
                x = args.get("x", 0)
                y = args.get("y", 0)
                
                # If x or y are > 1000, assume they're already pixel coordinates
                if x <= 1000 and y <= 1000:
                    actual_x = self.normalize_x(x)
                    actual_y = self.normalize_y(y)
                else:
                    actual_x = x
                    actual_y = y
                
                self.log(f"     ✓ Clicking at ({actual_x}, {actual_y})", "SUCCESS")
                pyautogui.click(actual_x, actual_y)
                time.sleep(0.5)
                result = "success"
                
            elif name == "type_text_at" or name == "type":
                x = args.get("x", 0)
                y = args.get("y", 0)
                text = args.get("text", "")
                press_enter = args.get("press_enter", False)
                clear_before_typing = args.get("clear_before_typing", True)
                
                # Normalize coordinates if needed
                if x <= 1000 and y <= 1000:
                    actual_x = self.normalize_x(x)
                    actual_y = self.normalize_y(y)
                else:
                    actual_x = x
                    actual_y = y
                
                self.log(f"     ✓ Typing '{text}' at ({actual_x}, {actual_y})", "SUCCESS")
                
                # Click at location first (unless coordinates are 0,0 which means "just type")
                if actual_x > 0 or actual_y > 0:
                    pyautogui.click(actual_x, actual_y)
                    time.sleep(0.2)
                
                # Clear existing text if requested
                if clear_before_typing and (actual_x > 0 or actual_y > 0):
                    pyautogui.hotkey('ctrl', 'a')
                    pyautogui.press('backspace')
                    time.sleep(0.1)
                
                # Use keyboard library for Unicode text input (supports all languages)
                keyboard.write(text, delay=0.02)
                time.sleep(0.1)
                
                # Press enter if requested
                if press_enter:
                    time.sleep(0.3)
                    pyautogui.press('enter')
                
                time.sleep(0.5)
                result = "success"
                
            elif name == "scroll":
                direction = args.get("direction", "down")
                amount = args.get("amount", 3)
                
                scroll_amount = -amount if direction == "down" else amount
                self.log(f"     ✓ Scrolling {direction} by {amount}", "SUCCESS")
                pyautogui.scroll(scroll_amount * 100)
                time.sleep(0.3)
                result = "success"
                
            elif name == "key" or name == "press_key":
                key = args.get("key", "")
                self.log(f"     ✓ Pressing key: {key}", "SUCCESS")
                pyautogui.press(key)
                time.sleep(0.3)
                result = "success"
                
            elif name == "hotkey":
                keys = args.get("keys", [])
                # Convert "win" to proper key name for pyautogui
                normalized_keys = []
                for key in keys:
                    if key.lower() == "win":
                        normalized_keys.append("win")  # pyautogui uses "win" for Windows key
                    else:
                        normalized_keys.append(key.lower())
                
                self.log(f"     ✓ Pressing hotkey: {'+'.join(normalized_keys)}", "SUCCESS")
                pyautogui.hotkey(*normalized_keys)
                
                # Give extra time for system actions (Win menu, Alt+Tab, etc.)
                if "win" in normalized_keys or "alt" in normalized_keys:
                    time.sleep(1.5)  # Wait for Start menu or window switch
                else:
                    time.sleep(0.3)
                    
                result = "success"
            
            elif name == "search":
                query = args.get("query", "")
                import webbrowser
                search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
                webbrowser.open(search_url)
                self.current_url = search_url
                self.log(f"     ✓ Searched for: {query}", "SUCCESS")
                time.sleep(2)
                result = "success"
                
            else:
                self.log(f"     ⚠ Unknown action: {name}", "WARNING")
                result = "unknown_function"
            
            return {"name": name, "success": True, "result": result}
            
        except Exception as e:
            self.log(f"     ✗ Error: {e}", "ERROR")
            return {"name": name, "success": False, "error": str(e)}
    
    def start_task(self):
        """Start new task and auto-execute until complete"""
        task = self.task_entry.get().strip()
        if not task:
            messagebox.showerror("Error", "Please enter a task")
            return
        
        if not self.check_server():
            messagebox.showerror("Error", "Server not running!\nStart: python main_simple.py")
            return
        
        self.start_btn.config(state="disabled")
        self.log_text.delete(1.0, tk.END)
        self.iteration = 0
        self.session_id = None
        
        try:
            self.log("=== STARTING NEW TASK ===", "SUCCESS")
            self.log(f"Task: {task}\n")
            self.log(f"Screen: {self.screen_width}x{self.screen_height}\n")
            
            # Capture initial screenshot
            self.log("📸 Capturing screenshot...")
            screenshot = self.capture_screenshot()
            if not screenshot:
                raise Exception("Failed to capture screenshot")
            
            # Send to server
            self.log("📤 Sending request to AI server...")
            self.status_label.config(text="Waiting for AI response...", fg="orange")
            
            response = requests.post(
                f"{self.server_url}/api/v1/start",
                json={
                    "prompt": task,
                    "screenshot": screenshot
                },
                timeout=60
            )
            response.raise_for_status()
            
            result = response.json()
            self.session_id = result["session_id"]
            
            self.iteration += 1
            self.log(f"\n{'='*60}", "INFO")
            self.log(f"ITERATION {self.iteration}", "INFO")
            self.log(f"{'='*60}", "INFO")
            self.log(f"📋 Session ID: {self.session_id}")
            
            if result.get("reasoning"):
                self.log(f"\n🤖 AI Response:")
                self.log(f"{result['reasoning']}\n")
            
            # Check if complete
            if result["is_complete"]:
                self.log("\n" + "="*60, "SUCCESS")
                self.log("✅ TASK COMPLETE! (No actions needed)", "SUCCESS")
                self.log("="*60, "SUCCESS")
                self.status_label.config(text="Task Complete!", fg="green")
                self.start_btn.config(state="normal")
                return
            
            # Execute actions
            actions = result.get("actions", [])
            self.log(f"📝 Received {len(actions)} actions to execute\n")
            
            self.function_results = []
            for i, action in enumerate(actions, 1):
                self.log(f"Action {i}/{len(actions)}:")
                exec_result = self.execute_action(action)
                self.function_results.append(exec_result)
            
            # Update URL display
            self.url_label.config(text=self.current_url)
            
            # Auto-continue the loop
            self.auto_continue_loop()
            
        except Exception as e:
            self.log(f"\n❌ ERROR: {str(e)}", "ERROR")
            self.status_label.config(text="Error", fg="red")
            messagebox.showerror("Error", str(e))
            self.start_btn.config(state="normal")
    
    def auto_continue_loop(self, max_iterations=30):
        """Auto-execute continuation loop until task completes"""
        try:
            while self.iteration < max_iterations:
                # Wait a bit for UI update
                time.sleep(1)
                
                # Capture new screenshot
                self.log("\n📸 Capturing new screenshot...")
                screenshot = self.capture_screenshot()
                if not screenshot:
                    raise Exception("Failed to capture screenshot")
                
                # Send results to server
                self.log("📤 Sending execution results to AI...")
                self.status_label.config(text=f"Iteration {self.iteration + 1} - Waiting for AI...", fg="orange")
                
                response = requests.post(
                    f"{self.server_url}/api/v1/continue",
                    json={
                        "session_id": self.session_id,
                        "screenshot": screenshot,
                        "current_url": self.current_url,
                        "function_results": self.function_results
                    },
                    timeout=60
                )
                response.raise_for_status()
                
                result = response.json()
                
                self.iteration += 1
                self.log(f"\n{'='*60}", "INFO")
                self.log(f"ITERATION {self.iteration}", "INFO")
                self.log(f"{'='*60}", "INFO")
                
                if result.get("reasoning"):
                    self.log(f"\n🤖 AI Response:")
                    self.log(f"{result['reasoning']}\n")
                
                # Check if complete
                if result["is_complete"]:
                    self.log("\n" + "="*60, "SUCCESS")
                    self.log("✅ TASK COMPLETE!", "SUCCESS")
                    self.log("="*60, "SUCCESS")
                    self.status_label.config(text=f"Task Complete! ({self.iteration} iterations)", fg="green")
                    self.start_btn.config(state="normal")
                    return
                
                # Execute next actions
                actions = result.get("actions", [])
                if not actions:
                    self.log("\n" + "="*60, "SUCCESS")
                    self.log("✅ TASK COMPLETE! (No more actions)", "SUCCESS")
                    self.log("="*60, "SUCCESS")
                    self.status_label.config(text=f"Task Complete! ({self.iteration} iterations)", fg="green")
                    self.start_btn.config(state="normal")
                    return
                
                self.log(f"📝 Received {len(actions)} actions to execute\n")
                
                self.function_results = []
                for i, action in enumerate(actions, 1):
                    self.log(f"Action {i}/{len(actions)}:")
                    exec_result = self.execute_action(action)
                    self.function_results.append(exec_result)
                
                # Update URL display
                self.url_label.config(text=self.current_url)
            
            # Max iterations reached
            self.log(f"\n⚠️ Max iterations ({max_iterations}) reached", "WARNING")
            self.status_label.config(text=f"Incomplete - Max iterations reached", fg="orange")
            self.start_btn.config(state="normal")
            
        except Exception as e:
            self.log(f"\n❌ ERROR: {str(e)}", "ERROR")
            self.status_label.config(text="Error", fg="red")
            messagebox.showerror("Error", str(e))
            self.start_btn.config(state="normal")


def main():
    root = tk.Tk()
    app = ComputerUseClient(root)
    root.mainloop()


if __name__ == "__main__":
    main()
