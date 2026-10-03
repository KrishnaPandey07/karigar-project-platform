const API_BASE = '/api/v1';

let accessToken = localStorage.getItem('locallink_token') || null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('locallink_token', token);
  } else {
    localStorage.removeItem('locallink_token');
  }
};

export const getAccessToken = () => accessToken;

/**
 * Universal API fetch wrapper with automatic JWT injection, envelope unboxing,
 * and 401 token refresh retry.
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // essential for httpOnly refresh cookies
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  let response = await fetch(url, config);

  // Auto-refresh token if 401 UNAUTHORIZED and not already refreshing or calling auth endpoints
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          response = await fetch(url, { ...config, headers });
        }
      } else {
        setAccessToken(null);
      }
    } catch {
      setAccessToken(null);
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || (json && json.success === false)) {
    const error = new Error(json?.error?.message || 'Request failed');
    error.code = json?.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    error.details = json?.error?.details || null;
    throw error;
  }

  return json;
}

export default apiClient;
