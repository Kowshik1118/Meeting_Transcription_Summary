# Meeting Transcription & Summary System

A beginner-friendly college project using Python, Flask, JavaScript and the browser Web Speech API.

## Features

- Speech-to-text meeting transcription
- Manual transcript editing
- Word and sentence count
- Keyword extraction
- Automatic extractive summary
- Action-item detection
- Save meetings to JSON
- Saved meeting history
- Responsive web interface

## Requirements

- Python 3
- Google Chrome or Microsoft Edge for speech recognition

## Run

Open this folder in VS Code.

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open:

http://127.0.0.1:5000

## How it works

1. Enter a meeting title.
2. Click Start Recording.
3. Speak in English.
4. Speech is converted to text by the browser.
5. Click Analyze.
6. The Flask backend extracts keywords, summary sentences and action items.
7. Click Save Meeting to store the result in data/meetings.json.

## Important note

The summarizer is a simple extractive NLP implementation intended for a student project. It does not use a large language model.
