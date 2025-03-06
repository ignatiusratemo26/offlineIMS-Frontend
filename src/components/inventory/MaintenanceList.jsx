import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,Typography,Button,TextField,InputAdornment,IconButton,Chip,FormControl,
  InputLabel, Select,MenuItem,Grid,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Pagination,Alert,
  CircularProgress, Tooltip , Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Engineering as EngineeringIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import inventoryService from '../../services/inventory.service';
import { formatDate, formatTimeAgo, hasPermission } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const MaintenanceList = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    is_completed: '',
    lab: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    const fetchMaintenanceRecords = async () => {
      setLoading(true);
      try {
        const params = {
          search: search,
          page: page,
          page_size: pageSize,
          ...filters,
        };
        
        const response = await inventoryService.getMaintenanceRecords(params);
        setMaintenanceRecords(response.results || response);
        setTotalItems(response.count || response.length);
      } catch (err) {
        console.error('Error fetching maintenance records:', err);
        setError('Failed to load maintenance records. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaintenanceRecords();
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
      is_completed: '',
      lab: ''
    });
    setSearch('');
    setPage(1);
  };

  const handleEquipmentClick = (equipmentId) => {
    navigate(`/equipment/${equipmentId}`);
  };

  const handleCompleteMaintenance = (record) => {
    setSelectedRecord(record);
    setCompleteNotes('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedRecord(null);
    setCompleteNotes('');
  };

  const submitCompleteMaintenance = async () => {
    if (!selectedRecord) return;
    
    setActionLoading(true);
    try {
      await inventoryService.completeMaintenanceEquipment(selectedRecord.equipment.id, {
        notes: completeNotes,
        maintenance_record_id: selectedRecord.id
      });
      
      // Refresh the data
      const params = {
        search: search,
        page: page,
        page_size: pageSize,
        ...filters,
      };
      
      const response = await inventoryService.getMaintenanceRecords(params);
      setMaintenanceRecords(response.results || response);
      closeDialog();
    } catch (err) {
      console.error('Error completing maintenance:', err);
      setError('Failed to complete maintenance. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const labs = ['IVE', 'CEZERI', 'MEDTECH'];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Maintenance Records
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search maintenance records..."
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

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="is_completed"
                    value={filters.is_completed}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="false">Scheduled</MenuItem>
                    <MenuItem value="true">Completed</MenuItem>
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
        ) : maintenanceRecords.length === 0 ? (
          <Alert severity="info">No maintenance records found.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Equipment</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Technician</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Button
                          variant="text"
                          onClick={() => handleEquipmentClick(record.equipment.id)}
                        >
                          {record.equipment.name}
                        </Button>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {record.equipment.serial_number || 'No SN'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDate(record.maintenance_date)}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {formatTimeAgo(record.maintenance_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {record.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={record.is_completed ? <CheckCircleIcon /> : <CalendarIcon />}
                          label={record.is_completed ? 'Completed' : 'Scheduled'}
                          color={record.is_completed ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {record.performed_by ? record.performed_by.username : 'Not assigned'}
                      </TableCell>
                      <TableCell>
                        {!record.is_completed && hasPermission(authState.user, 'TECHNICIAN') && (
                          <Tooltip title="Complete Maintenance">
                            <IconButton 
                              color="success" 
                              onClick={() => handleCompleteMaintenance(record)}
                            >
                              <BuildIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Equipment">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEquipmentClick(record.equipment.id)}
                          >
                            <EngineeringIcon />
                          </IconButton>
                        </Tooltip>
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
      
      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>Complete Maintenance</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter notes about the maintenance that was performed on{' '}
            <strong>{selectedRecord?.equipment?.name}</strong>.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Maintenance Notes"
            fullWidth
            multiline
            rows={4}
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={submitCompleteMaintenance} 
            color="primary" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Complete Maintenance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceList;