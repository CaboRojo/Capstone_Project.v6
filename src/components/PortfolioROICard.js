import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, CircularProgress, useTheme } from '@mui/material';
import { useAuth } from './auth'; // Adjust the path as necessary

const PortfolioROICard = () => {
  const theme = useTheme();
  const { auth, authenticatedAxiosGet } = useAuth();
  const [roi, setRoi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchROI = async () => {
      if (!auth.isAuthenticated) return;

      try {
        const response = await authenticatedAxiosGet(`user/${auth.userId}/`);
        if (response.status === 200 && response.data) {
          setRoi(parseFloat(response.data.roi).toFixed(2));
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (err) {
        setError('Unable to load ROI. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchROI();
  }, [auth]);

  return (
    <Card sx={{ minWidth: 275, bgcolor: theme.palette.background.paper, m: 2 }}>
      <CardContent sx={{ textAlign: 'center', p: theme.spacing(3) }}>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              ROI
            </Typography>
            <Typography variant="h5" component="div" sx={{ my: 2 }}>
              {roi ? `${roi}%` : 'N/A'}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioROICard;
