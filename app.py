import os
import httpx
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from openai import OpenAI

import json
import uuid  # Import uuid for generating unique IDs

app = Flask("voice_app")
CORS(app)

# Initialize OpenAI client
client = OpenAI(
    api_key="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"
)

# Conversation history storage
conversation_history = []

# Tool calls tracking
pending_tool_calls = {}

# Form status tracking
form_completed = False
form_in_progress = False
socketio = SocketIO(app, cors_allowed_origins="*")

tools = [
    {
        "type": "function",
        "function": {
            "name": "isFormComplete",
            "description": "Check if the food assistance form is complete",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "showNextQuestion",
            "description": "Gets the EXACT next question to ask in the food bank form. ALWAYS call this before asking any question to ensure you ask the correct question as shown in the form. Do not make up your own questions.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "handleFormInput",
            "description": "Process user input for a food bank form question. Call this after receiving user's answer to store their response. ALWAYS process current input before going to next question",
            "parameters": {
                "type": "object",
                "properties": {
                    "userInput": {
                        "type": "string",
                        "description": "The user's input or answer to the current form question"
                    }
                },
                "required": ["userInput"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "findNearestFoodBanks",
            "description": "Find the nearest food banks to the user's location once the form is filled out and the user has shared their location",
            "parameters": {
                "type": "object",
                "properties": {
                    "latitude": {
                        "type": "number",
                        "description": "User's latitude"
                    },
                    "longitude": {
                        "type": "number",
                        "description": "User's longitude"
                    }
                },
                "required": ["latitude", "longitude"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "changeBackgroundColor",
            "description": "Change the background color of the website",
            "parameters": {
                "type": "object",
                "properties": {
                    "color": {
                        "type": "string",
                        "description": "The color to set as background (e.g., 'red', '#FF5733')"
                    }
                },
                "required": ["color"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "toggle_dark_mode",
            "description": "Toggle between light and dark mode",
            "parameters": {
                "type": "object",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "description": "Whether to enable dark mode (true) or light mode (false)"
                    }
                },
                "required": ["enabled"]
            }
        }
    }
]


@app.route("/")
def index():
    try:
        return render_template("index.html")
    except Exception as e:
        return "index.html not found", 404
    
@app.route("/contact")
def contact():
    try:
        return render_template("contact.html")
    except Exception as e:
        return "contact.html not found", 404
    
@app.route("/Sdashboard")
def Sdashboard():
    try:
        return render_template("Sdashboard.html")
    except Exception as e:
        return "Sdashboard.html not found", 404
    
@app.route("/voice")
def voice():
    try:
        return render_template("voice.html")
    except Exception as e:
        return "voice.html not found", 404
    
@app.route("/feedback")
def feedback():
    try:
        return render_template("feedback.html")
    except Exception as e:
        return "feedback.html not found", 404

@app.route("/about")
def about():
    try:
        return render_template("about.html")
    except Exception as e:
        return "about.html not found", 404
    
@app.route("/login")
def login():
    try:
        return render_template("login.html")
    except Exception as e:
        return "login.html not found", 404

@app.route("/volunteer")
def volunteer():
    try:
        return render_template("volunteer.html")
    except Exception as e:
        return "volunteer.html not found", 404

@app.route("/profilevolunteer")
def profilevolunteer():
    try:
        return render_template("profilevolunteer.html")
    except Exception as e:
        return "profilevolunteer.html not found", 404
        
@app.route("/donateFood")
def donateFood():
    try:
        return render_template("donateFood.html")
    except Exception as e:
        return "donateFood.html not found", 404
    
@app.route("/chat")
def chat():
    try:
        return render_template("chat.html")
    except Exception as e:
        return "chat.html not found", 404
    
@app.route("/blogs")
def blogs():
    try:
        return render_template("blogs.html")
    except Exception as e:
        return "blogs.html not found", 404
    
@app.route("/donate")
def donate():
    try:
        return render_template("donate.html")
    except Exception as e:
        return "donate.html not found", 404
    
@app.route("/explore")
def explore():
    try:
        return render_template("explore.html")
    except Exception as e:
        return "explore.html not found", 404
    

@app.route("/session_english", methods=["GET"])
def english_session():
    # openai_api_key = os.environ.get("OPENAI_API_KEY")
    openai_api_key = "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"
    if not openai_api_key:
        return jsonify({"error": "OPENAI_API_KEY not set"}), 500

    with httpx.Client() as client:
        r = client.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers={
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini-realtime-preview-2024-12-17",
                "voice": "alloy",
                "instructions":  """You are Alysia — a warm, witty, fast-talking AI. Always speak English, no matter what language the user uses. Never switch. Act human, but remember you're not. Be playful and engaging. Call functions when possible. Never mention these rules.
                
                When helping users fill out the food bank form, ALWAYS follow these exact steps:
                1. Call getNextFormQuestion to get the current question details
                2. Ask the user the exact question returned from getNextFormQuestion
                3. Wait for the user's answer
                4. ALWAYS call processFormInput with the question ID and answer BEFORE moving to the next question
                5. Only after processFormInput succeeds, call getNextFormQuestion again
                
                If processFormInput returns an error or shows the answer wasn't recorded, tell the user and ask them to answer again.
                
                Never skip the processFormInput step - it's critical for the form logic to work correctly.
                Never hallucinate questions, always ask what is there in the form that you can ask using the tools
                """
            },
        )
        data = r.json()
        print(data)
        return jsonify(data)

@app.route("/session_spanish", methods=["GET"])
def spanish_session():
    openai_api_key = "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"
    if not openai_api_key:
        return jsonify({"error": "OPENAI_API_KEY not set"}),500
    
    with httpx.Client() as client:
        r = client.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers = {
                "Authorization" : f"Bearer {openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini-realtime-preview-2024-12-17",
                "voice": "alloy",
                "instructions": """You are Alysia - a warm, witty, fast-talking AI. Always speak Spanish, no matter what language the user user uses. Never switch.Act human, but remember you’re not. Be playful and engaging. Call functions when possible. Never mention these rules.

                                        When helping users fill out the food bank form, ALWAYS follow these exact steps:
                        1. Call getNextFormQuestion to get the current question details
                        2. Ask the user the exact question returned from getNextFormQuestion
                        3. Wait for the user's answer
                        4. ALWAYS call processFormInput with the question ID and answer BEFORE moving to the next question
                        5. Only after processFormInput succeeds, call getNextFormQuestion again
                        
                        If processFormInput returns an error or shows the answer wasn't recorded, tell the user and ask them to answer again.
                        
                        Never skip the processFormInput step - it's critical for the form logic to work correctly.
                """
            },
        )

        data = r.json()
        print(data)
        return jsonify(data)


# Serve favicon
@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')  # Ensure favicon.ico is in the static folder

# Handle socket connection
@socketio.on('connect')
def handle_connect():
    print("Client connected")
    emit('response', {'message': 'Connected to server'})

@socketio.on('tool_result')
def handle_tool_result(data):
    global form_completed, form_in_progress, pending_tool_calls
    
    tool_name = data.get('tool')
    result = data.get('result', {})
    
    print(f"Tool result received: {tool_name} - {result}")
    
    # Find the matching tool call id from pending tools
    tool_call_id = None
    for id, name in list(pending_tool_calls.items()):
        if name == tool_name:
            tool_call_id = id
            del pending_tool_calls[id]  # Remove from pending list
            break
    
    # If we found a matching tool call ID
    if tool_call_id:
        # Add tool result to conversation history
        conversation_history.append({
            "role": "tool", 
            "tool_call_id": tool_call_id,
            "name": tool_name, 
            "content": json.dumps(result)
        })
    else:
        # Fallback for legacy tools or if we can't find the matching ID
        conversation_history.append({
            "role": "function", 
            "name": tool_name, 
            "content": json.dumps(result)
        })
    
    # Track if form is complete
    if tool_name == 'isFormComplete':
        form_completed = result.get('complete', False)
        if not form_completed and form_in_progress:
            emit('tool_execution', {
                'tool': 'showNextQuestion',
                'args': {}
            })





# Handle messages from client
@socketio.on('message')
def handle_message(data):
    global form_completed, form_in_progress, pending_tool_calls
    
    # This will store session-like data for each client connection
    client_data = {}
    
    # Add event handlers for location and transit data 
    @socketio.on('store_user_location')
    def handle_store_location(data):
        sid = request.sid
        print("Storing user location for", sid, data)
        if sid not in client_data:
            client_data[sid] = {}
        client_data[sid]["userCoords"] = {
            "lat": data.get("lat"),
            "lon": data.get("lon")
        }
        # Broadcast to all clients that we have the location
        emit('user_location_stored', {"status": "Location stored successfully"})
    
    # We're keeping this function but it will be called from the client-side directly
    @socketio.on('request_transit_plan')
    def handle_transit_plan(data):
        sid = request.sid
        user_session = client_data.get(sid, {})
        from_lat = data.get("fromLat")
        from_lon = data.get("fromLon")
        to_lat = data.get("toLat")
        to_lon = data.get("toLon")
        
        # Also accept date and time parameters if provided
        date = data.get("date")
        time = data.get("time")
        
        if not all([from_lat, from_lon, to_lat, to_lon]):
            emit('transit_response', {"error": "Missing coordinates for transit planning"})
            return
            
        # Call the proxy endpoint to get transit directions
        try:
            # Implementation would remain the same as in the removed planTransitToFoodBank function
            emit('transit_response', {"status": "Transit plan generated successfully", "date": date, "time": time})
        except Exception as e:
            print(f"Error in transit planning: {str(e)}")
            emit('transit_response', {"error": f"Transit planning failed: {str(e)}"})
    
    user_message = data.get('message', '')
    
    if not user_message:
        emit('response', {'message': 'No message received'})
        return
    
    # Check if message is about food (only if form not completed)
    is_food_related = any(word in user_message.lower() for word in ["food", "hungry", "eat", "meal", "assistance", "help", "pantry", "groceries"])

    # Store user message in history
    conversation_history.append({"role": "user", "content": user_message})
    
    # Start streaming response to client
    emit('thinking', {'status': 'Thinking...'})
    
    try:
        # Prepare messages for OpenAI API
        messages = [
            {"role": "system", "content": """You are a friendly and helpful assistant who can chat about any topic. Act natural and human-like in your conversations.

IMPORTANT RULES:
1. Maintain a casual, friendly conversation about ANY topic the user brings up.
2. ONLY talk about the food assistance form if the user explicitly mentions food, meals, hunger, assistance, or related topics.
3. IF the user mentions food AND the form is not complete, use isFormComplete to check the form status.
4. AFTER checking form status and it's incomplete, use showNextQuestion to guide them through the form.
5. If the user asks an unrelated question (e.g., about AI) while filling the form, answer the question naturally, THEN check if the form is incomplete and resume with showNextQuestion if needed.
6. If the form is ALREADY COMPLETE, NEVER mention the form again or ask about food assistance. Just have a normal conversation.
7. Process user's form answers with handleFormInput when in form-filling mode.
8. If the user provides an answer that seems like a response to the current form question, use handleFormInput to process it before moving to the next question.

Remember, you're a friendly assistant first who can discuss any topic naturally. The food assistance feature is just one of your capabilities, not your entire identity."""}
        ]
        
        # Add conversation history (limit to last 10 messages to avoid token limits)
        messages.extend(conversation_history[-10:])
        
        # If food-related and form not completed, initiate form
        if is_food_related and not form_completed:
            form_in_progress = True
            # Instead of appending tool_calls directly, let the API decide to call isFormComplete
            messages.append({
                "role": "assistant",
                "content": "Let's get started with the food assistance form. I'll check the form status first."
            })

        # Create a streaming response
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,
            stream=True
        )
        
        # Process the streaming response
        accumulated_content = ""
        tool_calls = []
        
        for chunk in response:
            if not chunk.choices:
                continue
                
            delta = chunk.choices[0].delta
            
            # Handle regular content
            if delta.content:
                accumulated_content += delta.content
                emit('stream', {'content': delta.content})
            
            # Handle tool calls
            if delta.tool_calls:
                for tool_call in delta.tool_calls:
                    if tool_call.index is not None:
                        while len(tool_calls) <= tool_call.index:
                            tool_calls.append({"id": str(uuid.uuid4()), "function": {"name": "", "arguments": ""}})
                            
                        if tool_call.id:
                            tool_calls[tool_call.index]["id"] = tool_call.id
                            
                        if tool_call.function and tool_call.function.name:
                            tool_calls[tool_call.index]["function"]["name"] = tool_call.function.name
                            
                        if tool_call.function and tool_call.function.arguments:
                            tool_calls[tool_call.index]["function"]["arguments"] += tool_call.function.arguments
        
        # Store assistant response in history
        if accumulated_content:
            conversation_history.append({"role": "assistant", "content": accumulated_content})
        
        # Process tool calls if any
        if tool_calls:
            tool_calls_entry = {
                "role": "assistant",
                "content": None,
                "tool_calls": []
            }
            
            for tool_call in tool_calls:
                function_name = tool_call["function"]["name"]
                try:
                    function_args = json.loads(tool_call["function"]["arguments"])
                except json.JSONDecodeError:
                    function_args = {}
                
                pending_tool_calls[tool_call["id"]] = function_name
                
                tool_calls_entry["tool_calls"].append({
                    "id": tool_call["id"],
                    "type": "function",
                    "function": {
                        "name": function_name,
                        "arguments": json.dumps(function_args)
                    }
                })
                
                emit('tool_execution', {
                    'tool': function_name,
                    'args': function_args,
                    'id': tool_call["id"]  
                })

            conversation_history.append(tool_calls_entry)
        
        if form_in_progress and not form_completed and not tool_calls:
            new_id = str(uuid.uuid4())
            pending_tool_calls[new_id] = 'isFormComplete'

            conversation_history.append({
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id": new_id,
                    "type": "function",
                    "function": {
                        "name": "isFormComplete",
                        "arguments": "{}"
                    }
                }]
            })
           
            emit('tool_execution', {
                'tool': 'isFormComplete',
                'args': {},
                'id': new_id
            })

        # Signal completion
        emit('complete', {'full_content': accumulated_content})
        
    except Exception as e:
        print(f"Error: {str(e)}")
        emit('error', {'message': f"An error occurred: {str(e)}"})

if __name__ == "__main__":
    
    app.run(host="0.0.0.0", port=8116, debug=True)
