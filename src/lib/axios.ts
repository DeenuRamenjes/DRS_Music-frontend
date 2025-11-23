import axios from 'axios';

declare global {
    interface Window {
        Clerk?: {
            session?: {
                getToken: (options?: { template?: string }) => Promise<string | null>;
            };
        };
    }
}

const baseURL = import.meta.env.MODE === "development" 
    ? "/api" 
    : "https://drs-music-backend.onrender.com/api";

const CLERK_JWT_STORAGE_KEY = '__clerk_client_jwt';

const getAuthToken = async () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const { Clerk } = window;

    if (Clerk?.session?.getToken) {
        try {
            let token = await Clerk.session.getToken();

            if (!token) {
                token = await Clerk.session.getToken({ template: 'integration_fallback' });
            }

            if (token) {
                return token;
            }
        } catch (error) {
            console.warn('Unable to fetch Clerk session token', error);
        }
    }

    try {
        return window.localStorage.getItem(CLERK_JWT_STORAGE_KEY);
    } catch {
        return null;
    }
};

export const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 1000000, // 5 minutes timeout
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
});

// Add request interceptor to handle authentication and file uploads
axiosInstance.interceptors.request.use(
    async (config) => {
        // Get the auth token from Clerk or fallback storage
        const token = await getAuthToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            delete config.headers.Authorization;
        }

        // If the request contains FormData, remove the Content-Type header
        // to let the browser set it with the correct boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('Request timeout:', error);
            return Promise.reject(new Error('Request timeout. Please try again.'));
        }
        return Promise.reject(error);
    }
);