from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime, timezone

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True)
    language = db.Column(db.String(4), default="en")
    view_mode = db.Column(db.String, default="grid") 

class UserLyricsTopic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    lyrics_hash = db.Column(db.String(64))
    topic1 = db.Column(db.String(64))
    topic2 = db.Column(db.String(64))
    topic3 = db.Column(db.String(64))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AnalyzedAlbum(db.Model):
    album_id = db.Column(db.String(128), primary_key=True)
    features = db.Column(db.Text)  # збережені фічі про трек у вигляді JSON для альбомів
    consistency_score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AlbumTrackFeature(db.Model):
    __table_args__ = (
        db.PrimaryKeyConstraint('album_id', 'track_id'),
    )
    album_id = db.Column(db.String(128), nullable=False)
    track_id = db.Column(db.String(128), nullable=False)
    track_name = db.Column(db.String(256), nullable=True)
    features = db.Column(db.Text)  # JSON у текстовому вигляді
    cluster = db.Column(db.Integer, nullable=True)
    tags = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AnalyzedPlaylist(db.Model):
    playlist_id = db.Column(db.String(128), primary_key=True)
    features = db.Column(db.Text)  # збережені фічі про трек у вигляді JSON для плейлистів
    consistency_score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class PlaylistTrackFeature(db.Model):
    __table_args__ = (
        db.PrimaryKeyConstraint('playlist_id', 'track_id'),
    )
    playlist_id = db.Column(db.String(128), nullable=False)
    track_id = db.Column(db.String(128), nullable=False)
    track_name = db.Column(db.String(256), nullable=True)
    features = db.Column(db.Text)  # JSON у текстовому вигляді
    cluster = db.Column(db.Integer, nullable=True)
    tags = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Rating(db.Model):
    __tablename__ = "ratings"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    spotify_id = db.Column(db.String(64), nullable=False, unique=True)
    name = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(16), nullable=False)
    artist = db.Column(db.Text, nullable=False)
    total_score = db.Column(db.SmallInteger, nullable=False)
    scores = db.Column(ARRAY(db.SmallInteger), nullable=False, default=[])
    cover_url = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
