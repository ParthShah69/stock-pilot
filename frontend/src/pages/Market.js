import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Visibility,
  Star,
  Timeline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { stocksArray } from '../data/stockData';

const Market = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [marketOverview, setMarketOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      
      // Commented out API calls - using static data instead
      // const topStocksResponse = await axios.get('/api/stocks/top?limit=10');
      // setTopStocks(Array.isArray(topStocksResponse.data.stocks) ? topStocksResponse.data.stocks : []);
      
      // const marketResponse = await axios.get('/api/stocks/market/overview');
      // setMarketOverview(Array.isArray(marketResponse.data.market_overview) ? marketResponse.data.market_overview : []);
      
      // Use unified stock data
      const staticStocks = stocksArray;
      
      setTopStocks(staticStocks);
      setMarketOverview(staticStocks.slice(0, 4)); // Show first 4 for market overview
      
    } catch (error) {
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      // Commented out API call - using static search instead
      // const response = await axios.get(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      // setSearchResults(response.data.stocks);
      
      // Static search through the 60 stocks
      const query = searchQuery.toLowerCase();
      const filteredStocks = topStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query) || 
        stock.name.toLowerCase().includes(query) ||
        stock.sector.toLowerCase().includes(query)
      );
      setSearchResults(filteredStocks);
    } catch (error) {
      setError('Failed to search stocks');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === undefined || amount === null) {
      return 'N/A';
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value || value === undefined || value === null) {
      return 'N/A';
    }
    
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatVolume = (volume) => {
    if (!volume || volume === undefined || volume === null) {
      return 'N/A';
    }
    
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(2)}K`;
    }
    return volume.toLocaleString();
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap || marketCap === undefined || marketCap === null) {
      return 'N/A';
    }
    
    if (marketCap >= 1e12) {
      return `₹${(marketCap / 1e12).toFixed(1)}T`;
    } else if (marketCap >= 1e9) {
      return `₹${(marketCap / 1e9).toFixed(1)}B`;
    } else if (marketCap >= 1e6) {
      return `₹${(marketCap / 1e6).toFixed(1)}M`;
    }
    return `₹${marketCap.toLocaleString()}`;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Market
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Market Overview */}
        {marketOverview && marketOverview.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Market Overview
                </Typography>
                <Grid container spacing={2}>
                  {marketOverview.map((index, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" color="primary">
                          {index?.symbol || 'N/A'}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(index?.current_price)}
                        </Typography>
                        <Chip
                          label={formatPercentage(index?.change_percent)}
                          color={(index?.change_percent || 0) >= 0 ? 'success' : 'error'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Stock Search */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Search Stocks
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search by stock symbol or company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                >
                  {searching ? <CircularProgress size={20} /> : 'Search'}
                </Button>
              </Box>

              {/* Search Results */}
              {searchResults && searchResults.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Search Results ({searchResults.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {searchResults.map((stock, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                          onClick={() => navigate(`/stock-analysis/${stock?.symbol}`)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6">{stock?.symbol || 'N/A'}</Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                {stock?.name || 'N/A'}
                              </Typography>
                              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(stock?.current_price)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Market Cap: {formatMarketCap(stock?.market_cap)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip
                                label={formatPercentage(stock?.change_percent)}
                                color={(stock?.change_percent || 0) >= 0 ? 'success' : 'error'}
                                size="small"
                              />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* No Search Results */}
              {searchQuery && searchResults && searchResults.length === 0 && !searching && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No stocks found for "{searchQuery}"
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Try searching with a different keyword
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All Available Stocks */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                All Available Stocks ({topStocks.length})
              </Typography>
              <Grid container spacing={2}>
                {topStocks && topStocks.map((stock, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        position: 'relative',
                      }}
                                                onClick={() => navigate(`/stock-analysis/${stock?.symbol}`)}
                    >
                      {index < 3 && (
                        <Star
                          color="warning"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            fontSize: 20,
                          }}
                        />
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h5">{stock?.symbol || 'N/A'}</Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {stock?.name || 'N/A'}
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(stock?.current_price)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Volume: {formatVolume(stock?.volume)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Market Cap: {formatMarketCap(stock?.market_cap)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={formatPercentage(stock?.change_percent)}
                            color={(stock?.change_percent || 0) >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                          <Box sx={{ mt: 1 }}>
                            {(stock?.change_percent || 0) >= 0 ? (
                              <TrendingUp color="success" />
                            ) : (
                              <TrendingDown color="error" />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Action Buttons */}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/stock-analysis/${stock?.symbol}`)}
                          startIcon={<Visibility />}
                          sx={{ flex: 1 }}
                        >
                          View Analysis
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/stock-analysis/${stock?.symbol}`)}
                          startIcon={<Timeline />}
                          sx={{ flex: 1 }}
                        >
                          Generate Prediction
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Popular Stock Categories */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Popular Categories
              </Typography>
              <Grid container spacing={2}>
                {[
                  { name: 'Technology', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'] },
                  { name: 'Finance', symbols: ['JPM', 'BAC', 'WFC', 'GS'] },
                  { name: 'Healthcare', symbols: ['JNJ', 'PFE', 'UNH', 'ABBV'] },
                  { name: 'Energy', symbols: ['XOM', 'CVX', 'COP', 'EOG'] },
                ].map((category, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {category.name}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                        {category.symbols.map((symbol) => (
                          <Chip
                            key={symbol}
                            label={symbol}
                            size="small"
                            onClick={() => navigate(`/stock-analysis/${symbol}`)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Tips */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Tips
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      💡 Research Before Investing
                    </Typography>
                    <Typography variant="body2">
                      Always research a company's fundamentals, financial statements, and market position before making investment decisions.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'white' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      📊 Diversify Your Portfolio
                    </Typography>
                    <Typography variant="body2">
                      Spread your investments across different sectors and asset classes to reduce risk and increase potential returns.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      ⏰ Long-term Perspective
                    </Typography>
                    <Typography variant="body2">
                      Focus on long-term growth rather than short-term market fluctuations. Time in the market beats timing the market.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'white' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      🎯 Set Investment Goals
                    </Typography>
                    <Typography variant="body2">
                      Define clear investment objectives and risk tolerance to guide your portfolio decisions and stay disciplined.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Market;
