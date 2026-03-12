const API_BASE = 'http://localhost:8000';

export const api = {
  // Get suggested topics
  async getTopics() {
    const res = await fetch(`${API_BASE}/api/debate/topics`);
    if (!res.ok) throw new Error('Failed to fetch topics');
    return res.json();
  },

  // Start a new debate
  async startDebate(topic, userStance, maxRounds = 5) {
    const res = await fetch(`${API_BASE}/api/debate/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        user_stance: userStance,
        max_rounds: maxRounds
      })
    });
    if (!res.ok) throw new Error('Failed to start debate');
    return res.json();
  },

  // Send a message in the debate
  async sendMessage(sessionId, content) {
    const res = await fetch(`${API_BASE}/api/debate/message/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  // End the debate and get scores
  async endDebate(sessionId) {
    const res = await fetch(`${API_BASE}/api/debate/end/${sessionId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to end debate');
    return res.json();
  },

  // Transcribe audio
  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json();
  }
};
