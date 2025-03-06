import api from './api';

const BASE_PATH = '/bookings';

const bookingService = {
  // Booking endpoints
  getBookings: (params = {}) => {
    return api.getList(BASE_PATH, params);
  },
  
  getBookingById: (bookingId) => {
    return api.getById(BASE_PATH, bookingId);
  },

  getProjectBookings: async (projectId) => {
    try {
      // Try equipment bookings first
      const equipmentBookings = await api.getList(`${BASE_PATH}/equipment-bookings`, { project_id: projectId });
      
      // Try workspace bookings
      const workspaceBookings = await api.getList(`${BASE_PATH}/workspace-bookings`, { project_id: projectId });
      
      // Combine both types of bookings
      return [...(equipmentBookings.results || equipmentBookings || []), 
              ...(workspaceBookings.results || workspaceBookings || [])];
    } catch (error) {
      console.error('Error fetching project bookings:', error);
      return []; // Return empty array on error
    }
  },  
  createBooking: (bookingData) => {
    return api.create(BASE_PATH, bookingData);
  },
  
  updateBooking: (bookingId, bookingData) => {
    return api.update(BASE_PATH, bookingId, bookingData);
  },
  
  cancelBooking: (bookingId) => {
    return api.delete(BASE_PATH, bookingId);
  },
  
  // Approve/reject booking (for admins/lab managers)
  approveBooking: (bookingId) => {
    return api.create(`${BASE_PATH}/${bookingId}/approve`, {});
  },
  
  rejectBooking: (bookingId, reason) => {
    return api.create(`${BASE_PATH}/${bookingId}/reject`, { reason });
  },
  
  // Workspace endpoints
  getWorkspaces: (params = {}) => {
    return api.getList(`${BASE_PATH}/workspaces`, params);
  },
  
  getWorkspaceById: (workspaceId) => {
    return api.getById(`${BASE_PATH}/workspaces`, workspaceId);
  },
  
  // Check resource availability (equipment or workspace)
  checkAvailability: (resourceType, resourceId, startTime, endTime) => {
    return api.getList(`${BASE_PATH}/availability`, {
      resource_type: resourceType,
      resource_id: resourceId,
      start_time: startTime,
      end_time: endTime
    });
  },


  // Add these methods to your booking service

  // Create or find a booking slot
  findOrCreateSlot: async (slotData) => {
    // First try to find if the slot exists
    try {
      const existingSlots = await api.getList(`${BASE_PATH}/slots`, {
        date: slotData.date,
        start_time: slotData.start_time,
        end_time: slotData.end_time
      });
      
      // If slot already exists, return it
      if (existingSlots.results && existingSlots.results.length > 0) {
        return existingSlots.results[0];
      }
      
      // Otherwise create a new slot
      const newSlot = await api.create(`${BASE_PATH}/slots`, slotData);
      return newSlot;
    } catch (error) {
      console.error('Error finding or creating slot:', error);
      throw error;
    }
  },

  // Create equipment booking
  createEquipmentBooking: async (bookingData) => {
    return api.create(`${BASE_PATH}/equipment-bookings`, bookingData);
  },

  // Update equipment booking
  updateEquipmentBooking: async (id, bookingData) => {
    return api.update(`${BASE_PATH}/equipment-bookings`, id, bookingData);
  },

  // Create workspace booking
  createWorkspaceBooking: async (bookingData) => {
    return api.create(`${BASE_PATH}/workspace-bookings`, bookingData);
  },

  // Update workspace booking
  updateWorkspaceBooking: async (id, bookingData) => {
    return api.update(`${BASE_PATH}/workspace-bookings`, id, bookingData);
  },
  
  // Get calendar events (for calendar view)
  getCalendarEvents: (start, end, filters = {}) => {
    return api.getList(`${BASE_PATH}/calendar`, {
      start,
      end,
      ...filters
    });
  },
  
  // Get user's bookings
  getCurrentUserBookings: (params = {}) => {
    return api.getList(`${BASE_PATH}/my_bookings`, params);
  }
};

export default bookingService;