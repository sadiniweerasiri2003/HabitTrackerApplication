const API_URL = import.meta.env.VITE_API_URL;

export async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Something went wrong');
    }

    return response.json();
}

// Auth API calls
export const authApi = {
    login: (credentials) => 
        fetchWithAuth('/api/users/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
    
    register: (userData) =>
        fetchWithAuth('/api/users/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),

    getProfile: () => 
        fetchWithAuth('/api/users/me'),
};

// Habits API calls
export const habitsApi = {
    createHabit: (habitData) =>
        fetchWithAuth('/api/habits', {
            method: 'POST',
            body: JSON.stringify(habitData),
        }),

    getStats: () =>
        fetchWithAuth('/api/habits/stats'),

    getAllHabits: () =>
        fetchWithAuth('/api/habits'),
    
    getHabit: (id) =>
        fetchWithAuth(`/api/habits/${id}`),
    
    updateHabit: (id, habitData) =>
        fetchWithAuth(`/api/habits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(habitData),
        }),
    
    deleteHabit: (id) =>
        fetchWithAuth(`/api/habits/${id}`, {
            method: 'DELETE',
        }),
    
    updateProgress: (id, progressData) =>
        fetchWithAuth(`/api/habits/${id}/progress`, {
            method: 'POST',
            body: JSON.stringify(progressData),
        }),
};
