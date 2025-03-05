import axios from '../utils/axiosConfig';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Generic API service with common CRUD operations
const api = {
  // Generic GET list endpoint with optional query params
  getList: async (endpoint, params = {}) => {
    const response = await axios.get(`${endpoint}/`, { params });
    return response.data;
  },

  // Generic GET detail endpoint
  getById: async (endpoint, id) => {
    const response = await axios.get(`${endpoint}/${id}/`);
    return response.data;
  },

  // Generic POST endpoint
  create: async (endpoint, data) => {
    const response = await axios.post(`${endpoint}/`, data);
    return response.data;
  },

  // Generic PUT endpoint
  update: async (endpoint, id, data) => {
    const response = await axios.put(`${endpoint}/${id}/`, data);
    return response.data;
  },

  // Generic PATCH endpoint
  partialUpdate: async (endpoint, id, data) => {
    const response = await axios.patch(`${endpoint}/${id}/`, data);
    return response.data;
  },

  // Generic DELETE endpoint
  delete: async (endpoint, id) => {
    const response = await axios.delete(`${endpoint}/${id}/`);
    return response.data;
  },

  // Generic file upload with multipart/form-data
  uploadFile: async (endpoint, formData) => {
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default api;