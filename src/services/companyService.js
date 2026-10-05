import api from "./api";

/**
 * Retrieve the company profile data.
 * GET /api/company
 * @returns {Promise<Object>} API response JSON.
 */
export const getCompany = async () => {
    const response = await api.get("/company");
    return response.data;
};

/**
 * Create a new company profile.
 * POST /api/company
 * @param {FormData} formData - Multipart data containing both metadata and image files.
 * @returns {Promise<Object>} API response JSON.
 */
export const createCompany = async (formData) => {
    const response = await api.post("/company", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};

/**
 * Update an existing company profile.
 * PUT /api/company/:id
 * @param {number|string} id - The company ID.
 * @param {FormData} formData - Multipart data containing updated metadata and optional files.
 * @returns {Promise<Object>} API response JSON.
 */
export const updateCompany = async (id, formData) => {
    const response = await api.put(`/company/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};
