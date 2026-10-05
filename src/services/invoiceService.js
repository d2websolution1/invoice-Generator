import api from "./api";

/**
 * Retrieve all invoices.
 * GET /api/invoice
 * @returns {Promise<Object>} API response JSON.
 */
export const getInvoices = async () => {
    const response = await api.get("/invoice");
    return response.data;
};

/**
 * Retrieve a specific invoice profile by ID.
 * GET /api/invoice/:id
 * @param {number|string} id - The invoice ID.
 * @returns {Promise<Object>} API response JSON.
 */
export const getInvoice = async (id) => {
    const response = await api.get(`/invoice/${id}`);
    return response.data;
};

/**
 * Create a new invoice.
 * POST /api/invoice
 * @param {Object} invoiceData - Invoice details.
 * @returns {Promise<Object>} API response JSON.
 */
export const createInvoice = async (invoiceData) => {
    const response = await api.post("/invoice", invoiceData);
    return response.data;
};

/**
 * Update an existing invoice by its ID.
 * PUT /api/invoice/:id
 * @param {number|string} id - The invoice ID.
 * @param {Object} invoiceData - Updated invoice attributes.
 * @returns {Promise<Object>} API response JSON.
 */
export const updateInvoice = async (id, invoiceData) => {
    const response = await api.put(`/invoice/${id}`, invoiceData);
    return response.data;
};

/**
 * Delete a specific invoice by its ID.
 * DELETE /api/invoice/:id
 * @param {number|string} id - The invoice ID.
 * @returns {Promise<Object>} API response JSON.
 */
export const deleteInvoice = async (id) => {
    const response = await api.delete(`/invoice/${id}`);
    return response.data;
};
