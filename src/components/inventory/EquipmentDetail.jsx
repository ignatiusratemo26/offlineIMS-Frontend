import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Engineering as MaintenanceIcon,
  Inventory as InventoryIcon,
  SwapHoriz as TransferIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import inventoryService from '../../services/inventory.service';
import { formatDate, formatDateTime, getStatusColor, hasPermission } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState('1');
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [actionData, setActionData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const data = await inventoryService.getEquipmentById(id);
        setEquipment(data);
        
        // Fetch related maintenance records
        const maintenanceData = await inventoryService.getMaintenanceRecords({
          equipment_id: id
        });
        setMaintenanceRecords(maintenanceData.results || maintenanceData);
        
        // Fetch usage logs
        const usageData = await inventoryService.getUsageLogs({
          equipment_id: id
        });
        setUsageLogs(usageData.results || usageData);
        
      } catch (err) {
        console.error('Error fetching equipment details:', err);
        setError('Failed to load equipment details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEquipment();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/equipment');
  };

  const handleEdit = () => {
    navigate(`/equipment/${id}/edit`);
  };

  const openDialog = (type) => {
    setDialogType(type);
    setActionData({});
    setActionError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActionData({});
    setActionError(null);
  };

  const handleDialogInputChange = (e) => {
    const { name, value } = e.target;
    setActionData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaintenanceAction = async (isScheduling) => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      if (isScheduling) {
        await inventoryService.scheduleMaintenanceEquipment(id, actionData);
      } else {
        await inventoryService.completeMaintenanceEquipment(id, actionData);
      }
      
      // Refresh equipment data
      const updatedEquipment = await inventoryService.getEquipmentById(id);
      setEquipment(updatedEquipment);
      
      // Refresh maintenance records
      const maintenanceData = await inventoryService.getMaintenanceRecords({
        equipment_id: id
      });
      setMaintenanceRecords(maintenanceData.results || maintenanceData);
      
      closeDialog();
    } catch (err) {
      console.error('Error performing maintenance action:', err);
      setActionError('Failed to process maintenance action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckoutAction = async () => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      await inventoryService.checkoutEquipment(id, actionData);
      
      // Refresh equipment data
      const updatedEquipment = await inventoryService.getEquipmentById(id);
      setEquipment(updatedEquipment);
      
      // Refresh usage logs
      const usageData = await inventoryService.getUsageLogs({
        equipment_id: id
      });
      setUsageLogs(usageData.results || usageData);
      
      closeDialog();
    } catch (err) {
      console.error('Error checking out equipment:', err);
      setActionError('Failed to checkout equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckinAction = async () => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      await inventoryService.checkinEquipment(id, actionData);
      
      // Refresh equipment data
      const updatedEquipment = await inventoryService.getEquipmentById(id);
      setEquipment(updatedEquipment);
      
      // Refresh usage logs
      const usageData = await inventoryService.getUsageLogs({
        equipment_id: id
      });
      setUsageLogs(usageData.results || usageData);
      
      closeDialog();
    } catch (err) {
      console.error('Error checking in equipment:', err);
      setActionError('Failed to checkin equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferAction = async () => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      await inventoryService.transferEquipment(id, actionData);
      
      // Refresh equipment data
      const updatedEquipment = await inventoryService.getEquipmentById(id);
      setEquipment(updatedEquipment);
      
      closeDialog();
    } catch (err) {
      console.error('Error transferring equipment:', err);
      setActionError('Failed to transfer equipment');
    } finally {
      setActionLoading(false);
    }
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
          Back to Equipment List
        </Button>
      </Box>
    );
  }

  if (!equipment) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Equipment not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Equipment List
        </Button>
      </Box>
    );
  }

  const renderActionButtons = () => {
    const isAdmin = hasPermission(authState.user, 'ADMIN');
    const isTechnician = hasPermission(authState.user, 'TECHNICIAN');
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back
        </Button>

        {(isAdmin || isTechnician) && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
        )}

        {equipment.status === 'AVAILABLE' && (
          <Button 
            variant="contained"
            color="primary"
            startIcon={<InventoryIcon />}
            onClick={() => openDialog('checkout')}
          >
            Check Out
          </Button>
        )}

        {equipment.status === 'IN_USE' && (
          <Button 
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => openDialog('checkin')}
          >
            Check In
          </Button>
        )}

        {(isAdmin || isTechnician) && (
          <>
            {equipment.status !== 'MAINTENANCE' ? (
              <Button
                variant="contained"
                color="warning"
                startIcon={<MaintenanceIcon />}
                onClick={() => openDialog('scheduleMaintenance')}
              >
                Schedule Maintenance
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => openDialog('completeMaintenance')}
              >
                Complete Maintenance
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="contained"
                color="info"
                startIcon={<TransferIcon />}
                onClick={() => openDialog('transfer')}
              >
                Transfer
              </Button>
            )}
          </>
        )}
      </Box>
    );
  };

  const renderDialogContent = () => {
    switch (dialogType) {
      case 'scheduleMaintenance':
        return (
          <>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Please provide details for the maintenance.
              </DialogContentText>
              <TextField
                margin="dense"
                name="description"
                label="Maintenance Description"
                fullWidth
                multiline
                rows={3}
                value={actionData.description || ''}
                onChange={handleDialogInputChange}
              />
              <TextField
                margin="dense"
                name="maintenance_date"
                label="Maintenance Date"
                type="date"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                value={actionData.maintenance_date || ''}
                onChange={handleDialogInputChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={() => handleMaintenanceAction(true)} 
                disabled={actionLoading}
                variant="contained"
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Schedule'}
              </Button>
            </DialogActions>
          </>
        );
      
      case 'completeMaintenance':
        return (
          <>
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Please provide details about the completed maintenance.
              </DialogContentText>
              <TextField
                margin="dense"
                name="notes"
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={actionData.notes || ''}
                onChange={handleDialogInputChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={() => handleMaintenanceAction(false)} 
                disabled={actionLoading}
                variant="contained"
                color="success"
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Complete Maintenance'}
              </Button>
            </DialogActions>
          </>
        );
      
      case 'checkout':
        return (
          <>
            <DialogTitle>Check Out Equipment</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Please provide the reason for checking out this equipment.
              </DialogContentText>
              <TextField
                margin="dense"
                name="purpose"
                label="Purpose"
                fullWidth
                value={actionData.purpose || ''}
                onChange={handleDialogInputChange}
              />
              <TextField
                margin="dense"
                name="notes"
                label="Notes (Optional)"
                fullWidth
                multiline
                rows={2}
                value={actionData.notes || ''}
                onChange={handleDialogInputChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleCheckoutAction} 
                disabled={actionLoading}
                variant="contained"
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Check Out'}
              </Button>
            </DialogActions>
          </>
        );
      
      case 'checkin':
        return (
          <>
            <DialogTitle>Check In Equipment</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Please provide any notes about the equipment's condition.
              </DialogContentText>
              <TextField
                margin="dense"
                name="notes"
                label="Notes (Optional)"
                fullWidth
                multiline
                rows={3}
                value={actionData.notes || ''}
                onChange={handleDialogInputChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleCheckinAction} 
                disabled={actionLoading}
                variant="contained"
                color="success"
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Check In'}
              </Button>
            </DialogActions>
          </>
        );
      
      case 'transfer':
        return (
          <>
            <DialogTitle>Transfer Equipment</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Transfer this equipment to another lab.
              </DialogContentText>
              <FormControl fullWidth margin="dense">
                <InputLabel>Destination Lab</InputLabel>
                <Select
                  name="to_lab"
                  value={actionData.to_lab || ''}
                  onChange={handleDialogInputChange}
                  label="Destination Lab"
                >
                  <MenuItem value="IVE">IVE</MenuItem>
                  <MenuItem value="CEZERI">CEZERI</MenuItem>
                  <MenuItem value="MEDTECH">MEDTECH</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                name="notes"
                label="Transfer Notes"
                fullWidth
                multiline
                rows={2}
                value={actionData.notes || ''}
                onChange={handleDialogInputChange}
              />
              <TextField
                margin="dense"
                name="return_date"
                label="Return Date (Optional)"
                type="date"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                value={actionData.return_date || ''}
                onChange={handleDialogInputChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleTransferAction} 
                disabled={actionLoading || !actionData.to_lab || actionData.to_lab === equipment.lab}
                variant="contained"
                color="info"
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Transfer'}
              </Button>
            </DialogActions>
          </>
        );
      
      default:
        return null;
    }
  };

  // Render equipment details
  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}
        
        {renderActionButtons()}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box
              component="img"
              src={equipment.image || 'https://via.placeholder.com/400x300?text=No+Image'}
              alt={equipment.name}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 300,
                objectFit: 'contain',
                borderRadius: 1,
                mb: 2,
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Chip
                label={equipment.status}
                sx={{
                  backgroundColor: getStatusColor(equipment.status),
                  color: '#fff',
                  fontWeight: 'bold',
                  px: 1,
                }}
              />
            </Box>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Lab: {equipment.lab}
            </Typography>
            {equipment.location && (
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Location: {equipment.location}
              </Typography>
            )}
            {equipment.category && (
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Category: {equipment.category.name}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {equipment.name}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" width="30%">
                      Serial Number
                    </TableCell>
                    <TableCell>{equipment.serial_number || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Barcode
                    </TableCell>
                    <TableCell>{equipment.barcode || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Purchase Date
                    </TableCell>
                    <TableCell>{formatDate(equipment.purchase_date) || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Last Maintenance
                    </TableCell>
                    <TableCell>{formatDate(equipment.last_maintenance_date) || 'Never'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Next Maintenance Due
                    </TableCell>
                    <TableCell>
                      {equipment.next_maintenance_date ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {formatDate(equipment.next_maintenance_date)}
                          <DateRangeIcon sx={{ ml: 1, color: 'primary.main' }} fontSize="small" />
                        </Box>
                      ) : (
                        'Not scheduled'
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {equipment.description || 'No description available.'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="equipment details tabs"
            >
              <Tab label="Maintenance History" value="1" />
              <Tab label="Usage History" value="2" />
              {equipment.status === 'SHARED' && <Tab label="Transfer History" value="3" />}
            </Tabs>
          </Box>
          
          <TabPanel value="1">
            {maintenanceRecords.length === 0 ? (
              <Alert severity="info">No maintenance records found.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableBody>
                    {maintenanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Typography variant="subtitle1">{formatDate(record.maintenance_date)}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.is_completed ? 'Completed' : 'Scheduled'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">{record.description}</Typography>
                          {record.notes && (
                            <Typography variant="body2" color="text.secondary">
                              Notes: {record.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            By: {record.performed_by?.username || 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
          
          <TabPanel value="2">
            {usageLogs.length === 0 ? (
              <Alert severity="info">No usage history found.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableBody>
                    {usageLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Typography variant="subtitle1">
                            {formatDateTime(log.check_out_time)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {log.check_in_time 
                              ? `Returned: ${formatDateTime(log.check_in_time)}` 
                              : 'Currently checked out'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">{log.purpose || 'No purpose specified'}</Typography>
                          {log.notes && (
                            <Typography variant="body2" color="text.secondary">
                              Notes: {log.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            User: {log.user?.username || 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
          
          {equipment.status === 'SHARED' && (
            <TabPanel value="3">
              <Alert severity="info">
                This equipment is shared with other labs. Transfer history functionality is available in this tab.
              </Alert>
              {/* Transfer history would be implemented here */}
            </TabPanel>
          )}
        </TabContext>
      </Paper>
      
      <Dialog open={dialogOpen} onClose={closeDialog}>
        {renderDialogContent()}
      </Dialog>
    </>
  );
};

export default EquipmentDetail;