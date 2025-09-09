import os
import re
import time
import yt_dlp

def sanitize_filename(name):
    return re.sub(r'[<>:"/\\|?*]', '_', name)

def download_audio(track_name, artist_name, out_dir="audio_temp"):
    os.makedirs(out_dir, exist_ok=True)

    safe_track = sanitize_filename(track_name)
    safe_artist = sanitize_filename(artist_name)

    search_query = f"{track_name} {artist_name} audio"
    out_path = os.path.join(out_dir, f"{safe_track}_{safe_artist}")
    out_file = out_path + ".mp3"

    ffmpeg_path = os.path.abspath("./ffmpeg/bin")

    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'noplaylist': True,
        'outtmpl': out_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',
        }],
        'ffmpeg_location': ffmpeg_path,
        'retries': 10,
        'sleep_interval': 1,
        'noprogress': True,
        'nooverwrites': True,
        'concurrent_fragment_downloads': 1,
        # 'cookiefile': 'youtube_cookies.txt',   <--- для локальної розробки
        'cookiefile': '/etc/secrets/youtube_cookies.txt' # <--- це я змінив на це перед деплоєм
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"ytsearch1:{search_query}"])
        time.sleep(0.5)  # дати ОС завершити обробку файлу

        if os.path.exists(out_file):
            return out_file
        else:
            print(f"❌ File not found after download: {out_file}")
            return None

    except Exception as e:
        print(f"❌ Download failed for {search_query}: {e}")
        return None