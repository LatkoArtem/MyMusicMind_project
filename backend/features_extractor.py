import os
import requests
import time
import librosa
import numpy as np
from pydub import AudioSegment

def split_audio_to_chunks(file_path, chunk_length_ms=30000):
    audio = AudioSegment.from_file(file_path)
    duration = len(audio)

    if duration <= chunk_length_ms:
        chunk_path = f"{file_path}_chunk_0.mp3"
        audio.export(chunk_path, format="mp3")
        return [chunk_path]

    center = duration // 2
    offsets = [-chunk_length_ms, 0, chunk_length_ms]

    chunks = []
    for i, offset in enumerate(offsets):
        start = max(center + offset - chunk_length_ms // 2, 0)
        end = min(start + chunk_length_ms, duration)
        chunk = audio[start:end]

        chunk_path = f"{file_path}_chunk_{i}.mp3"
        chunk.export(chunk_path, format="mp3")
        chunks.append(chunk_path)

    return chunks


def extract_low_level_features(file_path):
    y, sr = librosa.load(file_path, sr=22050, mono=True, duration=30)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfccs_mean = np.mean(mfccs, axis=1)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    contrast_mean = np.mean(contrast, axis=1)

    low_level_feats = np.concatenate([mfccs_mean, chroma_mean, contrast_mean])
    return low_level_feats


def extract_audio_features(file_path, max_retries=3, retry_delay=5):
    url = "https://api.reccobeats.com/v1/analysis/audio-features"
    retries = 0
    while retries < max_retries:
        try:
            with open(file_path, 'rb') as f:
                files = {'audioFile': f}
                response = requests.post(url, files=files)

            if response.status_code == 200:
                data = response.json()
                print(f"📈 [INFO] Reccobeats returned features: {data}")

                high_level_feats = np.array([
                    data["acousticness"],
                    data["danceability"],
                    data["energy"],
                    data["instrumentalness"],
                    data["liveness"],
                    data["loudness"],
                    data["speechiness"],
                    data["tempo"],
                    data["valence"]
                ])

                low_level_feats = extract_low_level_features(file_path)
                combined_feats = np.concatenate([high_level_feats, low_level_feats])
                return combined_feats

            elif response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", retry_delay))
                print(f"⚠️ Rate limited by API. Retrying after {retry_after} seconds...")
                time.sleep(retry_after)
                retries += 1
            else:
                print(f"❌ [ERROR] API error {response.status_code}: {response.text}")
                return None

        except Exception as e:
            print(f"❌ [ERROR] Exception during feature extraction: {e}")
            time.sleep(retry_delay)
            retries += 1

    print("❌ [ERROR] Max retries exceeded.")
    return None


def extract_features_from_full_track(file_path, delay_sec=1.0):
    chunk_paths = split_audio_to_chunks(file_path)
    features_list = []

    for chunk_path in chunk_paths:
        feats = extract_audio_features(chunk_path)
        if feats is not None:
            features_list.append(feats.tolist())
        else:
            print(f"⚠️ Failed to extract features from chunk {chunk_path}")

        try:
            os.remove(chunk_path)
            print(f"🗑️ Removed temporary chunk: {chunk_path}")
        except Exception as e:
            print(f"❌ [ERROR] Cannot remove chunk {chunk_path}: {e}")

        time.sleep(delay_sec)

    if not features_list:
        return None

    mean_features = np.mean(features_list, axis=0)
    return np.round(mean_features, 4)
