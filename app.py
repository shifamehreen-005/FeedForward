import os
import httpx
from flask import Flask, render_template, jsonify
from flask_cors import CORS

app = Flask("voice_app")
CORS(app)

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
    
if __name__ == "__main__":
    
    app.run(host="0.0.0.0", port=8116, debug=True)
