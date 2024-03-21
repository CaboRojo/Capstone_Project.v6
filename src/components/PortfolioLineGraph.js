import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import axios from 'axios';
import { useAuth } from './auth'; // Adjust the path as necessary

const PortfolioLineGraph = ({ selectedStockSymbols }) => {
  const { auth, authenticatedAxiosGet } = useAuth();
  const [series, setSeries] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError('');
      let fetchedSeries = [];

      for (const symbol of selectedStockSymbols) {
        try {
          const response = await authenticatedAxiosGet(`stocks/${symbol}`);
          // Transform data to match chart format
          const transformedSeries = {
            name: symbol,
            data: response.data.map(point => ({
              x: new Date(point.date),
              y: point.lastClosingPrice
            }))
          };
          fetchedSeries.push(transformedSeries);
        } catch (error) {
          // Advanced error handling: specify the stock symbol in the error message
          setError(`Failed to load data for ${symbol}. Please check the symbol or try again later.`);
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      }

      if (fetchedSeries.length === 0 && selectedStockSymbols.length > 0) {
        // If no data was successfully fetched for any symbol
        setError('Failed to load data for all selected symbols.');
      } else {
        setError(''); // Clear error if at least some data was successfully fetched
      }

      setSeries(fetchedSeries);
      setIsLoading(false);
    };

    if (selectedStockSymbols.length && auth.token) {
      fetchStockData();
    }
  }, [auth.token, selectedStockSymbols]);

  const options = {
    chart: {
      id: 'historical-stock-data',
      type: 'line',
      height: 350,
      toolbar: {
        show: true
      },
      zoom: {
        enabled: true
      }
    },
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'], // Define contrasting colors for each line
    tooltip: {
      enabled: true,
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        formatter: (value) => `$${value.toFixed(2)}`, // Format tooltip value
        title: {
          formatter: (seriesName) => seriesName, // Display the series name (stock symbol)
        },
      },
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      title: {
        text: 'Last Closing Price'
      },
    },
    title: {
      text: 'Historical Stock Data',
      align: 'left'
    },
    noData: {
      text: 'No data available'
    }
  };

  return (
    <div id="chart">
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
      ) : (
        <ReactApexChart
          options={options}
          series={series}
          type="line"
          height={350}
        />
      )}
    </div>
  );
};

export default PortfolioLineGraph;
