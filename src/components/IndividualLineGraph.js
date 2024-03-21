import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useAuth } from './auth'; // Adjust the path as necessary

const IndividualLineGraph = ({ selectedStockSymbol }) => {
  const { auth, authenticatedAxiosGet } = useAuth();
  const [series, setSeries] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Updated to use the correct authenticatedAxiosGet usage
        const response = await authenticatedAxiosGet(`/stocks/${selectedStockSymbol}/`);

        // Assuming the API returns the data in the desired format
        const transformedSeries = [{
          name: "Closing Price",
          data: response.data.map(item => ({
            x: item.date,
            y: parseFloat(item.adjustedClosingPrice)
          }))
        }];

        setSeries(transformedSeries);
      } catch (error) {
        console.error('Failed to fetch stock data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [auth, selectedStockSymbol]); // Include auth and authenticatedAxiosGet in dependencies

  const options = {
    chart: {
      id: 'stock-data',
      type: 'line',
      zoom: {
        enabled: true
      }
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: {
      title: {
        text: 'Price',
      },
      labels: {
        formatter: function(val) {
          return val.toFixed(2);
        }
      }
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy',
      }
    },
    noData: {
      text: isLoading ? 'Loading...' : 'No data available'
    }
  };

  return (
    <div id="chart">
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <ReactApexChart options={options} series={series} type="line" height={350} />
    </div>
  );
};

export default IndividualLineGraph;
