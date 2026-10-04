from flask import Flask, render_template, request, jsonify
import re
import json
import os
from datetime import datetime

app = Flask(__name__)

DATA_FILE = "data/meetings.json"

STOPWORDS = {
    "the","a","an","is","are","was","were","to","of","and","in","on","for",
    "with","this","that","it","i","we","you","he","she","they","our","my",
    "your","be","been","have","has","had","will","would","should","can",
    "could","from","at","as","or","but","about","into","by","meeting"
}

ACTION_PATTERNS = [
    r"\bneed to\s+([^.!?]+)",
    r"\bshould\s+([^.!?]+)",
    r"\bwill\s+([^.!?]+)",
    r"\bmust\s+([^.!?]+)",
    r"\bdeadline\s+(?:is|for)?\s*([^.!?]+)",
    r"\bcomplete\s+([^.!?]+)"
]

def load_meetings():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_meetings(meetings):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meetings, f, indent=2, ensure_ascii=False)

def split_sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]

def extract_keywords(text, limit=10):
    words = re.findall(r"[A-Za-z][A-Za-z'-]*", text.lower())
    freq = {}
    for word in words:
        if len(word) > 2 and word not in STOPWORDS:
            freq[word] = freq.get(word, 0) + 1
    return [word for word, _ in sorted(freq.items(), key=lambda x: (-x[1], x[0]))[:limit]]

def summarize(text, max_sentences=4):
    sentences = split_sentences(text)
    if len(sentences) <= max_sentences:
        return sentences

    keywords = set(extract_keywords(text, 15))
    scored = []

    for index, sentence in enumerate(sentences):
        words = set(re.findall(r"[A-Za-z]+", sentence.lower()))
        score = len(words & keywords)
        scored.append((score, -index, sentence))

    selected = sorted(scored, reverse=True)[:max_sentences]
    selected_indices = {sentences.index(item[2]) for item in selected}

    return [sentences[i] for i in sorted(selected_indices)]

def extract_action_items(text):
    actions = []
    for pattern in ACTION_PATTERNS:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            action = match.group(1).strip(" ,")
            if action:
                action = action[0].upper() + action[1:]
                if action not in actions:
                    actions.append(action)
    return actions[:10]

def analyze_text(text):
    sentences = split_sentences(text)
    words = re.findall(r"[A-Za-z][A-Za-z'-]*", text)

    return {
        "word_count": len(words),
        "sentence_count": len(sentences),
        "keywords": extract_keywords(text),
        "summary": summarize(text),
        "action_items": extract_action_items(text)
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    text = data.get("transcript", "").strip()

    if not text:
        return jsonify({"error": "Please enter or record a meeting transcript."}), 400

    result = analyze_text(text)
    result["transcript"] = text
    return jsonify(result)

@app.route("/save", methods=["POST"])
def save():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "Untitled Meeting").strip()
    transcript = data.get("transcript", "").strip()

    if not transcript:
        return jsonify({"error": "Transcript is empty."}), 400

    analysis = analyze_text(transcript)

    meeting = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S%f"),
        "title": title or "Untitled Meeting",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "transcript": transcript,
        **analysis
    }

    meetings = load_meetings()
    meetings.insert(0, meeting)
    save_meetings(meetings[:50])

    return jsonify({"message": "Meeting saved successfully.", "meeting": meeting})

@app.route("/meetings")
def meetings():
    return jsonify(load_meetings())

if __name__ == "__main__":
    app.run(debug=True)
