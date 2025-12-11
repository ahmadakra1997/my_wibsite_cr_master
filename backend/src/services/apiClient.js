// frontend/src/services/apiClient.js
// عميل HTTP بسيط موحّد للـ frontend
// يعتمد على fetch ويقرأ قاعدة الـ API من REACT_APP_API_BASE_URL

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // لو عندك كوكيز JWT
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // في حال لا يوجد body JSON
  }

  // نتعامل مع نمط استجابة مثل: { success, data, message, code }
  if (!response.ok || (data && data.success === false)) {
    const error = new Error(
      (data && data.message) ||
        `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.code = data?.code;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export const apiClient = {
  get(path, options = {}) {
    return request(path, { ...options, method: 'GET' });
  },
  post(path, body, options = {}) {
    return request(path, { ...options, method: 'POST', body });
  },
  put(path, body, options = {}) {
    return request(path, { ...options, method: 'PUT', body });
  },
  del(path, options = {}) {
    return request(path, { ...options, method: 'DELETE' });
  },
};
