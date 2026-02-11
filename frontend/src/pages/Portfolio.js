import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// Add custom styles for the modal
const modalStyles = {
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1050,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1040
  }
};

const Portfolio = () => {
  const [searchParams] = useSearchParams();
  const [portfolioData, setPortfolioData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [sellFormData, setSellFormData] = useState({
    symbol: '',
    quantity: '',
    sell_price: '',
    sell_date: new Date().toISOString().split('T')[0]
  });
  const [currentPrices, setCurrentPrices] = useState({});
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedStockAnalysis, setSelectedStockAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [transactionSummary, setTransactionSummary] = useState(null);

  // Static stock data with current prices in INR (converted from USD)
  const staticStockPrices = {
    // Technology (25 stocks) - US stocks converted to INR
    'AAPL': 16580, 'MSFT': 34670, 'GOOGL': 11900, 'META': 40545, 'NVDA': 73085,
    'ADBE': 43900, 'CRM': 20525, 'NFLX': 40570, 'TXN': 13230, 'QCOM': 10505,
    'INTU': 40520, 'AMAT': 9385, 'ADI': 16330, 'ISRG': 28875, 'SPGI': 35525,
    'AVGO': 40570, 'ACN': 26365, 'IBM': 14650, 'ORCL': 7950, 'CSCO': 4410,
    'INTC': 3520, 'AMD': 9080, 'MU': 6550, 'ALGN': 27170, 'DXCM': 11290,
    
    // Consumer Cyclical (15 stocks) - US stocks converted to INR
    'AMZN': 12970, 'TSLA': 20750, 'HD': 27200, 'COST': 48885, 'SBUX': 7710,
    'TJX': 6860, 'CAT': 20505, 'DE': 31330, 'WMT': 5215, 'DIS': 7410,
    'NKE': 8205, 'MCD': 24700, 'TGT': 11310, 'LOW': 18835, 'UPS': 12970,
    'FDX': 22195, 'BA': 16320,
    
    // Financial Services (20 stocks) - US stocks converted to INR
    'BRK-B': 30275, 'V': 23000, 'JPM': 14440, 'MA': 35535, 'BAC': 2710,
    'UNP': 17180, 'BLK': 60605, 'MMC': 16330, 'GS': 28870, 'MS': 6875,
    'C': 4355, 'WFC': 3825, 'SCHW': 5215, 'AXP': 13805, 'USB': 3235,
    'PNC': 11320, 'COF': 8550, 'AIG': 4870, 'PRU': 7745, 'MET': 5715,
    'ALL': 10490, 'TRV': 16320, 'PGR': 12420, 'CB': 18835, 'AFL': 5750,
    
    // Healthcare (18 stocks) - US stocks converted to INR
    'JNJ': 14100, 'UNH': 43025, 'ABBV': 12170, 'PFE': 2625, 'TMO': 37205,
    'DHR': 19685, 'MRK': 8215, 'GILD': 5715, 'BMY': 4070, 'REGN': 60605,
    'BDX': 19670, 'LLY': 62275, 'AMGN': 19660, 'HUM': 37225, 'CI': 24670,
    'ANTM': 33035, 'DVA': 10475, 'HCA': 15515, 'BIIB': 19670, 'VRTX': 33035,
    'BMRN': 7410, 'ILMN': 15470, 'WAT': 28040, 'IDXX': 37205, 'ALNY': 15485,
    
    // Consumer Defensive (6 stocks) - US stocks converted to INR
    'PG': 13565, 'KO': 4905, 'PEP': 14665, 'MDLZ': 5715,
    
    // Industrials (8 stocks) - US stocks converted to INR
    'RTX': 6875, 'HON': 16345, 'GE': 7385, 'LMT': 37205, 'NEE': 4905, 'DUK': 7380,
    
    // Communication Services (4 stocks) - US stocks converted to INR
    'CMCSA': 3520, 'T': 1405, 'VZ': 3125,
    
    // Energy (4 stocks) - US stocks converted to INR
    'PM': 7410, 'SO': 5715, 'XOM': 8545, 'CVX': 12430
  };

  useEffect(() => {
    // Add animation on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchPortfolio();
    fetchTransactions();
    fetchTransactionSummary();
  }, []);



  // Handle URL parameters for pre-filling the add form
  useEffect(() => {
    const symbol = searchParams.get('symbol');
    const stockName = searchParams.get('name');
    const currentPrice = searchParams.get('price');
    
    if (symbol) {
      // Pre-fill the form with stock information from URL
      setFormData(prev => ({
        ...prev,
        symbol: symbol,
        purchase_price: currentPrice || ''
      }));
      
      // Show the add form automatically
      setShowAddForm(true);
      
      // Show success message if stock name is provided
      if (stockName) {
        setSuccess(`Ready to add ${stockName} (${symbol}) to your portfolio!`);
        setTimeout(() => setSuccess(''), 5000);
      }
    }
  }, [searchParams]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/portfolio/');
      setPortfolioData(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Please complete KYC verification to view your portfolio');
      } else {
        setError('Failed to load portfolio data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions/');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchTransactionSummary = async () => {
    try {
      const response = await axios.get('/api/transactions/summary');
      setTransactionSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch transaction summary:', error);
    }
  };

  const fetchCurrentPrices = () => {
    if (!portfolioData?.stocks) return;
    
    // Use static prices instead of API calls
    const priceMap = {};
    portfolioData.stocks.forEach(stock => {
      if (staticStockPrices[stock.symbol]) {
        priceMap[stock.symbol] = staticStockPrices[stock.symbol];
      }
    });
    
    setCurrentPrices(priceMap);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSellChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'symbol' && value) {
      // Auto-fill purchase price and available quantity when stock is selected
      const selectedStock = portfolioData?.stocks?.find(stock => stock.symbol === value);
      if (selectedStock) {
        setSellFormData({
          ...sellFormData,
          [name]: value,
          available_quantity: selectedStock.quantity,
          avg_purchase_price: selectedStock.last_purchase_price || selectedStock.avg_purchase_price
        });
      }
    } else {
      setSellFormData({
        ...sellFormData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    // Client-side validation
    if (!formData.symbol || !formData.quantity || !formData.purchase_price || !formData.purchase_date) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (parseFloat(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    if (parseFloat(formData.purchase_price) <= 0) {
      setError('Purchase price must be greater than 0');
      return;
    }
    
    try {
      const response = await axios.post('/api/portfolio/add', formData);
      console.log('Success response:', response.data);
      setSuccess('Stock added to portfolio successfully!');
      setError(''); // Clear any previous errors
      setFormData({ symbol: '', quantity: '', purchase_price: '', purchase_date: new Date().toISOString().split('T')[0] });
      setShowAddForm(false);
      fetchPortfolio();
      fetchTransactions();
      fetchTransactionSummary(); // Update summary after adding
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding stock:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to add stock');
      setSuccess(''); // Clear any previous success messages
    }
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting sell form data:', sellFormData);
    
    // Client-side validation
    if (!sellFormData.symbol || !sellFormData.quantity || !sellFormData.sell_price) {
      setError('Please fill in stock, quantity, and sell price');
      return;
    }
    
    // Auto-fill date if not provided
    if (!sellFormData.sell_date) {
      setSellFormData(prev => ({
        ...prev,
        sell_date: new Date().toISOString().split('T')[0]
      }));
    }
    
    if (parseFloat(sellFormData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    if (parseFloat(sellFormData.quantity) > parseFloat(sellFormData.available_quantity)) {
      setError(`You can only sell up to ${sellFormData.available_quantity} shares of ${sellFormData.symbol}`);
      return;
    }
    
    if (parseFloat(sellFormData.sell_price) <= 0) {
      setError('Sell price must be greater than 0');
      return;
    }
    
    try {
      const response = await axios.post('/api/portfolio/sell', sellFormData);
      console.log('Sell success response:', response.data);
      setSuccess('Stock sold successfully!');
      setError(''); // Clear any previous errors
      setSellFormData({ symbol: '', quantity: '', sell_price: '', sell_date: new Date().toISOString().split('T')[0] });
      setShowSellForm(false);
      setSelectedStock(null);
      fetchPortfolio();
      fetchTransactions();
      fetchTransactionSummary(); // Update summary after selling
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error selling stock:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to sell stock');
      setSuccess(''); // Clear any previous success messages
    }
  };

  const handleRemoveStock = async (transactionId) => {
    if (window.confirm('Are you sure you want to remove this transaction? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/portfolio/remove/${transactionId}`);
        setSuccess('Transaction removed successfully');
        fetchPortfolio();
        fetchTransactions();
        fetchTransactionSummary(); // Update summary after removing
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to remove transaction');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleRemoveTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to remove this transaction? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/transactions/${transactionId}`);
        setSuccess('Transaction removed successfully');
        fetchPortfolio();
        fetchTransactions();
        fetchTransactionSummary(); // Update summary after removing
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to remove transaction');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const openSellForm = (stock) => {
    setSelectedStock(stock);
    setSellFormData({
      symbol: stock.symbol,
      quantity: '',
      sell_price: staticStockPrices[stock.symbol] || '',
      sell_date: new Date().toISOString().split('T')[0],
      available_quantity: stock.quantity,
      avg_purchase_price: stock.last_purchase_price || stock.avg_purchase_price, // Use actual purchase price
      current_market_price: staticStockPrices[stock.symbol] || 0
    });
    setShowSellForm(true);
    setShowAddForm(false);
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    if (!showAddForm) {
      // Clear form when opening
      setFormData({ symbol: '', quantity: '', purchase_price: '', purchase_date: new Date().toISOString().split('T')[0] });
      setError('');
      setSuccess('');
    }
    setShowSellForm(false);
    setSelectedStock(null);
  };

  const toggleSellForm = () => {
    setShowSellForm(!showSellForm);
    if (!showSellForm) {
      setSellFormData({ 
        symbol: '', 
        quantity: '', 
        sell_price: '', 
        sell_date: new Date().toISOString().split('T')[0],
        available_quantity: null,
        avg_purchase_price: null
      });
      setError('');
      setSuccess('');
    }
    setShowAddForm(false);
    setSelectedStock(null);
  };

  const fetchStockAnalysis = async (symbol) => {
    try {
      setAnalysisLoading(true);
      const response = await axios.get(`/api/portfolio/analysis/${symbol}`);
      setSelectedStockAnalysis(response.data);
      setShowAnalysisModal(true);
    } catch (error) {
      setError('Failed to fetch stock analysis');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-3">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      {/* Header */}
      <div className="row mb-5">
        <div className="col-12 animate-on-scroll">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-4 fw-bold text-primary mb-2">💼 My Portfolio</h1>
              <p className="lead text-muted">Manage your investment portfolio</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary btn-lg"
                onClick={toggleAddForm}
              >
                <i className="fas fa-plus me-2"></i>
                {showAddForm ? 'Cancel' : 'Add Stock'}
              </button>
              <button
                className="btn btn-success btn-lg"
                onClick={toggleSellForm}
              >
                <i className="fas fa-minus me-2"></i>
                {showSellForm ? 'Cancel' : 'Sell Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="row mb-4">
          <div className="col-12 animate-on-scroll">
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="row mb-4">
          <div className="col-12 animate-on-scroll">
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          </div>
        </div>
      )}



      {/* Add Stock Form */}
      {showAddForm && (
        <div className="row mb-5">
          <div className="col-12 animate-on-scroll">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">📈 Add New Stock</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label htmlFor="symbol" className="form-label">
                        <i className="fas fa-tag me-2"></i>Stock Symbol *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="symbol"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleChange}
                        required
                        placeholder="e.g., AAPL, GOOGL"
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label htmlFor="quantity" className="form-label">
                        <i className="fas fa-layer-group me-2"></i>Quantity *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="Number of shares"
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label htmlFor="purchasePrice" className="form-label">
                        <i className="fas fa-dollar-sign me-2"></i>Purchase Price *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="purchasePrice"
                        name="purchase_price"
                        value={formData.purchase_price}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        placeholder="Price per share"
                      />
                    </div>

                    <div className="col-md-3 mb-3">
                      <label htmlFor="purchaseDate" className="form-label">
                        <i className="fas fa-calendar-alt me-2"></i>Purchase Date *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="purchaseDate"
                        name="purchase_date"
                        value={formData.purchase_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-plus me-2"></i>Add to Portfolio
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={toggleAddForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sell Stock Form */}
      {showSellForm && (
        <div className="row mb-5">
          <div className="col-12 animate-on-scroll">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">📉 Sell Stock</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSellSubmit}>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label htmlFor="sellSymbol" className="form-label">
                        <i className="fas fa-tag me-2"></i>Select Stock *
                      </label>
                      <select
                        className="form-control"
                        id="sellSymbol"
                        name="symbol"
                        value={sellFormData.symbol}
                        onChange={handleSellChange}
                        required
                      >
                        <option value="">Choose a stock...</option>
                        {portfolioData?.stocks?.map((stock) => (
                          <option key={stock.symbol} value={stock.symbol}>
                            {stock.symbol} - {stock.quantity} shares @ ₹{staticStockPrices[stock.symbol]?.toFixed(2) || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                                        <div className="col-md-4 mb-3">
                      <label htmlFor="sellQuantity" className="form-label">
                        <i className="fas fa-layer-group me-2"></i>Quantity *
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        id="sellQuantity"
                        name="quantity"
                        value={sellFormData.quantity}
                        onChange={handleSellChange}
                        required
                        min="1"
                        placeholder="Number of shares"
                      />
                      {sellFormData.available_quantity && (
                        <small className="form-text text-muted">
                          Available: {sellFormData.available_quantity} shares
                        </small>
                      )}
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="sellPrice" className="form-label">
                        <i className="fas fa-dollar-sign me-2"></i>Sell Price *
                        {sellFormData.current_market_price && (
                          <small className="form-text text-muted ms-2">
                            (Current: ₹{sellFormData.current_market_price?.toFixed(2)})
                          </small>
                        )}
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        id="sellPrice"
                        name="sell_price"
                        value={sellFormData.sell_price}
                        onChange={handleSellChange}
                        required
                        step="0.01"
                        min="0"
                        placeholder="Price per share"
                      />
                      {sellFormData.sell_price && sellFormData.avg_purchase_price && sellFormData.quantity && (
                        <small className={`form-text ${parseFloat(sellFormData.sell_price) >= parseFloat(sellFormData.avg_purchase_price) ? 'text-success' : 'text-danger'}`}>
                          {parseFloat(sellFormData.sell_price) >= parseFloat(sellFormData.avg_purchase_price) ? '📈' : '📉'} 
                          {parseFloat(sellFormData.sell_price) >= parseFloat(sellFormData.avg_purchase_price) ? 'Profit' : 'Loss'}: 
                          ₹{Math.abs((parseFloat(sellFormData.sell_price) - parseFloat(sellFormData.avg_purchase_price)) * parseFloat(sellFormData.quantity)).toFixed(2)}
                        </small>
                      )}
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="sellDate" className="form-label">
                        <i className="fas fa-calendar-alt me-2"></i>Sell Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="sellDate"
                        name="sell_date"
                        value={sellFormData.sell_date}
                        onChange={handleSellChange}
                      />
                      <small className="form-text text-muted">Leave empty to use today's date</small>
                    </div>
                    
                    {/* Selected Stock Details */}
                    {sellFormData.symbol && sellFormData.avg_purchase_price && (
                      <div className="col-12 mb-3">
                        <div className="alert alert-info">
                          <div className="row">
                            <div className="col-md-3">
                              <strong>Stock:</strong> {sellFormData.symbol}
                            </div>
                            <div className="col-md-3">
                              <strong>Buy Price:</strong> ₹{sellFormData.avg_purchase_price?.toFixed(2)}
                            </div>
                            <div className="col-md-3">
                              <strong>Available:</strong> {sellFormData.available_quantity} shares
                            </div>
                            <div className="col-md-3">
                              <strong>Total Invested:</strong> ₹{(sellFormData.available_quantity * sellFormData.avg_purchase_price)?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Transaction Summary */}
                  {sellFormData.symbol && sellFormData.quantity && sellFormData.sell_price && sellFormData.avg_purchase_price && (
                    <div className="row mb-3">
                      <div className="col-12">
                        <div className="card border-primary">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">📊 Transaction Summary</h6>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-3">
                                <strong>Stock:</strong> {sellFormData.symbol}
                              </div>
                              <div className="col-md-3">
                                <strong>Quantity:</strong> {sellFormData.quantity} shares
                              </div>
                              <div className="col-md-3">
                                <strong>Buy Price:</strong> ₹{sellFormData.avg_purchase_price?.toFixed(2)}
                              </div>
                              <div className="col-md-3">
                                <strong>Sell Price:</strong> ₹{sellFormData.sell_price}
                              </div>
                            </div>
                            <div className="row mt-2">
                              <div className="col-md-3">
                                <strong>Total Buy Value:</strong> ₹{(parseFloat(sellFormData.quantity) * parseFloat(sellFormData.avg_purchase_price)).toFixed(2)}
                              </div>
                              <div className="col-md-3">
                                <strong>Total Sell Value:</strong> ₹{(parseFloat(sellFormData.quantity) * parseFloat(sellFormData.sell_price)).toFixed(2)}
                              </div>
                              <div className="col-md-3">
                                <strong>Profit/Loss:</strong> 
                                <span className={`ms-1 ${parseFloat(sellFormData.sell_price) >= parseFloat(sellFormData.avg_purchase_price) ? 'text-success' : 'text-danger'}`}>
                                  ₹{((parseFloat(sellFormData.sell_price) - parseFloat(sellFormData.avg_purchase_price)) * parseFloat(sellFormData.quantity)).toFixed(2)}
                                </span>
                              </div>
                              <div className="col-md-3">
                                <strong>Return:</strong> 
                                <span className={`ms-1 ${parseFloat(sellFormData.sell_price) >= parseFloat(sellFormData.avg_purchase_price) ? 'text-success' : 'text-danger'}`}>
                                  {(((parseFloat(sellFormData.sell_price) - parseFloat(sellFormData.avg_purchase_price)) / parseFloat(sellFormData.avg_purchase_price)) * 100).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success">
                      <i className="fas fa-minus me-2"></i>Sell Stock
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={toggleSellForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolioData && (
        <div className="row mb-5">
          <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
            <div className="card text-center h-100">
              <div className="card-body">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-chart-line fa-2x"></i>
                </div>
                <h4 className="text-primary">
                  ₹{portfolioData?.total_value ? portfolioData.total_value.toLocaleString() : '0'}
                </h4>
                <p className="text-muted">Total Value</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
            <div className="card text-center h-100">
              <div className="card-body">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-coins fa-2x"></i>
                </div>
                <h4 className="text-success">
                  ₹{(() => {
                    // Use the simple calculation: Total Sell - Total Buy
                    const totalBuyValue = portfolioData?.total_buy_value || 0;
                    const totalSellValue = portfolioData?.total_sell_value || 0;
                    const totalProfitLoss = totalSellValue - totalBuyValue;
                    return totalProfitLoss.toLocaleString();
                  })()}
                </h4>
                <p className="text-muted">Total Profit/Loss</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
            <div className="card text-center h-100">
              <div className="card-body">
                <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-percentage fa-2x"></i>
                </div>
                <h4 className="text-info">
                  {(() => {
                    // Use the simple calculation from backend: (Total Sell - Total Buy) / Total Buy * 100
                    const totalBuyValue = portfolioData?.total_buy_value || 0;
                    const totalSellValue = portfolioData?.total_sell_value || 0;
                    const totalProfitLoss = totalSellValue - totalBuyValue;
                    const returnPercent = totalBuyValue > 0 ? (totalProfitLoss / totalBuyValue) * 100 : 0;
                    return returnPercent.toFixed(2);
                  })()}%
                </h4>
                <p className="text-muted">Total Return %</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
            <div className="card text-center h-100">
              <div className="card-body">
                <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <i className="fas fa-list fa-2x"></i>
                </div>
                <h4 className="text-warning">
                  {portfolioData.stocks?.length || '0'}
                </h4>
                <p className="text-muted">Stocks Held</p>
              </div>
            </div>
          </div>
          

        </div>
      )}

      {/* Detailed Profit/Loss Breakdown */}
      <div className="row mb-4">
        <div className="col-12 animate-on-scroll">
          <div className="card border-0 shadow-sm" style={{borderRadius: '15px'}}>
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-chart-pie me-2 text-success"></i>
                Detailed Profit/Loss Breakdown
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <h6 className="text-success mb-2">Total Buy Value</h6>
                  <h4 className="fw-bold text-success">
                    ₹{portfolioData.total_buy_value ? portfolioData.total_buy_value.toLocaleString() : '0'}
                  </h4>
                  <small className="text-muted">Total amount invested in buying stocks</small>
                </div>
                
                <div className="col-md-4">
                  <h6 className="text-danger mb-2">Total Sell Value</h6>
                  <h4 className="fw-bold text-danger">
                    ₹{portfolioData.total_sell_value ? portfolioData.total_sell_value.toLocaleString() : '0'}
                  </h4>
                  <small className="text-muted">Total amount received from selling stocks</small>
                </div>
                
                <div className="col-md-4">
                  <h6 className="text-info mb-2">Net Profit/Loss</h6>
                  <h4 className={`fw-bold ${(() => {
                    const totalBuyValue = portfolioData.total_buy_value || 0;
                    const totalSellValue = portfolioData.total_sell_value || 0;
                    const totalProfitLoss = totalSellValue - totalBuyValue;
                    return totalProfitLoss >= 0 ? 'text-success' : 'text-danger';
                  })()}`}>
                    {(() => {
                      const totalBuyValue = portfolioData.total_buy_value || 0;
                      const totalSellValue = portfolioData.total_sell_value || 0;
                      const totalProfitLoss = totalSellValue - totalBuyValue;
                      return totalProfitLoss >= 0 ? '+' : '';
                    })()}₹{(() => {
                      const totalBuyValue = portfolioData.total_buy_value || 0;
                      const totalSellValue = portfolioData.total_sell_value || 0;
                      const totalProfitLoss = totalSellValue - totalBuyValue;
                      return Math.abs(totalProfitLoss).toLocaleString();
                    })()}
                  </h4>
                  <small className="text-muted">Net result: Sell Value - Buy Value</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Holdings */}
      <div className="row mb-5">
        <div className="col-12 animate-on-scroll">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">📊 Portfolio Holdings</h5>
            </div>
            <div className="card-body">
              {portfolioData?.stocks && portfolioData.stocks.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{width: '25%'}}>Stock</th>
                        <th style={{width: '15%'}}>Quantity</th>
                        <th style={{width: '20%'}}>Purchase Price (₹)</th>
                        <th style={{width: '20%'}}>Market Price (₹)</th>
                        <th style={{width: '20%'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioData.stocks.map((stock, index) => (
                        <tr key={index}>
                          <td>
                            <Link to={`/stock/${stock.symbol}`} className="text-decoration-none">
                              <strong>{stock.symbol}</strong>
                            </Link>
                          </td>
                          <td>{stock.quantity}</td>
                          <td>
                            <span className="fw-bold text-primary">₹{(stock.last_purchase_price || stock.avg_purchase_price)?.toFixed(2) || 'N/A'}</span>
                          </td>
                          <td>
                            <span className="fw-bold">₹{staticStockPrices[stock.symbol]?.toFixed(2) || 'N/A'}</span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <Link
                                to={`/stock/${stock.symbol}`}
                                className="btn btn-outline-primary btn-sm"
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </Link>
                              <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => openSellForm(stock)}
                                title="Sell Stock"
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-portfolio text-muted fa-4x mb-4"></i>
                  <h4 className="text-muted mb-3">Your portfolio is empty</h4>
                  <p className="text-muted mb-4">
                    Start building your investment portfolio by adding stocks
                  </p>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={toggleAddForm}
                  >
                    <i className="fas fa-plus me-2"></i>Add Your First Stock
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      {transactionSummary && (
        <div className="col-12 mb-4 animate-on-scroll">
          <div className="card bg-light">
            <div className="card-body">
              <h6 className="text-primary mb-3">
                <i className="fas fa-calculator me-2"></i>Transaction Summary
              </h6>
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center">
                    <h5 className="text-primary mb-1">
                      {transactionSummary.total_buy_transactions}
                    </h5>
                    <small className="text-muted">Buy Transactions</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <h5 className="text-danger mb-1">
                      {transactionSummary.total_sell_transactions}
                    </h5>
                    <small className="text-muted">Sell Transactions</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <h5 className={`mb-1 ${(() => {
                      const totalBuyValue = transactionSummary.total_buy_value || 0;
                      const totalSellValue = transactionSummary.total_sell_value || 0;
                      const totalProfitLoss = totalSellValue - totalBuyValue;
                      return totalProfitLoss >= 0 ? 'text-success' : 'text-danger';
                    })()}`}>
                      ₹{(() => {
                        const totalBuyValue = transactionSummary.total_buy_value || 0;
                        const totalSellValue = transactionSummary.total_sell_value || 0;
                        const totalProfitLoss = totalSellValue - totalBuyValue;
                        return Math.abs(totalProfitLoss).toFixed(2);
                      })()}
                    </h5>
                    <small className="text-muted">Net Profit/Loss</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <h5 className={`mb-1 ${(() => {
                      const totalBuyValue = transactionSummary.total_buy_value || 0;
                      const totalSellValue = transactionSummary.total_sell_value || 0;
                      const totalProfitLoss = totalSellValue - totalBuyValue;
                      const returnPercent = totalBuyValue > 0 ? (totalProfitLoss / totalBuyValue) * 100 : 0;
                      return returnPercent >= 0 ? 'text-success' : 'text-danger';
                    })()}`}>
                      {(() => {
                        const totalBuyValue = transactionSummary.total_buy_value || 0;
                        const totalSellValue = transactionSummary.total_sell_value || 0;
                        const totalProfitLoss = totalSellValue - totalBuyValue;
                        const returnPercent = totalBuyValue > 0 ? (totalProfitLoss / totalBuyValue) * 100 : 0;
                        return returnPercent.toFixed(2);
                      })()}%
                    </h5>
                    <small className="text-muted">Overall Return %</small>
                  </div>
                </div>
              </div>
              
              {/* Additional Summary Information */}
              <div className="row mt-3">
                <div className="col-md-6">
                  <div className="text-center">
                    <h6 className="text-info mb-1">
                      ₹{(() => {
                        const totalBuyValue = transactionSummary.total_buy_value || 0;
                        return totalBuyValue.toFixed(2);
                      })()}
                    </h6>
                    <small className="text-muted">Total Invested (Buy)</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-center">
                    <h6 className="text-warning mb-1">
                      ₹{(() => {
                        const totalSellValue = transactionSummary.total_sell_value || 0;
                        return totalSellValue.toFixed(2);
                      })()}
                    </h6>
                    <small className="text-muted">Total Realized (Sell)</small>
                  </div>
                </div>
              </div>
              
              {/* Calculation Method Explanation */}
              <div className="row mt-3">
                <div className="col-12">
                  <div className="alert alert-info">
                    <h6 className="mb-2">
                      <i className="fas fa-info-circle me-2"></i>How Profit/Loss is Calculated
                    </h6>
                    <p className="mb-1 small">
                      <strong>Simple Method:</strong> Total Profit/Loss = (Sum of All Sell Transactions) - (Sum of All Buy Transactions)
                    </p>
                    <p className="mb-0 small text-muted">
                      This approach calculates the overall performance by comparing total money received from selling vs. total money invested in buying.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="col-12 animate-on-scroll">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-history me-2"></i>Transaction History
            </h5>
          </div>
          <div className="card-body">
            {transactions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Stock</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price (₹)</th>
                      <th>Total Value (₹)</th>
                      <th>Profit/Loss (₹)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </td>
                        <td>
                          <strong>{transaction.symbol}</strong>
                        </td>
                        <td>
                          <span className={`badge ${transaction.transaction_type === 'buy' ? 'bg-success' : 'bg-danger'}`}>
                            {transaction.transaction_type === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                        </td>
                        <td>{transaction.quantity}</td>
                        <td>₹{parseFloat(transaction.price).toFixed(2)}</td>
                        <td>₹{transaction.total_value?.toFixed(2) || (transaction.quantity * transaction.price).toFixed(2)}</td>
                        <td>
                          {transaction.transaction_type === 'sell' && transaction.profit_loss !== null ? (
                            <span className={`fw-bold ${transaction.profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                              {transaction.profit_loss >= 0 ? '+' : ''}₹{transaction.profit_loss.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => fetchStockAnalysis(transaction.symbol)}
                              title="View Analysis"
                            >
                              <i className="fas fa-chart-line"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveTransaction(transaction.id)}
                              title="Remove Transaction"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted py-4">
                <i className="fas fa-inbox fa-3x mb-3"></i>
                <p>No transactions found. Start by adding some stocks to your portfolio!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Tips */}
      <div className="row mt-5">
        <div className="col-12 animate-on-scroll">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="text-primary mb-4">💡 Portfolio Management Tips</h5>
              <div className="row">
                <div className="col-md-6">
                  <h6><i className="fas fa-lightbulb text-warning me-2"></i>Diversification</h6>
                  <p className="text-muted">
                    Spread your investments across different sectors and companies to reduce risk.
                  </p>
                </div>
                <div className="col-md-6">
                  <h6><i className="fas fa-chart-line text-success me-2"></i>Regular Monitoring</h6>
                  <p className="text-muted">
                    Keep track of your portfolio performance and make adjustments as needed.
                  </p>
                </div>
                <div className="col-md-6">
                  <h6><i className="fas fa-clock text-info me-2"></i>Long-term Perspective</h6>
                  <p className="text-muted">
                    Focus on long-term growth rather than short-term market fluctuations.
                  </p>
                </div>
                <div className="col-md-6">
                  <h6><i className="fas fa-shield-alt text-primary me-2"></i>Risk Management</h6>
                  <p className="text-muted">
                    Set stop-loss orders and don't invest more than you can afford to lose.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Analysis Modal */}
      {showAnalysisModal && selectedStockAnalysis && (
        <>
          {/* Modal Backdrop */}
          <div 
            style={modalStyles.backdrop}
            onClick={() => setShowAnalysisModal(false)}
          ></div>
          
          {/* Modal */}
          <div style={modalStyles.modal}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-chart-line me-2"></i>
                    {selectedStockAnalysis.symbol} - Detailed Analysis
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowAnalysisModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {analysisLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading analysis...</p>
                    </div>
                  ) : (
                    <div>
                      {/* Summary Cards */}
                      <div className="row mb-4">
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h6 className="text-primary">{selectedStockAnalysis.total_bought_quantity}</h6>
                              <small className="text-muted">Total Bought</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h6 className="text-danger">{selectedStockAnalysis.total_sold_quantity}</h6>
                              <small className="text-muted">Total Sold</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h6 className="text-info">{selectedStockAnalysis.remaining_quantity}</h6>
                              <small className="text-muted">Current Holdings</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h6 className={`${selectedStockAnalysis.realized_profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                                ₹{Math.abs(selectedStockAnalysis.realized_profit_loss).toFixed(2)}
                              </h6>
                              <small className="text-muted">Realized P&L</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">Investment Summary</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Total Invested:</strong> ₹{selectedStockAnalysis.total_bought_value.toFixed(2)}</p>
                              <p><strong>Total Sold Value:</strong> ₹{selectedStockAnalysis.total_sold_value.toFixed(2)}</p>
                              <p><strong>Current Holdings Value:</strong> ₹{(selectedStockAnalysis.remaining_quantity * selectedStockAnalysis.avg_purchase_price).toFixed(2)}</p>
                              <p><strong>Average Purchase Price:</strong> ₹{selectedStockAnalysis.avg_purchase_price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">Performance Summary</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Realized Profit/Loss:</strong> 
                                <span className={`ms-2 fw-bold ${selectedStockAnalysis.realized_profit_loss >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {selectedStockAnalysis.realized_profit_loss >= 0 ? '+' : ''}₹{selectedStockAnalysis.realized_profit_loss.toFixed(2)}
                                </span>
                              </p>
                              <p><strong>Total Return:</strong> 
                                <span className={`ms-2 fw-bold ${selectedStockAnalysis.total_return_percentage >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {selectedStockAnalysis.total_return_percentage >= 0 ? '+' : ''}{selectedStockAnalysis.total_return_percentage.toFixed(2)}%
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="card">
                        <div className="card-header">
                          <h6 className="mb-0">Transaction Details</h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6">
                              <h6 className="text-success">Buy Transactions</h6>
                              {selectedStockAnalysis.transactions.buy.length > 0 ? (
                                <div className="table-responsive">
                                  <table className="table table-sm">
                                    <thead>
                                      <tr>
                                        <th>Date</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedStockAnalysis.transactions.buy.map((buy, index) => (
                                        <tr key={index}>
                                          <td>{new Date(buy.date).toLocaleDateString()}</td>
                                          <td>{buy.quantity}</td>
                                          <td>₹{buy.price.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-muted">No buy transactions</p>
                              )}
                            </div>
                            <div className="col-md-6">
                              <h6 className="text-danger">Sell Transactions</h6>
                              {selectedStockAnalysis.transactions.sell.length > 0 ? (
                                <div className="table-responsive">
                                  <table className="table table-sm">
                                    <thead>
                                      <tr>
                                        <th>Date</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedStockAnalysis.transactions.sell.map((sell, index) => (
                                        <tr key={index}>
                                          <td>{new Date(sell.date).toLocaleDateString()}</td>
                                          <td>{sell.quantity}</td>
                                          <td>₹{sell.price.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-muted">No sell transactions</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAnalysisModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Portfolio;
