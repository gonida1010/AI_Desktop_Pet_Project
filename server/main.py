from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pyautogui
import random
import time
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

cat_state = {
    "energy": 100.0,
    "boredom": 0.0,
    "mode": "IDLE",
    "wander_target": -1,
    "last_time": time.time(),
    "attack_cooldown": 0.0
}

@app.get("/ai-command")
def get_ai_command(cat_x: float, cat_y: float):
    global cat_state
    
    current_time = time.time()
    dt = current_time - cat_state["last_time"]
    cat_state["last_time"] = current_time
    
    mouse_x, mouse_y = pyautogui.position()
    dist_x = mouse_x - cat_x
    dist_y = mouse_y - cat_y
    distance = math.sqrt(dist_x**2 + dist_y**2)
    cat_state["attack_cooldown"] = max(0, cat_state["attack_cooldown"] - dt)
    
    if cat_state["energy"] < 40:
        cat_state["mode"] = "SLEEP"
    
    elif cat_state["mode"] == "SLEEP" and cat_state["energy"] > 95:
        cat_state["mode"] = "IDLE"
    elif cat_state["boredom"] > 30:
        cat_state["mode"] = "WANDER"
        

    if cat_state["mode"] == "SLEEP":
        
        cat_state["energy"] += 0.4
        cat_state["boredom"] = 0
    elif cat_state["mode"] == "WANDER":
        cat_state["energy"] -= 0.3
        cat_state["boredom"] -= 1.0
    else:
        cat_state["energy"] -= 0.1
        cat_state["boredom"] += 1.0

    cat_state["energy"] = max(0, min(100, cat_state["energy"]))
    cat_state["boredom"] = max(0, min(100, cat_state["boredom"]))

    command = "idle"
    
    if cat_state["mode"] != "SLEEP" and distance < 120 and cat_state["attack_cooldown"] == 0:
        if random.random() < 0.2:
            command = "attack"
            cat_state["attack_cooldown"] = 3.0

    if command != "attack":
        if cat_state["mode"] == "WANDER":
            if cat_state["wander_target"] == -1 or abs(cat_state["wander_target"] - cat_x) < 50:
                
                move_range = random.randint(100, 300)
                direction = 1 if random.random() < 0.5 else -1
                
                new_target = cat_x + (move_range * direction)
                
                if new_target < 50: new_target = cat_x + 200
                if new_target > 1800: new_target = cat_x - 200
                
                cat_state["wander_target"] = new_target
                
                if random.random() < 0.3:
                    cat_state["mode"] = "IDLE"
                    cat_state["boredom"] = 0

            if cat_state["wander_target"] > cat_x:
                command = "right"
            else:
                command = "left"

        elif cat_state["mode"] == "SLEEP":
             command = "sleep"

    return {
        "command": command, 
        "mood": f"{cat_state['mode']} (E:{int(cat_state['energy'])})"
    }