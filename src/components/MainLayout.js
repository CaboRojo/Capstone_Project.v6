import React from 'react';
import { AppBar, Toolbar, Typography, Button, CssBaseline, Box } from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth'; // Adjust the path to auth.js if necessary

export default function MainLayout() {
  const navigate = useNavigate();
  const { clearAuth, authenticatedAxiosPost } = useAuth();

  const handleLogout = async () => {
    // Attempt to notify the backend about the logout
    try {
      await authenticatedAxiosPost('/handle_logout', {});
    } catch (error) {
      console.error('Error during logout notification to backend:', error);
      // Handle error or notify user as needed
    }
    
    // Clear authentication state client-side and redirect to login page
    clearAuth();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }} 
            onClick={() => navigate('/')}
          >
            Home
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Log Out
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {/* Outlet for rendering the matched child route component. */}
        <Outlet />
      </Box>
    </Box>
  );
}
