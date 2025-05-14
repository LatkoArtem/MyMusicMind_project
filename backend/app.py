import os
import requests
from flask import Flask, request, redirect, session, jsonify
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Session config
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './flask_session_files'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
Session(app)

# CORS config
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_URL = "https://api.spotify.com/v1/me"
SCOPE = "user-read-private user-read-email"

@app.route("/login")
def login():
    session.pop("access_token", None)
    session["expecting_callback"] = True
    auth_url = (
        f"{SPOTIFY_AUTH_URL}?response_type=code&client_id={CLIENT_ID}"
        f"&scope={SCOPE}&redirect_uri={REDIRECT_URI}&show_dialog=true"
    )
    return redirect(auth_url)

@app.route("/callback")
def callback():
    if not session.get("expecting_callback"):
        return redirect("http://localhost:3000?error=unexpected_callback")

    session.pop("expecting_callback", None)

    error = request.args.get("error")
    if error:
        # Користувач натиснув "Скасувати" або сталася інша помилка
        return redirect("http://localhost:3000?error=access_denied")

    code = request.args.get("code")
    if not code:
        return redirect("http://localhost:3000?error=no_code")

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    if response.status_code != 200:
        return redirect("http://localhost:3000?error=token_failed")

    tokens = response.json()
    session["access_token"] = tokens["access_token"]
    print("✅ Token:", tokens["access_token"])
    return redirect("http://localhost:3000")

@app.route("/profile")
def profile():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    response = requests.get(
        SPOTIFY_API_URL,
        headers={"Authorization": f"Bearer {access_token}"}
    )

    print("👉 Spotify API status:", response.status_code)
    print("👉 Spotify API response:", response.text)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch profile"}), 400

    return jsonify(response.json())

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("access_token", None)
    response = jsonify({"message": "Logged out"})
    response.delete_cookie('session')
    return response, 200

if __name__ == "__main__":
    app.run(port=8888, debug=True)
