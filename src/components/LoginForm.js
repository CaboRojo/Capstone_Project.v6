import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Assuming you're using react-router for navigation
import { useAuth } from './auth'; // Adjust the import path according to your project structure
import { Card, CardContent, CardActions, TextField, Button, Typography, IconButton, InputAdornment, FormControlLabel, Checkbox, Box } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginForm = ({ onNavigateToRegister }) => {
  const [credentials, setCredentials] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth(); // Corrected use of useAuth hook

  const handleInputChange = (event) => {
    setCredentials({ ...credentials, [event.target.name]: event.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const validateForm = () => {
    if (!credentials.name.trim()) {
      setError('name is required.');
      return false;
    }
    if (!credentials.password) {
      setError('Password is required.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/handle_login`, credentials);
      auth.setAuthToken(response.data.token); // Use setAuthToken from Auth hook
      auth.setUser(response.data.userId); // Use setUser from Auth hook
      navigate('/dashboard'); // Navigate to the dashboard or home page on successful login
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || 'Login failed. Please try again.');
      } else if (error.request) {
        setError('No response from the server. Please try again later.');
      } else {
        setError('Login failed due to an unexpected error. Please try again.');
      }
    }
  };

  return (
    <Card sx={{ maxWidth: 345, mx: 'auto', mt: 5 }}>
      <CardContent>
        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
          MyApp Name Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="name"
            name="name"
            autoComplete="name"
            autoFocus
            value={credentials.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleInputChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={handleRememberMeChange} name="rememberMe" />}
            label="Remember Me"
          />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <CardActions>
            <Button type="submit" fullWidth variant="contained">Sign In</Button>
          </CardActions>
        </form>
      </CardContent>
      <Box textAlign="center" sx={{ mb: 2 }}>
        <Button onClick={onNavigateToRegister} variant="text">
          Don't have an account? Sign up
        </Button>
      </Box>
    </Card>
  );
};

export default LoginForm;
