import math
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

def preprocess_features(features_list, n_features=9):
    """
    Вибирає n_features перших фіч з features_list і масштабує їх.
    """
    selected_features = features_list[:, :n_features]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(selected_features)
    return X_scaled

def cluster_features(X_scaled, n_clusters, random_state=42):
    """
    Виконує кластеризацію KMeans на масштабованих фічах.
    """
    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init="auto")
    clusters = kmeans.fit_predict(X_scaled)
    return clusters

def classify_track_multi(f):
    """
    Класифікація одного вектора фіч з мульти-тегами.
    """
    acousticness, danceability, energy, instrumentalness, liveness, loudness, speechiness, tempo, valence = f
    tags = []

    # 🎤 Вокал і мова
    if speechiness > 0.7:
        tags.append("Spoken Word / Podcast / Rap")
    elif 0.4 < speechiness <= 0.7:
        tags.append("Rap / Vocal Heavy")
    elif speechiness < 0.2 and instrumentalness > 0.5:
        tags.append("Instrumental / Minimal Vocals")

    # 🎸 Інструментальність та акустичність
    if instrumentalness > 0.85:
        tags.append("Fully Instrumental")
    elif instrumentalness > 0.5:
        tags.append("Mostly Instrumental")

    if acousticness > 0.8:
        tags.append("Acoustic / Unplugged")
    elif 0.4 < acousticness <= 0.8:
        tags.append("Semi-Acoustic")

    # 🎧 Енергія та гучність
    if energy > 0.85:
        tags.append("High Energy / Intense")
    elif 0.6 < energy <= 0.85:
        tags.append("Energetic / Uplifting")
    elif 0.3 < energy <= 0.6:
        tags.append("Moderate Energy")
    else:
        tags.append("Low Energy / Mellow")

    if loudness > -5:
        tags.append("Very Loud / Club-Level")
    elif -10 < loudness <= -5:
        tags.append("Loud / Driving")
    elif loudness <= -20:
        tags.append("Very Quiet / Ambient")

    # 💃 Танцювальність
    if danceability > 0.85:
        tags.append("Dancefloor Ready / Club")
    elif 0.6 < danceability <= 0.85:
        tags.append("Groovy / Danceable")
    elif danceability < 0.4:
        tags.append("Not Danceable")

    # 🕺 Ритм та темп
    if tempo > 160:
        tags.append("Fast-Paced / Intense Tempo")
    elif 120 < tempo <= 160:
        tags.append("Upbeat / Workout Suitable")
    elif 90 < tempo <= 120:
        tags.append("Medium Tempo")
    elif tempo <= 90:
        tags.append("Slow / Relaxed Tempo")

    # 🎤 Живі виступи
    if liveness > 0.85:
        tags.append("Live Performance")
    elif 0.5 < liveness <= 0.85:
        tags.append("Likely Live Recording")

    # 😊 Настрій (valence)
    if valence > 0.8:
        tags.append("Very Happy / Joyful")
    elif 0.5 < valence <= 0.8:
        tags.append("Positive / Pleasant")
    elif 0.3 < valence <= 0.5:
        tags.append("Neutral / Mixed Mood")
    elif valence <= 0.3:
        if energy > 0.6:
            tags.append("Dark / Haunting / Edgy")
        elif acousticness > 0.5:
            tags.append("Melancholic / Soft Sadness")
        else:
            tags.append("Sad / Melancholic")

    if valence < 0.4 and energy > 0.6 and danceability > 0.4 and instrumentalness < 0.5:
        tags.append("Psychedelic / Experimental")

    # 🧘 Атмосферні / релакс
    if energy < 0.3 and acousticness > 0.5 and valence < 0.4:
        tags.append("Ambient / Chill / Calm")
    if energy < 0.2 and loudness < -20 and acousticness > 0.6:
        tags.append("Meditative / Background Music")

    # 🏋️ Для спорту
    if tempo > 140 and energy > 0.6 and danceability > 0.6:
        tags.append("Workout / Cardio / Running")

    # 🤔 Якщо жоден тег не підійшов
    if not tags:
        tags.append("Mixed / Balanced")

    return tags

def classify_tracks(features_scaled):
    """
    Класифікує список фіч, повертає список списків тегів.
    """
    return [classify_track_multi(f) for f in features_scaled]

def choose_num_clusters(X):
    """
    Автоматичний вибір k для кластеризації на основі silhouette score та евристики sqrt(n).
    X — numpy-масив фіч (n_samples, n_features)
    """
    num_tracks = X.shape[0]

    if num_tracks <= 2:
        return 1

    # Евристика
    k_heuristic = round(math.sqrt(num_tracks))
    k_range = range(max(2, k_heuristic - 2), min(50, k_heuristic + 2) + 1)

    best_k = None
    best_score = -1
    scores = {}

    for k in k_range:
        try:
            kmeans = KMeans(n_clusters=k, n_init='auto', random_state=42).fit(X)
            score = silhouette_score(X, kmeans.labels_)
            scores[k] = score
            if score > best_score:
                best_score = score
                best_k = k
        except Exception as e:
            print(f"⚠️ k={k} error: {e}")
            continue

    print(f"📊 Silhouette scores: {scores}")
    print(f"✅ Best k = {best_k} with score = {best_score:.3f}")
    return best_k


def analyze_tracks(features_list):
    """
    Повний аналіз: масштабування, кластеризація, класифікація.
    Повертає список словників з результатами для кожного треку.
    """
    X_scaled = preprocess_features(features_list)
    n_clusters = choose_num_clusters(X_scaled)
    clusters = cluster_features(X_scaled, n_clusters)
    tags_list = classify_tracks(features_list[:, :9])

    results = []
    for i in range(len(features_list)):
        track_info = {
            "track_index": i,
            "cluster": int(clusters[i]),
            "tags": tags_list[i],
        }
        results.append(track_info)

    return results

