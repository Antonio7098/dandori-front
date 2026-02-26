const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('dandori-token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
    localStorage.removeItem('dandori-token');
    const storeData = JSON.parse(localStorage.getItem('dandori-user-storage') || '{}');
    if (storeData?.state) {
      storeData.state.user = null;
      storeData.state.isAuthenticated = false;
      localStorage.setItem('dandori-user-storage', JSON.stringify(storeData));
    }
    const error = await response.json().catch(() => ({ error: 'Session expired' }));
    throw new Error(error.error || 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

async function fetchWithAuthForm(endpoint, formData, method = 'POST') {
  const token = localStorage.getItem('dandori-token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const coursesApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return fetchWithAuth(`/api/courses?${searchParams}`);
  },
  
  getById: (id) => fetchWithAuth(`/api/courses/${id}`),
  
  create: (data) => fetchWithAuth('/api/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => fetchWithAuth(`/api/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => fetchWithAuth(`/api/courses/${id}`, {
    method: 'DELETE',
  }),

  uploadPdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithAuthForm('/api/upload', formData, 'POST');
  },

  uploadBatch: (files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return fetchWithAuthForm('/api/upload/batch', formData, 'POST');
  },
  
  search: (query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters });
    return fetchWithAuth(`/api/search?${params}`);
  },
  
  graphSearch: (query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters });
    return fetchWithAuth(`/api/graph-search?${params}`);
  },
};

export const authApi = {
  login: (email, password) => fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  signup: (data) => fetchWithAuth('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  logout: () => fetchWithAuth('/api/auth/logout', {
    method: 'POST',
  }),
  
  getProfile: () => fetchWithAuth('/api/auth/profile'),
  
  updateProfile: (data) => fetchWithAuth('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getReviewCount: () => fetchWithAuth('/api/auth/review-count'),

  getUserReviews: () => fetchWithAuth('/api/auth/reviews'),
};

export const chatApi = {
  sendMessage: async ({
    message,
    history = [],
    mode = 'standard',
    filters = {},
    stream = false,
  }) => {
    return fetchWithAuth('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, mode, filters, stream }),
    });
  },

  streamChat: async function* ({
    message,
    history = [],
    mode = 'standard',
    filters = {},
  }) {
    const token = localStorage.getItem('dandori-token');

    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ message, history, mode, filters, stream: true }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let separatorIndex;
      while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const lines = rawEvent.split('\n');
        let eventName = null;
        let dataPayload = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataPayload += line.slice(5).trim();
          }
        }

        if (!eventName || !dataPayload) {
          continue;
        }

        let parsed;
        try {
          parsed = JSON.parse(dataPayload);
        } catch {
          parsed = dataPayload;
        }

        yield { event: eventName, data: parsed };
      }
    }
  },
};

export const userApi = {
  getSavedCourses: () => fetchWithAuth('/api/user/saved-courses'),
  
  saveCourse: (courseId) => fetchWithAuth('/api/user/saved-courses', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId }),
  }),
  
  unsaveCourse: (courseId) => fetchWithAuth(`/api/user/saved-courses/${courseId}`, {
    method: 'DELETE',
  }),
  
  addReview: (courseId, rating, review) => fetchWithAuth(`/api/courses/${courseId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, review }),
  }),
  
  getReviews: (courseId) => fetchWithAuth(`/api/courses/${courseId}/reviews`),
};
