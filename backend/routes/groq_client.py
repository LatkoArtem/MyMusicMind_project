import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_song_themes_from_groq(lyrics):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "user",
                "content": f"Based on the following song lyrics, return exactly 3 short thematic words, each one word, separated by commas only, no numbering, no extra text, no markdown formatting:\n\n{lyrics}"
            }
        ],
        "temperature": 0,
        "max_tokens": 50
    }

    print("📡 Sending request to Groq API...")
    response = requests.post(url, headers=headers, json=payload)

    try:
        result = response.json()
        print("✅ Groq response:", result)
    except Exception as e:
        print("❌ Failed to parse Groq response:", e)
        print("❌ Raw response:", response.text)
        return "groq-json-error"

    if "error" in result:
        print("❌ Groq returned error:", result["error"])
        return result["error"].get("message", "groq-api-error")

    return result["choices"][0]["message"]["content"]