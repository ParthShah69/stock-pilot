import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { marketIndicesData, marketNewsData, economicCalendarData, marketAnalysisPages } from '../data/marketData';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioData, setPortfolioData] = useState(null);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [marketIndices, setMarketIndices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Static stock data with current prices in INR (converted from USD)
  const staticStocks = [
    // Technology (25 stocks) - US stocks converted to INR
    { symbol: 'AAPL', name: 'Apple Inc.', current_price: 16580, sector: 'Technology', market_cap: 3100000000000, change_percent: 1.2, volume: 52000000 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', current_price: 34670, sector: 'Technology', market_cap: 3080000000000, change_percent: 0.8, volume: 38000000 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', current_price: 11900, sector: 'Technology', market_cap: 1790000000000, change_percent: -0.3, volume: 28000000 },
    { symbol: 'META', name: 'Meta Platforms Inc.', current_price: 40545, sector: 'Technology', market_cap: 1230000000000, change_percent: 2.1, volume: 32000000 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', current_price: 73085, sector: 'Technology', market_cap: 2150000000000, change_percent: 3.5, volume: 45000000 },
    { symbol: 'ADBE', name: 'Adobe Inc.', current_price: 43900, sector: 'Technology', market_cap: 240000000000, change_percent: 0.9, volume: 18000000 },
    { symbol: 'CRM', name: 'Salesforce Inc.', current_price: 20525, sector: 'Technology', market_cap: 240000000000, change_percent: -0.7, volume: 22000000 },
    { symbol: 'NFLX', name: 'Netflix Inc.', current_price: 40570, sector: 'Consumer Cyclical', market_cap: 210000000000, change_percent: 1.8, volume: 20000000 },
    { symbol: 'TSLA', name: 'Tesla Inc.', current_price: 20750, sector: 'Consumer Cyclical', market_cap: 790000000000, change_percent: 2.8, volume: 60000000 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', current_price: 12970, sector: 'Consumer Cyclical', market_cap: 1610000000000, change_percent: 1.5, volume: 50000000 },
    
    // Financial Services - US stocks converted to INR
    { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', current_price: 30275, sector: 'Financial Services', market_cap: 790000000000, change_percent: 0.4, volume: 9000000 },
    { symbol: 'V', name: 'Visa Inc.', current_price: 23000, sector: 'Financial Services', market_cap: 565000000000, change_percent: 0.8, volume: 30000000 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', current_price: 14440, sector: 'Financial Services', market_cap: 520000000000, change_percent: -0.3, volume: 35000000 },
    
    // Healthcare - US stocks converted to INR
    { symbol: 'JNJ', name: 'Johnson & Johnson', current_price: 14100, sector: 'Healthcare', market_cap: 408000000000, change_percent: 0.6, volume: 28000000 },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', current_price: 43025, sector: 'Healthcare', market_cap: 478000000000, change_percent: 1.2, volume: 20000000 },
    { symbol: 'LLY', name: 'Eli Lilly and Company', current_price: 62275, sector: 'Healthcare', market_cap: 708000000000, change_percent: 2.8, volume: 15000000 },
    
    // Consumer Defensive - US stocks converted to INR
    { symbol: 'PG', name: 'Procter & Gamble Co.', current_price: 13565, sector: 'Consumer Defensive', market_cap: 383000000000, change_percent: 0.3, volume: 22000000 },
    { symbol: 'KO', name: 'The Coca-Cola Company', current_price: 4905, sector: 'Consumer Defensive', market_cap: 271000000000, change_percent: 0.7, volume: 32000000 },
    
    // Energy - US stocks converted to INR
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', current_price: 8545, sector: 'Energy', market_cap: 408000000000, change_percent: 1.2, volume: 28000000 },
    { symbol: 'CVX', name: 'Chevron Corporation', current_price: 12430, sector: 'Energy', market_cap: 280000000000, change_percent: 0.9, volume: 22000000 }
  ];

  // Top gainers and losers
  const topGainers = [...staticStocks].sort((a, b) => b.change_percent - a.change_percent).slice(0, 5);
  const topLosers = [...staticStocks].sort((a, b) => a.change_percent - b.change_percent).slice(0, 5);

  useEffect(() => {
    fetchPortfolioData();
    fetchTransactionSummary();
    fetchMarketIndices();
    
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

  const fetchPortfolioData = async () => {
    try {
      const response = await axios.get('/api/portfolio/');
      setPortfolioData(response.data);
    } catch (error) {
      console.log('Portfolio data not available or KYC not completed');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionSummary = async () => {
    try {
      const response = await axios.get('/api/transactions/summary');
      setTransactionSummary(response.data);
    } catch (error) {
      console.log('Transaction summary not available');
    }
  };

  const fetchMarketIndices = async () => {
    try {
      const response = await axios.get('/api/stocks/market/overview');
      if (response.data.market_overview) {
        setMarketIndices(response.data.market_overview);
      }
    } catch (error) {
      console.log('Using fallback market indices data');
      // Fallback data if API fails
      setMarketIndices([
        { symbol: '^NSEI', name: 'NIFTY 50', current_price: '22,419.95', change_percent: 0.85, change: '+189.40', trend: 'up' },
        { symbol: '^BSESN', name: 'SENSEX', current_price: '73,852.94', change_percent: 0.72, change: '+526.10', trend: 'up' },
        { symbol: '^NSEBANK', name: 'BANK NIFTY', current_price: '48,234.67', change_percent: 1.12, change: '+534.20', trend: 'up' },
        { symbol: '^NSEIT', name: 'NIFTY IT', current_price: '36,789.45', change_percent: -0.45, change: '-167.30', trend: 'down' }
      ]);
    }
  };

  // Calculate portfolio metrics for current holdings only with improved profit/loss tracking
  const calculatePortfolioMetrics = () => {
    if (!portfolioData || !portfolioData.stocks) return [];

    return portfolioData.stocks.map(stock => {
      const currentPrice = staticStocks.find(s => s.symbol === stock.symbol)?.current_price || stock.avg_purchase_price;
      const currentValue = currentPrice * stock.quantity;
      const totalInvestment = stock.total_investment || (stock.avg_purchase_price * stock.quantity);
      
      // Calculate unrealized profit/loss (paper profit/loss on current holdings)
      const unrealizedProfitLoss = currentValue - totalInvestment;
      const unrealizedProfitLossPercent = (unrealizedProfitLoss / totalInvestment) * 100;
      
      // Get realized profit/loss from backend (from completed sell transactions)
      const realizedProfitLoss = stock.realized_profit_loss || 0;
      
      // Total profit/loss (realized + unrealized)
      const totalProfitLoss = realizedProfitLoss + unrealizedProfitLoss;
      
      return {
        ...stock,
        currentPrice,
        currentValue,
        totalInvestment,
        unrealizedProfitLoss,
        unrealizedProfitLossPercent,
        realizedProfitLoss,
        totalProfitLoss,
        profitLoss: totalProfitLoss,
        profitLossPercent: unrealizedProfitLossPercent
      };
    });
  };

  const portfolioStocks = calculatePortfolioMetrics();

  return (
    <div className="container-fluid mt-4">
      {/* Welcome Hero Section */}
      <div className="row mb-4">
        <div className="col-12 animate-on-scroll">
          <div className="card border-0 shadow-lg" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px'
          }}>
            <div className="card-body text-white p-5">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="display-5 fw-bold mb-3">
                    Welcome back, {user?.name || 'Investor'}! 🚀
                  </h1>
                  <p className="lead mb-4">
                    Your investment dashboard is ready. Track your portfolio, analyze market trends, and make informed decisions.
                  </p>
                  <div className="d-flex gap-3">
                    <Link to="/market" className="btn btn-light btn-lg px-4">
                      <i className="fas fa-chart-line me-2"></i>Explore Market
                    </Link>
                    <Link to="/portfolio" className="btn btn-outline-light btn-lg px-4">
                      <i className="fas fa-portfolio me-2"></i>View Portfolio
                    </Link>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="bg-white bg-opacity-20 rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{width: '120px', height: '120px'}}>
                    <i className="fas fa-rocket fa-3x text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Summary Cards - Only Portfolio Value and Stocks Held */}
      <div className="row mb-4">
        <div className="col-lg-6 col-md-6 mb-3 animate-on-scroll">
          <div className="card border-0 shadow-sm h-100" style={{borderRadius: '15px'}}>
            <div className="card-body text-center p-4">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <i className="fas fa-chart-line fa-2x"></i>
              </div>
              <h3 className="fw-bold text-primary mb-2">
                ₹{portfolioData?.total_value ? portfolioData.total_value.toLocaleString() : '0'}
              </h3>
              <p className="text-muted mb-0">Portfolio Value</p>
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-md-6 mb-3 animate-on-scroll">
          <div className="card border-0 shadow-sm h-100" style={{borderRadius: '15px'}}>
            <div className="card-body text-center p-4">
              <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{width: '60px', height: '60px'}}>
                <i className="fas fa-list fa-2x"></i>
              </div>
              <h3 className="fw-bold text-warning mb-2">
                {portfolioStocks.length}
              </h3>
              <p className="text-muted mb-0">Stocks Held</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profit/Loss Breakdown Section */}
      {portfolioData && (
        <div className="row mb-4">
          <div className="col-12 animate-on-scroll">
            <div className="card border-0 shadow-sm" style={{borderRadius: '15px'}}>
              <div className="card-header bg-transparent border-0">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-chart-pie me-2 text-success"></i>
                  Profit/Loss Breakdown
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="text-center p-3 rounded" style={{backgroundColor: '#e8f5e8'}}>
                      <h6 className="text-success mb-2">Total Buy Value</h6>
                      <h4 className="fw-bold text-success">
                        ₹{portfolioData.total_buy_value ? portfolioData.total_buy_value.toLocaleString() : '0'}
                      </h4>
                      <small className="text-muted">Total amount invested in buying stocks</small>
                    </div>
                  </div>
                  
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="text-center p-3 rounded" style={{backgroundColor: '#fff3cd'}}>
                      <h6 className="text-warning mb-2">Total Sell Value</h6>
                      <h4 className="fw-bold text-warning">
                        ₹{portfolioData.total_sell_value ? portfolioData.total_sell_value.toLocaleString() : '0'}
                      </h4>
                      <small className="text-muted">Total amount received from selling stocks</small>
                    </div>
                  </div>
                  
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="text-center p-3 rounded" style={{backgroundColor: '#d1ecf1'}}>
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
                  
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="text-center p-3 rounded" style={{backgroundColor: '#f8f9fa'}}>
                      <h6 className="text-dark mb-2">Total Return %</h6>
                      <h4 className={`fw-bold ${(() => {
                        const totalBuyValue = portfolioData.total_buy_value || 0;
                        const totalSellValue = portfolioData.total_sell_value || 0;
                        const totalProfitLoss = totalSellValue - totalBuyValue;
                        const returnPercent = totalBuyValue > 0 ? (totalProfitLoss / totalBuyValue) * 100 : 0;
                        return returnPercent >= 0 ? 'text-success' : 'text-danger';
                      })()}`}>
                        {(() => {
                          const totalBuyValue = portfolioData.total_buy_value || 0;
                          const totalSellValue = portfolioData.total_sell_value || 0;
                          const totalProfitLoss = totalSellValue - totalBuyValue;
                          const returnPercent = totalBuyValue > 0 ? (totalProfitLoss / totalBuyValue) * 100 : 0;
                          return returnPercent.toFixed(2);
                        })()}%
                      </h4>
                      <small className="text-muted">Overall return: (Sell - Buy) / Buy * 100</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Indices with External Links */}
      <div className="row mb-4">
        <div className="col-12 animate-on-scroll">
          <div className="card border-0 shadow-sm" style={{borderRadius: '15px'}}>
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-globe me-2 text-primary"></i>
                Market Indices
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {marketIndicesData.map((index, idx) => (
                  <div key={idx} className="col-lg-3 col-md-6 mb-3">
                    <div className="d-flex justify-content-between align-items-center p-3 rounded" 
                         style={{backgroundColor: index.trend === 'up' || index.change_percent >= 0 ? '#e8f5e8' : '#ffeaea'}}>
                      <div>
                        <h6 className="mb-1 fw-bold">{index.name}</h6>
                        <div className="h5 mb-0 fw-bold">{index.current_price}</div>
                        <small className="text-muted">{index.sector}</small>
                      </div>
                      <div className="text-end">
                        <div className={`fw-bold ${(index.trend === 'up' || index.change_percent >= 0) ? 'text-success' : 'text-danger'}`}>
                          {index.change_percent >= 0 ? '+' : ''}{index.change_percent.toFixed(2)}%
                        </div>
                        <small className={`${(index.trend === 'up' || index.change_percent >= 0) ? 'text-success' : 'text-danger'}`}>
                          {index.change}
                        </small>
                        <div className="mt-2">
                          <a 
                            href={index.redirect_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm"
                            title={`View on ${index.external_source}`}
                          >
                            <i className="fas fa-external-link-alt me-1"></i>
                            {index.external_source}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="row mb-4">
        <div className="col-12 animate-on-scroll">
          <div className="card border-0 shadow-sm" style={{borderRadius: '15px'}}>
                        <div className="card-header bg-transparent border-0">
              <ul className="nav nav-tabs card-header-tabs w-100">
                <li className="nav-item flex-fill">
                  <button 
                    className={`nav-link w-100 ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                    style={{
                      color: activeTab === 'overview' ? '#fff' : '#495057',
                      backgroundColor: activeTab === 'overview' ? '#007bff' : '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '5px 5px 0 0',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}
                  >
                    <i className="fas fa-chart-pie me-2"></i>Portfolio Overview
                  </button>
                </li>
                <li className="nav-item flex-fill">
                  <button 
                    className={`nav-link w-100 ${activeTab === 'market' ? 'active' : ''}`}
                    onClick={() => setActiveTab('market')}
                    style={{
                      color: activeTab === 'market' ? '#fff' : '#495057',
                      backgroundColor: activeTab === 'market' ? '#007bff' : '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '5px 5px 0 0',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}
                  >
                    <i className="fas fa-chart-line me-2"></i>Market Trends
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {/* Portfolio Overview Tab - Current Holdings Only */}
              {activeTab === 'overview' && (
                <div className="row">
                  <div className="col-lg-8 mb-4">
                    <h6 className="fw-bold mb-3">Your Current Holdings</h6>
                    {portfolioStocks.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Stock</th>
                              <th>Quantity</th>
                              <th>Purchase Price (₹)</th>
                              <th>Current Price (₹)</th>
                              <th>Current Value (₹)</th>
                              <th>Total Investment (₹)</th>
                              <th>Profit/Loss (₹)</th>
                              <th>P&L %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portfolioStocks.map((stock, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                                         style={{width: '40px', height: '40px'}}>
                                      <i className="fas fa-chart-line"></i>
                                    </div>
                                    <div>
                                      <div className="fw-bold">{stock.symbol}</div>
                                      <small className="text-muted">{stock.sector || 'N/A'}</small>
                                    </div>
                                  </div>
                                </td>
                                <td className="fw-bold">{stock.quantity}</td>
                                <td>₹{stock.purchase_price.toFixed(2)}</td>
                                <td className="fw-bold">₹{stock.current_price.toFixed(2)}</td>
                                <td>₹{stock.currentValue.toFixed(2)}</td>
                                <td>₹{stock.totalInvestment.toFixed(2)}</td>
                                <td>
                                  <div className={`fw-bold ${stock.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {stock.profitLoss >= 0 ? '+' : ''}₹{stock.profitLoss.toFixed(2)}
                                  </div>
                                </td>
                                <td>
                                  <small className={`${stock.profitLossPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {stock.profitLossPercent >= 0 ? '+' : ''}{stock.profitLossPercent.toFixed(1)}%
                                  </small>
                                </td>
                                <td>
                                  <Link to={`/stock/${stock.symbol}`} className="btn btn-outline-primary btn-sm">
                                    <i className="fas fa-eye me-1"></i>View
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-portfolio text-muted fa-4x mb-4"></i>
                        <h4 className="text-muted mb-3">No stocks in your portfolio</h4>
                        <p className="text-muted mb-4">
                          Start building your investment portfolio by adding stocks
                        </p>
                        <Link to="/portfolio" className="btn btn-primary btn-lg">
                          <i className="fas fa-plus me-2"></i>Add Your First Stock
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="col-lg-4">
                    <h6 className="fw-bold mb-3">Portfolio Distribution</h6>
                    {portfolioStocks.length > 0 ? (
                      <div className="mb-4">
                        {portfolioStocks.map((stock, index) => {
                          const totalValue = portfolioStocks.reduce((sum, s) => sum + s.currentValue, 0);
                          const percentage = totalValue > 0 ? (stock.currentValue / totalValue) * 100 : 0;
                          
                          return (
                            <div key={index} className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <span className="fw-bold">{stock.symbol}</span>
                                <span className="text-muted">{percentage.toFixed(1)}%</span>
                              </div>
                              <div className="progress" style={{height: '8px'}}>
                                <div 
                                  className="progress-bar" 
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'][index % 5]
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-chart-pie text-muted fa-3x mb-3"></i>
                        <p className="text-muted">No portfolio data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Market Trends Tab */}
              {activeTab === 'market' && (
                <div className="row">
                  <div className="col-lg-6 mb-4">
                    <h6 className="fw-bold mb-3 text-success">
                      <i className="fas fa-arrow-up me-2"></i>Top Gainers
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Change</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topGainers.map((stock, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" 
                                       style={{width: '40px', height: '40px'}}>
                                    <i className="fas fa-arrow-up"></i>
                                  </div>
                                  <div>
                                    <div className="fw-bold">{stock.symbol}</div>
                                    <small className="text-muted">{stock.name}</small>
                                  </div>
                                </div>
                              </td>
                              <td className="fw-bold">₹{stock.current_price.toFixed(2)}</td>
                              <td className="text-success fw-bold">+{stock.change_percent.toFixed(2)}%</td>
                              <td>
                                <Link to={`/stock/${stock.symbol}`} className="btn btn-outline-success btn-sm">
                                  <i className="fas fa-chart-line me-1"></i>Analyze
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-lg-6 mb-4">
                    <h6 className="fw-bold mb-3 text-danger">
                      <i className="fas fa-arrow-down me-2"></i>Top Losers
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Change</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topLosers.map((stock, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center me-3" 
                                       style={{width: '40px', height: '40px'}}>
                                    <i className="fas fa-arrow-down"></i>
                                  </div>
                                  <div>
                                    <div className="fw-bold">{stock.symbol}</div>
                                    <small className="text-muted">{stock.name}</small>
                                  </div>
                                </div>
                              </td>
                              <td className="fw-bold">₹{stock.current_price.toFixed(2)}</td>
                              <td className="text-danger fw-bold">{stock.change_percent.toFixed(2)}%</td>
                              <td>
                                <Link to={`/stock/${stock.symbol}`} className="btn btn-outline-danger btn-sm">
                                  <i className="fas fa-chart-line me-1"></i>Analyze
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12 animate-on-scroll">
          <div className="card border-0 shadow-sm" style={{borderRadius: '15px'}}>
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-bolt me-2 text-warning"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-lg-3 col-md-6 mb-3">
                  <Link to="/market" className="card text-decoration-none h-100 border-0 shadow-sm" 
                        style={{borderRadius: '15px', transition: 'transform 0.2s'}}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div className="card-body text-center p-4">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px'}}>
                        <i className="fas fa-search fa-2x"></i>
                      </div>
                      <h6 className="fw-bold">Search Stocks</h6>
                      <p className="text-muted small">Find and analyze stocks</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6 mb-3">
                  <Link to="/portfolio" className="card text-decoration-none h-100 border-0 shadow-sm" 
                        style={{borderRadius: '15px', transition: 'transform 0.2s'}}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div className="card-body text-center p-4">
                      <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px'}}>
                        <i className="fas fa-portfolio fa-2x"></i>
                      </div>
                      <h6 className="fw-bold">Manage Portfolio</h6>
                      <p className="text-muted small">View and manage your investments</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6 mb-3">
                  <Link to="/kyc" className="card text-decoration-none h-100 border-0 shadow-sm" 
                        style={{borderRadius: '15px', transition: 'transform 0.2s'}}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div className="card-body text-center p-4">
                      <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px'}}>
                        <i className="fas fa-id-card fa-2x"></i>
                      </div>
                      <h6 className="fw-bold">Complete KYC</h6>
                      <p className="text-muted small">Verify your account</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6 mb-3">
                  <Link to="/profile" className="card text-decoration-none h-100 border-0 shadow-sm" 
                        style={{borderRadius: '15px', transition: 'transform 0.2s'}}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div className="card-body text-center p-4">
                      <div className="bg-info bg-opacity-10 text-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{width: '60px', height: '60px'}}>
                        <i className="fas fa-user fa-2x"></i>
                      </div>
                      <h6 className="fw-bold">Update Profile</h6>
                      <p className="text-muted small">Manage your account</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market News & Updates */}
      <div className="row mb-4">
        <div className="col-12 animate-on-scroll">
          <div className="card border-0 shadow-sm" style={{borderRadius: '15px'}}>
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-newspaper me-2 text-info"></i>
                Market Updates
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {marketNewsData.map((news, index) => (
                  <div key={news.id} className="col-md-4 mb-3">
                    <div className="card border-0 shadow-sm h-100" style={{borderRadius: '15px'}}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className={`bg-${news.color} bg-opacity-10 text-${news.color} rounded-circle d-flex align-items-center justify-content-center me-3`} 
                               style={{width: '40px', height: '40px'}}>
                            <i className={news.icon}></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0">{news.title}</h6>
                            <small className="text-muted">{news.time}</small>
                          </div>
                        </div>
                        <p className="text-muted small">
                          {news.summary}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`badge bg-${news.color}`}>{news.category}</span>
                          <a 
                            href={news.redirect_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            title={`Read full article on ${news.external_source}`}
                          >
                            <i className="fas fa-external-link-alt me-1"></i>
                            {news.external_source}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Analysis Tools with External Links */}
      <div className="row mb-4">
        <div className="col-12 animate-on-scroll">
          <div className="card border-0 shadow-sm" style={{borderRadius: '15px'}}>
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-tools me-2 text-warning"></i>
                Market Analysis Tools
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {marketAnalysisPages.map((tool, index) => (
                  <div key={index} className="col-lg-3 col-md-6 mb-3">
                    <div className="card border-0 shadow-sm h-100" style={{borderRadius: '15px'}}>
                      <div className="card-body text-center">
                        <div className={`bg-${tool.color} bg-opacity-10 text-${tool.color} rounded-circle d-inline-flex align-items-center justify-content-center mb-3`} 
                             style={{width: '60px', height: '60px'}}>
                          <i className={`${tool.icon} fa-2x`}></i>
                        </div>
                        <h6 className="fw-bold mb-2">{tool.title}</h6>
                        <p className="text-muted small mb-3">{tool.description}</p>
                        <a 
                          href={tool.redirect_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm w-100"
                          title={`Open ${tool.external_source}`}
                        >
                          <i className="fas fa-external-link-alt me-1"></i>
                          {tool.external_source}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
