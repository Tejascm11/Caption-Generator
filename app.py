import os
import base64
import json
from pathlib import Path
from flask import Flask, render_template, request, jsonify
from groq import Groq

app = Flask(__name__)

ENV_FILE = Path(__file__).parent / ".env"


def load_key():
    """Read GROQ_API_KEY from .env file if it exists."""
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith("GROQ_API_KEY="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("GROQ_API_KEY", "")


def save_key(key):
    """Write GROQ_API_KEY permanently to .env file."""
    ENV_FILE.write_text(f"GROQ_API_KEY={key}\n")


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/has-key")
def has_key():
    """Tell the frontend whether a key is already saved."""
    return jsonify({"has_key": bool(load_key())})


@app.route("/save-key", methods=["POST"])
def save_key_route():
    """Validate and permanently save the API key."""
    data = request.get_json()
    key  = (data or {}).get("api_key", "").strip()

    if not key.startswith("gsk_"):
        return jsonify({"error": 'Key must start with "gsk_". Check you copied it fully.'}), 400

    # Quick test call to verify the key works
    try:
        client = Groq(api_key=key)
        client.models.list()          # lightweight check — no tokens used
    except Exception as e:
        err = str(e)
        if "401" in err or "invalid" in err.lower():
            return jsonify({"error": "Key rejected by Groq. Please double-check and try again."}), 400
        # Any other error (network, etc.) — still save and let the user try
    save_key(key)
    return jsonify({"ok": True})


@app.route("/generate", methods=["POST"])
def generate():
    api_key = load_key()
    if not api_key:
        return jsonify({"error": "No API key saved. Please enter your Groq key."}), 401

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    file      = request.files["image"]
    tone      = request.form.get("tone",  "Witty")
    count     = request.form.get("count", "3")
    mime_type = file.content_type or "image/jpeg"

    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400
    if mime_type not in ALLOWED_TYPES:
        return jsonify({"error": f"Unsupported file type: {mime_type}"}), 400

    image_b64 = base64.standard_b64encode(file.read()).decode("utf-8")

    prompt = f"""Analyze this image and generate exactly {count} Instagram caption(s) with a {tone.lower()} tone.

Return ONLY valid JSON — no markdown, no extra text:
{{
  "captions": ["caption 1", "caption 2"],
  "hashtags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8"]
}}

Rules:
- Match the {tone.lower()} tone perfectly
- Use emojis naturally inside captions
- Each caption: 1-3 sentences
- Exactly {count} caption(s)
- Exactly 8 relevant hashtags WITHOUT the # symbol"""

    try:
        client   = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}},
                    {"type": "text",      "text": prompt},
                ],
            }],
            max_tokens=1024,
            temperature=0.8,
        )

        raw    = response.choices[0].message.content.strip()
        raw    = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)

        return jsonify({
            "captions": result.get("captions", []),
            "hashtags": result.get("hashtags", []),
        })

    except json.JSONDecodeError:
        return jsonify({"error": "Could not parse AI response. Please try again."}), 500
    except Exception as e:
        err = str(e)
        if "401" in err or "invalid_api_key" in err:
            return jsonify({"error": "API key is invalid. Please re-enter your Groq key."}), 401
        return jsonify({"error": err}), 500


if __name__ == "__main__":
    key = load_key()
    if key:
        print("\n✅ API key loaded from .env — ready to go!")
    else:
        print("\n⚠️  No API key found. Open http://localhost:5000 to enter it.")
    print("   Open http://localhost:5000\n")
    app.run(debug=True, port=5000)