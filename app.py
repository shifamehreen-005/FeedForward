import os
import httpx
from flask import Flask, render_template, jsonify

app = Flask("voice_app")

@app.route("/")
def index():
    try:
        return render_template("index.html")
    except Exception as e:
        return "index.html not found", 404

@app.route("/session", methods=["GET"])
def session_endpoint():
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
                "voice": "verse",
            },
        )
        data = r.json()
        print(data)
        return jsonify(data)

if __name__ == "__main__":
    
    app.run(host="0.0.0.0", port=8116, debug=True)
