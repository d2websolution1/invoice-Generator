import api from "./api";

/**
 * Fetch all items (Products and Services).
 * GET /api/item
 * @returns {Promise<Object>} API response JSON.
 */
export const getItems = async () => {
    const response = await api.get("/item");
    return response.data;
};

/**
 * Create a new item profile.
 * POST /api/item
 * @param {Object} itemData - Item details.
 * @returns {Promise<Object>} API response JSON.
 */
export const createItem = async (itemData) => {
    const response = await api.post("/item", itemData);
    return response.data;
};

/**
 * Update an existing item profile.
 * PUT /api/item/:id
 * @param {number|string} id - The item ID.
 * @param {Object} itemData - Item fields to update.
 * @returns {Promise<Object>} API response JSON.
 */
export const updateItem = async (id, itemData) => {
    const response = await api.put(`/item/${id}`, itemData);
    return response.data;
};

/**
 * Delete a specific item.
 * DELETE /api/item/:id
 * @param {number|string} id - The item ID.
 * @returns {Promise<Object>} API response JSON.
 */
export const deleteItem = async (id) => {
    const response = await api.delete(`/item/${id}`);
    return response.data;
};
