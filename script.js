const transcript = document.getElementById("transcript");
const title = document.getElementById("meetingTitle");
const status = document.getElementById("status");

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        status.textContent = "🎙 Listening... Speak clearly.";
        startBtn.disabled = true;
        stopBtn.disabled = false;
    };

    recognition.onresult = (event) => {
        let finalText = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalText += text + " ";
            } else {
                interim += text;
            }
        }

        if (finalText) {
            transcript.value += finalText;
        }

        status.textContent = interim
            ? "Listening: " + interim
            : "🎙 Keep speaking...";
    };

    recognition.onerror = (event) => {
        status.textContent = "Speech error: " + event.error;
    };

    recognition.onend = () => {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        status.textContent = "Recording stopped.";
    };
} else {
    status.textContent =
        "Speech recognition is not supported. Use Chrome or Edge.";
}

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

startBtn.onclick = () => {
    if (recognition) recognition.start();
};

stopBtn.onclick = () => {
    if (recognition) recognition.stop();
};

document.getElementById("analyzeBtn").onclick = async () => {
    if (!transcript.value.trim()) {
        alert("Please enter or record a transcript.");
        return;
    }

    status.textContent = "Analyzing transcript...";

    const response = await fetch("/analyze", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({transcript: transcript.value})
    });

    const data = await response.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    showResults(data);
    status.textContent = "Analysis completed.";
};

function showResults(data) {
    document.getElementById("results").classList.remove("hidden");

    document.getElementById("wordCount").textContent = data.word_count;
    document.getElementById("sentenceCount").textContent = data.sentence_count;
    document.getElementById("keywordCount").textContent = data.keywords.length;
    document.getElementById("actionCount").textContent = data.action_items.length;

    document.getElementById("summary").innerHTML =
        data.summary.map(s => "<p>• " + escapeHTML(s) + "</p>").join("");

    const keywords = document.getElementById("keywords");
    keywords.innerHTML = "";

    data.keywords.forEach(k => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = k;
        keywords.appendChild(span);
    });

    const actions = document.getElementById("actions");
    actions.innerHTML = "";

    if (data.action_items.length === 0) {
        actions.innerHTML = "<li>No action items detected.</li>";
    } else {
        data.action_items.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            actions.appendChild(li);
        });
    }
}

document.getElementById("saveBtn").onclick = async () => {
    if (!transcript.value.trim()) {
        alert("Please enter or record a transcript first.");
        return;
    }

    const response = await fetch("/save", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            title: title.value || "Untitled Meeting",
            transcript: transcript.value
        })
    });

    const data = await response.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    status.textContent = "Meeting saved successfully.";
    loadMeetings();
};

document.getElementById("clearBtn").onclick = () => {
    transcript.value = "";
    title.value = "";
    document.getElementById("results").classList.add("hidden");
    status.textContent = "Ready.";
};

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

async function loadMeetings() {
    const response = await fetch("/meetings");
    const meetings = await response.json();
    const container = document.getElementById("savedMeetings");

    if (!meetings.length) {
        container.innerHTML = "<p>No saved meetings yet.</p>";
        return;
    }

    container.innerHTML = meetings.map(m => `
        <div class="meeting">
            <h3>${escapeHTML(m.title)}</h3>
            <small>${escapeHTML(m.date)}</small>
            <p><b>Summary:</b> ${escapeHTML((m.summary || []).join(" "))}</p>
            <p><b>Keywords:</b> ${escapeHTML((m.keywords || []).join(", "))}</p>
        </div>
    `).join("");
}

loadMeetings();
