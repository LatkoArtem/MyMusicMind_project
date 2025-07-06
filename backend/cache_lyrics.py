import time

lyrics_cache = {}  # кеш за lyrics_hash
lyrics_by_track_id = {}  # кеш за track_id

# Час життя для кешу - 6 годин
CACHE_TTL_SECONDS = 60 * 60 * 6

def get_cached_lyrics(lyrics_hash):
    data = lyrics_cache.get(lyrics_hash)
    if not data:
        return None
    lyrics, timestamp = data
    if time.time() - timestamp > CACHE_TTL_SECONDS:
        del lyrics_cache[lyrics_hash]
        return None
    return lyrics

def set_cached_lyrics(lyrics_hash, lyrics):
    lyrics_cache[lyrics_hash] = (lyrics, time.time())

def get_cached_lyrics_by_track_id(track_id):
    data = lyrics_by_track_id.get(track_id)
    if not data:
        return None
    lyrics, timestamp = data
    if time.time() - timestamp > CACHE_TTL_SECONDS:
        del lyrics_by_track_id[track_id]
        return None
    return lyrics

def set_cached_lyrics_by_track_id(track_id, lyrics):
    lyrics_by_track_id[track_id] = (lyrics, time.time())