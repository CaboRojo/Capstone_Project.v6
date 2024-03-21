import React, { useState, useEffect } from 'react';
import { useAuth } from './auth'; // Adjust the path as necessary
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const HistoricalDataTable = ({ selectedStockSymbol }) => {
  const { authenticatedAxiosGet } = useAuth();
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedAxiosGet(`/stocks/${selectedStockSymbol}/`);

        if (response.data && Array.isArray(response.data)) {
          const sortedData = response.data.map(item => ({
            ...item,
            closingPrice: item.adjustedClosingPrice // Use adjustedClosingPrice directly
          })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date

          setHistoricalData(sortedData);
        } else {
          throw new Error('Invalid data structure');
        }
      } catch (error) {
        console.error('Failed to fetch stock data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedStockSymbol) {
      fetchHistoricalData();
    }
  }, [selectedStockSymbol]); // Dependency array

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell align="right">Closing Price ($)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={2} align="center">
                <Typography>Loading...</Typography>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={2} align="center">
                <Typography color="error">{error}</Typography>
              </TableCell>
            </TableRow>
          ) : historicalData.length > 0 ? (
            historicalData.map((data, index) => (
              <TableRow key={index}>
                <TableCell>{data.date}</TableCell>
                <TableCell align="right">${data.closingPrice}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} align="center">
                <Typography>No data available.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default HistoricalDataTable;
