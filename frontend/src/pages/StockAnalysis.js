import React, { useState, useEffect } from 'react';

import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  Timeline,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getStockBySymbol } from '../data/stockData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockAnalysis = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [userHolding, setUserHolding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [chartOpen, setChartOpen] = useState(false);
  const [chartMonths, setChartMonths] = useState(6);
  const [chartData, setChartData] = useState(null);



  useEffect(() => {
    fetchStockAnalysis();
    checkBackendStatus();
  }, [symbol]);

  const checkBackendStatus = async () => {
    try {
      await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
      setBackendAvailable(true);
    } catch (error) {
      console.warn('Backend not available, using static data');
      setBackendAvailable(false);
    }
  };

  const fetchStockAnalysis = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from backend first
      if (backendAvailable) {
        try {
          const response = await axios.get(`http://localhost:5000/api/stocks/${symbol}`);
          if (response.data.success) {
            setStockData(response.data.data);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn('Failed to fetch from backend, using static data');
        }
      }
      
      // Fallback to unified static data
      const staticStock = getStockBySymbol(symbol) || {
        symbol: symbol,
        name: `${symbol} Corporation`,
        current_price: 10000,
        sector: 'Technology',
        market_cap: 100000000000,
        change_percent: 0.0,
        volume: 10000000,
        previous_close: 10000,
        open: 10000,
        high_24h: 10100,
        low_24h: 9900,
        high_52w: 11000,
        low_52w: 9000,
        pe_ratio: 20.0
      };
      
      setStockData(staticStock);
      setUserHolding(null);
    } catch (error) {
      setError('Failed to load stock analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateMockPrediction = () => {
    const staticStock = getStockBySymbol(symbol) || stockData;
    const changePercent = staticStock ? staticStock.change_percent / 100 : 0.01;
    const basePrice = staticStock ? staticStock.current_price : 10000;
    
    // Generate realistic mock prediction data
    const predictedPrice = basePrice * (1 + changePercent * 3);
    const accuracy = 70 + Math.random() * 25;
    
    // Generate mock chart data
    const labels = [];
    const mid = [];
    const lower = [];
    const upper = [];
    
    const today = new Date();
    for (let i = 1; i <= chartMonths; i++) {
      const date = new Date();
      date.setMonth(today.getMonth() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      
      const trend = 1 + (changePercent * 0.1 * i);
      const randomFactor = 0.95 + Math.random() * 0.1;
      const predictedValue = basePrice * trend * randomFactor;
      
      mid.push(predictedValue);
      lower.push(predictedValue * 0.95);
      upper.push(predictedValue * 1.05);
    }
    
    setChartData({ labels, mid, lower, upper });
    
    return {
      predicted_price: predictedPrice,
      accuracy: Math.round(accuracy),
      risk_level: accuracy > 80 ? 'Low' : accuracy > 60 ? 'Medium' : 'High',
      metrics: {
        RMSE: (2.5 + Math.random() * 3).toFixed(2),
        R2: (0.7 + Math.random() * 0.2).toFixed(3),
        MAPE: (3.2 + Math.random() * 2).toFixed(2),
        Direction_Accuracy: Math.round(accuracy)
      },
      lastUpdated: new Date().toISOString(),
      plot: null
    };
  };

  const fetchMLPrediction = async () => {
    try {
      setMlLoading(true);
      setError('');
      
      if (!backendAvailable) {
        // Use mock data if backend is not available
        setTimeout(() => {
          const mockPrediction = generateMockPrediction();
          setMlPrediction(mockPrediction);
          setMlLoading(false);
        }, 1500);
        return;
      }
      
      // Try to call backend API for real ML prediction
      const response = await axios.get(
        `http://localhost:5000/api/stocks/ml-prediction/${symbol}?months=${chartMonths}`,
        { timeout: 10000 }
      );
      
      if (response.data && response.data.success) {
        const predictionData = response.data.data;
        
        // Format the prediction data for display
        const prediction = {
          predicted_price: predictionData.predicted_price,
          accuracy: Math.round(predictionData.metrics.Direction_Accuracy || 75),
          risk_level: predictionData.metrics.MAPE > 5 ? 'High' : predictionData.metrics.MAPE > 3 ? 'Medium' : 'Low',
          metrics: {
            RMSE: predictionData.metrics.RMSE || 0,
            R2: predictionData.metrics.R2 || 0,
            MAPE: predictionData.metrics.MAPE || 0,
            Direction_Accuracy: predictionData.metrics.Direction_Accuracy || 0
          },
          lastUpdated: predictionData.last_updated || new Date().toISOString(),
          plot: predictionData.plot
        };
        
        setMlPrediction(prediction);
        
        // Generate chart data from predictions
        if (predictionData.predictions && predictionData.predictions.length > 0) {
          const labels = predictionData.predictions.map(p => {
            const date = new Date(p.date);
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          });
          const mid = predictionData.predictions.map(p => p.predicted_price);
          const lower = predictionData.predictions.map(p => p.lower_bound);
          const upper = predictionData.predictions.map(p => p.upper_bound);
          
          setChartData({ labels, mid, lower, upper });
        }
      } else {
        throw new Error('Failed to get prediction data from API');
      }
    } catch (error) {
      console.error('Failed to generate ML prediction:', error);
      // Fall back to mock data
      const mockPrediction = generateMockPrediction();
      setMlPrediction(mockPrediction);
      setBackendAvailable(false);
    } finally {
      setMlLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatVolume = (volume) => {
    if (!volume || volume === undefined || volume === null) return 'N/A';
    
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toLocaleString();
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap || marketCap === undefined || marketCap === null) return 'N/A';
    
    if (marketCap >= 1e12) return `₹${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `₹${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `₹${(marketCap / 1e6).toFixed(1)}M`;
    return `₹${marketCap.toLocaleString()}`;
  };

  const openChartDialog = () => {
    setChartOpen(true);
  };

  const handleChartMonthsChange = (e) => {
    const months = parseInt(e.target.value);
    if (months >= 1 && months <= 24) {
      setChartMonths(months);
    }
  };

  const applyChartMonths = () => {
    setChartOpen(false);
    if (mlPrediction) {
      fetchMLPrediction(); // Refetch with new months parameter
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!stockData) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          Stock data not available for {symbol}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Stock Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {stockData.symbol} - {stockData.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {formatCurrency(stockData.current_price)}
          </Typography>
          <Chip
            label={formatPercentage(stockData.change_percent)}
            color={stockData.change_percent >= 0 ? 'success' : 'error'}
            size="large"
          />
          {stockData.change_percent >= 0 ? (
            <TrendingUp color="success" />
          ) : (
            <TrendingDown color="error" />
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Stock Overview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Previous Close
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stockData.previous_close)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Open
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stockData.open)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Day High
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stockData.high_24h)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Day Low
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stockData.low_24h)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Volume
                  </Typography>
                  <Typography variant="h6">
                    {formatVolume(stockData.volume)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Market Cap
                  </Typography>
                  <Typography variant="h6">
                    {formatMarketCap(stockData.market_cap)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    P/E Ratio
                  </Typography>
                  <Typography variant="h6">
                    {stockData.pe_ratio ? stockData.pe_ratio.toFixed(2) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    52W High
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stockData.high_52w)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* User Holding */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Position
              </Typography>
              {userHolding ? (
                <Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {userHolding.total_quantity} shares
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Avg Price: {formatCurrency(userHolding.total_investment / userHolding.total_quantity)}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Current Value: {formatCurrency(userHolding.current_value)}
                  </Typography>
                  <Chip
                    label={formatPercentage(userHolding.profit_loss_percentage)}
                    color={userHolding.profit_loss_percentage >= 0 ? 'success' : 'error'}
                    size="large"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Total P&L: {formatCurrency(userHolding.profit_loss)}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    You don't own this stock
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/portfolio?symbol=${symbol}&name=${stockData.name}&price=${stockData.current_price}`)}
                    sx={{ mt: 1 }}
                  >
                    Add to Portfolio
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ML Prediction Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Psychology color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    AI Price Prediction ({chartMonths} Months)
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<Timeline />}
                    onClick={openChartDialog}
                    sx={{ mr: 2 }}
                  >
                    Adjust Period
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchMLPrediction}
                    disabled={mlLoading}
                    startIcon={mlLoading ? <CircularProgress size={20} /> : <Psychology />}
                  >
                    {mlLoading ? 'Generating...' : 'Generate Prediction'}
                  </Button>
                </Box>
              </Box>

              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* ML Prediction Results */}
              {mlPrediction && (
                <Box>
                  {/* Main Prediction Display */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', textAlign: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Predicted Price
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(mlPrediction.predicted_price)}
                        </Typography>
                        <Typography variant="body2">
                          Current: {formatCurrency(stockData.current_price)}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white', textAlign: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Accuracy
                        </Typography>
                        <Typography variant="h4">
                          {mlPrediction.accuracy}%
                        </Typography>
                        <Typography variant="body2">
                          Risk: {mlPrediction.risk_level}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white', textAlign: 'center' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Last Updated
                        </Typography>
                        <Typography variant="body2">
                          {new Date(mlPrediction.lastUpdated).toLocaleString()}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Detailed Metrics */}
                  <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>
                      Prediction Metrics
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            RMSE
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {mlPrediction.metrics.RMSE}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Lower is better
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            R² Score
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {mlPrediction.metrics.R2}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Higher is better
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            MAPE
                          </Typography>
                          <Typography variant="h6" color="warning.main">
                            {mlPrediction.metrics.MAPE}%
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Lower is better
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary">
                            Direction Accuracy
                          </Typography>
                          <Typography variant="h6" color="info.main">
                            {mlPrediction.metrics.Direction_Accuracy}%
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Higher is better
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* ML Prediction Chart from Backend */}
                  {mlPrediction.plot && (
                    <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        ML Prediction Chart (INR)
                      </Typography>
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={`data:image/png;base64,${mlPrediction.plot}`}
                          alt={`${symbol} Price Prediction`}
                          style={{ 
                            maxWidth: '100%', 
                            height: 'auto',
                            borderRadius: '8px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                          AI-generated price prediction based on historical data
                        </Typography>
                      </Box>
                    </Paper>
                  )}

                  {/* Interactive Chart */}
                  {chartData && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Price Prediction Chart ({chartMonths} Months)
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <Line
                          data={{
                            labels: chartData.labels,
                            datasets: [
                              {
                                label: 'Predicted Price',
                                data: chartData.mid,
                                borderColor: 'rgba(255, 127, 14, 1)',
                                backgroundColor: 'rgba(255, 127, 14, 0.1)',
                                fill: true,
                                tension: 0.4,
                              },
                              {
                                label: 'Lower Bound',
                                data: chartData.lower,
                                borderColor: 'rgba(76, 175, 80, 0.7)',
                                borderDash: [5, 5],
                                pointRadius: 0,
                                fill: false,
                              },
                              {
                                label: 'Upper Bound',
                                data: chartData.upper,
                                borderColor: 'rgba(244, 67, 54, 0.7)',
                                borderDash: [5, 5],
                                pointRadius: 0,
                                fill: false,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { 
                                display: true,
                                position: 'top',
                              },
                              tooltip: { 
                                mode: 'index', 
                                intersect: false,
                                callbacks: {
                                  label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                                  }
                                }
                              },
                            },
                            scales: {
                              x: { 
                                title: { 
                                  display: true, 
                                  text: 'Date' 
                                } 
                              },
                              y: { 
                                title: { 
                                  display: true, 
                                  text: 'Price (INR)' 
                                },
                                beginAtZero: false,
                                ticks: {
                                  callback: function(value) {
                                    return formatCurrency(value);
                                  }
                                }
                              },
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  )}
                </Box>
              )}

              {/* No Prediction Yet */}
              {!mlPrediction && !mlLoading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Psychology color="action" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Ready to Generate Prediction
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Click the "Generate Prediction" button to get AI-powered price forecasts for {symbol}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Historical Graph from Backend */}
{/* {mlPrediction.historical_plot && (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <History color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
                Historical Price Graph (INR)
            </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
            <img 
                src={`data:image/png;base64,${mlPrediction.historical_plot}`}
                alt={`${symbol} Historical Price`}
                style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Historical price data for {symbol}
            </Typography>
        </Box>
    </Paper>
)} */}
        

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/portfolio?symbol=${symbol}&name=${stockData.name}&price=${stockData.current_price}`)}
                >
                  Add to Portfolio
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/market')}
                >
                  View Similar Stocks
                </Button>
                <Button
                  variant="outlined"
                  onClick={openChartDialog}
                  startIcon={<Timeline />}
                >
                  Adjust Prediction Period
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart Period Dialog */}
      <Dialog open={chartOpen} onClose={() => setChartOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Prediction Period</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Months Ahead (1-24)"
            value={chartMonths}
            onChange={handleChartMonthsChange}
            inputProps={{ min: 1, max: 24 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChartOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyChartMonths}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockAnalysis;