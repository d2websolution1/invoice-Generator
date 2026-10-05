import api from "./api";

/**
 * Handle POST request to login endpoint, saving token on success.
 * @param {string} email - Admin email address.
 * @param {string} password - Admin password.
 * @returns {Promise<Object>} API Response JSON.
 */
export const login = async (email, password) => {
    const response = await api.post("/auth/login", {
        email,
        password
    });
    
    if (response.data?.success && response.data?.data?.token) {
        const token = response.data.data.token;
        localStorage.setItem("token", token);
        if (response.data.data.admin) {
            localStorage.setItem("admin", JSON.stringify(response.data.data.admin));
        }
    }
    
    return response.data;
};

/**
 * Revoke authentication by deleting token and admin data from localStorage.
 */
export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
};

/**
 * Check if the user is authenticated based on token existence and valid expiry.
 * @returns {boolean} True if token exists and is valid.
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
        return false;
    }

    try {
        const parts = token.split(".");
        if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                // Token has expired!
                localStorage.removeItem("token");
                localStorage.removeItem("admin");
                return false;
            }
        }
        return true;
    } catch {
        return !!token;
    }
};

/**
 * Retrieve current JWT auth token.
 * @returns {string|null} JWT token value or null.
 */
export const getToken = () => {
    return localStorage.getItem("token");
};

/**
 * Retrieve cached admin profile.
 * @returns {Object|null} Admin object or null.
 */
export const getAdminProfile = () => {
    try {
        const admin = localStorage.getItem("admin");
        return admin ? JSON.parse(admin) : null;
    } catch {
        return null;
    }
};
