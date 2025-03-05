import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Box
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Build as BuildIcon,
  FolderSpecial as ProjectIcon,
  EventNote as BookingIcon,
  CalendarMonth as CalendarIcon,
  Group as UsersIcon,
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const [openInventory, setOpenInventory] = React.useState(true);
  const [openProjects, setOpenProjects] = React.useState(false);
  const [openBookings, setOpenBookings] = React.useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();
  const { user } = authState;
  
  const handleInventoryClick = () => {
    setOpenInventory(!openInventory);
  };
  
  const handleProjectsClick = () => {
    setOpenProjects(!openProjects);
  };
  
  const handleBookingsClick = () => {
    setOpenBookings(!openBookings);
  };
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Box sx={{ overflow: 'auto' }}>
      <List component="nav">
        <ListItemButton onClick={() => navigate('/')} selected={isActive('/')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Inventory Section */}
        <ListItemButton onClick={handleInventoryClick}>
          <ListItemIcon>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText primary="Inventory" />
          {openInventory ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openInventory} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }} 
              onClick={() => navigate('/equipment')} 
              selected={isActive('/equipment')}
            >
              <ListItemIcon>
                <InventoryIcon />
              </ListItemIcon>
              <ListItemText primary="Equipment" />
            </ListItemButton>
            
            <ListItemButton 
              sx={{ pl: 4 }} 
              onClick={() => navigate('/categories')} 
              selected={isActive('/categories')}
            >
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Categories" />
            </ListItemButton>
            
            <ListItemButton 
              sx={{ pl: 4 }} 
              onClick={() => navigate('/maintenance')} 
              selected={isActive('/maintenance')}
            >
              <ListItemIcon>
                <BuildIcon />
              </ListItemIcon>
              <ListItemText primary="Maintenance" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Projects Section */}
        <ListItemButton onClick={handleProjectsClick}>
          <ListItemIcon>
            <ProjectIcon />
          </ListItemIcon>
          <ListItemText primary="Projects" />
          {openProjects ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openProjects} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }} 
              onClick={() => navigate('/projects')} 
              selected={isActive('/projects')}
            >
              <ListItemIcon>
                <ProjectIcon />
              </ListItemIcon>
              <ListItemText primary="All Projects" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Bookings Section */}
        <ListItemButton onClick={handleBookingsClick}>
          <ListItemIcon>
            <BookingIcon />
          </ListItemIcon>
          <ListItemText primary="Bookings" />
          {openBookings ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openBookings} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }} 
              onClick={() => navigate('/bookings')} 
              selected={isActive('/bookings')}
            >
              <ListItemIcon>
                <BookingIcon />
              </ListItemIcon>
              <ListItemText primary="All Bookings" />
            </ListItemButton>
            
            <ListItemButton 
              sx={{ pl: 4 }} 
              onClick={() => navigate('/bookings/calendar')} 
              selected={isActive('/bookings/calendar')}
            >
              <ListItemIcon>
                <CalendarIcon />
              </ListItemIcon>
              <ListItemText primary="Calendar" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* User Management - Only shown to admin users */}
        {user && user.role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItemButton 
              onClick={() => navigate('/users')} 
              selected={isActive('/users')}
            >
              <ListItemIcon>
                <UsersIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );
};

export default Sidebar;