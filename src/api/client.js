const API_BASE = '/api';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // Always send HttpOnly cookies
    headers,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed');
    error.status = response.status;
    error.code = payload?.code || null;
    throw error;
  }

  return payload;
}

export function loginAdmin(email, password) {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function checkAdminSession() {
  return request('/admin/session');
}

// Public content: cache: 'no-store' ensures Home page always gets fresh data
// after an admin saves changes — no manual reload needed.
export function getPublicContent() {
  return request('/content', { cache: 'no-store' });
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

  const res = await fetch(`${API_BASE}/admin/upload`, {
    method: 'POST',
    credentials: 'include', // Cookie auth — no Authorization header needed
    body: formData,
    // Do NOT set Content-Type header — browser sets it with boundary for multipart
  });

  let data = null;
  try {
    data = await res.json();
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

export async function restoreAdminContent(restoredData) {
  return request('/admin/restore', {
    method: 'POST',
    body: JSON.stringify({ data: restoredData }),
  });
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
