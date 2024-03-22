import React from 'react';
import { AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, CssBaseline, Box } from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom'; // Import Outlet from 'react-router-dom'
import {useAuth} from './auth';
const drawerWidth = 240;

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const { clearAuth, authenticatedAxiosPost } = useAuth();
  const menuItems = [
    { text: 'Page 1', path: '/page1' },
    { text: 'Page 2', path: '/page2' },
    // Add more navigation items here
  ];

  const handleLogout = async () => {
    // Call the /handle_logout endpoint
    await authenticatedAxiosPost('/handle_logout', {});
    clearAuth(); // Clear authentication state client-side
    navigate('/login'); // Redirect to login page
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            Home
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Log Out
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> {/* Provides spacing under AppBar */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} onClick={() => navigate(item.path)}>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        {/* Main content area */}
        <Outlet />
      </Box>
    </Box>
  );
}
