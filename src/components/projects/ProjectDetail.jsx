import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Menu,
  MenuItem,
  Link
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';
import { TabContext, TabPanel } from '@mui/lab';

import projectService from '../../services/project.service';
import bookingService from '../../services/booking.service';
import { useAuth } from '../../contexts/AuthContext';
import { 
  formatDate, 
  formatDateTime, 
  formatTimeAgo, 
  getStatusColor, 
  hasPermission 
} from '../../utils/helpers';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  // State for project data
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState('1');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documentData, setDocumentData] = useState({ title: '', description: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [deletingItemType, setDeletingItemType] = useState(null); // 'document' or 'member'
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        // Fetch project details
        const projectData = await projectService.getProjectById(id);
        setProject(projectData);
        
        // Fetch project members
        const membersData = await projectService.getProjectMembers(id);
        setMembers(membersData.results || membersData);
        
        // Fetch project documents
        const documentsData = await projectService.getProjectDocuments(id);
        setDocuments(documentsData.results || documentsData);
        
        try {
            // Try to get project bookings from a more specific endpoint
            const bookingsData = await bookingService.getProjectBookings(id);
            setBookings(bookingsData.results || bookingsData);
          } catch (bookingErr) {
            console.error('Error fetching project bookings:', bookingErr);
            // Fallback to empty array if the endpoint doesn't exist or there's an error
            setBookings([]);
          }
        
        // Fetch project statistics
        const statsData = await projectService.getProjectStatistics(id);
        setStatistics(statsData);
        
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleBack = () => {
    navigate('/projects');
  };
  
  const handleEditProject = () => {
    navigate(`/projects/${id}/edit`);
  };
  
  const handleManageMembers = () => {
    navigate(`/projects/${id}/members`);
  };
  
  // Document handling
  const handleOpenUploadDialog = () => {
    setDocumentData({ title: '', description: '' });
    setDocumentFile(null);
    setUploadError(null);
    setUploadDialogOpen(true);
  };
  
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };
  
  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };
  
  const handleUploadDocument = async () => {
    if (!documentFile || !documentData.title) {
      setUploadError('File and title are required');
      return;
    }
    
    setUploadLoading(true);
    setUploadError(null);
    
    try {
      await projectService.uploadDocument(
        id, 
        documentData.title, 
        documentData.description,
        documentFile
      );
      
      // Refresh documents
      const documentsData = await projectService.getProjectDocuments(id);
      setDocuments(documentsData.results || documentsData);
      
      handleCloseUploadDialog();
    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };
  
  // Document menu handling
  const handleDocumentMenuOpen = (event, document) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };
  
  const handleDocumentMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDocument(null);
  };
  
  const handleDownloadDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      // This assumes the document has a download_url property
      // If not, you'll need to implement a download endpoint
      window.open(selectedDocument.download_url || selectedDocument.file_url, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
    } finally {
      handleDocumentMenuClose();
    }
  };
  
  const handleViewDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      // Open document in new tab
      window.open(selectedDocument.file_url, '_blank');
    } catch (err) {
      console.error('Error viewing document:', err);
    } finally {
      handleDocumentMenuClose();
    }
  };
  
  // Delete handlers
  const openConfirmDelete = (id, type) => {
    setDeletingItemId(id);
    setDeletingItemType(type);
    setConfirmDeleteOpen(true);
  };
  
  const closeConfirmDelete = () => {
    setConfirmDeleteOpen(false);
    setDeletingItemId(null);
    setDeletingItemType(null);
  };
  
  const handleDeleteConfirmed = async () => {
    if (!deletingItemId || !deletingItemType) return;
    
    try {
      if (deletingItemType === 'document') {
        await projectService.deleteDocument(id, deletingItemId);
        
        // Refresh documents
        const documentsData = await projectService.getProjectDocuments(id);
        setDocuments(documentsData.results || documentsData);
      } else if (deletingItemType === 'member') {
        await projectService.removeProjectMember(id, deletingItemId);
        
        // Refresh members
        const membersData = await projectService.getProjectMembers(id);
        setMembers(membersData.results || membersData);
      }
      
      closeConfirmDelete();
    } catch (err) {
      console.error(`Error deleting ${deletingItemType}:`, err);
      setError(`Failed to delete ${deletingItemType}. Please try again.`);
      closeConfirmDelete();
    }
  };
  
  // Permission checks
  const isProjectOwner = () => {
    return project && authState.user && project.created_by?.id === authState.user.id;
  };
  
  const canEditProject = () => {
    return isProjectOwner() || hasPermission(authState.user, 'ADMIN');
  };
  
  const canManageMembers = () => {
    return isProjectOwner() || hasPermission(authState.user, 'ADMIN');
  };
  
  const canManageDocuments = () => {
    // Project members can upload documents
    const isMember = members.some(member => member.id === authState.user?.id);
    return isProjectOwner() || isMember || hasPermission(authState.user, 'ADMIN');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }
  
  if (!project) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Project not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }
  
  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1">
              {project.title}
            </Typography>
            <Chip 
              label={project.status}
              sx={{
                ml: 2,
                bgcolor: getStatusColor(project.status),
                color: '#fff'
              }}
            />
          </Box>
          
          <Box>
            {canEditProject() && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditProject}
                sx={{ mr: 1 }}
              >
                Edit Project
              </Button>
            )}
            {canManageMembers() && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PeopleIcon />}
                onClick={handleManageMembers}
              >
                Manage Members
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {project.description || 'No description provided.'}
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Project Details
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      Start Date: <strong>{formatDate(project.start_date)}</strong>
                    </Typography>
                  </Box>
                  {project.end_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        End Date: <strong>{formatDate(project.end_date)}</strong>
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EngineeringIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      Lab: <strong>{project.lab}</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      Created by: <strong>{project.created_by?.username || 'Unknown'}</strong>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader title="Project Statistics" />
              <CardContent>
              {statistics ? (
                <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Team Size:</Typography>
                    <Typography variant="body2" fontWeight="bold">{statistics.team_size || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Documents:</Typography>
                    <Typography variant="body2" fontWeight="bold">{statistics.total_documents || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tasks:</Typography>
                    <Typography variant="body2" fontWeight="bold">{statistics.total_tasks || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Completed Tasks:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                    {statistics.completed_tasks || 0} ({statistics.task_completion_percentage?.toFixed(0) || 0}%)
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Resource Count:</Typography>
                    <Typography variant="body2" fontWeight="bold">{statistics.resource_count || 0}</Typography>
                </Box>
                {statistics.days_active > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Days Active:</Typography>
                    <Typography variant="body2" fontWeight="bold">{statistics.days_active}</Typography>
                    </Box>
                )}
                {statistics.days_remaining !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Days Remaining:</Typography>
                    <Typography variant="body2" fontWeight="bold">{statistics.days_remaining}</Typography>
                    </Box>
                )}
                </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No statistics available
                  </Typography>
                )}
              </CardContent>
            </Card>
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<ScheduleIcon />}
                component={RouterLink}
                to={`/bookings/new?project=${id}`}
                fullWidth
                sx={{ mb: 1 }}
              >
                Create New Booking
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="project tabs"
            >
              <Tab label="Team Members" value="1" />
              <Tab label="Documents" value="2" />
              <Tab label="Bookings" value="3" />
            </Tabs>
          </Box>
          
          {/* Team Members Tab */}
          <TabPanel value="1">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Team Members ({members.length})
              </Typography>
              {canManageMembers() && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleManageMembers}
                >
                  Add Member
                </Button>
              )}
            </Box>
            
            {members.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                This project has no team members yet.
              </Alert>
            ) : (
              <List>
                {members.map((member) => (
                  <ListItem 
                    key={member.id}
                    secondaryAction={
                      canManageMembers() && (
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => openConfirmDelete(member.id, 'member')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {member.username?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.username}
                      secondary={
                        <>
                          {member.email && (
                            <Typography component="span" variant="body2" color="text.primary">
                              {member.email}
                            </Typography>
                          )}
                          <br />
                            {/* If joined_at exists, format it, otherwise use first_name and last_name */}
                            {member.joined_at ? `Joined: ${formatDate(member.joined_at)}` : 
                            `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>
          
          {/* Documents Tab */}
          <TabPanel value="2">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Project Documents ({documents.length})
              </Typography>
              {canManageDocuments() && (
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={handleOpenUploadDialog}
                >
                  Upload Document
                </Button>
              )}
            </Box>
            
            {documents.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No documents have been uploaded to this project.
              </Alert>
            ) : (
              <List>
                {documents.map((document) => (
                  <ListItem 
                    key={document.id}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="more"
                        onClick={(e) => handleDocumentMenuOpen(e, document)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <AssignmentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={document.title}
                      secondary={
                        <>
                          {document.description && (
                            <Typography component="span" variant="body2" color="text.secondary" display="block">
                              {document.description}
                            </Typography>
                          )}
                          Uploaded by {document.uploaded_by?.username || 'Unknown'} | {formatDateTime(document.upload_date)}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>
          
          {/* Bookings Tab */}
          <TabPanel value="3">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Related Bookings ({bookings.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                component={RouterLink}
                to={`/bookings/new?project=${id}`}
              >
                New Booking
              </Button>
            </Box>
            
            {bookings.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No bookings are associated with this project.
              </Alert>
            ) : (
              <List>
                {bookings.map((booking) => (
                  <ListItemButton 
                    key={booking.id}
                    component={RouterLink}
                    to={`/bookings/${booking.id}`}
                  >
                    <ListItemText
                      primary={`${booking.resource_type}: ${booking.equipment?.name || booking.workspace?.name}`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {formatDate(booking.start_time)} {formatDate(booking.start_time, 'HH:mm')} - {formatDate(booking.end_time, 'HH:mm')}
                          </Typography>
                          <br />
                          {booking.purpose}
                        </>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </TabPanel>
        </TabContext>
      </Paper>
      
      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Project Document</DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            name="title"
            label="Document Title"
            fullWidth
            variant="outlined"
            value={documentData.title}
            onChange={handleDocumentInputChange}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={documentData.description}
            onChange={handleDocumentInputChange}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            fullWidth
          >
            {documentFile ? documentFile.name : 'Select File'}
            <input
              type="file"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained" 
            disabled={uploadLoading || !documentFile || !documentData.title}
          >
            {uploadLoading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Document Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleDocumentMenuClose}
      >
        <MenuItem onClick={handleViewDocument}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          View Document
        </MenuItem>
        <MenuItem onClick={handleDownloadDocument}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          Download
        </MenuItem>
        {canManageDocuments() && selectedDocument && (
          <MenuItem onClick={() => {
            openConfirmDelete(selectedDocument.id, 'document');
            handleDocumentMenuClose();
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
        )}
      </Menu>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={closeConfirmDelete}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deletingItemType === 'document' ? 
              'Are you sure you want to delete this document? This action cannot be undone.' : 
              'Are you sure you want to remove this member from the project?'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDelete}>Cancel</Button>
          <Button onClick={handleDeleteConfirmed} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectDetail;