import React from 'react';
import { Grid, Container } from '@mui/material';
import TotalPortfolioValueCard from './TotalPortfolioValueCard';
import PortfolioROICard from './PortfolioROICard';
// import PortfolioLineGraph from './PortfolioLineGraph';
import PortfolioStockTickerDisplay from './PortfolioStockTickerDisplay';

const Dashboard = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Total Portfolio Value Card */}
                <Grid item xs={12} md={6}>
                    <TotalPortfolioValueCard />
                </Grid>

                {/* Portfolio ROI Card */}
                <Grid item xs={12} md={6}>
                    <PortfolioROICard />
                </Grid>

                {/* Portfolio Line Graph */}
                <Grid item xs={12}>
                    {/* <PortfolioLineGraph /> */}
                </Grid>

                {/* Stock Ticker Display */}
                <Grid item xs={12}>
                    <PortfolioStockTickerDisplay />
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
