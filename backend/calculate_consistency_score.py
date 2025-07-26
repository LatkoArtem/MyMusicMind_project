import numpy as np
from itertools import combinations

# Заздалегідь задані межі фічей (мінімальні та максимальні)
min_vector = np.array([0]*5 + [-60, 0, 40, 0, -600, -300, -200, -150] + [-120]*9 + [0]*12 + [10]*7)
max_vector = np.array([1]*5 + [0, 1, 250, 1, 200, 300, 200, 150] + [120]*9 + [1]*12 + [60]*7)

def calculate_consistency_score(vectors):
    vectors = np.array(vectors)

    if len(vectors) < 2:
        return 1.0

    # Мін-макс нормалізація в межах [0,1]
    diff = max_vector - min_vector
    diff[diff == 0] = 1
    vectors_norm = (vectors - min_vector) / diff

    max_euclid_dist = np.linalg.norm(np.ones_like(min_vector) - np.zeros_like(min_vector))

    # Обчислення схожості між усіма парами
    similarities = []
    for a, b in combinations(vectors_norm, 2):
        dist = np.linalg.norm(a - b)
        sim = 1 - (dist / max_euclid_dist)
        similarities.append(sim)

    consistency_score = round(float(np.mean(similarities)), 4)

    return consistency_score


def calculate_mean_feature_vector(features_all):
    """
    Повертає центроїд (mean vector) у вихідній шкалі (без нормалізації).
    Просто середнє по оригінальних векторах.
    """
    features_all = np.array(features_all)
    centroid = features_all.mean(axis=0)
    return np.round(centroid, 5).tolist()