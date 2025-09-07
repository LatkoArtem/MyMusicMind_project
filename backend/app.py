import os
import re
import requests
import json
import time
import numpy as np
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
from flask import Flask, request, redirect, session, jsonify
# from flask_cors import CORS, cross_origin
from flask_session import Session
from dotenv import load_dotenv
from routes.groq_client import get_song_themes_from_groq
from models import db, User, UserLyricsTopic, AnalyzedAlbum, AnalyzedPlaylist, AlbumTrackFeature, PlaylistTrackFeature, Rating
from utils import hash_lyrics, is_request_allowed
from cache_lyrics import get_cached_lyrics, set_cached_lyrics, get_cached_lyrics_by_track_id, set_cached_lyrics_by_track_id
from yt_download_audio import download_audio
from sqlalchemy.exc import IntegrityError
from features_extractor import extract_features_from_full_track
from calculate_consistency_score import calculate_mean_feature_vector, calculate_consistency_score
from cluster_tracks import analyze_tracks

# PROFILE_PATH = "./flask_session_files/profile_data.json" <--- для локальної розробки

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

# DB_HOST=os.getenv("DB_HOST")
# DB_NAME=os.getenv("DB_NAME")   <--- для локальної розробки
# DB_USER=os.getenv("DB_USER")
# DB_PASS=os.getenv("DB_PASS")

LASTFM_API_KEY=os.getenv("LASTFM_API_KEY")

app = Flask(__name__, static_folder="frontend_build", template_folder="frontend_build")
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'change-me-in-prod')

# app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}" <--- для локальної розробки

DATABASE_URL = os.getenv("DATABASE_URL") # для деплою
if DATABASE_URL and DATABASE_URL.startswith("postgres://"): # для деплою
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1) # для деплою

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Session config
# app.config['SESSION_TYPE'] = 'filesystem'                 <--- для локальної розробки
# app.config['SESSION_FILE_DIR'] = './flask_session_files'  <--- для локальної розробки
app.config['SESSION_TYPE'] = 'sqlalchemy'
app.config['SESSION_SQLALCHEMY'] = db
# app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  <--- для локальної розробки
# app.config['SESSION_COOKIE_SECURE'] = False    <--- для локальної розробки
app.config['SESSION_PERMANENT'] = False # <--- для деплою
app.config['SESSION_USE_SIGNER'] = True # <--- для деплою
app.config['SESSION_COOKIE_NAME'] = "mymusicmind_session" # <--- для деплою
# app.config['SESSION_COOKIE_DOMAIN'] = 'mymusicmind.onrender.com' # <--- для деплою
app.config['SESSION_COOKIE_SAMESITE'] = "Lax"
app.config['SESSION_COOKIE_SECURE'] = True

Session(app)

# CORS config
# CORS(app, supports_credentials=True, origins=["https://mymusicmind.netlify.app"])

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_URL = "https://api.spotify.com/v1/me"
SCOPE = "user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative user-follow-read user-library-modify user-read-playback-state user-read-currently-playing streaming app-remote-control user-read-playback-position user-top-read"

# ----------- Routs ------------

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "API endpoint not found"}), 404
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    return app.send_static_file("index.html")

@app.route("/profile/update", methods=["POST"])
def update_profile():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json

    if "viewMode" in data and data["viewMode"] in ["grid", "list"]:
        user.view_mode = data["viewMode"]
    if "language" in data and data["language"] in ["en", "uk"]:
        user.language = data["language"]

    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully",
        "viewMode": user.view_mode,
        "language": user.language
    })

@app.route("/profile/set-language", methods=["POST"])
def set_language():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    language = data.get("language")
    if language not in ["en", "uk"]:
        return jsonify({"error": "Invalid language"}), 400

    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.language = language
    db.session.commit()

    return jsonify({"success": True, "language": language})

@app.route("/login")
def login():
    session.pop("access_token", None)
    session["expecting_callback"] = True
    auth_url = (
        f"{SPOTIFY_AUTH_URL}?response_type=code&client_id={CLIENT_ID}"
        f"&scope={SCOPE}&redirect_uri={REDIRECT_URI}&show_dialog=true"
    )
    return redirect(auth_url)

# ---------- Token refresh function ----------
def refresh_spotify_access_token():
    refresh_token = session.get("refresh_token")
    if not refresh_token:
        return None

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code != 200:
        return None

    tokens = response.json()
    session["access_token"] = tokens["access_token"]
    return tokens["access_token"]

@app.route("/callback")
def callback():
    if not session.get("expecting_callback"):
        return redirect("https://mymusicmind.onrender.com?error=unexpected_callback")

    session.pop("expecting_callback", None)

    error = request.args.get("error")
    if error:
        return redirect("https://mymusicmind.onrender.com?error=access_denied")

    code = request.args.get("code")
    if not code:
        return redirect("https://mymusicmind.onrender.com?error=no_code")

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
        return redirect("https://mymusicmind.onrender.com?error=token_failed")

    tokens = response.json()
    session["access_token"] = tokens["access_token"]
    session["refresh_token"] = tokens.get("refresh_token")

    profile_response = requests.get(
        SPOTIFY_API_URL,
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )

    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        email = profile_data.get("email")

        if email:
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(email=email, language="en")
                db.session.add(user)
                db.session.commit()
            session["user_id"] = user.id

    return redirect("https://mymusicmind.onrender.com")

@app.route("/profile")
def profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    access_token = session.get("access_token")
    spotify_data = {}

    if access_token:
        response = requests.get(
            SPOTIFY_API_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code == 401:  # токен протух
            access_token = refresh_spotify_access_token()
            if not access_token:
                return jsonify({"error": "Need login"}), 401
            response = requests.get(
                SPOTIFY_API_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

        if response.status_code == 200:
            spotify_data = response.json()

    profile_data = {
        "email": user.email,
        "language": user.language,
        "id": user.id,
        "spotifyAccessToken": access_token,
        **{k: v for k, v in spotify_data.items() if k not in ["email", "language"]}
    }

    return jsonify(profile_data)

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    response = jsonify({"message": "Logged out"})
    response.delete_cookie('session')
    return response, 200

@app.route("/liked-songs")
def liked_songs():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = "https://api.spotify.com/v1/me/tracks"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50, "offset": 0}

    all_tracks = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch liked songs", "details": response.json()}), response.status_code

        data = response.json()
        all_tracks["items"].extend(data.get("items", []))
        all_tracks["total"] = data.get("total", 0)

        url = data.get("next")
        params = None

    return jsonify(all_tracks)

@app.route("/viewmode", methods=["POST"])
def update_viewmode():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    viewmode = data.get("viewMode")
    if viewmode not in ["grid", "list"]:
        return jsonify({"error": "Invalid view mode"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.view_mode = viewmode
    db.session.commit()

    return jsonify({"message": "View mode updated", "viewMode": viewmode})

@app.route("/playlists")
def playlists():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = "https://api.spotify.com/v1/me/playlists"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50, "offset": 0}

    all_playlists = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch playlists"}), response.status_code

        data = response.json()

        playlists_only = data.get("items", [])

        all_playlists["items"].extend(playlists_only)
        all_playlists["total"] = data.get("total", 0)

        url = data.get("next")
        params = None

    return jsonify(all_playlists)

@app.route("/playlists/<playlist_id>")
def get_playlist_details(playlist_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/playlists/{playlist_id}"
    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch playlist details"}), response.status_code

    return jsonify(response.json())

@app.route("/playlists/<playlist_id>/tracks")
def playlist_tracks(playlist_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50}

    all_tracks = {"items": [], "total": 0}
    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch playlist tracks"}), response.status_code
        data = response.json()
        all_tracks["items"].extend(data.get("items", []))
        all_tracks["total"] = data.get("total", 0)
        url = data.get("next")
        params = None

    return jsonify(all_tracks)

@app.route("/albums")
def albums():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = "https://api.spotify.com/v1/me/albums"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50, "offset": 0}

    all_albums = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch albums", "details": response.json()}), response.status_code

        data = response.json()

        albums_only = [item["album"] for item in data.get("items", [])]

        all_albums["items"].extend(albums_only)
        all_albums["total"] = data.get("total", 0)

        url = data.get("next")
        params = None

    return jsonify(all_albums)

@app.route("/albums/<album_id>")
def get_album_details(album_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/albums/{album_id}"
    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch album details", "details": response.json()}), response.status_code

    return jsonify(response.json())

@app.route("/albums/<album_id>/tracks")
def album_tracks(album_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/albums/{album_id}/tracks"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50}

    all_tracks = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch album tracks"}), response.status_code
        data = response.json()
        all_tracks["items"].extend(data.get("items", []))
        all_tracks["total"] = data.get("total", 0)
        url = data.get("next")
        params = None

    return jsonify(all_tracks)

@app.route("/artists")
def artists():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = "https://api.spotify.com/v1/me/following"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"type": "artist", "limit": 50}

    all_artists = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch artists", "details": response.json()}), response.status_code

        data = response.json()
        artists_data = data.get("artists", {})
        all_artists["items"].extend(artists_data.get("items", []))
        all_artists["total"] = artists_data.get("total", 0)

        url = artists_data.get("next")
        params = None

    return jsonify(all_artists)

@app.route("/artists/<artist_id>")
def get_artist_details(artist_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/artists/{artist_id}"
    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch artist details"}), response.status_code

    return jsonify(response.json())


@app.route("/artists/<artist_id>/top-tracks")
def get_artist_top_tracks(artist_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"market": "US"}

    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch artist top tracks"}), response.status_code

    return jsonify(response.json())

@app.route("/podcasts")
def podcasts():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = "https://api.spotify.com/v1/me/shows"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50, "offset": 0}

    all_podcasts = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch podcasts", "details": response.json()}), response.status_code

        data = response.json()

        shows_only = [item["show"] for item in data.get("items", [])]
        all_podcasts["items"].extend(shows_only)
        all_podcasts["total"] = data.get("total", 0)

        url = data.get("next")
        params = None

    return jsonify(all_podcasts)


@app.route("/podcasts/<podcast_id>")
def get_podcast_details(podcast_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/shows/{podcast_id}"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"market": "US"}

    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch podcast details", "details": response.json()}), response.status_code

    return jsonify(response.json())


@app.route("/podcasts/<podcast_id>/episodes")
def get_podcast_episodes(podcast_id):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = f"https://api.spotify.com/v1/shows/{podcast_id}/episodes"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50, "offset": 0, "market": "US"}

    all_episodes = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch podcast episodes", "details": response.json()}), response.status_code

        data = response.json()
        all_episodes["items"].extend(data.get("items", []))
        all_episodes["total"] = data.get("total", 0)

        url = data.get("next")
        params = None

    return jsonify(all_episodes)

@app.route("/my-episodes")
def get_saved_episodes():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    url = "https://api.spotify.com/v1/me/episodes"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"limit": 50, "offset": 0, "market": "UA"}

    all_episodes = {"items": [], "total": 0}

    while url:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({
                "error": "Failed to fetch saved episodes",
                "details": response.json()
            }), response.status_code

        data = response.json()

        episodes_only = [item["episode"] for item in data.get("items", []) if "episode" in item]

        all_episodes["items"].extend(episodes_only)
        all_episodes["total"] = data.get("total", 0)

        url = data.get("next")
        params = None

    return jsonify(all_episodes)

############## GENIUS LYRICS PARSING ##############
GENIUS_API_TOKEN = os.getenv("GENIUS_API_TOKEN")
HEADERS_GENIUS = {"Authorization": f"Bearer {GENIUS_API_TOKEN}"}

# Search for songs on Genius
def search_genius(song_title, artist_name):
    base_url = "https://api.genius.com/search"
    query = f"{song_title} {artist_name}"
    response = requests.get(base_url, params={"q": query}, headers=HEADERS_GENIUS)

    if response.status_code != 200:
        return None

    data = response.json()
    hits = data["response"]["hits"]
    for hit in hits:
        if artist_name.lower() in hit["result"]["primary_artist"]["name"].lower():
            return hit["result"]["url"]
    return None

# Scrape lyrics
def scrape_lyrics_from_url(url):
    page = requests.get(url)
    if page.status_code != 200:
        return None

    soup = BeautifulSoup(page.text, "html.parser")
    lyrics_blocks = soup.select("div[data-lyrics-container='true']")

    lyrics_lines = []

    for block in lyrics_blocks:
        for excluded in block.select('[data-exclude-from-selection="true"]'):
            excluded.decompose()

        for element in block.children:
            if getattr(element, "name", None) == "p":
                text = element.get_text(separator="\n").strip()
                if text:
                    lyrics_lines.append(text)
            elif isinstance(element, str):
                text = element.strip()
                if text:
                    lyrics_lines.append(text)
            else:
                text = element.get_text(separator="\n").strip()
                if text:
                    lyrics_lines.append(text)

    full_text = "\n".join(lyrics_lines)

    full_text = re.sub(r"\[\s*([^]]*?\n)*?[^]]*?\s*\]", "", full_text, flags=re.MULTILINE)

    cleaned_lyrics = re.sub(r"\n{2,}", "\n", full_text).strip()

    return cleaned_lyrics if cleaned_lyrics else None

# Main endpoint
@app.route("/get_lyrics", methods=["GET"])
def get_lyrics():
    song = request.args.get("song")
    artist = request.args.get("artist")
    track_id = request.args.get("track_id")

    if not song or not artist:
        return jsonify({"error": "Missing song or artist"}), 400

    search_string = f"{song} {artist}"
    lyrics_hash = hash_lyrics(search_string)

    # Спроба взяти lyrics з кешу
    cached = get_cached_lyrics(lyrics_hash)
    if cached:
        # Зберігаємо до track_id-кешу, якщо track_id є
        if track_id:
            set_cached_lyrics_by_track_id(track_id, cached)
        return jsonify({
            "song": song,
            "artist": artist,
            "lyrics": cached,
            "source": "cache"
        })

    genius_url = search_genius(song, artist)
    if not genius_url:
        return jsonify({"error": "Song not found on Genius"}), 404

    lyrics = scrape_lyrics_from_url(genius_url)
    if not lyrics:
        return jsonify({"error": "Lyrics not found or could not be parsed"}), 500

    # Зберігаємо в кеш
    set_cached_lyrics(lyrics_hash, lyrics)
    if track_id:
        set_cached_lyrics_by_track_id(track_id, lyrics)

    return jsonify({
        "song": song,
        "artist": artist,
        "lyrics": lyrics,
        "source_url": genius_url
    })
############## GENIUS LYRICS PARSING END ##############

############## Analyze lyrics #########################
@app.route("/get_lyrics_quota")
def get_lyrics_quota():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)

    count = UserLyricsTopic.query.filter(
        UserLyricsTopic.user_id == user_id,
        UserLyricsTopic.created_at >= yesterday
    ).count()

    daily_limit = 10
    requests_left = max(0, daily_limit - count)

    first_request = UserLyricsTopic.query.filter(
        UserLyricsTopic.user_id == user_id,
        UserLyricsTopic.created_at >= yesterday
    ).order_by(UserLyricsTopic.created_at.asc()).first()

    if requests_left > 0 or not first_request:
        reset_seconds = 0
    else:
        created_at_utc = first_request.created_at.astimezone(timezone.utc)
        reset_seconds = int((created_at_utc + timedelta(days=1) - now).total_seconds())

    return jsonify({
        "requests_left": requests_left,
        "reset_seconds": reset_seconds
    })

@app.route("/analyze_lyrics", methods=["POST"])
def analyze_lyrics():
    data = request.get_json()
    lyrics = data.get("lyrics")
    user_id = session.get("user_id")

    if not user_id or not lyrics:
        return jsonify({"error": "Missing user ID or lyrics"}), 400

    lyrics_hash = hash_lyrics(lyrics)

    existing = UserLyricsTopic.query.filter_by(user_id=user_id, lyrics_hash=lyrics_hash).first()
    if existing:
        return jsonify({
            "topics": [existing.topic1, existing.topic2, existing.topic3],
            "cached": True
        })

    if not is_request_allowed(user_id):
        return jsonify({"error": "Daily limit exceeded"}), 429

    # Спроба взяти текст з кешу
    cached_lyrics = get_cached_lyrics(lyrics_hash)
    if not cached_lyrics:
        set_cached_lyrics(lyrics_hash, lyrics)

    # Виклик LLM
    theme_str = get_song_themes_from_groq(lyrics)
    topics = [x.strip() for x in theme_str.split(",")][:3]

    # Зберігаємо тільки хеш і топіки
    new_record = UserLyricsTopic(
        user_id=user_id,
        lyrics_hash=lyrics_hash,
        topic1=topics[0] if len(topics) > 0 else "",
        topic2=topics[1] if len(topics) > 1 else "",
        topic3=topics[2] if len(topics) > 2 else ""
    )
    db.session.add(new_record)
    db.session.commit()

    return jsonify({
        "topics": topics,
        "cached": False
    })

@app.route("/lyrics_topics/<track_id>")
def get_lyrics_topics_by_track_id(track_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    lyrics = get_cached_lyrics_by_track_id(track_id)
    if not lyrics:
        return jsonify({"error": "Lyrics not found in cache"}), 404

    lyrics_hash = hash_lyrics(lyrics)

    existing = UserLyricsTopic.query.filter_by(user_id=user_id, lyrics_hash=lyrics_hash).first()

    if existing:
        return jsonify({
            "topics": [existing.topic1, existing.topic2, existing.topic3],
            "cached": True
        })
    else:
        return jsonify({
            "topics": [],
            "cached": False
        })
############## Analyze lyrics END #####################

############## Album Analyze ##########################
@app.route("/analyze_album/<album_id>")
def analyze_album(album_id):
    access_token = session.get("access_token")
    if not access_token:
        print(f"⚠️ [WARN] Unauthorized access attempt for album {album_id}")
        return jsonify({"error": "Unauthorized"}), 401

    # Перевірка кешу аналізу альбому
    cached = AnalyzedAlbum.query.filter_by(album_id=album_id).first()
    if cached:
        print(f"🗂️ [INFO] Returning cached analysis for album {album_id}")

        track_features_db = AlbumTrackFeature.query.filter_by(album_id=album_id).all()
        print(f"🗂️ [INFO] Found {len(track_features_db)} cached track features")

        track_names = [tf.track_name for tf in track_features_db]
        track_clusters = [tf.cluster for tf in track_features_db]

        features_all = []
        for tf in track_features_db:
            try:
                features_json = json.loads(tf.features)
            except Exception as e:
                print(f"❌ [ERROR] Failed to load features JSON for track {tf.track_id}: {e}")
                features_json = None

            tags = []
            try:
                tags = json.loads(tf.tags) if tf.tags else []
            except Exception as e:
                print(f"❌ [ERROR] Failed to load tags JSON for track {tf.track_id}: {e}")

            features_all.append({
                "track_id": tf.track_id,
                "track_name": tf.track_name,
                "features": features_json,
                "cluster": tf.cluster,
                "tags": tags
            })

        print(f"🗂️ [INFO] Returning {len(features_all)} tracks with features")

        return jsonify({
            "album_id": album_id,
            "track_features": features_all,
            "track_names": track_names,
            "track_clusters": track_clusters,
            "feature_vector": json.loads(cached.features),
            "consistency_score": cached.consistency_score,
            "cached": True
        })

    # Якщо немає кешу — запитуємо треки з Spotify API
    headers = {"Authorization": f"Bearer {access_token}"}
    url = f"https://api.spotify.com/v1/albums/{album_id}/tracks"
    tracks = []

    print(f"🎵 [INFO] Fetching tracks for album {album_id} from Spotify API")
    while url:
        res = requests.get(url, headers=headers)
        if res.status_code != 200:
            print(f"❌ [ERROR] Failed to get album tracks for {album_id}, status: {res.status_code}")
            return jsonify({"error": "Failed to get album tracks"}), 400
        data = res.json()
        tracks += data["items"]
        url = data.get("next")

    print(f"📦 [INFO] Fetched {len(tracks)} raw tracks for album {album_id}")

    # Унікалізація треків за id
    unique_tracks = {}
    for track in tracks:
        track_id = track.get("id")
        artists = track.get("artists")
        if not track_id or not artists:
            print(f"⚠️ [WARN] Skipping track with missing ID or artists")
            continue
        if track_id not in unique_tracks:
            unique_tracks[track_id] = track
    tracks = list(unique_tracks.values())
    print(f"✅ [INFO] Unique tracks count after deduplication: {len(tracks)}")

    os.makedirs("audio_temp", exist_ok=True)
    features_all = []
    track_names = []

    # Обробка аудіо, екстракція фіч
    for idx, track in enumerate(tracks):
        name = track["name"]
        artist = track["artists"][0]["name"]
        print(f"🎧 [INFO] Processing track {idx + 1}: '{name}' by {artist}")

        path = download_audio(name, artist)
        if not path:
            print(f"⚠️ [WARN] Failed to download audio for track '{name}'")
            continue

        print(f"🔍 [DEBUG] Extracting features for '{name}' from {path}")
        feats = extract_features_from_full_track(path)

        if feats is not None:
            features_all.append(feats.tolist())
            track_names.append(name)
            print(f"🎯 [INFO] Extracted features for track '{name}'")
        else:
            print(f"⚠️ [WARN] Skipping track '{name}' due to failed extraction")

        try:
            os.remove(path)
            print(f"🗑️ [INFO] Deleted temporary audio file for track '{name}'")
        except Exception as e:
            print(f"❌ [ERROR] Cannot remove {path}: {e}")

        time.sleep(2.5)

    if not features_all:
        print(f"🚫 [ERROR] No audio features extracted for album {album_id}")
        return jsonify({"error": "No audio features extracted"}), 400

    analysis_results = analyze_tracks(np.array(features_all))

    mean_features = calculate_mean_feature_vector(features_all)
    consistency_score = calculate_consistency_score(features_all)

    # Збереження треків з кластером і тегами
    for idx, track in enumerate(tracks):
        if idx >= len(features_all):
            break

        analyzed_track = AlbumTrackFeature(
            album_id=album_id,
            track_id=track["id"],
            track_name=track["name"],
            features=json.dumps(features_all[idx]),
            cluster=int(analysis_results[idx]["cluster"]),
            tags=json.dumps(analysis_results[idx]["tags"])
        )
        db.session.merge(analyzed_track)

    # Збереження аналізу альбому
    new_entry = AnalyzedAlbum(
        album_id=album_id,
        features=json.dumps(mean_features),
        consistency_score=consistency_score
    )
    db.session.merge(new_entry)

    try:
        db.session.commit()
        print(f"💾 [INFO] Saved album analysis and all track features to DB for album {album_id}")
    except IntegrityError:
        db.session.rollback()
        print(f"⚠️ [WARN] Album {album_id} already saved in parallel operation")
        cached = AnalyzedAlbum.query.filter_by(album_id=album_id).first()
        return jsonify({
            "album_id": album_id,
            "feature_vector": json.loads(cached.features),
            "consistency_score": cached.consistency_score,
            "cached": True
        })

    return jsonify({
        "album_id": album_id,
        "track_features": [
            {
                "track_id": track["id"],
                "track_name": track["name"],
                "features": features_all[idx],
                "cluster": int(analysis_results[idx]["cluster"]),
                "tags": analysis_results[idx]["tags"]
            }
            for idx, track in enumerate(tracks) if idx < len(features_all)
        ],
        "feature_vector": mean_features,
        "consistency_score": consistency_score,
        "track_names": [track["name"] for track in tracks],
        "track_clusters": [int(result["cluster"]) for result in analysis_results],
        "cached": False
    })
############## Album Analyze END ######################

############## Playlist Analyze ##########################
@app.route("/analyze_playlist/<playlist_id>")
def analyze_playlist(playlist_id):
    access_token = session.get("access_token")
    if not access_token:
        print(f"⚠️ [WARN] Unauthorized access attempt for playlist {playlist_id}")
        return jsonify({"error": "Unauthorized"}), 401

    cached = AnalyzedPlaylist.query.filter_by(playlist_id=playlist_id).first()
    if cached:
        print(f"🗂️ [INFO] Returning cached analysis for playlist {playlist_id}")

        track_features_db = PlaylistTrackFeature.query.filter_by(playlist_id=playlist_id).all()
        print(f"🗂️ [INFO] Found {len(track_features_db)} cached track features")

        track_names = [tf.track_name for tf in track_features_db]
        track_clusters = [tf.cluster for tf in track_features_db]

        features_all = []
        for tf in track_features_db:
            try:
                features_json = json.loads(tf.features)
            except Exception as e:
                print(f"❌ [ERROR] Failed to load features JSON for track {tf.track_id}: {e}")
                features_json = None

            tags = []
            try:
                tags = json.loads(tf.tags) if tf.tags else []
            except Exception as e:
                print(f"❌ [ERROR] Failed to load tags JSON for track {tf.track_id}: {e}")

            features_all.append({
                "track_id": tf.track_id,
                "track_name": tf.track_name,
                "features": features_json,
                "cluster": tf.cluster,
                "tags": tags
            })

        print(f"🗂️ [INFO] Returning {len(features_all)} tracks with features")

        return jsonify({
            "playlist_id": playlist_id,
            "track_features": features_all,
            "track_names": track_names,
            "track_clusters": track_clusters,
            "feature_vector": json.loads(cached.features),
            "consistency_score": cached.consistency_score,
            "cached": True
        })

    headers = {"Authorization": f"Bearer {access_token}"}
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    tracks = []

    print(f"🎵 [INFO] Fetching tracks for playlist {playlist_id} from Spotify API")
    while url:
        res = requests.get(url, headers=headers)
        if res.status_code != 200:
            print(f"❌ [ERROR] Failed to get playlist tracks for {playlist_id}, status: {res.status_code}")
            return jsonify({"error": "Failed to get playlist tracks"}), 400
        data = res.json()
        tracks += data["items"]
        url = data.get("next")

    print(f"📦 [INFO] Fetched {len(tracks)} raw tracks for playlist {playlist_id}")

    valid_tracks = []
    for item in tracks:
        track = item.get("track")
        if track and track.get("id") and track.get("name") and track.get("artists"):
            valid_tracks.append(track)
        else:
            print("⚠️ [WARN] Skipping invalid or missing track entry")

    valid_tracks = sorted(valid_tracks, key=lambda t: t.get("popularity", 0), reverse=True)[:50]
    print(f"✅ [INFO] Selected top {len(valid_tracks)} tracks by popularity")

    os.makedirs("audio_temp", exist_ok=True)
    features_all = []
    track_names = []

    for idx, track in enumerate(valid_tracks):
        name = track["name"]
        artist = track["artists"][0]["name"]
        print(f"🎧 [INFO] Processing track {idx + 1}: '{name}' by {artist}")

        path = download_audio(name, artist)
        if not path:
            print(f"⚠️ [WARN] Failed to download audio for track '{name}'")
            continue

        print(f"🔍 [DEBUG] Extracting features for '{name}' from {path}")
        feats = extract_features_from_full_track(path)

        if feats is not None:
            features_all.append(feats.tolist())
            track_names.append(name)
            print(f"🎯 [INFO] Extracted features for track '{name}'")
        else:
            print(f"⚠️ [WARN] Skipping track '{name}' due to failed extraction")

        try:
            os.remove(path)
            print(f"🗑️ [INFO] Deleted temporary audio file for track '{name}'")
        except Exception as e:
            print(f"❌ [ERROR] Cannot remove {path}: {e}")

        time.sleep(2.5)

    if not features_all:
        print(f"🚫 [ERROR] No audio features extracted for playlist {playlist_id}")
        return jsonify({"error": "No audio features extracted"}), 400

    print(f"📊 [INFO] Feature vectors for each track in playlist {playlist_id}:")
    for i, vec in enumerate(features_all, start=1):
        print(f"Track {i} features: {vec}")

    analysis_results = analyze_tracks(np.array(features_all))

    mean_features = calculate_mean_feature_vector(features_all)
    consistency_score = calculate_consistency_score(features_all)

    # Збереження треків з кластером і тегами
    for idx, track in enumerate(valid_tracks):
        if idx >= len(features_all):
            break

        analyzed_track = PlaylistTrackFeature(
            playlist_id=playlist_id,
            track_id=track["id"],
            track_name=track["name"],
            features=json.dumps(features_all[idx]),
            cluster=int(analysis_results[idx]["cluster"]),
            tags=json.dumps(analysis_results[idx]["tags"])
        )
        db.session.merge(analyzed_track)

    # Збереження аналізу плейлисту
    new_entry = AnalyzedPlaylist(
        playlist_id=playlist_id,
        features=json.dumps(mean_features),
        consistency_score=consistency_score
    )
    db.session.merge(new_entry)

    try:
        db.session.commit()
        print(f"💾 [INFO] Saved playlist analysis and all track features to DB for playlist {playlist_id}")
    except IntegrityError:
        db.session.rollback()
        print(f"⚠️ [WARN] Playlist {playlist_id} already saved in parallel operation")
        cached = AnalyzedPlaylist.query.filter_by(playlist_id=playlist_id).first()
        return jsonify({
            "playlist_id": playlist_id,
            "feature_vector": json.loads(cached.features),
            "consistency_score": cached.consistency_score,
            "cached": True
        })

    return jsonify({
        "playlist_id": playlist_id,
        "track_features": [
            {
                "track_id": track["id"],
                "track_name": track["name"],
                "features": features_all[idx],
                "cluster": int(analysis_results[idx]["cluster"]),
                "tags": analysis_results[idx]["tags"]
            }
            for idx, track in enumerate(valid_tracks) if idx < len(features_all)
        ],
        "feature_vector": mean_features,
        "consistency_score": consistency_score,
        "track_names": [track["name"] for track in valid_tracks],
        "cached": False,
        "track_clusters": [int(result["cluster"]) for result in analysis_results]
    })
############## Playlist Analyze END ######################

############## Artist Analyze ######################
def get_spotify_headers():
    access_token = session.get("access_token")
    if not access_token:
        return None
    return {
        "Authorization": f"Bearer {access_token}"
    }

@app.route("/similar_artists/<artist_name>")
def get_similar_artists_combined(artist_name):
    # 1. Отримуємо схожих артистів з Last.fm
    lastfm_url = "https://ws.audioscrobbler.com/2.0/"
    params = {
        "method": "artist.getsimilar",
        "artist": artist_name,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        "limit": 12
    }
    lastfm_response = requests.get(lastfm_url, params=params)
    lastfm_data = lastfm_response.json()

    if "similarartists" not in lastfm_data:
        return jsonify({"error": "No similar artists found on Last.fm"}), 404

    similar_names = [a["name"] for a in lastfm_data["similarartists"]["artist"]]

    # 2. Шукаємо кожного артиста на Spotify
    headers = get_spotify_headers()
    if not headers:
        return jsonify({"error": "Spotify access token missing"}), 401

    result = []
    seen_ids = set()
    for name in similar_names:
        search_params = {
            "q": name,
            "type": "artist",
            "limit": 5
        }
        spotify_response = requests.get(f"https://api.spotify.com/v1/search", headers=headers, params=search_params)
        spotify_data = spotify_response.json()

        artists = spotify_data.get("artists", {}).get("items", [])
        if not artists:
            continue

        name_lower = name.lower()
        matched_artist = None
        for artist in artists:
            if artist["name"].lower() == name_lower:
                matched_artist = artist
                break
        if matched_artist is None:
            matched_artist = artists[0]

        if matched_artist["followers"]["total"] < 5000:
            continue

        if matched_artist["id"] in seen_ids:
            continue

        seen_ids.add(matched_artist["id"])
        result.append({
            "id": matched_artist["id"],
            "name": matched_artist["name"],
            "spotify_url": matched_artist["external_urls"]["spotify"],
            "image": matched_artist["images"][0]["url"] if matched_artist["images"] else None,
        })

    return jsonify(result)

@app.route("/artist_info/<info_type>/<value>")
def artist_info(info_type, value):
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Spotify access token missing"}), 401

    headers = {"Authorization": f"Bearer {access_token}"}

    artist_name = None
    image = None
    followers = None
    spotify_url = None

    if info_type == "id":
        spotify_resp = requests.get(f"https://api.spotify.com/v1/artists/{value}", headers=headers)
        if spotify_resp.status_code != 200:
            return jsonify({"error": "Spotify artist fetch failed"}), 404
        spotify_data = spotify_resp.json()
        artist_name = spotify_data.get("name")
        image = spotify_data["images"][0]["url"] if spotify_data.get("images") else None
        followers = spotify_data.get("followers", {}).get("total", None)
        spotify_url = spotify_data.get("external_urls", {}).get("spotify")

    elif info_type == "name":
        search_resp = requests.get(
            "https://api.spotify.com/v1/search",
            headers=headers,
            params={"q": value, "type": "artist", "limit": 5},
        )
        if search_resp.status_code != 200:
            return jsonify({"error": "Spotify search failed"}), 404
        data = search_resp.json()
        artists = data["artists"]["items"]
        if not artists:
            return jsonify({"error": "Artist not found"}), 404

        value_lower = value.lower()
        artist = None
        for a in artists:
            if a["name"].lower() == value_lower:
                artist = a
                break
        if artist is None:
            artist = artists[0]

        artist_name = artist["name"]
        image = artist["images"][0]["url"] if artist.get("images") else None
        followers = artist.get("followers", {}).get("total", None)
        spotify_url = artist.get("external_urls", {}).get("spotify")

    else:
        return jsonify({"error": "Invalid info_type. Must be 'id' or 'name'."}), 400

    # Біографія з Last.fm
    lastfm_url = "https://ws.audioscrobbler.com/2.0/"
    params = {
        "method": "artist.getinfo",
        "artist": artist_name,
        "api_key": LASTFM_API_KEY,
        "format": "json"
    }
    lastfm_response = requests.get(lastfm_url, params=params)
    lastfm_data = lastfm_response.json()

    bio = None
    if "artist" in lastfm_data and "bio" in lastfm_data["artist"]:
        raw_html = lastfm_data["artist"]["bio"].get("content") or lastfm_data["artist"]["bio"].get("summary", "")
        if raw_html:
            soup = BeautifulSoup(raw_html, "html.parser")
            cleaned_text = soup.get_text()
            cleaned_text = re.split(r'Read more on Last\.fm', cleaned_text)[0].strip()
            bio = cleaned_text

    return jsonify({
        "name": artist_name,
        "image": image,
        "followers": followers,
        "bio": bio,
        "spotify_url": spotify_url
    })

@app.route("/artist_latest_release/<artist_name>")
def artist_latest_release(artist_name):
    headers = get_spotify_headers()

    # Крок 1: Знайти артиста по імені
    search_url = "https://api.spotify.com/v1/search"
    search_params = {
        "q": artist_name,
        "type": "artist",
        "limit": 5,
    }
    search_resp = requests.get(search_url, headers=headers, params=search_params)
    search_data = search_resp.json()

    if "artists" not in search_data or len(search_data["artists"]["items"]) == 0:
        return jsonify({"error": "Artist not found"}), 404

    artist_name_lower = artist_name.lower()
    best_artist = None
    for artist in search_data["artists"]["items"]:
        if artist["name"].lower() == artist_name_lower:
            best_artist = artist
            break

    if best_artist is None:
        best_artist = search_data["artists"]["items"][0]

    artist_id = best_artist["id"]

    # Крок 2: Отримати всі релізи (обмежимося 20, або збільш за бажанням)
    albums_url = f"https://api.spotify.com/v1/artists/{artist_id}/albums"
    albums_params = {
        "include_groups": "album,single",
        "limit": 20,
        "market": "US",
    }
    albums_resp = requests.get(albums_url, headers=headers, params=albums_params)
    albums_data = albums_resp.json()

    if "items" not in albums_data or len(albums_data["items"]) == 0:
        return jsonify({"error": "No releases found"}), 404

    def parse_release_date(album):
        try:
            return datetime.strptime(album["release_date"], "%Y-%m-%d")
        except ValueError:
            try:
                return datetime.strptime(album["release_date"], "%Y-%m")
            except ValueError:
                return datetime.strptime(album["release_date"], "%Y")

    sorted_albums = sorted(albums_data["items"], key=parse_release_date, reverse=True)
    latest = sorted_albums[0]

    return jsonify({
        "name": latest["name"],
        "release_date": latest["release_date"],
        "release_type": latest["album_type"],  # "album" або "single"
        "spotify_url": latest["external_urls"]["spotify"],
        "image": latest["images"][0]["url"] if latest["images"] else None,
    })

def get_all_album_tracks(album_id, headers):
    tracks = []
    url = f"https://api.spotify.com/v1/albums/{album_id}/tracks?limit=50"

    while url:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            print(f"❌ Error fetching tracks for album {album_id}")
            break

        data = resp.json()
        tracks.extend(data.get("items", []))
        url = data.get("next")

    return tracks

@app.route("/genre_evolution/<artist_name>")
def genre_evolution(artist_name):
    headers = get_spotify_headers()

    # Тут список жанрів залишив без змін
    allowed_genres = {
        "Rap", "Hip-Hop", "R&B", "Pop", "Rock", "Country", "Jazz", "Blues",
        "Electronic", "Dance", "Soul", "Funk", "Reggae", "Metal", "Punk",
        "Classical", "Indie", "Alternative", "Latin", "Disco", "Gospel",
        "Trap", "House", "Techno", "Dubstep", "Ambient", "K-Pop", "Grime",
        "Ska", "Bluegrass", "Electro", "Drum & Bass", "Chillout", "Synthpop",
        "Garage", "Trap Soul", "Lo-fi Hip-Hop", "Electro Swing", "Future Bass",
        "Vaporwave", "Tropical House", "Post-Rock", "Shoegaze", "Dream Pop",
        "Neo-Soul", "Emo", "Hard Rock", "Progressive Rock", "Folk", "Acoustic",
        "Experimental", "Chillwave", "Trap Rap", "Christian", "Musical Theatre"
    }

    # Пошук артиста
    search_resp = requests.get(
        "https://api.spotify.com/v1/search",
        headers=headers,
        params={"q": artist_name, "type": "artist", "limit": 5}
    )
    search_data = search_resp.json()

    if "artists" not in search_data or not search_data["artists"]["items"]:
        return jsonify({"error": "Artist not found"}), 404

    artist_name_lower = artist_name.lower()
    best_artist = None
    for artist in search_data["artists"]["items"]:
        if artist["name"].lower() == artist_name_lower:
            best_artist = artist
            break

    if best_artist is None:
        best_artist = search_data["artists"]["items"][0]

    artist_id = best_artist["id"]
    print(f"Using artist: {best_artist['name']} with ID: {artist_id}")

    albums_url = f"https://api.spotify.com/v1/artists/{artist_id}/albums"
    albums_params = {
        "include_groups": "album,single",
        "limit": 50,
        "market": "US",
    }

    all_albums = []
    while albums_url:
        resp = requests.get(albums_url, headers=headers, params=albums_params)
        data = resp.json()
        all_albums.extend(data.get("items", []))
        albums_url = data.get("next")
        albums_params = None

    if not all_albums:
        return jsonify({"error": "No albums found"}), 404

    genre_by_year = defaultdict(lambda: defaultdict(int))
    tracks_count_by_year = defaultdict(int)
    seen_tracks_per_year = defaultdict(set)

    # Для виводу результату структуровано
    detailed_output = []

    # Сортуємо альбоми по даті релізу, щоб було зрозуміло як вони йдуть
    def album_release_key(album):
        release_date = album.get("release_date", "")
        for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
            try:
                return datetime.strptime(release_date, fmt)
            except:
                continue
        return datetime.min

    all_albums = sorted(all_albums, key=album_release_key)

    for album in all_albums:
        release_date = album.get("release_date", "")
        year = None
        for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
            try:
                year = datetime.strptime(release_date, fmt).year
                break
            except:
                continue
        if not year:
            continue

        album_id = album["id"]
        album_name = album.get("name", "Unknown Album")

        tracks = get_all_album_tracks(album_id, headers)

        album_tracks_for_output = []

        for track in tracks:
            track_name = track["name"].strip().lower()
            if track_name in seen_tracks_per_year[year]:
                continue
            seen_tracks_per_year[year].add(track_name)

            tracks_count_by_year[year] += 1
            album_tracks_for_output.append(track["name"])

            # Пошук у Genius
            genius_url = search_genius(track["name"], artist_name)
            if not genius_url:
                continue

            try:
                page = requests.get(genius_url)
                soup = BeautifulSoup(page.text, "html.parser")
                all_tags = [a.get_text(strip=True) for a in soup.select("a[href*='/tags/']")]
                filtered_tags = [tag for tag in all_tags if tag in allowed_genres]

                for tag in filtered_tags:
                    genre_by_year[str(year)][tag] += 1

            except Exception as e:
                print(f"❌ Error parsing Genius page for track '{track['name']}': {e}")
                continue

        detailed_output.append({
            "album_name": album_name,
            "release_date": release_date,
            "year": year,
            "tracks": album_tracks_for_output
        })

    # Виводимо в консоль для контролю
    print("\n=== Albums and tracks used in analysis ===")
    for item in detailed_output:
        print(f"{item['release_date']} — {item['album_name']} ({len(item['tracks'])} tracks):")
        for t in item['tracks']:
            print(f"   - {t}")
    print("=== End of list ===\n")

    result = {}
    all_years = set(tracks_count_by_year.keys()) | set(int(y) for y in genre_by_year.keys())

    for year in sorted(all_years):
        year_str = str(year)
        result[year_str] = {
            "totalTracks": tracks_count_by_year.get(year, 0),
            "genres": genre_by_year.get(year_str, {})
        }

    return jsonify(result)
############## Artist Analyze END ######################

SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search"

def get_spotify_token():
    return session.get("access_token")

def get_current_user_id():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return user_id

@app.route("/api/search")
def search():
    query = request.args.get("query")
    search_type = request.args.get("type", "track")  # за замовчуванням "track"

    if not query:
        return jsonify({f"{search_type}s": []})

    token = get_spotify_token()
    if not token:
        return jsonify({"error": "Not authenticated with Spotify"}), 401

    headers = {"Authorization": f"Bearer {token}"}
    params = {"q": query, "type": search_type, "limit": 15}

    resp = requests.get(SPOTIFY_SEARCH_URL, headers=headers, params=params)
    if resp.status_code != 200:
        return jsonify({"error": "Spotify API error"}), resp.status_code

    data = resp.json()

    if search_type == "track":
        items = [
            {
                "id": t["id"],
                "name": t["name"],
                "artist": ", ".join([a["name"] for a in t["artists"]]),
                "coverUrl": t["album"]["images"][0]["url"] if t["album"]["images"] else ""
            }
            for t in data.get("tracks", {}).get("items", [])
        ]
    elif search_type == "album":
        items = [
            {
                "id": a["id"],
                "name": a["name"],
                "artist": ", ".join([ar["name"] for ar in a["artists"]]),
                "coverUrl": a["images"][0]["url"] if a["images"] else ""
            }
            for a in data.get("albums", {}).get("items", [])
        ]
    else:
        items = []

    return jsonify({f"{search_type}s": items})

# --- Повертає тільки оцінки поточного користувача ---
@app.route("/api/ratings", methods=["GET"])
def get_ratings():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    ratings = Rating.query.filter_by(user_id=user_id).order_by(Rating.created_at.desc()).all()
    result = []
    for r in ratings:
        result.append({
            "id": r.id,
            "name": r.name,
            "type": r.type,
            "artist": r.artist,
            "scores": r.scores,
            "total_score": r.total_score,
            "coverUrl": r.cover_url,
            "spotify_id": r.spotify_id
        })
    return jsonify(result)

# --- Додає або оновлює оцінку для користувача ---
@app.route("/api/ratings", methods=["POST"])
def add_rating():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    spotify_id = data.get("spotify_id")
    if not spotify_id:
        return jsonify({"error": "Missing spotify_id"}), 400

    token = get_spotify_token()
    if not token:
        return jsonify({"error": "Not authenticated with Spotify"}), 401

    headers = {"Authorization": f"Bearer {token}"}
    item_type = data["type"]

    resp = requests.get(f"https://api.spotify.com/v1/{item_type}s/{spotify_id}", headers=headers)
    if resp.status_code != 200:
        return jsonify({"error": "Spotify API error"}), resp.status_code

    spotify_data = resp.json()
    if item_type == "track":
        cover_url = spotify_data["album"]["images"][0]["url"] if spotify_data.get("album") and spotify_data["album"].get("images") else ""
        artist = ", ".join([a["name"] for a in spotify_data["artists"]])
    else:
        cover_url = spotify_data["images"][0]["url"] if spotify_data.get("images") else ""
        artist = ", ".join([a["name"] for a in spotify_data.get("artists", [])])

    new_rating = Rating(
        user_id=user_id,
        name=data["name"],
        type=item_type,
        artist=artist,
        scores=data.get("scores", []),
        total_score=data.get("finalScore"),
        spotify_id=spotify_id,
        cover_url=cover_url
    )
    db.session.add(new_rating)
    db.session.commit()

    return jsonify({"status": "ok", "id": new_rating.id})

@app.route("/api/ratings/<int:rating_id>", methods=["PATCH"])
def update_rating(rating_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    rating = Rating.query.get_or_404(rating_id)
    if rating.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if "scores" in data:
        rating.scores = data["scores"]
    if "totalScore" in data:
        rating.total_score = data["totalScore"]
    db.session.commit()
    return jsonify({"status": "ok"})

@app.route("/api/<string:item_type>/<string:item_id>")
def get_item(item_type, item_id):
    token = get_spotify_token()
    if not token:
        return jsonify({"error": "Not authenticated with Spotify"}), 401

    headers = {"Authorization": f"Bearer {token}"}
    if item_type not in ["track", "album"]:
        return jsonify({"error": "Invalid type"}), 400

    url = f"https://api.spotify.com/v1/{item_type}s/{item_id}"
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        return jsonify({"error": "Spotify API error"}), resp.status_code

    data = resp.json()

    if item_type == "track":
        item = {
            "id": data["id"],
            "name": data["name"],
            "artist": ", ".join([a["name"] for a in data["artists"]]),
            "coverUrl": data["album"]["images"][0]["url"] if data["album"]["images"] else ""
        }
    else:  # album
        item = {
            "id": data["id"],
            "name": data["name"],
            "artist": ", ".join([a["name"] for a in data["artists"]]),
            "coverUrl": data["images"][0]["url"] if data["images"] else ""
        }

    return jsonify(item)

@app.route("/spotify/top-artists")
def top_artists():
    headers = get_spotify_headers()
    if not headers:
        return jsonify({"error": "Not authenticated with Spotify"}), 401

    time_range = request.args.get("time_range", "short_term")
    limit = int(request.args.get("limit", 20))

    res = requests.get(
        "https://api.spotify.com/v1/me/top/artists",
        headers=headers,
        params={"time_range": time_range, "limit": limit}
    )
    if res.status_code != 200:
        return jsonify({"error": "Failed to fetch top artists"}), res.status_code
    return jsonify(res.json())


@app.route("/spotify/top-tracks")
def top_tracks():
    headers = get_spotify_headers()
    if not headers:
        return jsonify({"error": "Not authenticated with Spotify"}), 401

    time_range = request.args.get("time_range", "short_term")
    limit = int(request.args.get("limit", 50))

    res = requests.get(
        "https://api.spotify.com/v1/me/top/tracks",
        headers=headers,
        params={"time_range": time_range, "limit": limit}
    )
    if res.status_code != 200:
        return jsonify({"error": "Failed to fetch top tracks"}), res.status_code
    return jsonify(res.json())

# Last.fm recomendations
recommendations_cache = {}

def fetch_lastfm_similar_tracks(track_name, artist_name, limit=5):
    try:
        artist = requests.utils.quote(artist_name)
        track = requests.utils.quote(track_name)
        url = f"https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist={artist}&track={track}&api_key={LASTFM_API_KEY}&format=json&limit={limit}"
        res = requests.get(url)
        data = res.json()
        return data.get("similartracks", {}).get("track", [])
    except:
        return []

def fetch_lastfm_similar_artists(artist_name, limit=5):
    try:
        artist = requests.utils.quote(artist_name)
        url = f"https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist={artist}&api_key={LASTFM_API_KEY}&format=json&limit={limit}"
        res = requests.get(url)
        data = res.json()
        return data.get("similarartists", {}).get("artist", [])
    except:
        return []

def fetch_spotify_item(query, type_, access_token):
    url = f"https://api.spotify.com/v1/search?q={requests.utils.quote(query)}&type={type_}&limit=1"
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        return None
    data = r.json()
    if type_ == "track":
        return data.get("tracks", {}).get("items", [None])[0]
    elif type_ == "artist":
        return data.get("artists", {}).get("items", [None])[0]
    return None

@app.route("/spotify/recommendations", methods=["POST"])
def get_recommendations():
    """
    Очікує JSON:
    {
        "user_id": "...",
        "topTracks": [...],
        "topArtists": [...],
        "spotifyAccessToken": "..."
    }
    """
    body = request.json
    user_id = body.get("user_id")
    topTracks = (body.get("topTracks", []) or [])[:25]
    topArtists = (body.get("topArtists", []) or [])[:10]
    access_token = body.get("spotifyAccessToken")

    if not all([user_id, access_token]):
        return jsonify({"error": "user_id та spotifyAccessToken обов'язкові"}), 400

    top_track_ids = set(t["id"] for t in topTracks if t.get("id"))
    top_artist_ids = set(a["id"] for a in topArtists if a.get("id"))

    similar_tracks = []
    for t in topTracks:
        similar_tracks += fetch_lastfm_similar_tracks(t["name"], t["artists"][0]["name"], limit=5)

    similar_artists = []
    for a in topArtists:
        similar_artists += fetch_lastfm_similar_artists(a["name"], limit=3)

    spotify_tracks = []
    seen_track_ids = set()
    for t in similar_tracks:
        track_item = fetch_spotify_item(f"{t['name']} {t['artist']['name']}", "track", access_token)
        if track_item and track_item["id"] not in seen_track_ids and track_item["id"] not in top_track_ids:
            spotify_tracks.append(track_item)
            seen_track_ids.add(track_item["id"])

    spotify_artists = []
    seen_artist_ids = set()
    for a in similar_artists:
        artist_item = fetch_spotify_item(a["name"], "artist", access_token)
        if artist_item and artist_item["id"] not in seen_artist_ids and artist_item["id"] not in top_artist_ids:
            spotify_artists.append(artist_item)
            seen_artist_ids.add(artist_item["id"])

    last_updated = datetime.now(timezone.utc).isoformat()
    result = {
        "tracks": spotify_tracks,
        "artists": spotify_artists,
        "last_updated": last_updated
    }

    recommendations_cache[user_id] = result

    return jsonify(result)

# для локальної розробки
if __name__ == "__main__":
    # with app.app_context():
    #     db.create_all()  # Create Tables if not already present
    # app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8888)), debug=False)
    pass