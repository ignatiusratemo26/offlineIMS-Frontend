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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Skeleton,
  Alert,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import inventoryService from '../../services/inventory.service';
import { formatDate, getStatusColor, hasPermission } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentList = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    lab: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  
  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {
          search: search,
          page: page,
          page_size: pageSize,
          ...filters,
        };
        
        const response = await inventoryService.getEquipment(params);
        setEquipment(response.results || response);
        setTotalItems(response.count || response.length);
        
        // Also fetch categories for filtering
        const categoriesResponse = await inventoryService.getCategories();
        setCategories(categoriesResponse.results || categoriesResponse);
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Failed to load equipment. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [search, filters, page, pageSize]);

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
      category: '',
      status: '',
      lab: ''
    });
    setSearch('');
    setPage(1);
  };

  const handleAddEquipment = () => {
    navigate('/equipment/new');
  };

  const handleEquipmentClick = (equipmentId) => {
    navigate(`/equipment/${equipmentId}`);
  };
  
  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'serial_number', headerName: 'Serial Number', flex: 1 },
    { field: 'category', headerName: 'Category', flex: 1, valueGetter: (params) => params.row.category?.name || 'N/A' },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 0.7,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          sx={{ 
            backgroundColor: getStatusColor(params.value),
            color: '#fff'
          }}
        />
      )
    },
    { field: 'lab', headerName: 'Lab', flex: 0.5 },
    { 
      field: 'last_maintenance_date', 
      headerName: 'Last Maintained', 
      flex: 0.8,
      valueFormatter: (params) => formatDate(params.value) 
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      flex: 0.5, 
      sortable: false,
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => handleEquipmentClick(params.row.id)}
        >
          View
        </Button>
      ) 
    }
  ];

  const renderEquipmentGrid = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (equipment.length === 0) {
      return (
        <Alert severity="info">
          No equipment found. Try adjusting your filters or adding new equipment.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {equipment.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' } 
              }}
              onClick={() => handleEquipmentClick(item.id)}
            >
              <CardMedia
                component="img"
                height="140"
                image={item.image || 'https://via.placeholder.com/300x140?text=No+Image'}
                alt={item.name}
              />
              <CardContent>
                <Typography variant="h6" noWrap>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {item.category?.name || 'No Category'}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={item.status} 
                    size="small" 
                    sx={{ 
                      backgroundColor: getStatusColor(item.status),
                      color: '#fff'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.lab}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={(e) => {
                  e.stopPropagation();
                  handleEquipmentClick(item.id);
                }}>
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderEquipmentTable = () => {
    return (
      <DataGrid
        rows={equipment}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize } },
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        loading={loading}
        getRowId={(row) => row.id}
        sx={{
          '& .MuiDataGrid-cell:hover': {
            cursor: 'pointer',
          },
        }}
        onRowClick={(params) => handleEquipmentClick(params.row.id)}
      />
    );
  };

  const statuses = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'SHARED'];
  const labs = ['IVE', 'CEZERI', 'MEDTECH'];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Equipment Inventory
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={viewMode === 'grid' ? <FilterListIcon /> : <FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            {hasPermission(authState.user, 'TECHNICIAN') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddEquipment}
              >
                Add Equipment
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search equipment..."
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
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
            sx={{ ml: 2, minWidth: 100 }}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
            sx={{ ml: 1, minWidth: 100 }}
          >
            Table
          </Button>
        </Box>

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
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

      <Paper sx={{ p: 3 }}>
        {viewMode === 'grid' ? renderEquipmentGrid() : renderEquipmentTable()}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={Math.ceil(totalItems / pageSize)} 
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default EquipmentList;