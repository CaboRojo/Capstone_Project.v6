import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './auth';// Adjust the import path according to your project structure
import { Card, CardContent, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Assuming you're using react-router for navigation

const RegisterForm = ({ onNavigateToLogin }) => {
  const [userDetails, setUserDetails] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useAuth(); // Corrected use of useAuth hook

  const handleInputChange = (event) => {
    setUserDetails({ ...userDetails, [event.target.name]: event.target.value });
  };

  const validateForm = () => {
    if (!userDetails.username.trim()) {
      setError('Username is required.');
      return false;
    }
    if (!userDetails.password || userDetails.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(userDetails.password)) {
      setError('Password must include uppercase, lowercase, and a number.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/handle_register`, userDetails);
      auth.setAuthToken(response.data.token); // Use setAuthToken from Auth hook
      auth.setUser(response.data.userId); // Use setUser from Auth hook
      navigate('/login'); // Navigate to login page after successful registration
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || 'Registration failed. Please try again.');
      } else if (error.request) {
        setError('No response from the server. Please try again later.');
      } else {
        setError('Registration failed due to an unexpected error. Please try again.');
      }
    }
  };

  return (
    <Card sx={{ maxWidth: 345, mx: 'auto', mt: 5 }}>
      <CardContent>
        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
          Welcome to Our App
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            value={userDetails.username}
            onChange={handleInputChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={userDetails.password}
            onChange={handleInputChange}
          />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Register
          </Button>
        </form>
      </CardContent>
      <Box textAlign="center" sx={{ mb: 2 }}>
        <Button onClick={onNavigateToLogin} variant="text">
          Already have an account? Log in
        </Button>
      </Box>
    </Card>
  );
};

export default RegisterForm;
