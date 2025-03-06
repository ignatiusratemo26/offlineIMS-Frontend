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
  Chip,
  IconButton,
  Autocomplete
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO, isAfter } from 'date-fns';
import projectService from '../../services/project.service';
import userService from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, parseErrorResponse } from '../../utils/helpers';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date(),
    end_date: null,
    status: 'PENDING',
    lab: '',
    tags: [],
    budget: '',
    funding_source: ''
  });

  // Team members state
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [availableUsers, setAvailableUsers] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    // Check permissions before loading
    if (!hasPermission(authState.user, 'TECHNICIAN')) {
      navigate('/projects');
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch available users for team members
        const usersResponse = await userService.getUsers();
        setAvailableUsers(usersResponse.results || usersResponse);

        // If in edit mode, fetch the project details
        if (isEditMode) {
          const projectResponse = await projectService.getProjectById(id);
          
          // Format dates
          const formattedData = {
            ...projectResponse,
            start_date: projectResponse.start_date ? parseISO(projectResponse.start_date) : new Date(),
            end_date: projectResponse.end_date ? parseISO(projectResponse.end_date) : null,
            tags: projectResponse.tags || []
          };
          
          setFormData(formattedData);
          
          // Fetch project members
          const membersResponse = await projectService.getProjectMembers(id);
          setMembers(membersResponse.results || membersResponse);
        } else {
          // For new projects, set current user's lab as default
          setFormData(prev => ({
            ...prev,
            lab: authState.user?.lab || ''
          }));
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load necessary data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
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

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
    }
  };

  const addTag = (tag) => {
    if (!tag) return;
    if (formData.tags.includes(tag)) return;
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMemberRoleChange = (e) => {
    setMemberRole(e.target.value);
  };

  const addTeamMember = async () => {
    if (!selectedUser) return;
    
    // Check if user is already added
    if (members.some(member => member.user.id === selectedUser.id)) {
      return;
    }
    
    if (isEditMode) {
      try {
        await projectService.addProjectMember(id, {
          user_id: selectedUser.id,
          role: memberRole
        });
        
        // Refresh members
        const membersResponse = await projectService.getProjectMembers(id);
        setMembers(membersResponse.results || membersResponse);
      } catch (err) {
        console.error('Error adding team member:', err);
        setError('Failed to add team member. Please try again.');
      }
    } else {
      // For new projects, just add to local state
      setMembers(prev => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          user: selectedUser,
          role: memberRole
        }
      ]);
    }
    
    // Reset selection
    setSelectedUser(null);
  };

  const removeTeamMember = async (memberId, userId) => {
    if (isEditMode) {
      try {
        await projectService.removeProjectMember(id, memberId);
        
        // Refresh members
        const membersResponse = await projectService.getProjectMembers(id);
        setMembers(membersResponse.results || membersResponse);
      } catch (err) {
        console.error('Error removing team member:', err);
        setError('Failed to remove team member. Please try again.');
      }
    } else {
      // For new projects, just remove from local state
      setMembers(prev => prev.filter(m => 
        (m.id !== memberId && m.user.id !== userId)
      ));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.name.trim()) errors.name = 'Project name is required';
    if (!formData.status) errors.status = 'Status is required';
    if (!formData.lab) errors.lab = 'Lab is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    
    // Date validation
    if (formData.end_date && formData.start_date && isAfter(formData.start_date, formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    // Budget validation (if provided)
    if (formData.budget && isNaN(Number(formData.budget))) {
      errors.budget = 'Budget must be a number';
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
      // Prepare data for submission
      const submitData = { ...formData };
      
      // Format dates for API
      if (submitData.start_date) {
        submitData.start_date = format(submitData.start_date, 'yyyy-MM-dd');
      }
      
      if (submitData.end_date) {
        submitData.end_date = format(submitData.end_date, 'yyyy-MM-dd');
      }
      
      let projectId = id;
      
      if (isEditMode) {
        await projectService.updateProject(id, submitData);
      } else {
        const newProject = await projectService.createProject(submitData);
        projectId = newProject.id;
        
        // Add team members to new project
        for (const member of members) {
          await projectService.addProjectMember(projectId, {
            user_id: member.user.id,
            role: member.role
          });
        }
      }
      
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error saving project:', err);
      setError(parseErrorResponse(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const labs = ['IVE', 'CEZERI', 'MEDTECH'];
  const statuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
  const roles = ['LEADER', 'MEMBER', 'CONTRIBUTOR', 'ADVISOR'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Filter out users who are already added as team members

    const filteredUsers = Array.isArray(availableUsers) 
    ? availableUsers.filter(user => !members.some(member => member.user.id === user.id))
    : [];

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
            {isEditMode ? 'Edit Project' : 'Create New Project'}
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
                  label="Project Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!validationErrors.status}>
                  <InputLabel>Project Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Project Status"
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.status && <FormHelperText>{validationErrors.status}</FormHelperText>}
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
                  multiline
                  rows={4}
                  label="Project Description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="Enter detailed description of the project..."
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Project Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.start_date}
                    onChange={(newValue) => handleDateChange('start_date', newValue)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required
                        error={!!validationErrors.start_date}
                        helperText={validationErrors.start_date}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date (Optional)"
                    value={formData.end_date}
                    onChange={(newValue) => handleDateChange('end_date', newValue)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!validationErrors.end_date}
                        helperText={validationErrors.end_date}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Additional Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget (Optional)"
                  name="budget"
                  type="number"
                  value={formData.budget || ''}
                  onChange={handleInputChange}
                  error={!!validationErrors.budget}
                  helperText={validationErrors.budget}
                  InputProps={{
                    startAdornment: <div style={{ marginRight: 8 }}>$</div>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Funding Source (Optional)"
                  name="funding_source"
                  value={formData.funding_source || ''}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Project Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      size="small"
                    />
                  ))}
                </Box>
                <TextField
                  fullWidth
                  label="Add Tags (Press Enter)"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyPress={handleTagInputKeyPress}
                  size="small"
                  helperText="Tags help categorize and search for projects"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Right column - Team members */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Team Members
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Add Team Member
              </Typography>
              <Autocomplete
                options={filteredUsers}
                getOptionLabel={(option) => `${option.username} (${option.email})`}
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select User"
                    fullWidth
                    margin="dense"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />
              
              <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={memberRole}
                    onChange={handleMemberRoleChange}
                    label="Role"
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addTeamMember}
                  disabled={!selectedUser}
                >
                  Add
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Current Team ({members.length})
            </Typography>
            
            {members.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No team members added yet.
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {members.map((member) => (
                  <Box 
                    key={member.id || `temp-${member.user.id}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {member.user.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => removeTeamMember(member.id, member.user.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

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
                  {isEditMode ? 'Update Project' : 'Create Project'}
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

export default ProjectForm;