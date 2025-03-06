import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Layout Components
import Dashboard from './components/layout/Dashboard';

// Auth Components
import Login from './components/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';

// Inventory Components
import EquipmentList from './components/inventory/EquipmentList';
import EquipmentDetail from './components/inventory/EquipmentDetail';
import EquipmentForm from './components/inventory/EquipmentForm';
import MaintenanceList from './components/inventory/MaintenanceList';
import CategoryList from './components/inventory/CategoryList';

// Projects Components
// import ProjectList from './components/projects/ProjectList';
// import ProjectDetail from './components/projects/ProjectDetail';
// import ProjectForm from './components/projects/ProjectForm';
// import DocumentList from './components/projects/DocumentList';

// // Bookings Components
// import BookingList from './components/bookings/BookingList';
// import BookingForm from './components/bookings/BookingForm';
// import Calendar from './components/bookings/Calendar';

// // Users Components
// import UserList from './components/users/UserList';
// import UserDetail from './components/users/UserDetail';
// import UserForm from './components/users/UserForm';

function App() {
  const { authState } = useAuth();
  
  return (
    <Box sx={{ display: 'flex' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          {/* Dashboard index route */}
          <Route index element={<Navigate to="/equipment" replace />} />
          
          {/* Inventory Routes */}
          <Route path="equipment">
            <Route index element={<EquipmentList />} />
            <Route path="new" element={<EquipmentForm />} />
            <Route path=":id" element={<EquipmentDetail />} />
            <Route path=":id/edit" element={<EquipmentForm />} />
          </Route>
          <Route path="maintenance" element={<MaintenanceList />} />
          <Route path="categories" element={<CategoryList />} />
          
          {/* Projects Routes */}
          {/* <Route path="projects">
            <Route index element={<ProjectList />} />
            <Route path="new" element={<ProjectForm />} />
            <Route path=":id" element={<ProjectDetail />} />
            <Route path=":id/edit" element={<ProjectForm />} />
            <Route path=":id/documents" element={<DocumentList />} />
          </Route> */}
          
          {/* Bookings Routes */}
          <Route path="bookings">
            <Route index element={<BookingList />} />
            <Route path="new" element={<BookingForm />} />
            <Route path=":id/edit" element={<BookingForm />} />
            <Route path="calendar" element={<Calendar />} />
          </Route>
          
          {/* Users Routes */}
          {/* <Route path="users">
            <Route index element={<UserList />} />
            <Route path="new" element={<UserForm />} />
            <Route path=":id" element={<UserDetail />} />
            <Route path=":id/edit" element={<UserForm />} />
          </Route> */}
        </Route> 
        
        {/* Redirect to login if not found */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Box>
  );
}

export default App;