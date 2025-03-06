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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Event as EventIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import bookingService from '../../services/booking.service';
import { formatDateTime, formatDate, getStatusColor, hasPermission } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    resource_type: '',
    lab: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'cancel', 'approve', 'reject'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const navigate = useNavigate();
  const { authState } = useAuth();

  // Role-based permissions
  const isAdmin = hasPermission(authState.user, 'ADMIN');
  const isLabManager = hasPermission(authState.user, 'LAB_MANAGER');
  const canApproveBookings = isAdmin || isLabManager;

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const params = {
          search: search,
          page: page,
          page_size: pageSize,
          ...filters,
        };
        
        let response;
        // If not admin or lab manager, only fetch user's own bookings
        if (!canApproveBookings) {
          response = await bookingService.getCurrentUserBookings(params);
        } else {
          response = await bookingService.getBookings(params);
        }
        
        // Ensure we always have an array of bookings
        const bookingData = response.results || response || [];
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setTotalItems(response.count || (Array.isArray(bookingData) ? bookingData.length : 0));
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again.');
        setBookings([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [search, filters, page, pageSize, canApproveBookings]);

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
      resource_type: '',
      lab: ''
    });
    setSearch('');
    setPage(1);
  };

  const handleNewBooking = () => {
    navigate('/bookings/new');
  };

  const handleEditBooking = (bookingId) => {
    navigate(`/bookings/${bookingId}/edit`);
  };

  const handleViewCalendar = () => {
    navigate('/bookings/calendar');
  };

  const openDialog = (type, booking) => {
    setDialogType(type);
    setSelectedBooking(booking);
    setRejectReason('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedBooking(null);
    setRejectReason('');
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setActionLoading(true);
    try {
      await bookingService.cancelBooking(selectedBooking.id);
      
      // Refresh data
      const updatedBookings = bookings.map(booking => {
        if (booking.id === selectedBooking.id) {
          return { ...booking, status: 'CANCELLED' };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      closeDialog();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveBooking = async () => {
    if (!selectedBooking) return;
    
    setActionLoading(true);
    try {
      await bookingService.approveBooking(selectedBooking.id, selectedBooking.resource_type);
      
      // Refresh data
      const updatedBookings = bookings.map(booking => {
        if (booking.id === selectedBooking.id) {
          return { ...booking, status: 'APPROVED' };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      closeDialog();
    } catch (err) {
      console.error('Error approving booking:', err);
      setError('Failed to approve booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!selectedBooking) return;
    
    setActionLoading(true);
    try {
      await bookingService.rejectBooking(selectedBooking.id, rejectReason);
      
      // Refresh data
      const updatedBookings = bookings.map(booking => {
        if (booking.id === selectedBooking.id) {
          return { ...booking, status: 'REJECTED' };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      closeDialog();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      setError('Failed to reject booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getResourceName = (booking) => {
    if (!booking) return 'Unknown';
    
    if (booking.resource_type === 'EQUIPMENT') {
      return booking.equipment?.name || 'Unknown Equipment';
    } else {
      return booking.workspace?.name || 'Unknown Workspace';
    }
  };

  const renderDialogContent = () => {
    if (!selectedBooking) return null;
    
    switch (dialogType) {
      case 'cancel':
        return (
          <>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to cancel this booking for {getResourceName(selectedBooking)}?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>No, Keep It</Button>
              <Button 
                onClick={handleCancelBooking} 
                color="error" 
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Booking'}
              </Button>
            </DialogActions>
          </>
        );
      
      case 'approve':
        return (
          <>
            <DialogTitle>Approve Booking</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Approve this booking for {getResourceName(selectedBooking)} from {selectedBooking?.user?.username || 'Unknown User'}?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleApproveBooking} 
                color="success" 
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Approve'}
              </Button>
            </DialogActions>
          </>
        );
      
      case 'reject':
        return (
          <>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Please provide a reason for rejecting this booking for {getResourceName(selectedBooking)}.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Rejection Reason"
                fullWidth
                multiline
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                variant="outlined"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleRejectBooking} 
                color="error" 
                variant="contained"
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Reject'}
              </Button>
            </DialogActions>
          </>
        );
      
      default:
        return null;
    }
  };

  const labs = ['IVE', 'CEZERI', 'MEDTECH'];
  const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  const resourceTypes = ['EQUIPMENT', 'WORKSPACE'];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Bookings
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<CalendarIcon />}
              onClick={handleViewCalendar}
              sx={{ mr: 1 }}
            >
              Calendar View
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewBooking}
            >
              New Booking
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search bookings..."
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
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resource Type</InputLabel>
                  <Select
                    name="resource_type"
                    value={filters.resource_type}
                    onChange={handleFilterChange}
                    label="Resource Type"
                  >
                    <MenuItem value="">All Resources</MenuItem>
                    {resourceTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type === 'EQUIPMENT' ? 'Equipment' : 'Workspace'}
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

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : bookings.length === 0 ? (
          <Alert severity="info">
            No bookings found. Create a new booking to get started.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resource</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {getResourceName(booking)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.lab || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {booking.resource_type === 'EQUIPMENT' ? 'Equipment' : 'Workspace'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(booking.start_time)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {booking.user?.username || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 150, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                          title={booking.purpose}
                        >
                          {booking.purpose}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          size="small"
                          sx={{ 
                            bgcolor: getStatusColor(booking.status),
                            color: '#fff',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {/* Show different actions based on booking status and user permissions */}
                        {booking.status === 'PENDING' && (
                          <>
                            {/* User can edit or cancel their own pending bookings */}
                            {(booking.user?.id === authState.user?.id || isAdmin) && (
                              <>
                                <Tooltip title="Edit Booking">
                                  <IconButton 
                                    color="primary"
                                    onClick={() => handleEditBooking(booking.id)}
                                    size="small"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel Booking">
                                  <IconButton
                                    color="error"
                                    onClick={() => openDialog('cancel', booking)}
                                    size="small"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            
                            {/* Admins and lab managers can approve/reject */}
                            {canApproveBookings && (
                              <>
                                <Tooltip title="Approve Booking">
                                  <IconButton
                                    color="success"
                                    onClick={() => openDialog('approve', booking)}
                                    size="small"
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject Booking">
                                  <IconButton
                                    color="error"
                                    onClick={() => openDialog('reject', booking)}
                                    size="small"
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </>
                        )}
                        
                        {/* Approved bookings can be cancelled */}
                        {booking.status === 'APPROVED' && (
                          <Tooltip title="Cancel Booking">
                            <IconButton
                              color="error"
                              onClick={() => openDialog('cancel', booking)}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
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
        {renderDialogContent()}
      </Dialog>
    </Box>
  );
};

export default BookingList;