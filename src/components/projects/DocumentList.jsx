import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
  CircularProgress,
  Alert,
  Menu,
  MenuItem as MenuOption,
  ListItemIcon,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon
} from '@mui/icons-material';

import projectService from '../../services/project.service';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime, formatFileSize, hasPermission } from '../../utils/helpers';

const DocumentList = () => {
  // Get project ID from URL if present
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  // State
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and pagination
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    project_id: projectId || searchParams.get('project_id') || '',
    file_type: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    project_id: projectId || '',
    title: '',
    description: ''
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(null);
  
  // Document action menu
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // File types for filtering
  const fileTypes = [
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'doc,docx', label: 'Word Documents' },
    { value: 'xls,xlsx', label: 'Excel Spreadsheets' },
    { value: 'ppt,pptx', label: 'PowerPoint Presentations' },
    { value: 'jpg,jpeg,png,gif', label: 'Images' },
    { value: 'txt,md', label: 'Text Files' }
  ];

  useEffect(() => {
    fetchDocuments();
    
    // Only fetch projects if not viewing from a specific project
    if (!projectId) {
      fetchProjects();
    }
  }, [projectId, search, filters, page, pageSize]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let response;
      
      if (projectId) {
        // If we're in a specific project, get documents for that project only
        response = await projectService.getProjectDocuments(projectId, {
          search,
          page,
          page_size: pageSize,
          file_type: filters.file_type
        });
      } else {
        // Otherwise, get all documents with filters
        response = await projectService.getAllDocuments({
          search,
          page,
          page_size: pageSize,
          ...filters
        });
      }
      
      setDocuments(response.results || response);
      setTotalItems(response.count || response.length);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      // Fetch projects the user has access to
      const response = await projectService.getProjects({
        user_id: authState.user?.id
      });
      
      setProjects(response.results || response);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset to first page on new filter
  };

  const clearFilters = () => {
    setFilters({
      project_id: projectId || '',
      file_type: ''
    });
    setSearch('');
    setPage(1);
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

  const handleViewDocument = () => {
    if (!selectedDocument) return;
    
    try {
      window.open(selectedDocument.file_url, '_blank');
    } catch (err) {
      console.error('Error viewing document:', err);
    } finally {
      handleDocumentMenuClose();
    }
  };

  const handleDownloadDocument = () => {
    if (!selectedDocument) return;
    
    try {
      // Use download_url if available, otherwise file_url
      window.open(selectedDocument.download_url || selectedDocument.file_url, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
    } finally {
      handleDocumentMenuClose();
    }
  };

  const handleDeleteClick = () => {
    setDeletingDocument(selectedDocument);
    setConfirmDeleteOpen(true);
    handleDocumentMenuClose();
  };

  // Upload dialog handling
  const handleOpenUploadDialog = () => {
    setUploadData({
      project_id: projectId || '',
      title: '',
      description: ''
    });
    setUploadFile(null);
    setUploadError(null);
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };

  const handleUploadInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadData.title || !uploadData.project_id) {
      setUploadError('Project, title, and file are required');
      return;
    }
    
    setUploadLoading(true);
    setUploadError(null);
    
    try {
      await projectService.uploadDocument(
        uploadData.project_id,
        uploadData.title,
        uploadData.description,
        uploadFile
      );
      
      // Refresh documents
      fetchDocuments();
      handleCloseUploadDialog();
    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Delete document handling
  const handleConfirmDelete = async () => {
    if (!deletingDocument) return;
    
    try {
      await projectService.deleteDocument(deletingDocument.project_id, deletingDocument.id);
      
      // Refresh documents
      fetchDocuments();
      setConfirmDeleteOpen(false);
      setDeletingDocument(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    }
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleBack = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/projects');
    }
  };

  // Check if user can upload documents
  const canUploadDocuments = () => {
    return hasPermission(authState.user, 'TECHNICIAN');
  };

  // Check if user can delete a document
  const canDeleteDocument = (document) => {
    if (!document) return false;
    
    return (
      hasPermission(authState.user, 'ADMIN') || 
      (document.uploaded_by?.id === authState.user?.id) ||
      document.is_owner
    );
  };

  // Get file icon based on extension
  const getFileIcon = (filename) => {
    if (!filename) return <DescriptionIcon />;
    
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <DescriptionIcon color="error" />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon color="primary" />;
      case 'xls':
      case 'xlsx':
        return <DescriptionIcon color="success" />;
      case 'ppt':
      case 'pptx':
        return <DescriptionIcon color="warning" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <DescriptionIcon color="secondary" />;
      default:
        return <DescriptionIcon />;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h5" component="h1">
              {projectId ? 'Project Documents' : 'All Documents'}
            </Typography>
          </Box>
          
          {canUploadDocuments() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={handleOpenUploadDialog}
            >
              Upload Document
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search documents..."
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              {!projectId && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Project</InputLabel>
                    <Select
                      name="project_id"
                      value={filters.project_id}
                      onChange={handleFilterChange}
                      label="Project"
                    >
                      <MenuItem value="">All Projects</MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} sm={projectId ? 12 : 6}>
                <FormControl fullWidth size="small">
                  <InputLabel>File Type</InputLabel>
                  <Select
                    name="file_type"
                    value={filters.file_type}
                    onChange={handleFilterChange}
                    label="File Type"
                  >
                    <MenuItem value="">All File Types</MenuItem>
                    {fileTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button 
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Alert severity="info">
            No documents found. {canUploadDocuments() && 'Click "Upload Document" to add a new document.'}
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    {!projectId && <TableCell>Project</TableCell>}
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>File Size</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getFileIcon(document.filename)}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body1">
                              {document.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {document.filename}
                            </Typography>
                            {document.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {document.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      
                      {!projectId && (
                        <TableCell>
                          <Button
                            variant="text"
                            size="small"
                            startIcon={<FolderIcon fontSize="small" />}
                            onClick={() => handleViewProject(document.project_id)}
                          >
                            {document.project_name}
                          </Button>
                        </TableCell>
                      )}
                      
                      <TableCell>
                        {document.uploaded_by?.username || 'Unknown'}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(document.upload_date)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {formatFileSize(document.file_size)}
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box>
                          <Tooltip title="View">
                            <IconButton onClick={() => {
                              setSelectedDocument(document);
                              handleViewDocument();
                            }}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Download">
                            <IconButton onClick={() => {
                              setSelectedDocument(document);
                              handleDownloadDocument();
                            }}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <IconButton 
                            onClick={(e) => handleDocumentMenuOpen(e, document)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={Math.ceil(totalItems / pageSize)} 
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </>
        )}
      </Paper>

      {/* Document Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleDocumentMenuClose}
      >
        <MenuOption onClick={handleViewDocument}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          View Document
        </MenuOption>
        <MenuOption onClick={handleDownloadDocument}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          Download Document
        </MenuOption>
        {selectedDocument && canDeleteDocument(selectedDocument) && (
          <>
            <Divider />
            <MenuOption onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              Delete Document
            </MenuOption>
          </>
        )}
      </Menu>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Document</DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          {!projectId && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Project</InputLabel>
              <Select
                name="project_id"
                value={uploadData.project_id}
                onChange={handleUploadInputChange}
                label="Project"
              >
                <MenuItem value="" disabled>Select a project</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <TextField
            margin="normal"
            name="title"
            label="Document Title"
            fullWidth
            required
            value={uploadData.title}
            onChange={handleUploadInputChange}
          />
          
          <TextField
            margin="normal"
            name="description"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={uploadData.description}
            onChange={handleUploadInputChange}
          />
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              {uploadFile ? uploadFile.name : 'Select File'}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {uploadFile && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                File Size: {formatFileSize(uploadFile.size)}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleUploadDocument}
            variant="contained" 
            disabled={uploadLoading || !uploadFile || !uploadData.title || (!projectId && !uploadData.project_id)}
          >
            {uploadLoading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the document "{deletingDocument?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentList;