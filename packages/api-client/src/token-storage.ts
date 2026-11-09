const TOKEN_KEY = 'astec_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null, persistent = true): void {
  try {
    if (typeof window === 'undefined') return;
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      return;
    }
    if (persistent) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function applyAuthHeaders(headers: Headers): Headers {
  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export function captureAuthHeader(response: Response): void {
  const token = response.headers.get('set-auth-token');
  if (token) {
    setStoredAuthToken(token);
  }
}

