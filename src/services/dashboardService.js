import api from "./api";

/**
 * Fetch dashboard aggregate summary metrics and recent invoices.
 * GET /api/dashboard
 * @returns {Promise<Object>} API response JSON.
 */
export const getDashboardData = async () => {
    const response = await api.get("/dashboard");
    return response.data;
};
