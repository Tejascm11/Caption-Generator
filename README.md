# 📸 InstaCap AI — Instagram Caption Generator
> Mini Project | Python Flask + Groq AI (100% FREE)

---

## 📁 Project Structure

```
instagram-caption-generator/
│
├── app.py                  ← Flask backend (routes + Groq AI calls)
├── requirements.txt        ← Python dependencies
├── README.md               ← This file
│
├── templates/
│   └── index.html          ← Main HTML page
│
└── static/
    ├── css/
    │   └── style.css       ← Styling & animations
    └── js/
        └── main.js         ← Frontend logic
```

---

## 🆓 FREE API Key Setup (Groq — No Credit Card)

1. Go to 👉 **https://console.groq.com**
2. Sign up with **Google or GitHub** (free, instant)
3. Click **"API Keys"** in the left sidebar
4. Click **"Create API Key"** → give it any name
5. Copy the key — it starts with **`gsk_...`**

✅ Groq keys **never expire** and have a generous free limit.

---

## ⚙️ Installation & Running

### Step 1 — Go into the project folder
```bash
cd instagram-caption-generator
```

### Step 2 — Create virtual environment
```bash
python -m venv venv
```
Activate:
- **Windows CMD:**   `venv\Scripts\activate`
- **Windows PS:**    `.\venv\Scripts\Activate.ps1`
- **Mac/Linux:**     `source venv/bin/activate`

### Step 3 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Set your FREE Groq API key

**Windows CMD:**
```cmd
set GROQ_API_KEY=gsk_your_key_here
```
**Windows PowerShell:**
```powershell
$env:GROQ_API_KEY="gsk_your_key_here"
```
**Mac / Linux:**
```bash
export GROQ_API_KEY=gsk_your_key_here
```

### Step 5 — Run the app
```bash
python app.py
```

### Step 6 — Open in browser
```
http://localhost:5000
```

---

## 🛠️ Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Python 3, Flask                         |
| AI Model  | Llama 4 Scout Vision via Groq (FREE)    |
| Frontend  | HTML5, CSS3, Vanilla JavaScript         |
| Fonts     | Google Fonts (Syne, Instrument Serif)   |

---

## ✨ Features
- 📤 Drag & drop or click-to-upload (JPG, PNG, WEBP, GIF)
- 🎭 6 tones: Witty, Poetic, Minimalist, Playful, Inspirational, Sarcastic
- 🔢 Generate 1, 2, or 3 captions at once
- #️⃣ 8 relevant hashtags auto-generated
- 📋 One-click copy (caption + all hashtags)
- 📱 Fully responsive design

---

## ⚠️ Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `AuthenticationError` | Check your `gsk_...` key is set correctly |
| Port in use | Change `port=5000` to `port=5001` in app.py |
| `python` not found | Try `python3` instead of `python` |