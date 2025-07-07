import os
import re
import requests
import json
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
from flask import Flask, request, redirect, session, jsonify
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv
from routes.groq_client import get_song_themes_from_groq
from models import db, User, UserLyricsTopic
from utils import hash_lyrics, is_request_allowed
from cache_lyrics import get_cached_lyrics, set_cached_lyrics, get_cached_lyrics_by_track_id, set_cached_lyrics_by_track_id


PROFILE_PATH = "./flask_session_files/profile_data.json"

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

DB_HOST=os.getenv("DB_HOST")
DB_NAME=os.getenv("DB_NAME")
DB_USER=os.getenv("DB_USER")
DB_PASS=os.getenv("DB_PASS")

app = Flask(__name__)
app.secret_key = os.urandom(24)

app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Session config
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './flask_session_files'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
Session(app)

# CORS config
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:3000"])

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_URL = "https://api.spotify.com/v1/me"
SCOPE = "user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative user-follow-read user-library-modify user-read-playback-state user-read-currently-playing streaming app-remote-control user-read-playback-position"

@app.route("/profile/update", methods=["POST"])
def update_profile():
    data = request.json
    with open(PROFILE_PATH, "w") as f:
        json.dump(data, f)
    return jsonify({"message": "Profile updated successfully"})

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
        return redirect("http://127.0.0.1:3000?error=unexpected_callback")

    session.pop("expecting_callback", None)

    error = request.args.get("error")
    if error:
        return redirect("http://127.0.0.1:3000?error=access_denied")

    code = request.args.get("code")
    if not code:
        return redirect("http://127.0.0.1:3000?error=no_code")

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
        return redirect("http://127.0.0.1:3000?error=token_failed")

    tokens = response.json()
    session["access_token"] = tokens["access_token"]
    print("✅ Token:", tokens["access_token"])

    # отримання email та збереження user_id у сесію
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
                user = User(email=email)
                db.session.add(user)
                db.session.commit()
            session["user_id"] = user.id

    return redirect("http://127.0.0.1:3000")

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

    profile_data = response.json()

    if os.path.exists(PROFILE_PATH):
        with open(PROFILE_PATH) as f:
            local_changes = json.load(f)
            profile_data.update(local_changes)

    return jsonify(profile_data)

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("access_token", None)
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
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    viewmode = data.get("viewMode")
    if viewmode not in ["grid", "list"]:
        return jsonify({"error": "Invalid view mode"}), 400

    if os.path.exists(PROFILE_PATH):
        with open(PROFILE_PATH) as f:
            profile_data = json.load(f)
    else:
        profile_data = {}

    profile_data["viewMode"] = viewmode

    with open(PROFILE_PATH, "w") as f:
        json.dump(profile_data, f)

    return jsonify({"message": "View mode updated"})

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
HEADERS = {"Authorization": f"Bearer {GENIUS_API_TOKEN}"}

# Search for songs on Genius
def search_genius(song_title, artist_name):
    base_url = "https://api.genius.com/search"
    query = f"{song_title} {artist_name}"
    response = requests.get(base_url, params={"q": query}, headers=HEADERS)

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

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Create Tables if not already present
    app.run(port=8888, debug=True)