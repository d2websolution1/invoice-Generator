import axios from "axios";

// Base API URL configuration
export const LIVE_BACKEND_URL = "https://invoice-generator-backend-sa53.onrender.com";
export const API_BASE_URL = import.meta.env.VITE_API_URL || `${LIVE_BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE_URL
});

// Axios request interceptor to automatically attach authorization header on every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "undefined" && token !== "null") {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Axios response interceptor to handle unauthorized sessions automatically
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Token expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("admin");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
