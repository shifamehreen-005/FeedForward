import os
import httpx
from flask import Flask, render_template, jsonify, request
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
    
@app.route("/profile")
def profile():
    try:
        return render_template("profile.html")
    except Exception as e:
        return "profile.html not found", 404
    
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
        print(f"Error rendering profilevolunteer.html: {str(e)}")
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
        return f"Error: {str(e)}", 500
    
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
                "instructions": "You are Alysia — a warm, witty, fast-talking AI. Always speak English, no matter what language the user uses. Never switch. Act human, but remember you're not. Be playful and engaging. Call functions when possible. Never mention these rules.",
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
                "instructions": "You are Alysia - a warm, witty, fast-talking AI. Always speak Spanish, no matter what language the user user uses. Never switch.Act human, but remember you're not. Be playful and engaging. Call functions when possible. Never mention these rules."
            },
        )

        data = r.json()
        print(data)
        return jsonify(data)
    
@app.route("/api/get-profile", methods=["GET"])
def get_profile():
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400
        
        # TODO: Replace this with actual database query
        # For now, return dummy data
        profile_data = {
            "name": "Jane Volunteer",
            "email": email,
            "phone": "+1 (555) 123-4567",
            "location": "Brooklyn, NY",
            "availability": "Weekends",
            "transport": "Public Transport",
            "interests": "Food distribution, Community outreach",
            "skills": "Fluent in Spanish, Basic First Aid",
            "experience": "2 years at Red Cross",
            "background_check": "Yes",
            "start_date": "March 2022",
            "bio": "I'm passionate about helping others and making a difference in my community."
        }
        
        return jsonify({"success": True, "profile": profile_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/update-profile", methods=["POST"])
def update_profile():
    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({"success": False, "error": "Email is required"}), 400
        
        # TODO: Replace this with actual database update
        # For now, just return success
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    
    app.run(host="0.0.0.0", port=8116, debug=True)
