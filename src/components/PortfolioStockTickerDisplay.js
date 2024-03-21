import React, { useState, useEffect } from 'react';
import { Card, CardContent, Grid, Link, Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { gridSpacing } from './constant';
import { useAuth } from './auth'; // Adjust the path as necessary




const PortfolioStockTickerDisplay = () => {
    const { auth, authenticatedAxiosGet, authenticatedAxiosPost } = useAuth();
    const [stockData, setStockData] = useState([]);
    const [buyModalOpen, setBuyModalOpen] = useState(false);
    const [sellModalOpen, setSellModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [buyQuantity, setBuyQuantity] = useState('');

    useEffect(() => {
        const fetchStockData = async () => {
            try {
                const response = await authenticatedAxiosGet(`assets/${auth.userId}/`);
                console.log("Stock Data:", response.data); // Log the stock data to the console
                if (response.data && response.data.stocks_details) {
                    setStockData(response.data.stocks_details);
                  } else {
                    // If there's no data, or the structure is not as expected
                    console.error('Unexpected response structure:', response.data);
                  }
                } catch (error) {
                  console.error("Error fetching stock data:", error);
                }
              };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchStockData();
    }, [auth.isAuthenticated, auth.userId]);

    const handleOpenBuyModal = (stock) => {
        setSelectedStock(stock);
        setBuyModalOpen(true);
    };

    const handleCloseBuyModal = () => {
        setBuyModalOpen(false);
        setBuyQuantity('');
    };

    const handleOpenSellModal = (stock) => {
        setSelectedStock(stock);
        setSellModalOpen(true);
    };

    const handleCloseSellModal = () => {
        setSellModalOpen(false);
};

    const handleBuy = async () => {
        try {
            // Corrected the usage of template literals
            await authenticatedAxiosPost(`/users/${auth.userId}/stocks/buy`, {
                symbol: selectedStock.symbol,
                quantity: buyQuantity
            });

            handleCloseBuyModal();
            // Optionally: Fetch updated stock data or trigger a global state update
        } catch (error) {
            console.error("Error buying button:", error);
            // Handle error here if needed
        }
    };

    const handleSell = async () => {
        try {
            // Corrected the usage of template literals
            await authenticatedAxiosPost(`/users/${auth.userId}/stocks/remove`, {
                userId: auth.userId,
                symbol: selectedStock.symbol
                // Backend handles selling all shares of the symbol for the user
            });

            handleCloseSellModal();
            // Optionally: Fetch updated stock data or trigger a global state update
        } catch (error) {
           console.error("Error in selling data:", error);
            // Handle error here if needed
        }
    };

    return (
        <Card>
            <CardContent>
                <Grid container spacing={gridSpacing}>
                    {/* Header */}
                    <Grid item xs={3}>
                        <Typography variant="h6">Company Name</Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <Typography variant="h6">Total Amount of Shares</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="h6">Portfolio %</Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <Typography variant="h6">Actions</Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <Typography variant="h6">Last Closing Price</Typography>
                    </Grid>
    
                    {/* Stock Data */}
                    {stockData.map((stock, index) => (
                    <React.Fragment key={index}>
                        {/* Company Name with navigation link */}
                        <Grid item xs={3}>
                            <Typography variant="subtitle1">
                                <Link href={`/details/${stock.symbol}`} style={{ textDecoration: 'none' }}>
                                    {stock.symbol} - {stock.company_name}
                                </Link>
                            </Typography>
                        </Grid>
                        {/* Total Amount of Shares */}
                        <Grid item xs={2}>
                            <Typography variant="subtitle2">Total Amount of Shares: {stock.quantity}</Typography>
                        </Grid>

                        {/* Portfolio % */}
                        <Grid item xs={3}>
                            <Typography variant="subtitle2">
                            Portfolio %: {stock.portfolio_percentage ? (
                            stock.portfolio_percentage.toFixed(2)
                            ) : (
                            "N/A"
                            )}
                            %
                            </Typography>
                        </Grid>

                        {/* Buy and Sell Actions */}
                        <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Button variant="outlined" onClick={() => handleOpenBuyModal(stock)}>Buy</Button>
                            <Button variant="outlined" sx={{ ml: 1 }} onClick={() => handleOpenSellModal(stock)}>Sell</Button>
                        </Grid>

                        {/* Last Closing Price */}
                        <Grid item xs={2} style={{ textAlign: 'right' }}>
                            <Typography variant="subtitle1">
                                {stock.last_closing_price ? `$${stock.last_closing_price.toFixed(2)}` : "Loading..."}
                            </Typography>
                        </Grid>
                    </React.Fragment>
                ))}

            </Grid>
            </CardContent>
            {/* Buy and Sell Dialogs */}
            <Dialog open={buyModalOpen} onClose={handleCloseBuyModal}>
                <DialogTitle>Buy {selectedStock?.symbol}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="quantity"
                        label="Quantity"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={buyQuantity}
                        onChange={(e) => setBuyQuantity(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBuyModal}>Cancel</Button>
                    <Button onClick={handleBuy}>Buy</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={sellModalOpen} onClose={handleCloseSellModal}>
                <DialogTitle>Sell All Shares of {selectedStock?.symbol}?</DialogTitle>
                <DialogContent>
                    This action will sell all shares of {selectedStock?.symbol}.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSellModal}>Cancel</Button>
                    <Button onClick={handleSell}>Sell All</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};
    
export default PortfolioStockTickerDisplay;
    