import React from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import MainRoutes from './components/MainRoutes'; // Ensure path is correct
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Create a sleek and professional theme for a portfolio MVP, using Roboto font
const theme = createTheme({
  palette: {
    primary: {
      main: '#0a192f', // A deep navy blue for primary actions and headers
    },
    secondary: {
      main: '#64ffda', // A vibrant teal for accents and secondary actions
    },
    background: {
      default: '#f8f8f8', // A very light grey, almost white, for the background
      paper: '#ffffff', // Pure white for card backgrounds and similar components
    },
    text: {
      primary: '#0a192f', // Dark text for maximum contrast on the light background
      secondary: '#8892b0', // A softer shade for less prominent text elements
    },
  },
  typography: {
    // Roboto is the default font for Material-UI, no need to explicitly set it
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem', // Large, impactful headers
      letterSpacing: '-0.05rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem', // Section headers
      letterSpacing: '-0.05rem',
    },
    body1: {
      fontSize: '1rem', // Main body text size
    },
    button: {
      fontWeight: 500,
      textTransform: 'none', // Keep button texts in default casing
    },
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0, // Flat design for the app bar
      },
      styleOverrides: {
        root: {
          backgroundColor: '#0a192f', // Use the primary color for the app bar
          color: '#64ffda', // Contrast the app bar text with secondary color
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 'bold', // Make buttons bolder for a strong call to action
        },
      },
    },
  },
});

const AppContent = () => {
  let routes = useRoutes(MainRoutes); // MainRoutes is now directly usable
  return routes;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent /> {/* Now uses AppContent with useRoutes */}
      </Router>
    </ThemeProvider>
  );
}

export default App;