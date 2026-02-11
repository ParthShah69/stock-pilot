import requests
import json
import time
from datetime import datetime
import yfinance as yf

class LiveMarketService:
    def __init__(self):
        self.cache = {}
        self.cache_duration = 60  # Cache for 60 seconds
        self.last_update = 0
        
    def get_indian_market_indices(self):
        """Get live Indian market indices data"""
        current_time = time.time()
        
        # Check if cache is still valid
        if current_time - self.last_update < self.cache_duration and self.cache:
            return self.cache
        
        try:
            # Method 1: Try Yahoo Finance (most reliable)
            indices_data = self._fetch_from_yahoo_finance()
            if indices_data:
                self.cache = indices_data
                self.last_update = current_time
                return indices_data
                
        except Exception as e:
            print(f"Yahoo Finance failed: {e}")
            
        try:
            # Method 2: Try Alpha Vantage (alternative)
            indices_data = self._fetch_from_alpha_vantage()
            if indices_data:
                self.cache = indices_data
                self.last_update = current_time
                return indices_data
                
        except Exception as e:
            print(f"Alpha Vantage failed: {e}")
            
        # Method 3: Fallback to static data with timestamp
        return self._get_fallback_data()
    
    def _fetch_from_yahoo_finance(self):
        """Fetch live data from Yahoo Finance"""
        try:
            # Indian market indices symbols
            indices = {
                '^NSEI': 'NIFTY 50',
                '^BSESN': 'SENSEX',
                '^NSEBANK': 'BANK NIFTY',
                '^NSEIT': 'NIFTY IT',
                '^NSEPHARMA': 'NIFTY PHARMA',
                '^NSEMETAL': 'NIFTY METAL'
            }
            
            market_data = []
            
            for symbol, name in indices.items():
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    
                    if info and 'regularMarketPrice' in info and info['regularMarketPrice']:
                        current_price = info['regularMarketPrice']
                        previous_close = info.get('regularMarketPreviousClose', current_price)
                        
                        if previous_close and previous_close > 0:
                            change = current_price - previous_close
                            change_percent = (change / previous_close) * 100
                            trend = 'up' if change >= 0 else 'down'
                            
                            market_data.append({
                                'symbol': symbol,
                                'name': name,
                                'current_price': f"{current_price:.2f}",
                                'change_percent': round(change_percent, 2),
                                'change': f"{'+' if change >= 0 else ''}{change:.2f}",
                                'trend': trend,
                                'sector': self._get_sector(name),
                                'volume': info.get('volume', 0),
                                'market_cap': info.get('marketCap', 0),
                                'last_updated': datetime.now().isoformat()
                            })
                            
                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")
                    continue
            
            if market_data:
                return market_data
                
        except Exception as e:
            print(f"Yahoo Finance error: {e}")
            
        return None
    
    def _fetch_from_alpha_vantage(self):
        """Fetch data from Alpha Vantage (requires API key)"""
        # You can add Alpha Vantage API integration here
        # This requires an API key from https://www.alphavantage.co/
        return None
    
    def _get_sector(self, index_name):
        """Get sector for index"""
        sector_map = {
            'NIFTY 50': 'Index',
            'SENSEX': 'Index',
            'BANK NIFTY': 'Banking',
            'NIFTY IT': 'Technology',
            'NIFTY PHARMA': 'Healthcare',
            'NIFTY METAL': 'Metals',
            'NIFTY AUTO': 'Automotive',
            'NIFTY FMCG': 'Consumer Goods'
        }
        return sector_map.get(index_name, 'Index')
    
    def _get_fallback_data(self):
        """Get fallback data with current timestamp"""
        return [
            {
                'symbol': '^NSEI',
                'name': 'NIFTY 50',
                'current_price': '22,419.95',
                'change_percent': 0.85,
                'change': '+189.40',
                'trend': 'up',
                'sector': 'Index',
                'volume': '2,45,67,890',
                'last_updated': datetime.now().isoformat(),
                'note': 'Fallback data - API unavailable'
            },
            {
                'symbol': '^BSESN',
                'name': 'SENSEX',
                'current_price': '73,852.94',
                'change_percent': 0.72,
                'change': '+526.10',
                'trend': 'up',
                'sector': 'Index',
                'volume': '3,12,45,678',
                'last_updated': datetime.now().isoformat(),
                'note': 'Fallback data - API unavailable'
            },
            {
                'symbol': '^NSEBANK',
                'name': 'BANK NIFTY',
                'current_price': '48,234.67',
                'change_percent': 1.12,
                'change': '+534.20',
                'trend': 'up',
                'sector': 'Banking',
                'volume': '1,89,34,567',
                'last_updated': datetime.now().isoformat(),
                'note': 'Fallback data - API unavailable'
            },
            {
                'symbol': '^NSEIT',
                'name': 'NIFTY IT',
                'current_price': '36,789.45',
                'change_percent': -0.45,
                'change': '-167.30',
                'trend': 'down',
                'sector': 'Technology',
                'volume': '98,76,543',
                'last_updated': datetime.now().isoformat(),
                'note': 'Fallback data - API unavailable'
            }
        ]
    
    def get_market_status(self):
        """Get current market status (open/closed)"""
        try:
            # Check if market is open (9:15 AM to 3:30 PM IST on weekdays)
            now = datetime.now()
            ist_hour = now.hour + 5  # Convert to IST
            ist_minute = now.minute + 30
            if ist_minute >= 60:
                ist_hour += 1
                ist_minute -= 60
            
            # Market hours: 9:15 AM to 3:30 PM IST
            market_open = (9, 15)  # 9:15 AM
            market_close = (15, 30)  # 3:30 PM
            
            is_weekday = now.weekday() < 5  # Monday = 0, Sunday = 6
            is_market_hours = (
                is_weekday and 
                ((ist_hour > market_open[0] or (ist_hour == market_open[0] and ist_minute >= market_open[1])) and
                 (ist_hour < market_close[0] or (ist_hour == market_close[0] and ist_minute <= market_close[1])))
            )
            
            return {
                'status': 'OPEN' if is_market_hours else 'CLOSED',
                'current_time_ist': f"{ist_hour:02d}:{ist_minute:02d}",
                'next_open': 'Monday 9:15 AM' if not is_weekday else 'Tomorrow 9:15 AM',
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting market status: {e}")
            return {
                'status': 'UNKNOWN',
                'current_time_ist': 'N/A',
                'next_open': 'N/A',
                'last_updated': datetime.now().isoformat()
            }
    
    def get_top_movers(self, limit=10):
        """Get top gainers and losers"""
        try:
            # Popular Indian stocks
            stocks = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
                     'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'AXISBANK.NS']
            
            movers = []
            
            for symbol in stocks[:limit]:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    
                    if info and 'regularMarketPrice' in info and info['regularMarketPrice']:
                        current_price = info['regularMarketPrice']
                        previous_close = info.get('regularMarketPreviousClose', current_price)
                        
                        if previous_close and previous_close > 0:
                            change = current_price - previous_close
                            change_percent = (change / previous_close) * 100
                            
                            movers.append({
                                'symbol': symbol.replace('.NS', ''),
                                'name': info.get('longName', symbol),
                                'current_price': current_price,
                                'change_percent': round(change_percent, 2),
                                'change': change,
                                'volume': info.get('volume', 0),
                                'market_cap': info.get('marketCap', 0)
                            })
                            
                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")
                    continue
            
            # Sort by absolute change percentage
            movers.sort(key=lambda x: abs(x['change_percent']), reverse=True)
            
            return {
                'top_gainers': [m for m in movers if m['change_percent'] > 0][:5],
                'top_losers': [m for m in movers if m['change_percent'] < 0][:5],
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting top movers: {e}")
            return None
