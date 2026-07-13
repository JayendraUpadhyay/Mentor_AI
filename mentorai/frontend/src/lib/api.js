const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function signup({ name, email, password }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function generateRoadmap({ goal, level, duration_weeks, user_id }) {
  const res = await fetch(`${API_BASE_URL}/api/roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, level, duration_weeks, user_id }),
  });
  return handleResponse(res);
}

export async function getRoadmapHistory(userId) {
  const res = await fetch(`${API_BASE_URL}/api/roadmap/history/${userId}`);
  return handleResponse(res);
}

export async function getRoadmapDetail(roadmapId) {
  const res = await fetch(`${API_BASE_URL}/api/roadmap/detail/${roadmapId}`);
  return handleResponse(res);
}

export async function deleteRoadmap(roadmapId) {
  const res = await fetch(`${API_BASE_URL}/api/roadmap/${roadmapId}`, { method: "DELETE" });
  return handleResponse(res);
}

export async function askDoubt({ message, history }) {
  const res = await fetch(`${API_BASE_URL}/api/doubt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  return handleResponse(res);
}

export async function notesToQuiz(file, numQuestions = 6) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("num_questions", String(numQuestions));
  const res = await fetch(`${API_BASE_URL}/api/notes-quiz`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export async function getProgress(userId) {
  const res = await fetch(`${API_BASE_URL}/api/progress/${userId}`);
  return handleResponse(res);
}

export async function updateProgress(userId, topicId, completed = true) {
  const res = await fetch(`${API_BASE_URL}/api/progress/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic_id: topicId, completed }),
  });
  return handleResponse(res);
}

export async function recordQuizResult(userId, total, correct) {
  const res = await fetch(`${API_BASE_URL}/api/quiz-result/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ total, correct }),
  });
  return handleResponse(res);
}
