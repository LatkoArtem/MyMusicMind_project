import os
import re
import requests
import json
from bs4 import BeautifulSoup
from flask import Flask, request, redirect, session, jsonify
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv

PROFILE_PATH = "./flask_session_files/profile_data.json"

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

app = Flask(__name__)
app.secret_key = os.urandom(24)

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
        # The user clicked "Cancel" or another error occurred
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
        all_playlists["items"].extend(data.get("items", []))
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

    if not song or not artist:
        return jsonify({"error": "Missing song or artist"}), 400

    genius_url = search_genius(song, artist)
    if not genius_url:
        return jsonify({"error": "Song not found on Genius"}), 404

    lyrics = scrape_lyrics_from_url(genius_url)
    if not lyrics:
        return jsonify({"error": "Lyrics not found or could not be parsed"}), 500

    return jsonify({
        "song": song,
        "artist": artist,
        "lyrics": lyrics,
        "source_url": genius_url
    })
############## GENIUS LYRICS PARSING END ##############

if __name__ == "__main__":
    app.run(port=8888, debug=True)