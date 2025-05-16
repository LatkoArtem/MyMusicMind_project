import os
import json
import psycopg2
from glob import glob
from datetime import datetime
from config import DB_CONFIG, DATA_DIR
import traceback

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

json_folder = DATA_DIR
json_files = glob(os.path.join(json_folder, "*.json"))

for file_path in json_files:
    with open(file_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)

            # Якщо у файлі масив плейлистів
            playlists = data.get("playlists")
            if playlists is None:
                # The file may contain one playlist in the form {"playlist": {...}, "tracks": [...]}
                playlists = [data.get("playlist")]
                # Also need to find tracks for this playlist
                tracks_all = data.get("tracks", [])
            else:
                tracks_all = None

            for playlist in playlists:
                if not playlist:
                    continue

                mod_at = playlist.get("modified_at")
                if mod_at:
                    try:
                        modified_at = datetime.fromtimestamp(int(mod_at))
                    except Exception:
                        modified_at = None
                else:
                    modified_at = None

                cur.execute("""
                    INSERT INTO playlists (pid, name, description, modified_at, num_artists, num_albums, num_tracks, num_followers)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (pid) DO NOTHING;
                """, (
                    playlist.get("pid"),
                    playlist.get("name"),
                    playlist.get("description"),
                    modified_at,
                    playlist.get("num_artists"),
                    playlist.get("num_albums"),
                    playlist.get("num_tracks"),
                    playlist.get("num_followers"),
                ))

                # Extract tracks — if tracks_all is not None, then tracks in a separate key
                if tracks_all is not None:
                    tracks = tracks_all
                else:
                    tracks = playlist.get("tracks", [])

                for track in tracks:
                    cur.execute("""
                        INSERT INTO tracks (pid, pos, track_name, track_uri, artist_name, artist_uri, album_name, album_uri, duration_ms)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (pid, pos) DO NOTHING;
                    """, (
                        playlist.get("pid"),
                        track.get("pos"),
                        track.get("track_name"),
                        track.get("track_uri"),
                        track.get("artist_name"),
                        track.get("artist_uri"),
                        track.get("album_name"),
                        track.get("album_uri"),
                        track.get("duration_ms"),
                    ))

            print(f"✅ Imported: {os.path.basename(file_path)}")

        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            traceback.print_exc()

conn.commit()
cur.close()
conn.close()
print("🎉 Import complete.")
