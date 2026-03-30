const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type FetchOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

async function authFetch(
  endpoint: string,
  getToken: () => Promise<string | null>,
  options: FetchOptions = {}
) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${res.status}`);
  }

  return res;
}

// ── Resume ──

export async function uploadResume(
  file: File,
  getToken: () => Promise<string | null>
) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authFetch('/resume/upload', getToken, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });

  return res.json();
}

// ── Interview ──

export async function startInterview(
  data: { resume_id: string; role: string; difficulty: string; interview_type?: string },
  getToken: () => Promise<string | null>
) {
  const res = await authFetch('/interview/start', getToken, {
    method: 'POST',
    body: data,
  });
  return res.json();
}

export async function submitAnswer(
  data: { session_id: string; answer: string; request_nudge?: boolean },
  getToken: () => Promise<string | null>
) {
  const res = await authFetch('/interview/answer', getToken, {
    method: 'POST',
    body: data,
  });
  return res.json();
}

export async function getReport(
  sessionId: string,
  getToken: () => Promise<string | null>
) {
  const res = await authFetch(`/interview/report/${sessionId}`, getToken);
  return res.json();
}

export async function getUserSessions(
  getToken: () => Promise<string | null>
) {
  const res = await authFetch('/interview/sessions', getToken);
  return res.json();
}

// ── Session Recovery ──

export async function getActiveSession(
  sessionId: string,
  getToken: () => Promise<string | null>
) {
  const res = await authFetch(`/interview/session/${sessionId}`, getToken);
  return res.json();
}

// ── Voice ──

export async function synthesizeSpeech(
  text: string,
  getToken: () => Promise<string | null>
): Promise<Blob> {
  const res = await authFetch('/voice/synthesize', getToken, {
    method: 'POST',
    body: { text },
  });
  return res.blob();
}

// ── Analytics ──

export async function getProgress(
  getToken: () => Promise<string | null>
) {
  const res = await authFetch('/analytics/progress', getToken);
  return res.json();
}
