import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Grid,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import inventoryService from '../../services/inventory.service';
import { hasPermission } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryData, setCategoryData] = useState({ name: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  const { authState } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const params = {
          search: search,
          page: page,
          page_size: pageSize
        };
        
        const response = await inventoryService.getCategories(params);
        setCategories(response.results || response);
        setTotalItems(response.count || response.length);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [search, page, pageSize]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setCategoryData({ name: '', description: '' });
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setDialogMode('edit');
    setCategoryData({ 
      name: category.name, 
      description: category.description || '' 
    });
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const openDeleteDialog = (category) => {
    setDialogMode('delete');
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setCategoryData({ name: '', description: '' });
    setSelectedCategory(null);
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCategory = async () => {
    setActionLoading(true);
    try {
      if (dialogMode === 'add') {
        await inventoryService.createCategory(categoryData);
      } else if (dialogMode === 'edit') {
        await inventoryService.updateCategory(selectedCategory.id, categoryData);
      }
      
      // Refresh the data
      const params = {
        search: search,
        page: page,
        page_size: pageSize
      };
      
      const response = await inventoryService.getCategories(params);
      setCategories(response.results || response);
      setTotalItems(response.count || response.length);
      closeDialog();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    setActionLoading(true);
    try {
      await inventoryService.deleteCategory(selectedCategory.id);
      
      // Refresh the data
      const params = {
        search: search,
        page: page,
        page_size: pageSize
      };
      
      const response = await inventoryService.getCategories(params);
      setCategories(response.results || response);
      setTotalItems(response.count || response.length);
      closeDialog();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderCategoryGrid = () => {
    if (categories.length === 0) {
      return (
        <Alert severity="info">No categories found.</Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item key={category.id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 60 }}>
                  {category.description || "No description provided."}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Equipment items: {category.equipment_count || 0}
                </Typography>
              </CardContent>
              {hasPermission(authState.user, 'TECHNICIAN') && (
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => openEditDialog(category)}
                  >
                    Edit
                  </Button>
                  {hasPermission(authState.user, 'ADMIN') && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => openDeleteDialog(category)}
                    >
                      Delete
                    </Button>
                  )}
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderCategoryTable = () => {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Equipment Count</TableCell>
              {hasPermission(authState.user, 'TECHNICIAN') && (
                <TableCell>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasPermission(authState.user, 'TECHNICIAN') ? 4 : 3}>
                  <Alert severity="info">No categories found.</Alert>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Typography variant="subtitle1">
                      {category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {category.description || "No description provided."}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {category.equipment_count || 0}
                  </TableCell>
                  {hasPermission(authState.user, 'TECHNICIAN') && (
                    <TableCell>
                      <Tooltip title="Edit Category">
                        <IconButton 
                          color="primary" 
                          onClick={() => openEditDialog(category)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {hasPermission(authState.user, 'ADMIN') && (
                        <Tooltip title="Delete Category">
                          <IconButton 
                            color="error" 
                            onClick={() => openDeleteDialog(category)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
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
            Equipment Categories
          </Typography>
          <Box>
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
              sx={{ mr: 1, minWidth: 80 }}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              sx={{ mr: 2, minWidth: 80 }}
            >
              Table
            </Button>
            {hasPermission(authState.user, 'TECHNICIAN') && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={openAddDialog}
              >
                Add Category
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search categories..."
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
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'grid' ? renderCategoryGrid() : renderCategoryTable()}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={Math.ceil(totalItems / pageSize)} 
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        {dialogMode === 'delete' ? (
          <>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Are you sure you want to delete the category "{selectedCategory?.name}"?
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                This action cannot be undone. All equipment associated with this category will need to be reassigned.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleDeleteCategory} 
                color="error" 
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>{dialogMode === 'add' ? 'Add New Category' : 'Edit Category'}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Category Name"
                fullWidth
                value={categoryData.name}
                onChange={handleCategoryInputChange}
                variant="outlined"
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={categoryData.description}
                onChange={handleCategoryInputChange}
                variant="outlined"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleSaveCategory} 
                color="primary" 
                variant="contained"
                disabled={actionLoading || !categoryData.name.trim()}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CategoryList;