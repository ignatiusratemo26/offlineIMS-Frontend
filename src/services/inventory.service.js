import api from './api';

const BASE_PATH = '/inventory';

const inventoryService = {
  // Category endpoints
  getCategories: (params = {}) => {
    return api.getList(`${BASE_PATH}/categories`, params);
  },
  
  createCategory: (categoryData) => {
    return api.create(`${BASE_PATH}/categories`, categoryData);
  },
  
  updateCategory: (categoryId, categoryData) => {
    return api.update(`${BASE_PATH}/categories`, categoryId, categoryData);
  },
  
  deleteCategory: (categoryId) => {
    return api.delete(`${BASE_PATH}/categories`, categoryId);
  },
  
  // Equipment endpoints
  getEquipment: (params = {}) => {
    return api.getList(`${BASE_PATH}/equipment`, params);
  },
  
  getEquipmentById: (equipmentId) => {
    return api.getById(`${BASE_PATH}/equipment`, equipmentId);
  },
  
  createEquipment: (equipmentData) => {
    return api.create(`${BASE_PATH}/equipment`, equipmentData);
  },
  
  updateEquipment: (equipmentId, equipmentData) => {
    return api.update(`${BASE_PATH}/equipment`, equipmentId, equipmentData);
  },
  
  deleteEquipment: (equipmentId) => {
    return api.delete(`${BASE_PATH}/equipment`, equipmentId);
  },
  
  // Equipment operations
  checkoutEquipment: (equipmentId, checkoutData) => {
    return api.create(`${BASE_PATH}/equipment/${equipmentId}/checkout`, checkoutData);
  },
  
  checkinEquipment: (equipmentId, checkinData) => {
    return api.create(`${BASE_PATH}/equipment/${equipmentId}/checkin`, checkinData);
  },
  
  scheduleMaintenanceEquipment: (equipmentId, maintenanceData) => {
    return api.create(`${BASE_PATH}/equipment/${equipmentId}/schedule_maintenance`, maintenanceData);
  },
  
  completeMaintenanceEquipment: (equipmentId, maintenanceData) => {
    return api.create(`${BASE_PATH}/equipment/${equipmentId}/complete_maintenance`, maintenanceData);
  },
  
  transferEquipment: (equipmentId, transferData) => {
    return api.create(`${BASE_PATH}/equipment/${equipmentId}/transfer`, transferData);
  },
  
  // Maintenance records
  getMaintenanceRecords: (params = {}) => {
    return api.getList(`${BASE_PATH}/maintenance`, params);
  },
  
  getMaintenanceById: (maintenanceId) => {
    return api.getById(`${BASE_PATH}/maintenance`, maintenanceId);
  },
  
  // Usage logs
  getUsageLogs: (params = {}) => {
    return api.getList(`${BASE_PATH}/usage-logs`, params);
  },
  
  // File upload for equipment image
  uploadEquipmentImage: (equipmentId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.uploadFile(`${BASE_PATH}/equipment/${equipmentId}/upload_image/`, formData);
  }
};

export default inventoryService;