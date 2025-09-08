import os
import re
import time
import yt_dlp
import requests

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def sanitize_filename(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', '_', name)

def search_youtube(track_name: str, artist_name: str) -> str | None:
    query = f"{track_name} {artist_name} audio"
    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": query,
        "key": YOUTUBE_API_KEY,
        "maxResults": 1,
        "type": "video",
        "videoCategoryId": "10",  # category "Music"
    }

    try:
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

        if "items" in data and len(data["items"]) > 0:
            return data["items"][0]["id"]["videoId"]
        else:
            print(f"❌ Нічого не знайдено для {query}")
            return None
    except Exception as e:
        print(f"❌ Помилка запиту YouTube API: {e}")
        return None

def download_audio(track_name: str, artist_name: str, out_dir: str = "audio_temp") -> str | None:
    os.makedirs(out_dir, exist_ok=True)

    safe_track = sanitize_filename(track_name)
    safe_artist = sanitize_filename(artist_name)

    out_path = os.path.join(out_dir, f"{safe_track}_{safe_artist}")
    out_file = out_path + ".mp3"

    ffmpeg_path = os.path.abspath("./ffmpeg/bin")

    video_id = search_youtube(track_name, artist_name)
    if not video_id:
        return None
    video_url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        "format": "bestaudio/best",
        "quiet": True,
        "noplaylist": True,
        "outtmpl": out_path,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "ffmpeg_location": ffmpeg_path,
        "retries": 10,
        "sleep_interval": 1,
        "noprogress": True,
        "nooverwrites": True,
        "concurrent_fragment_downloads": 1,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
        time.sleep(0.5)

        if os.path.exists(out_file):
            return out_file
        else:
            print(f"❌ Файл не знайдено після завантаження: {out_file}")
            return None

    except Exception as e:
        print(f"❌ Завантаження впало для {track_name} - {artist_name}: {e}")
        return None
