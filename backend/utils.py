import hashlib
from datetime import datetime, timezone, timedelta
from models import UserLyricsTopic

def hash_lyrics(lyrics: str) -> str:
    return hashlib.md5(lyrics.strip().lower().encode()).hexdigest()

def is_request_allowed(user_id: int, daily_limit: int = 10) -> bool:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=24)  # 24 години назад від зараз

    count = UserLyricsTopic.query.filter(
        UserLyricsTopic.user_id == user_id,
        UserLyricsTopic.created_at >= window_start
    ).count()

    return count < daily_limit