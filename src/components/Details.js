import React from 'react';
import { Grid, Typography } from '@mui/material';
import { gridSpacing } from './constant';
import HistoricalDataTable from './HistoricalDataTable';
import IndividualLineGraph from './IndividualLineGraph';
import { useParams } from 'react-router-dom'; // Import useParams hook

const Details = () => {
    const { symbol } = useParams(); // Use useParams hook to access route parameters
    // Directly use the symbol variable obtained from useParams
    const stockSymbol = symbol || "AAPL"; // Default to "AAPL" if symbol is not provided

    return (
        <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
                <Typography variant="h1" gutterBottom>
                    Stock Details for {stockSymbol}
                </Typography>
            </Grid>
            <Grid item lg={6} md={6} sm={12} xs={12}>
                Hoa
                <HistoricalDataTable selectedStockSymbol={stockSymbol} />
            </Grid>
            <Grid item lg={6} md={6} sm={12} xs={12}>
                <IndividualLineGraph selectedStockSymbol={stockSymbol} />
            </Grid>
        </Grid>
    );
};

export default Details;

