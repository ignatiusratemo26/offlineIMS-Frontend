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