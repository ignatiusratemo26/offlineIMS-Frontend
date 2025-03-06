import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton,
  InputAdornment,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import inventoryService from '../../services/inventory.service';
import { hasPermission, parseErrorResponse } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    barcode: '',
    status: 'AVAILABLE',
    category: '',
    lab: '',
    location: '',
    purchase_date: null,
    last_maintenance_date: null,
    next_maintenance_date: null
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch categories regardless of mode
        const categoriesResponse = await inventoryService.getCategories();
        setCategories(categoriesResponse.results || categoriesResponse);

        // If in edit mode, fetch the equipment details
        if (isEditMode) {
          const equipmentData = await inventoryService.getEquipmentById(id);
          
          // Format dates properly
          const formattedData = {
            ...equipmentData,
            purchase_date: equipmentData.purchase_date ? parseISO(equipmentData.purchase_date) : null,
            last_maintenance_date: equipmentData.last_maintenance_date ? parseISO(equipmentData.last_maintenance_date) : null,
            next_maintenance_date: equipmentData.next_maintenance_date ? parseISO(equipmentData.next_maintenance_date) : null,
            category: equipmentData.category ? equipmentData.category.id : ''
          };

          setFormData(formattedData);

          if (equipmentData.image) {
            setPreviewImage(equipmentData.image);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Check permissions before loading
    if (!hasPermission(authState.user, 'TECHNICIAN')) {
      navigate('/equipment');
      return;
    }

    fetchData();
  }, [id, isEditMode, navigate, authState.user]);

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
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));

    // Clear validation error when date is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setImageFile(file);

    // Clean up error if there was one
    if (validationErrors.image) {
      setValidationErrors(prev => ({
        ...prev,
        image: undefined
      }));
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    setImageFile(null);

    // If in edit mode, also set image to null in form data
    if (isEditMode) {
      setFormData(prev => ({
        ...prev,
        image: null
      }));
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const validateForm = () => {
    const errors = {};

    // Required fields
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.status) errors.status = 'Status is required';
    if (!formData.lab) errors.lab = 'Lab is required';
    if (!formData.category) errors.category = 'Category is required';

    // Optional validations
    if (formData.serial_number && formData.serial_number.length > 100) {
      errors.serial_number = 'Serial number is too long (max 100 characters)';
    }

    if (formData.barcode && formData.barcode.length > 100) {
      errors.barcode = 'Barcode is too long (max 100 characters)';
    }

    // Date validations
    // Ensure next_maintenance_date is after last_maintenance_date if both exist
    if (formData.last_maintenance_date && formData.next_maintenance_date && 
        formData.next_maintenance_date < formData.last_maintenance_date) {
      errors.next_maintenance_date = 'Next maintenance date must be after last maintenance date';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Deep copy and format dates
      const submissionData = { ...formData };
      
      // Format dates properly for API
      if (submissionData.purchase_date) {
        submissionData.purchase_date = format(submissionData.purchase_date, 'yyyy-MM-dd');
      }
      if (submissionData.last_maintenance_date) {
        submissionData.last_maintenance_date = format(submissionData.last_maintenance_date, 'yyyy-MM-dd');
      }
      if (submissionData.next_maintenance_date) {
        submissionData.next_maintenance_date = format(submissionData.next_maintenance_date, 'yyyy-MM-dd');
      }

      let equipmentId = id;

      // Create or update equipment
      if (isEditMode) {
        await inventoryService.updateEquipment(id, submissionData);
      } else {
        const response = await inventoryService.createEquipment(submissionData);
        equipmentId = response.id; // Get ID from created equipment
      }

      // Handle image upload if there's a new image
      if (imageFile) {
        await inventoryService.uploadEquipmentImage(equipmentId, imageFile);
      }

      // Navigate back to equipment detail
      navigate(`/equipment/${equipmentId}`);
    } catch (err) {
      console.error('Error saving equipment:', err);
      setError(parseErrorResponse(err));
    } finally {
      setSaving(false);
    }
  };

  const labs = ['IVE', 'CEZERI', 'MEDTECH'];
  const statuses = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'SHARED'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left column - Basic information */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Equipment Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  name="serial_number"
                  value={formData.serial_number || ''}
                  onChange={handleInputChange}
                  error={!!validationErrors.serial_number}
                  helperText={validationErrors.serial_number}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Barcode"
                  name="barcode"
                  value={formData.barcode || ''}
                  onChange={handleInputChange}
                  error={!!validationErrors.barcode}
                  helperText={validationErrors.barcode}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!validationErrors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category"
                  >
                    <MenuItem value="" disabled>
                      Select a category
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.category && <FormHelperText>{validationErrors.category}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!validationErrors.lab}>
                  <InputLabel>Lab</InputLabel>
                  <Select
                    name="lab"
                    value={formData.lab}
                    onChange={handleInputChange}
                    label="Lab"
                  >
                    <MenuItem value="" disabled>
                      Select a lab
                    </MenuItem>
                    {labs.map((lab) => (
                      <MenuItem key={lab} value={lab}>
                        {lab}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.lab && <FormHelperText>{validationErrors.lab}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location Details"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  placeholder="E.g., Cabinet 3, Shelf B"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required error={!!validationErrors.status}>
                  <FormLabel id="status-label">Equipment Status</FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statuses.map((status) => (
                      <FormControlLabel 
                        key={status} 
                        value={status} 
                        control={<Radio />} 
                        label={status.replace('_', ' ')} 
                      />
                    ))}
                  </RadioGroup>
                  {validationErrors.status && <FormHelperText>{validationErrors.status}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Dates
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Purchase Date"
                    value={formData.purchase_date}
                    onChange={(newValue) => handleDateChange('purchase_date', newValue)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!validationErrors.purchase_date}
                        helperText={validationErrors.purchase_date}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Last Maintenance Date"
                    value={formData.last_maintenance_date}
                    onChange={(newValue) => handleDateChange('last_maintenance_date', newValue)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!validationErrors.last_maintenance_date}
                        helperText={validationErrors.last_maintenance_date}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Next Maintenance Date"
                    value={formData.next_maintenance_date}
                    onChange={(newValue) => handleDateChange('next_maintenance_date', newValue)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!validationErrors.next_maintenance_date}
                        helperText={validationErrors.next_maintenance_date}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Description
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Equipment Description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter detailed description of the equipment..."
            />
          </Grid>

          {/* Right column - Image and actions */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Equipment Image
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: 250,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  mb: 2,
                }}
              >
                {previewImage ? (
                  <>
                    <Box
                      component="img"
                      src={previewImage}
                      alt="Equipment preview"
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                      }}
                      onClick={clearImage}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                ) : (
                  <Typography color="text.secondary">No image selected</Typography>
                )}
              </Box>

              <Button
                component="label"
                variant="contained"
                startIcon={<PhotoCameraIcon />}
              >
                {previewImage ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {validationErrors.image && (
                <FormHelperText error>{validationErrors.image}</FormHelperText>
              )}
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={saving}
                  loadingPosition="start"
                  startIcon={<SaveIcon />}
                  fullWidth
                >
                  Save
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
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default EquipmentForm;