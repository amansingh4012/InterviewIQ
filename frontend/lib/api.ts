// Validate API URL configuration
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const isDevelopment = process.env.NODE_ENV === 'development';

// Security: Enforce HTTPS in production
if (!isDevelopment && !rawApiUrl.startsWith('https://')) {
  console.error('Security Error: API_URL must use HTTPS in production');
  throw new Error('Invalid API configuration');
}

const API_URL = rawApiUrl;

type FetchOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

// Error class that doesn't expose sensitive details
class ApiError extends Error {
  status: number;
  errorId?: string;
  
  constructor(message: string, status: number, errorId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorId = errorId;
  }
}

// Sanitize error messages to prevent information leakage
function sanitizeErrorMessage(detail: string | undefined, status: number): string {
  // Don't expose internal error details to users
  const genericMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please sign in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong. Please try again later.',
    502: 'Service temporarily unavailable. Please try again.',
    503: 'Service temporarily unavailable. Please try again.',
  };
  
  // For client errors (4xx), we can show more specific messages if they're safe
  if (status >= 400 && status < 500 && detail) {
    // Only allow specific known safe error messages
    const safePatterns = [
      /^Only PDF files accepted$/,
      /^File too large/,
      /^Could not extract/,
      /^Resume not found/,
      /^Session not found$/,
      /^Interview already completed$/,
      /^Report not ready yet$/,
      /^Invalid subscription tier$/,
      /^Text too long/,
      /^Invalid resume_id format$/,
      /^Invalid session_id format$/,
    ];
    
    if (safePatterns.some(pattern => pattern.test(detail))) {
      return detail;
    }
  }
  
  return genericMessages[status] || 'An unexpected error occurred.';
}

async function authFetch(
  endpoint: string,
  getToken: () => Promise<string | null>,
  options: FetchOptions = {}
) {
  const token = await getToken();
  if (!token) throw new ApiError('Not authenticated', 401);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Add request ID for tracking
  const requestId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
  headers['X-Request-ID'] = requestId;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include', // Include cookies for CORS
  });

  if (!res.ok) {
    let errorDetail: string | undefined;
    let errorId: string | undefined;
    
    try {
      const errorData = await res.json();
      errorDetail = errorData.detail;
      errorId = errorData.error_id;
    } catch {
      // JSON parsing failed, use generic message
    }
    
    const safeMessage = sanitizeErrorMessage(errorDetail, res.status);
    throw new ApiError(safeMessage, res.status, errorId);
  }

  return res;
}

// ── Resume ──

export async function uploadResume(
  file: File,
  getToken: () => Promise<string | null>
) {
  // Client-side validation before upload
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new ApiError('Only PDF files are accepted', 400);
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new ApiError('File too large. Maximum size is 5MB.', 400);
  }

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
  // Validate UUID format client-side
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(data.resume_id)) {
    throw new ApiError('Invalid resume ID format', 400);
  }

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
  // Validate session_id format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(data.session_id)) {
    throw new ApiError('Invalid session ID format', 400);
  }
  
  // Validate answer length
  if (data.answer && data.answer.length > 10000) {
    throw new ApiError('Answer too long. Maximum 10,000 characters.', 400);
  }

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
  // Validate session_id format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(sessionId)) {
    throw new ApiError('Invalid session ID format', 400);
  }

  const res = await authFetch(`/interview/report/${encodeURIComponent(sessionId)}`, getToken);
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
  // Validate session_id format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(sessionId)) {
    throw new ApiError('Invalid session ID format', 400);
  }

  const res = await authFetch(`/interview/session/${encodeURIComponent(sessionId)}`, getToken);
  return res.json();
}

// ── Voice ──

export async function synthesizeSpeech(
  text: string,
  getToken: () => Promise<string | null>
): Promise<Blob> {
  // Validate text length
  if (text.length > 1000) {
    throw new ApiError('Text too long for synthesis. Maximum 1000 characters.', 400);
  }

  const res = await authFetch('/voice/synthesize', getToken, {
    method: 'POST',
    body: { text },
  });
  return res.blob();
}

// ── Analytics ──

export async function getProgress(
  getToken: () => Promise<string | null>,
  options?: { limit?: number; skip?: number }
) {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.skip) params.set('skip', String(options.skip));
  
  const queryString = params.toString();
  const endpoint = `/analytics/progress${queryString ? `?${queryString}` : ''}`;
  
  const res = await authFetch(endpoint, getToken);
  return res.json();
}

// ── Subscription ──

export async function getSubscriptionStatus(
  getToken: () => Promise<string | null>
) {
  const res = await authFetch('/subscription/status', getToken);
  return res.json();
}

export async function canStartInterview(
  getToken: () => Promise<string | null>
) {
  const res = await authFetch('/subscription/can-start', getToken);
  return res.json();
}

export async function getSubscriptionPlans() {
  // This endpoint is public, no auth needed
  const res = await fetch(`${API_URL}/subscription/plans`);
  if (!res.ok) {
    throw new ApiError('Failed to load subscription plans', res.status);
  }
  return res.json();
}

// Export the ApiError class for type checking
export { ApiError };
