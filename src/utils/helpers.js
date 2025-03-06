import { format, parseISO, formatDistance } from 'date-fns';

// Date and Time helpers
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

// File helpers
export const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    if (i === 0) return `${bytes} ${sizes[i]}`;
    
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
  };

export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

// Object helpers
export const removeEmptyFields = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => {
      if (value === null || value === undefined || value === '') {
        return false;
      }
      return true;
    })
  );
};

// String helpers
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const formatEnumValue = (value) => {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Array helpers
export const sortByProperty = (array, property, direction = 'asc') => {
  if (!array || !array.length) return [];
  
  const sortedArray = [...array].sort((a, b) => {
    if (a[property] < b[property]) return direction === 'asc' ? -1 : 1;
    if (a[property] > b[property]) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sortedArray;
};

// Form helpers
export const createFormData = (data) => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      // Handle files differently
      if (value instanceof File) {
        formData.append(key, value);
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item));
      }
      // Handle Date objects
      else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      }
      // Handle everything else
      else {
        formData.append(key, value);
      }
    }
  });
  
  return formData;
};

// Validation helpers
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone) => {
  // Basic validation for international phone numbers
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

// Status and color helpers
export const getStatusColor = (status) => {
  const statusColors = {
    // Equipment status colors
    AVAILABLE: '#4caf50',  // Green
    IN_USE: '#ff9800',     // Orange
    MAINTENANCE: '#f44336', // Red
    SHARED: '#2196f3',     // Blue
    
    // Booking status colors
    PENDING: '#ff9800',    // Orange
    APPROVED: '#4caf50',   // Green
    REJECTED: '#f44336',   // Red
    CANCELLED: '#9e9e9e',  // Grey
    
    // Project status colors
    ACTIVE: '#4caf50',     // Green
    COMPLETED: '#2196f3',  // Blue
    
    // Default
    default: '#9e9e9e'     // Grey
  };
  
  return statusColors[status] || statusColors.default;
};

// Permission helpers
export const hasPermission = (user, requiredRole) => {
  if (!user || !user.role) return false;
  
  const roles = {
    'ADMIN': 4,
    'LAB_MANAGER': 3,
    'TECHNICIAN': 2,
    'STUDENT': 1
  };
  
  return roles[user.role] >= roles[requiredRole];
};

// Error handling helpers
export const parseErrorResponse = (error) => {
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  
  const { data, status } = error.response;
  
  if (status === 401) {
    return 'Session expired. Please login again.';
  }
  
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (status === 500) {
    return 'Internal server error. Please try again later.';
  }
  
  // Try to parse detailed error messages from the response
  if (data) {
    if (typeof data === 'string') {
      return data;
    }
    
    if (data.detail) {
      return data.detail;
    }
    
    if (data.non_field_errors) {
      return data.non_field_errors.join(', ');
    }
    
    // Check for field-specific errors
    if (typeof data === 'object') {
      const errorMessages = [];
      
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          errorMessages.push(`${key}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          errorMessages.push(`${key}: ${value}`);
        }
      });
      
      if (errorMessages.length > 0) {
        return errorMessages.join('; ');
      }
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Local storage helpers
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const getFromStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};