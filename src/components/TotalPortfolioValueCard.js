import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from './auth'; // Adjust the path as necessary

const TotalPortfolioValueCard = () => {
  const { auth, authenticatedAxiosGet } = useAuth();
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTotalPortfolioValue = async () => {
      if (!auth.isAuthenticated) return;

      try {
        const response = await authenticatedAxiosGet(`user/${auth.userId}/`);
        if (response.status === 200 && response.data) {
          setTotalPortfolioValue(response.data.total_portfolio_value);
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (err) {
        setError('Unable to load portfolio value. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalPortfolioValue();
  }, [auth]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="150px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 275, textAlign: 'center', p: 2 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Total Portfolio Value
        </Typography>
        <Typography variant="h5" component="div">
          ${totalPortfolioValue ? totalPortfolioValue.toLocaleString() : 'N/A'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TotalPortfolioValueCard;
