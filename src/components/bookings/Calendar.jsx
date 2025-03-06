import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Today as TodayIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addDays } from 'date-fns';
import bookingService from '../../services/booking.service';
import inventoryService from '../../services/inventory.service';
import { getStatusColor, formatDateTime, formatTimeAgo } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    resource_type: '',
    equipment_id: '',
    workspace_id: '',
    status: '',
    lab: ''
  });
  const [equipment, setEquipment] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { authState } = useAuth();
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchBookingsForMonth = async () => {
      setLoading(true);
      try {
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
        
        const params = {
          start,
          end,
          ...filters
        };
        
        const response = await bookingService.getCalendarEvents(start, end, params);
        setBookings(response.results || response);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings for calendar. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingsForMonth();
  }, [currentDate, filters]);

  // Fetch equipment and workspaces for filters
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const equipmentResponse = await inventoryService.getEquipment({ page_size: 100 });
        setEquipment(equipmentResponse.results || equipmentResponse);
        
        const workspaceResponse = await bookingService.getWorkspaces({ page_size: 100 });
        setWorkspaces(workspaceResponse.results || workspaceResponse);
      } catch (err) {
        console.error('Error fetching resources:', err);
      }
    };
    
    fetchResources();
  }, []);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleNewBooking = () => {
    navigate('/bookings/new');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Handle interdependent filters
    if (name === 'resource_type') {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        equipment_id: '',
        workspace_id: ''
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      resource_type: '',
      equipment_id: '',
      workspace_id: '',
      status: '',
      lab: ''
    });
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleEditBooking = () => {
    if (selectedBooking) {
      closeDetailDialog();
      navigate(`/bookings/${selectedBooking.id}/edit`);
    }
  };

  // Calendar generation
  const generateCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = monthStart;
    const endDate = monthEnd;

    const dateArray = eachDayOfInterval({ start: startDate, end: endDate });

    // Create weeks array
    const weeks = [];
    let week = [];

    // First, fill in any days from the previous month
    const firstDayOfMonth = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      week.push(null); // Empty cell for days before the month starts
    }

    // Fill in the days of the month
    dateArray.forEach((day) => {
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      week.push(day);
    });

    // Fill in any remaining days
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);

    return weeks;
  };

  // Get bookings for a specific day
  const getBookingsForDay = (day) => {
    if (!day) return [];
    
    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.start_time);
      return isSameDay(bookingDate, day);
    });
  };

  // Render a day cell in the calendar
  const renderDayCell = (day, index) => {
    const isToday = day ? isSameDay(day, new Date()) : false;
    const isCurrentMonth = day ? isSameMonth(day, currentDate) : false;
    const dayBookings = day ? getBookingsForDay(day) : [];
    
    const cellStyles = {
      height: '120px',
      border: '1px solid #eee',
      padding: '8px',
      backgroundColor: isToday ? 'rgba(25, 118, 210, 0.08)' : 'white',
      opacity: isCurrentMonth ? 1 : 0.3,
    };

    if (!day) {
      return <Box key={`empty-${index}`} sx={cellStyles}></Box>;
    }

    return (
      <Box key={day.toString()} sx={cellStyles}>
        <Typography 
          variant="subtitle2"
          sx={{ 
            fontWeight: isToday ? 'bold' : 'normal',
            color: isToday ? 'primary.main' : 'text.primary',
            mb: 1
          }}
        >
          {format(day, 'd')}
        </Typography>
        
        <Box sx={{ overflow: 'auto', maxHeight: '85px' }}>
          {dayBookings.length > 0 ? (
            dayBookings.map(booking => (
              <Chip
                key={booking.id}
                label={booking.resource_type === 'EQUIPMENT' 
                  ? booking.equipment?.name?.substring(0, 15) 
                  : booking.workspace?.name?.substring(0, 15)}
                size="small"
                onClick={() => handleBookingClick(booking)}
                sx={{ 
                  mb: 0.5, 
                  width: '100%',
                  backgroundColor: getStatusColor(booking.status),
                  color: '#fff',
                  justifyContent: 'flex-start',
                  textOverflow: 'ellipsis',
                  '& .MuiChip-label': {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }
                }}
              />
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              No bookings
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const weeks = generateCalendar();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labs = ['IVE', 'CEZERI', 'MEDTECH'];
  const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

  // Get resource name for selected booking
  const getResourceName = (booking) => {
    if (!booking) return '';
    
    if (booking.resource_type === 'EQUIPMENT') {
      return booking.equipment?.name || 'Unknown Equipment';
    } else {
      return booking.workspace?.name || 'Unknown Workspace';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Booking Calendar
          </Typography>
          <Box>
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

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resource Type</InputLabel>
                  <Select
                    name="resource_type"
                    value={filters.resource_type}
                    onChange={handleFilterChange}
                    label="Resource Type"
                  >
                    <MenuItem value="">All Resources</MenuItem>
                    <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                    <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                    <MenuItem value="WORKSPACE">Workspace</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {filters.resource_type === 'EQUIPMENT' && (
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Equipment</InputLabel>
                    <Select
                      name="equipment_id"
                      value={filters.equipment_id}
                      onChange={handleFilterChange}
                      label="Equipment"
                    >
                      <MenuItem value="">All Equipment</MenuItem>
                      {equipment.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {filters.resource_type === 'WORKSPACE' && (
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Workspace</InputLabel>
                    <Select
                      name="workspace_id"
                      value={filters.workspace_id}
                      onChange={handleFilterChange}
                      label="Workspace"
                    >
                      <MenuItem value="">All Workspaces</MenuItem>
                      {workspaces.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6} md={2}>
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
              
              <Grid item xs={12} sm={6} md={2}>
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
              
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Button 
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    size="small"
                    fullWidth
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePreviousMonth}>
              <PrevIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mx: 2 }}>
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <NextIcon />
            </IconButton>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleToday}
            size="small"
          >
            Today
          </Button>
        </Box>
      </Paper>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box ref={calendarRef}>
            <Grid container>
              {/* Calendar Header - Days of Week */}
              {daysOfWeek.map((day) => (
                <Grid item xs key={day} sx={{ textAlign: 'center', p: 1, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                  {day}
                </Grid>
              ))}
            </Grid>
            
            {/* Calendar Body - Weeks */}
            {weeks.map((week, weekIndex) => (
              <Grid container key={`week-${weekIndex}`}>
                {week.map((day, dayIndex) => (
                  <Grid item xs key={`day-${weekIndex}-${dayIndex}`}>
                    {renderDayCell(day, dayIndex)}
                  </Grid>
                ))}
              </Grid>
            ))}
            
            {/* Legend */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 0.5 }} /> Status:
              </Typography>
              {statuses.map(status => (
                <Chip 
                  key={status}
                  label={status}
                  size="small"
                  sx={{ 
                    bgcolor: getStatusColor(status),
                    color: '#fff'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Booking Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={closeDetailDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedBooking && (
          <>
            <DialogTitle>
              <Typography variant="h6">
                Booking Details
              </Typography>
              <Chip 
                label={selectedBooking.status}
                size="small"
                sx={{ 
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  bgcolor: getStatusColor(selectedBooking.status),
                  color: '#fff'
                }}
              />
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedBooking.resource_type === 'EQUIPMENT' ? 'Equipment' : 'Workspace'}
                </Typography>
                <Typography variant="h6">
                  {getResourceName(selectedBooking)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lab: {selectedBooking.lab || 'Not specified'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    From
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(selectedBooking.start_time)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    To
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(selectedBooking.end_time)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Booked By
                  </Typography>
                  <Typography variant="body1">
                    {selectedBooking.user?.username || 'Unknown user'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Purpose
                  </Typography>
                  <Typography variant="body1">
                    {selectedBooking.purpose || 'No purpose specified'}
                  </Typography>
                </Grid>
                
                {selectedBooking.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.notes}
                    </Typography>
                  </Grid>
                )}
                
                {selectedBooking.rejection_reason && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ color: 'error.main' }}>
                      Rejection Reason
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'error.main' }}>
                      {selectedBooking.rejection_reason}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Created {formatTimeAgo(selectedBooking.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedBooking.status === 'PENDING' || selectedBooking.status === 'APPROVED' ? (
                <>
                  {/* Only allow edit for pending or approved bookings */}
                  {(selectedBooking.user?.id === authState.user?.id || hasPermission(authState.user, 'ADMIN')) && (
                    <Button onClick={handleEditBooking}>
                      Edit
                    </Button>
                  )}
                  <Button onClick={closeDetailDialog} color="primary">
                    Close
                  </Button>
                </>
              ) : (
                <Button onClick={closeDetailDialog} color="primary">
                  Close
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Calendar;                    