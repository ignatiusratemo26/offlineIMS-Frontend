import api from '../utils/axiosConfig';

const login = async (username, password) => {
  const response = await api.post('/users/token/', { username, password });
  return response.data;
};

const refreshToken = async (refresh) => {
  const response = await api.post('/users/token/refresh/', { refresh });
  return response.data;
};

const getCurrentUser = async () => {
  const response = await api.get('/users/me/');
  return response.data;
};

const authService = {
  login,
  refreshToken,
  getCurrentUser,
};

export default authService;