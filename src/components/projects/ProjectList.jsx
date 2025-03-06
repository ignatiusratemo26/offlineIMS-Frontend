import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Pagination,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  AvatarGroup,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { formatDate, formatTimeAgo, hasPermission, getStatusColor } from '../../utils/helpers';
import projectService from '../../services/project.service';
import { useAuth } from '../../contexts/AuthContext';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    lab: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, [search, filters, page, pageSize]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        search: search,
        page: page,
        page_size: pageSize,
        ...filters
      };

      const response = await projectService.getProjects(params);
      setProjects(response.results || response);
      setTotalItems(response.count || response.length);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
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
      status: '',
      lab: ''
    });
    setSearch('');
    setPage(1);
  };

  const handleActionMenuOpen = (event, project) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedProject(null);
  };

  const handleAddProject = () => {
    navigate('/projects/new');
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
    handleActionMenuClose();
  };

  const handleEditProject = (projectId) => {
    navigate(`/projects/${projectId}/edit`);
    handleActionMenuClose();
  };

  const handleManageMembers = (projectId) => {
    navigate(`/projects/${projectId}/members`);
    handleActionMenuClose();
  };

  const handleManageDocuments = (projectId) => {
    navigate(`/projects/${projectId}/documents`);
    handleActionMenuClose();
  };

  const isOwner = (project) => {
    return project.created_by?.id === authState.user?.id;
  };

  const isMember = (project) => {
    // This is a simplified check - you might need to fetch actual members
    return true; // For now, assume the user is a member of all displayed projects
  };

  const canManageProject = (project) => {
    return isOwner(project) || hasPermission(authState.user, 'ADMIN');
  };

  // Status options for filter
  const statuses = ['ACTIVE', 'PENDING', 'COMPLETED'];
  const labs = ['IVE', 'CEZERI', 'MEDTECH'];

  const renderGridView = () => {
    if (projects.length === 0) {
      return (
        <Alert severity="info">No projects found matching your criteria.</Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item key={project.id} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" component="div" noWrap>
                    {project.name}
                  </Typography>
                  <Chip 
                    label={project.status} 
                    size="small" 
                    sx={{
                      bgcolor: getStatusColor(project.status),
                      color: '#fff'
                    }} 
                  />
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    height: 60
                  }}
                >
                  {project.description || 'No description provided.'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(project.start_date)}
                    {project.end_date && ` - ${formatDate(project.end_date)}`}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Lab: {project.lab}
                  </Typography>
                </Box>
                
                {project.member_count > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <AvatarGroup max={4} sx={{ ml: -1 }}>
                      {/* This would be populated with actual members if available */}
                      <Avatar alt="Member" sx={{ width: 28, height: 28 }}>M1</Avatar>
                      {project.member_count > 1 && (
                        <Avatar alt="Member" sx={{ width: 28, height: 28 }}>M2</Avatar>
                      )}
                    </AvatarGroup>
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {project.member_count} member{project.member_count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button 
                  size="small" 
                  startIcon={<OpenInNewIcon />}
                  onClick={() => handleViewProject(project.id)}
                >
                  View
                </Button>
                <IconButton 
                  size="small" 
                  onClick={(e) => handleActionMenuOpen(e, project)}
                  aria-label="more actions"
                >
                  <MoreVertIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderTableView = () => {
    return (
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Lab</TableCell>
              <TableCell>Timeline</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="info">No projects found matching your criteria.</Alert>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow 
                  key={project.id}
                  hover
                  sx={{ 
                    '&:hover': { 
                      bgcolor: 'action.hover',
                      cursor: 'pointer' 
                    } 
                  }}
                  onClick={() => handleViewProject(project.id)}
                >
                  <TableCell>
                    <Typography variant="subtitle1">{project.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {project.member_count || 0} member{project.member_count !== 1 ? 's' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={project.status} 
                      size="small" 
                      sx={{
                        bgcolor: getStatusColor(project.status),
                        color: '#fff'
                      }} 
                    />
                  </TableCell>
                  <TableCell>{project.lab}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(project.start_date)}
                      {project.end_date && ` - ${formatDate(project.end_date)}`}
                    </Typography>
                    {project.start_date && (
                      <Typography variant="caption" color="text.secondary">
                        Started {formatTimeAgo(project.start_date)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.created_by?.username || 'Unknown'}
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Tooltip title="View Project">
                        <IconButton onClick={(e) => {
                          e.stopPropagation();
                          handleViewProject(project.id);
                        }}>
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                      {canManageProject(project) && (
                        <Tooltip title="Edit Project">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project.id);
                          }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="More Actions">
                        <IconButton onClick={(e) => {
                          e.stopPropagation();
                          handleActionMenuOpen(e, project);
                        }}>
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Projects
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
              startIcon={<ViewModuleIcon />}
              sx={{ minWidth: 100 }}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              startIcon={<ViewListIcon />}
              sx={{ minWidth: 100 }}
            >
              Table
            </Button>
            {hasPermission(authState.user, 'TECHNICIAN') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddProject}
              >
                New Project
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search projects..."
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
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
        </Box>

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lab</InputLabel>
                  <Select
                    name="lab"
                    value={filters.lab}
                    onChange={handleFilterChange}
                    label="Lab"
                  >
                    <MenuItem value="">All Labs</MenuItem>
                    {labs.map((lab) => (
                      <MenuItem key={lab} value={lab}>
                        {lab}
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

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {viewMode === 'grid' ? renderGridView() : renderTableView()}
            
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

      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => handleViewProject(selectedProject?.id)}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          View Project
        </MenuItem>
        
        {selectedProject && canManageProject(selectedProject) && (
          <MenuItem onClick={() => handleEditProject(selectedProject.id)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit Project
          </MenuItem>
        )}
        
        {selectedProject && (isMember(selectedProject) || canManageProject(selectedProject)) && (
          <MenuItem onClick={() => handleManageMembers(selectedProject.id)}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            Manage Members
          </MenuItem>
        )}
        
        {selectedProject && (isMember(selectedProject) || canManageProject(selectedProject)) && (
          <MenuItem onClick={() => handleManageDocuments(selectedProject.id)}>
            <ListItemIcon>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            Manage Documents
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ProjectList;