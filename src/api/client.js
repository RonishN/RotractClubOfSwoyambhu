const API_BASE = '/api';

export const globalLoadingState = {
  activeRequests: 0,
  listeners: [],
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  notify() {
    const isLoading = this.activeRequests > 0;
    this.listeners.forEach(l => l(isLoading));
  }
};

async function request(path, options = {}, requestOptions = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  globalLoadingState.activeRequests++;
  globalLoadingState.notify();

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: requestOptions.credentials || 'include',
      headers,
    });
  } catch (err) {
    globalLoadingState.activeRequests--;
    globalLoadingState.notify();
    throw err;
  }

  globalLoadingState.activeRequests--;
  globalLoadingState.notify();

  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || 'Request failed');
    error.status = response.status;
    error.code = payload?.code || null;
    throw error;
  }

  return payload;
}

export function loginAdmin(username, password) {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function subscribeToEvents(email) {
  return request('/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function unsubscribeToEvents(email) {
  return request('/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(username, resetCode, newPassword) {
  return request('/admin/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ username, resetCode, newPassword }),
  });
}

export function changePassword(currentPassword, newPassword, token) {
  return request('/admin/change-password', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function getUsers() {
  return request('/admin/users');
}

export function createUser(username, email, permissions) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username, email, permissions }),
  });
}

export function sendAdminCredentials(username, email, tempPassword) {
  return request('/admin/users/send-credentials', {
    method: 'POST',
    body: JSON.stringify({ username, email, tempPassword }),
  });
}

export function toggleUserStatus(username, is_active) {
  return request(`/admin/users/${username}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active }),
  });
}

export function deleteUser(username) {
  return request(`/admin/users/${username}`, {
    method: 'DELETE',
  });
}

export function generateResetCode(username) {
  return request('/admin/generate-reset-code', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export function getAuditLogs(page = 1, limit = 15) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return request(`/admin/logs?${params.toString()}`);
}

export function checkAdminSession() {
  return request('/admin/session');
}

// Public content: cache: 'no-store' ensures Home page always gets fresh data
// after an admin saves changes — no manual reload needed.
export function getPublicContent() {
  return request('/content', { cache: 'no-store' }, { credentials: 'omit' });
}

export function getAdminContent() {
  return request('/admin/content');
}

export function updateAdminContent(data) {
  return request('/admin/content', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * uploadImage — uses credentials: 'include' (HttpOnly cookie auth).
 * No Bearer token from localStorage needed.
 * If ImageKit is not configured (503), throws with code: 'IMAGEKIT_NOT_CONFIGURED'.
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  globalLoadingState.activeRequests++;
  globalLoadingState.notify();

  let res;
  try {
    res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      credentials: 'include', // Cookie auth — no Authorization header needed
      body: formData,
      // Do NOT set Content-Type header — browser sets it with boundary for multipart
    });
  } catch (err) {
    globalLoadingState.activeRequests--;
    globalLoadingState.notify();
    throw err;
  }

  globalLoadingState.activeRequests--;
  globalLoadingState.notify();

  let data = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = {};
  }

  if (!res.ok) {
    const error = new Error(data?.message || 'Image upload failed');
    error.status = res.status;
    error.code = data?.code || null;
    throw error;
  }

  return data.url;
}

export async function restoreToDefaults() {
  return request('/admin/restore-defaults', {
    method: 'POST',
  });
}

export function logoutAdmin() {
  return request('/admin/logout', {
    method: 'POST',
  });
}

export function updateUserPermissions(username, permissions) {
  return request(`/admin/users/${username}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
}

export function getPublicEvents() {
  return request('/events', { cache: 'no-store' }, { credentials: 'omit' });
}

export function getAdminEvents() {
  return request('/admin/events');
}

export function createEvent(eventData) {
  return request('/admin/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

export function updateEvent(id, eventData) {
  return request(`/admin/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
}

export function deleteEvent(id) {
  return request(`/admin/events/${id}`, {
    method: 'DELETE',
  });
}

export function notifyEventSubscribers(id) {
  return request(`/admin/events/${id}/notify-subscribers`, {
    method: 'POST',
  });
}

export function resetEventNotifiedStates() {
  return request('/admin/events/reset-notified', {
    method: 'POST',
  });
}
