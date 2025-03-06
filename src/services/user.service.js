import api from './api';

const BASE_PATH = '/users/users';

const userService = {
  // User management
  getUsers: (params = {}) => {
    return api.getList(BASE_PATH, params);
  },
  
  getUserById: (userId) => {
    return api.getById(BASE_PATH, userId);
  },
  
  createUser: (userData) => {
    return api.create(BASE_PATH, userData);
  },
  
  updateUser: (userId, userData) => {
    return api.update(BASE_PATH, userId, userData);
  },
  
  deleteUser: (userId) => {
    return api.delete(BASE_PATH, userId);
  },
  
  // Current user profile
  getCurrentUser: () => {
    return api.getById(BASE_PATH, 'me');
  },
  
  updateCurrentUser: (userData) => {
    return api.update(BASE_PATH, 'me', userData);
  },
  
  changePassword: (passwordData) => {
    return api.create(`${BASE_PATH}/change_password`, passwordData);
  },
  
  // Profile picture
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return api.uploadFile(`${BASE_PATH}/me/profile_picture`, formData);
  },
  
  // User filtering
  getUsersByLab: (labCode) => {
    return api.getList(`${BASE_PATH}/lab_users`, { lab: labCode });
  },
  
  // User activity
  getUserActivity: (userId) => {
    return api.getList(`${BASE_PATH}/${userId}/activity`);
  }
};

export default userService;