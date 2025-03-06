import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Autocomplete,
  Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { addHours, format, parseISO, isAfter, isBefore } from 'date-fns';
import bookingService from '../../services/booking.service';
import inventoryService from '../../services/inventory.service';
import projectService from '../../services/project.service';
import { useAuth } from '../../contexts/AuthContext';
import { parseErrorResponse } from '../../utils/helpers';

const BookingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const isEditMode = !!id;
  
  const initialFormState = {
    resource_type: 'EQUIPMENT',
    equipment: null,
    workspace: null,
    project: null,
    start_time: addHours(new Date(), 1), // Default to 1 hour from now
    end_time: addHours(new Date(), 3),   // Default 2 hour duration
    purpose: '',
    notes: '',
    participants_count: 1
  };

  // Form state
  const [formData, setFormData] = useState(initialFormState);
  
  // Select options
  const [equipment, setEquipment] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      
      try {
        // Fetch available equipment
        const equipmentResponse = await inventoryService.getEquipment({ status: 'AVAILABLE' });
        setEquipment(equipmentResponse.results || equipmentResponse);
        
        // Fetch workspaces
        const workspacesResponse = await bookingService.getWorkspaces();
        setWorkspaces(workspacesResponse.results || workspacesResponse);
        
        // Fetch projects user is part of
        const projectsResponse = await projectService.getProjects({ user_id: authState.user.id });
        setProjects(projectsResponse.results || projectsResponse);
        
        // If editing, fetch booking details
        if (isEditMode) {
            try {
            const bookingResponse = await bookingService.getBookingById(id);
            
            // Determine resource type from the response
            let resourceType = 'EQUIPMENT';
            let equipmentItem = null;
            let workspaceItem = null;
            let startTime, endTime;
            
            if (bookingResponse.equipment) {
                resourceType = 'EQUIPMENT';
                // Find the equipment in the list
                equipmentItem = equipment.find(e => e.id === bookingResponse.equipment) || null;
                
                if (!equipmentItem && bookingResponse.equipment_details) {
                equipmentItem = bookingResponse.equipment_details;
                }
            } else if (bookingResponse.workspace) {
                resourceType = 'WORKSPACE';
                // Find the workspace in the list
                workspaceItem = workspaces.find(w => w.id === bookingResponse.workspace) || null;
                
                if (!workspaceItem && bookingResponse.workspace_details) {
                workspaceItem = bookingResponse.workspace_details;
                }
            }
            
            // Handle different date formats
            if (bookingResponse.start_time && bookingResponse.end_time) {
                // Direct start/end time properties
                startTime = parseISO(bookingResponse.start_time);
                endTime = parseISO(bookingResponse.end_time);
            } else if (bookingResponse.slot_details) {
                // Slot-based bookings
                const slotDate = bookingResponse.slot_details.date;
                const slotStartTime = bookingResponse.slot_details.start_time;
                const slotEndTime = bookingResponse.slot_details.end_time;
                
                startTime = new Date(`${slotDate}T${slotStartTime}`);
                endTime = new Date(`${slotDate}T${slotEndTime}`);
            }
            
            // Format data for form
            const formattedData = {
                resource_type: resourceType,
                equipment: equipmentItem,
                workspace: workspaceItem,
                start_time: startTime,
                end_time: endTime,
                purpose: bookingResponse.purpose || '',
                notes: bookingResponse.notes || '',
                participants_count: bookingResponse.participants_count || 1,
                // Keep the original data for reference
                originalBooking: bookingResponse
            };
          
            setFormData(formattedData);
          
            // Check availability to ensure it's still valid
            await checkResourceAvailability(formattedData);
          } catch (bookingError) {
            console.error('Error fetching booking details:', bookingError);
            setError(`Could not find booking with ID ${id}. It may have been deleted or you don't have permission to view it.`);
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load necessary data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [id, isEditMode, authState.user.id]);

  // Reset form data when resource type changes
  useEffect(() => {
    if (formData.resource_type === 'EQUIPMENT') {
      setFormData(prev => ({ ...prev, workspace: null }));
    } else {
      setFormData(prev => ({ ...prev, equipment: null }));
    }
    
    setAvailabilityChecked(false);
    setIsAvailable(false);
  }, [formData.resource_type]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Reset availability check when relevant fields change
    if (
      name === 'resource_type' || 
      name === 'equipment' || 
      name === 'workspace'
    ) {
      setAvailabilityChecked(false);
      setIsAvailable(false);
    }
  };

  const handleAutocompleteChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Reset availability check when equipment or workspace changes
    if (name === 'equipment' || name === 'workspace') {
      setAvailabilityChecked(false);
      setIsAvailable(false);
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Reset availability check when dates change
    setAvailabilityChecked(false);
    setIsAvailable(false);
  };

  const checkResourceAvailability = async (data = formData) => {
    const { resource_type, equipment, workspace, start_time, end_time } = data;
    
    if (!start_time || !end_time) {
      setValidationErrors(prev => ({
        ...prev,
        start_time: !start_time ? 'Start time is required' : undefined,
        end_time: !end_time ? 'End time is required' : undefined
      }));
      return false;
    }
    
    if (isBefore(end_time, start_time)) {
      setValidationErrors(prev => ({
        ...prev,
        end_time: 'End time must be after start time'
      }));
      return false;
    }
    
    const resourceId = resource_type === 'EQUIPMENT' ? equipment?.id : workspace?.id;
    
    if (!resourceId) {
      setValidationErrors(prev => ({
        ...prev,
        [resource_type.toLowerCase()]: `Please select a ${resource_type.toLowerCase()}`
      }));
      return false;
    }
    
    try {
      setLoading(true);
      const availability = await bookingService.checkAvailability(
        resource_type,
        resourceId,
        format(start_time, "yyyy-MM-dd'T'HH:mm:ss"),
        format(end_time, "yyyy-MM-dd'T'HH:mm:ss")
      );
      
      setAvailabilityChecked(true);
      setIsAvailable(availability.available);
      
      if (!availability.available) {
        setError(`The selected ${resource_type.toLowerCase()} is not available during the requested time period.`);
      } else {
        setError(null);
      }
      
      return availability.available;
      
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Failed to check availability. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.resource_type) errors.resource_type = 'Resource type is required';
    if (formData.resource_type === 'EQUIPMENT' && !formData.equipment) {
      errors.equipment = 'Please select an equipment';
    }
    if (formData.resource_type === 'WORKSPACE' && !formData.workspace) {
      errors.workspace = 'Please select a workspace';
    }
    if (!formData.start_time) errors.start_time = 'Start time is required';
    if (!formData.end_time) errors.end_time = 'End time is required';
    if (!formData.purpose) errors.purpose = 'Purpose is required';
    
    // Validate dates
    if (formData.start_time && formData.end_time) {
      if (isBefore(formData.end_time, formData.start_time)) {
        errors.end_time = 'End time must be after start time';
      }
      
      if (isBefore(formData.start_time, new Date()) && !isEditMode) {
        errors.start_time = 'Cannot book in the past';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First validate the form
    if (!validateForm()) {
      return;
    }
    
    // Check resource availability if not already checked
    if (!availabilityChecked) {
      const available = await checkResourceAvailability();
      if (!available) return;
    }
    
    // If resource is not available, don't submit
    if (!isAvailable) {
      setError(`The selected ${formData.resource_type.toLowerCase()} is not available during the requested time period.`);
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {

    const submitData = {
        purpose: formData.purpose,
        notes: formData.notes || '',
      };
      
      // Create or get booking slot
      const slotData = {
        date: format(formData.start_time, "yyyy-MM-dd"),
        start_time: format(formData.start_time, "HH:mm:ss"),
        end_time: format(formData.end_time, "HH:mm:ss")
      };
      
      // First create or get the slot
      let slotResponse;
      try {
        // Try to find existing slot
        slotResponse = await bookingService.findOrCreateSlot(slotData);
      } catch (slotError) {
        console.error("Error with booking slot:", slotError);
        throw new Error("Failed to create booking slot. Please try different times.");
      }
      
      // Add slot ID to submit data
      submitData.slot = slotResponse.id;
      
      // Add resource-specific IDs based on resource type
      if (formData.resource_type === 'EQUIPMENT') {
        submitData.equipment = formData.equipment?.id;
        
        if (isEditMode) {
          await bookingService.updateEquipmentBooking(id, submitData);
        } else {
          await bookingService.createEquipmentBooking(submitData);
        }
      } else { // WORKSPACE
        submitData.workspace = formData.workspace?.id;
        submitData.participants_count = formData.participants_count || 1;
        
        if (isEditMode) {
          await bookingService.updateWorkspaceBooking(id, submitData);
        } else {
          await bookingService.createWorkspaceBooking(submitData);
        }
      }
      
      // Add project if selected
      if (formData.project) {
        submitData.project_name = formData.project.title || formData.project.name;
      }
      
      // Navigate to bookings list
      navigate('/bookings');
    } catch (err) {
      console.error('Error saving booking:', err);
      setError(parseErrorResponse(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/bookings');
  };

  if (loading && !saving) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Edit Booking' : 'New Booking'}
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {availabilityChecked && isAvailable && (
          <Alert severity="success" sx={{ mb: 3 }}>
            The selected {formData.resource_type.toLowerCase()} is available for the requested time period.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Resource Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Resource Selection
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Resource Type</FormLabel>
              <RadioGroup
                row
                name="resource_type"
                value={formData.resource_type}
                onChange={handleInputChange}
              >
                <FormControlLabel value="EQUIPMENT" control={<Radio />} label="Equipment" />
                <FormControlLabel value="WORKSPACE" control={<Radio />} label="Workspace" />
              </RadioGroup>
            </FormControl>

            {formData.resource_type === 'EQUIPMENT' ? (
              <Autocomplete
                options={equipment}
                getOptionLabel={(option) => option.name || ''}
                value={formData.equipment}
                onChange={(_, newValue) => handleAutocompleteChange('equipment', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Equipment"
                    error={!!validationErrors.equipment}
                    helperText={validationErrors.equipment}
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.serial_number ? `SN: ${option.serial_number}` : 'No Serial Number'} | Lab: {option.lab}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                fullWidth
                sx={{ mb: 2 }}
              />
            ) : (
              <Autocomplete
                options={workspaces}
                getOptionLabel={(option) => option.name || ''}
                value={formData.workspace}
                onChange={(_, newValue) => handleAutocompleteChange('workspace', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Workspace"
                    error={!!validationErrors.workspace}
                    helperText={validationErrors.workspace}
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Capacity: {option.capacity} | Lab: {option.lab}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                fullWidth
                sx={{ mb: 2 }}
              />
            )}

            <Autocomplete
              options={projects}
              getOptionLabel={(option) => option.name || ''}
              value={formData.project}
              onChange={(_, newValue) => handleAutocompleteChange('project', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Associated Project (Optional)"
                  error={!!validationErrors.project}
                  helperText={validationErrors.project}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Status: {option.status}
                    </Typography>
                  </Box>
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              fullWidth
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Purpose"
              name="purpose"
              value={formData.purpose || ''}
              onChange={handleInputChange}
              error={!!validationErrors.purpose}
              helperText={validationErrors.purpose}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Additional Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              multiline
              rows={4}
            />
          </Grid>

          {/* Date and Time Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Date and Time
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={formData.start_time}
                onChange={(newValue) => handleDateChange('start_time', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth
                    sx={{ mb: 3 }}
                    required
                    error={!!validationErrors.start_time}
                    helperText={validationErrors.start_time}
                  />
                )}
              />

              <DateTimePicker
                label="End Time"
                value={formData.end_time}
                onChange={(newValue) => handleDateChange('end_time', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth
                    sx={{ mb: 3 }}
                    required
                    error={!!validationErrors.end_time}
                    helperText={validationErrors.end_time}
                  />
                )}
              />
            </LocalizationProvider>

            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => checkResourceAvailability()}
              disabled={
                !formData.start_time ||
                !formData.end_time ||
                (formData.resource_type === 'EQUIPMENT' && !formData.equipment) ||
                (formData.resource_type === 'WORKSPACE' && !formData.workspace)
              }
              sx={{ mb: 3, width: '100%' }}
            >
              Check Availability
            </Button>

            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={2}>
              <LoadingButton
                type="submit"
                variant="contained"
                color="primary"
                loading={saving}
                loadingPosition="start"
                startIcon={<SaveIcon />}
                fullWidth
                disabled={!availabilityChecked || !isAvailable}
              >
                {isEditMode ? 'Update Booking' : 'Create Booking'}
              </LoadingButton>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleBack}
                color="inherit"
                fullWidth
              >
                Cancel
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default BookingForm;