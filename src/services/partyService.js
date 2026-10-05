import api from "./api";

/**
 * Fetch all party profiles.
 * GET /api/party
 * @returns {Promise<Object>} API response JSON.
 */
export const getParties = async () => {
    const response = await api.get("/party");
    return response.data;
};

/**
 * Create a new party profile (Customer or Supplier).
 * POST /api/party
 * @param {Object} partyData - JSON metadata of the party.
 * @returns {Promise<Object>} API response JSON.
 */
export const createParty = async (partyData) => {
    const response = await api.post("/party", partyData);
    return response.data;
};

/**
 * Update an existing party profile.
 * PUT /api/party/:id
 * @param {number|string} id - Party ID.
 * @param {Object} partyData - JSON metadata to update.
 * @returns {Promise<Object>} API response JSON.
 */
export const updateParty = async (id, partyData) => {
    const response = await api.put(`/party/${id}`, partyData);
    return response.data;
};

/**
 * Delete a specific party profile.
 * DELETE /api/party/:id
 * @param {number|string} id - Party ID.
 * @returns {Promise<Object>} API response JSON.
 */
export const deleteParty = async (id) => {
    const response = await api.delete(`/party/${id}`);
    return response.data;
};
