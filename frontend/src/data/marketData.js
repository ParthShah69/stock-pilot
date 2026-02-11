// Accurate Static Market Data with External Redirect Links
export const marketIndicesData = [
  {
    symbol: '^NSEI',
    name: 'NIFTY 50',
    current_price: '22,419.95',
    change_percent: 0.85,
    change: '+189.40',
    trend: 'up',
    sector: 'Index',
    redirect_url: 'https://www.nseindia.com/index-tracker/NIFTY%2050',
    external_source: 'NSE India'
  },
  {
    symbol: '^BSESN',
    name: 'SENSEX',
    current_price: '73,852.94',
    change_percent: 0.72,
    change: '+526.10',
    trend: 'up',
    sector: 'Index',
    redirect_url: 'https://www.moneycontrol.com/indian-indices/sensex-4.html',
    external_source: 'Money Control'
  },
  {
    symbol: '^NSEBANK',
    name: 'BANK NIFTY',
    current_price: '48,234.67',
    change_percent: 1.12,
    change: '+534.20',
    trend: 'up',
    sector: 'Banking',
    redirect_url: 'https://www.nseindia.com/index-tracker/BANKNIFTY',
    external_source: 'NSE India'
  },
  {
    symbol: '^NSEIT',
    name: 'NIFTY IT',
    current_price: '36,789.45',
    change_percent: -0.45,
    change: '-167.30',
    trend: 'down',
    sector: 'Technology',
    redirect_url: 'https://www.nseindia.com/index-tracker/NIFTY%20IT',
    external_source: 'NSE India'
  }
];

// Market News with External Redirect Links
export const marketNewsData = [
  {
    id: 1,
    title: 'Tech Stocks Rally Continues',
    summary: 'Technology sector shows strong momentum with major gains. AI and cloud computing stocks surge.',
    category: 'Technology',
    time: '2 hours ago',
    redirect_url: 'https://economictimes.indiatimes.com/markets/stocks/news',
    external_source: 'Economic Times',
    icon: 'fas fa-microchip',
    color: 'primary'
  },
  {
    id: 2,
    title: 'Banking Sector Recovery',
    summary: 'Banking stocks show signs of recovery with improved loan growth and better asset quality.',
    category: 'Banking',
    time: '4 hours ago',
    redirect_url: 'https://www.moneycontrol.com/news/business/markets/',
    external_source: 'Money Control',
    icon: 'fas fa-university',
    color: 'success'
  },
  {
    id: 3,
    title: 'Healthcare Innovation Surge',
    summary: 'Biotech and pharmaceutical companies announce breakthrough treatments, sector gains momentum.',
    category: 'Healthcare',
    time: '6 hours ago',
    redirect_url: 'https://www.livemint.com/market',
    external_source: 'Live Mint',
    icon: 'fas fa-heartbeat',
    color: 'danger'
  }
];

// Economic Calendar with Official Source Links
export const economicCalendarData = [
  {
    date: '2024-01-20',
    time: '10:00 AM',
    event: 'RBI Monetary Policy Meeting',
    impact: 'High',
    previous: '6.50%',
    forecast: '6.50%',
    actual: '6.50%',
    redirect_url: 'https://www.rbi.org.in/',
    external_source: 'RBI Official'
  },
  {
    date: '2024-01-22',
    time: '2:30 PM',
    event: 'US Fed Interest Rate Decision',
    impact: 'High',
    previous: '5.50%',
    forecast: '5.50%',
    actual: '5.50%',
    redirect_url: 'https://www.federalreserve.gov/',
    external_source: 'Federal Reserve'
  },
  {
    date: '2024-01-25',
    time: '9:00 AM',
    event: 'GDP Growth Rate Q4',
    impact: 'Medium',
    previous: '7.2%',
    forecast: '7.0%',
    actual: '7.1%',
    redirect_url: 'https://www.mospi.gov.in/',
    external_source: 'Ministry of Statistics'
  }
];

// Market Analysis Pages with External Links (Fixed URLs)
export const marketAnalysisPages = [
  {
    title: 'Daily Reports',
    description: 'Get comprehensive market analysis and trends',
    icon: 'fas fa-chart-line',
    color: 'primary',
    redirect_url: 'https://www.nseindia.com/all-reports',
    external_source: 'NSE Market Data'
  },
  {
    title: 'Sector Analysis',
    description: 'Detailed sector-wise performance analysis',
    icon: 'fas fa-industry',
    color: 'success',
    redirect_url: 'https://www.moneycontrol.com/markets/indian-indices/',
    external_source: 'Money Control'
  },
  {
    title: 'Technical Analysis',
    description: 'Advanced charts and technical indicators',
    icon: 'fas fa-chart-bar',
    color: 'warning',
    redirect_url: 'https://www.tradingview.com/symbols/NSE-NIFTY/',
    external_source: 'TradingView'
  },
  {
    title: 'Fundamental Analysis',
    description: 'Company financials and valuation metrics',
    icon: 'fas fa-calculator',
    color: 'info',
    redirect_url: 'https://www.screener.in/',
    external_source: 'Screener.in'
  }
];