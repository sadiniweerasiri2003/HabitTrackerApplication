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
    });    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || 'Something went wrong');
        } else {
            throw new Error('Network response was not ok');
        }
    }

    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    
    throw new Error('Invalid response content type');
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

// User API calls
export const userApi = {
    getProfile: async () => {
        try {
            return await fetchWithAuth('/api/users/profile');
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },

    updateProfile: async (userData) => {
        try {
            return await fetchWithAuth('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify(userData),
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
};
