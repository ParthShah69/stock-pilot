from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from prophet import Prophet
import warnings
import io
import base64
import time
import random
import os
from datetime import datetime
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

warnings.filterwarnings('ignore')

# USD to INR conversion rate
USD_TO_INR = 83.0

class StockService:
    def __init__(self):
        self.cache = {}
        self.cache_timeout = 300
        self.usd_to_inr = USD_TO_INR
    
    def _convert_to_inr(self, usd_amount):
        """Convert USD amount to INR"""
        return usd_amount * self.usd_to_inr
    
    def get_top_stocks(self, limit=10):
        """Get top performing stocks with caching"""
        cache_key = f"top_stocks_{limit}"
        if cache_key in self.cache:
            cache_time, cached_data = self.cache[cache_key]
            if time.time() - cache_time < self.cache_timeout:
                return cached_data
        
        # Extended list of 110 popular stocks
        top_symbols = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'BRK-B', 'JNJ', 'V', 'JPM',
            'NVDA', 'UNH', 'HD', 'PG', 'MA', 'BAC', 'ABBV', 'PFE', 'KO', 'AVGO',
            'PEP', 'TMO', 'COST', 'DHR', 'MRK', 'ACN', 'VZ', 'ADBE', 'CRM', 'NFLX',
            'CMCSA', 'TXN', 'NEE', 'PM', 'RTX', 'UNP', 'IBM', 'QCOM', 'LMT', 'HON',
            'INTU', 'AMAT', 'T', 'SBUX', 'GILD', 'BMY', 'GE', 'CAT', 'DE', 'MMC',
            'BLK', 'SPGI', 'ADI', 'ISRG', 'REGN', 'MDLZ', 'TJX', 'DUK', 'SO', 'BDX',
            'LLY', 'XOM', 'CVX', 'WMT', 'DIS', 'NKE', 'MCD', 'ORCL', 'CSCO', 'INTC',
            'AMD', 'MU', 'AMGN', 'TGT', 'LOW', 'UPS', 'FDX', 'BA', 'GS', 'MS',
            'C', 'WFC', 'SCHW', 'AXP', 'USB', 'PNC', 'COF', 'AIG', 'PRU', 'MET',
            'ALL', 'TRV', 'PGR', 'CB', 'AFL', 'HUM', 'CI', 'ANTM', 'DVA', 'HCA',
            'ISRG', 'ALGN', 'DXCM', 'BIIB', 'VRTX', 'BMRN', 'ILMN', 'WAT', 'IDXX', 'ALNY'
        ]

        # Comprehensive fallback data for 110 stocks with realistic values (in USD)
        fallback_data = {
            # Technology (25 stocks)
            'AAPL': {'price': 165.80, 'name': 'Apple Inc.', 'sector': 'Technology', 'market_cap': 3100000000000},
            'MSFT': {'price': 346.70, 'name': 'Microsoft Corporation', 'sector': 'Technology', 'market_cap': 3080000000000},
            'GOOGL': {'price': 119.00, 'name': 'Alphabet Inc.', 'sector': 'Technology', 'market_cap': 1790000000000},
            'META': {'price': 250.00, 'name': 'Meta Platforms Inc.', 'sector': 'Technology', 'market_cap': 800000000000},
            'NVDA': {'price': 450.00, 'name': 'NVIDIA Corporation', 'sector': 'Technology', 'market_cap': 1100000000000},
            'ADBE': {'price': 380.00, 'name': 'Adobe Inc.', 'sector': 'Technology', 'market_cap': 170000000000},
            'CRM': {'price': 180.00, 'name': 'Salesforce Inc.', 'sector': 'Technology', 'market_cap': 220000000000},
            'NFLX': {'price': 420.00, 'name': 'Netflix Inc.', 'sector': 'Technology', 'market_cap': 190000000000},
            'TXN': {'price': 140.00, 'name': 'Texas Instruments Inc.', 'sector': 'Technology', 'market_cap': 130000000000},
            'QCOM': {'price': 110.00, 'name': 'QUALCOMM Inc.', 'sector': 'Technology', 'market_cap': 120000000000},
            'INTU': {'price': 420.00, 'name': 'Intuit Inc.', 'sector': 'Technology', 'market_cap': 110000000000},
            'AMAT': {'price': 95.00, 'name': 'Applied Materials Inc.', 'sector': 'Technology', 'market_cap': 80000000000},
            'ADI': {'price': 180.00, 'name': 'Analog Devices Inc.', 'sector': 'Technology', 'market_cap': 90000000000},
            'ISRG': {'price': 320.00, 'name': 'Intuitive Surgical Inc.', 'sector': 'Technology', 'market_cap': 120000000000},
            'SPGI': {'price': 380.00, 'name': 'S&P Global Inc.', 'sector': 'Technology', 'market_cap': 130000000000},
            'AVGO': {'price': 420.00, 'name': 'Broadcom Inc.', 'sector': 'Technology', 'market_cap': 200000000000},
            'ACN': {'price': 280.00, 'name': 'Accenture plc', 'sector': 'Technology', 'market_cap': 180000000000},
            'IBM': {'price': 160.00, 'name': 'International Business Machines Corp.', 'sector': 'Technology', 'market_cap': 140000000000},
            'ORCL': {'price': 85.00, 'name': 'Oracle Corporation', 'sector': 'Technology', 'market_cap': 220000000000},
            'CSCO': {'price': 45.00, 'name': 'Cisco Systems Inc.', 'sector': 'Technology', 'market_cap': 190000000000},
            'INTC': {'price': 35.00, 'name': 'Intel Corporation', 'sector': 'Technology', 'market_cap': 150000000000},
            'AMD': {'price': 95.00, 'name': 'Advanced Micro Devices Inc.', 'sector': 'Technology', 'market_cap': 150000000000},
            'MU': {'price': 65.00, 'name': 'Micron Technology Inc.', 'sector': 'Technology', 'market_cap': 70000000000},
            'ALGN': {'price': 280.00, 'name': 'Align Technology Inc.', 'sector': 'Technology', 'market_cap': 20000000000},
            'DXCM': {'price': 120.00, 'name': 'Dexcom Inc.', 'sector': 'Technology', 'market_cap': 45000000000},
            
            # Consumer Cyclical (15 stocks)
            'AMZN': {'price': 129.70, 'name': 'Amazon.com Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 1610000000000},
            'TSLA': {'price': 207.50, 'name': 'Tesla Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 790000000000},
            'HD': {'price': 280.00, 'name': 'The Home Depot Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 280000000000},
            'COST': {'price': 520.00, 'name': 'Costco Wholesale Corporation', 'sector': 'Consumer Cyclical', 'market_cap': 230000000000},
            'SBUX': {'price': 85.00, 'name': 'Starbucks Corporation', 'sector': 'Consumer Cyclical', 'market_cap': 95000000000},
            'TJX': {'price': 75.00, 'name': 'The TJX Companies Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 85000000000},
            'CAT': {'price': 220.00, 'name': 'Caterpillar Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 110000000000},
            'DE': {'price': 340.00, 'name': 'Deere & Company', 'sector': 'Consumer Cyclical', 'market_cap': 100000000000},
            'WMT': {'price': 55.00, 'name': 'Walmart Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 420000000000},
            'DIS': {'price': 85.00, 'name': 'The Walt Disney Company', 'sector': 'Consumer Cyclical', 'market_cap': 160000000000},
            'NKE': {'price': 95.00, 'name': 'NIKE Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 150000000000},
            'MCD': {'price': 280.00, 'name': 'McDonald\'s Corporation', 'sector': 'Consumer Cyclical', 'market_cap': 200000000000},
            'TGT': {'price': 120.00, 'name': 'Target Corporation', 'sector': 'Consumer Cyclical', 'market_cap': 55000000000},
            'LOW': {'price': 200.00, 'name': 'Lowe\'s Companies Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 120000000000},
            'UPS': {'price': 140.00, 'name': 'United Parcel Service Inc.', 'sector': 'Consumer Cyclical', 'market_cap': 120000000000},
            'FDX': {'price': 240.00, 'name': 'FedEx Corporation', 'sector': 'Consumer Cyclical', 'market_cap': 60000000000},
            'BA': {'price': 180.00, 'name': 'Boeing Company', 'sector': 'Consumer Cyclical', 'market_cap': 110000000000},
            
            # Financial Services (20 stocks)
            'BRK-B': {'price': 350.00, 'name': 'Berkshire Hathaway Inc.', 'sector': 'Financial Services', 'market_cap': 750000000000},
            'V': {'price': 230.00, 'name': 'Visa Inc.', 'sector': 'Financial Services', 'market_cap': 500000000000},
            'JPM': {'price': 140.00, 'name': 'JPMorgan Chase & Co.', 'sector': 'Financial Services', 'market_cap': 450000000000},
            'MA': {'price': 380.00, 'name': 'Mastercard Inc.', 'sector': 'Financial Services', 'market_cap': 380000000000},
            'BAC': {'price': 28.00, 'name': 'Bank of America Corp.', 'sector': 'Financial Services', 'market_cap': 220000000000},
            'UNP': {'price': 190.00, 'name': 'Union Pacific Corporation', 'sector': 'Financial Services', 'market_cap': 120000000000},
            'BLK': {'price': 680.00, 'name': 'BlackRock Inc.', 'sector': 'Financial Services', 'market_cap': 100000000000},
            'MMC': {'price': 180.00, 'name': 'Marsh & McLennan Companies Inc.', 'sector': 'Financial Services', 'market_cap': 90000000000},
            'GS': {'price': 320.00, 'name': 'Goldman Sachs Group Inc.', 'sector': 'Financial Services', 'market_cap': 110000000000},
            'MS': {'price': 75.00, 'name': 'Morgan Stanley', 'sector': 'Financial Services', 'market_cap': 130000000000},
            'C': {'price': 45.00, 'name': 'Citigroup Inc.', 'sector': 'Financial Services', 'market_cap': 85000000000},
            'WFC': {'price': 40.00, 'name': 'Wells Fargo & Company', 'sector': 'Financial Services', 'market_cap': 150000000000},
            'SCHW': {'price': 55.00, 'name': 'Charles Schwab Corporation', 'sector': 'Financial Services', 'market_cap': 100000000000},
            'AXP': {'price': 150.00, 'name': 'American Express Company', 'sector': 'Financial Services', 'market_cap': 120000000000},
            'USB': {'price': 35.00, 'name': 'U.S. Bancorp', 'sector': 'Financial Services', 'market_cap': 60000000000},
            'PNC': {'price': 120.00, 'name': 'PNC Financial Services Group Inc.', 'sector': 'Financial Services', 'market_cap': 55000000000},
            'COF': {'price': 95.00, 'name': 'Capital One Financial Corp.', 'sector': 'Financial Services', 'market_cap': 45000000000},
            'AIG': {'price': 55.00, 'name': 'American International Group Inc.', 'sector': 'Financial Services', 'market_cap': 40000000000},
            'PRU': {'price': 85.00, 'name': 'Prudential Financial Inc.', 'sector': 'Financial Services', 'market_cap': 35000000000},
            'MET': {'price': 65.00, 'name': 'MetLife Inc.', 'sector': 'Financial Services', 'market_cap': 45000000000},
            'ALL': {'price': 120.00, 'name': 'Allstate Corporation', 'sector': 'Financial Services', 'market_cap': 32000000000},
            
            # Healthcare (15 stocks)
            'JNJ': {'price': 160.00, 'name': 'Johnson & Johnson', 'sector': 'Healthcare', 'market_cap': 400000000000},
            'UNH': {'price': 480.00, 'name': 'UnitedHealth Group Inc.', 'sector': 'Healthcare', 'market_cap': 440000000000},
            'ABBV': {'price': 140.00, 'name': 'AbbVie Inc.', 'sector': 'Healthcare', 'market_cap': 250000000000},
            'PFE': {'price': 28.00, 'name': 'Pfizer Inc.', 'sector': 'Healthcare', 'market_cap': 160000000000},
            'TMO': {'price': 420.00, 'name': 'Thermo Fisher Scientific Inc.', 'sector': 'Healthcare', 'market_cap': 200000000000},
            'DHR': {'price': 220.00, 'name': 'Danaher Corporation', 'sector': 'Healthcare', 'market_cap': 170000000000},
            'MRK': {'price': 95.00, 'name': 'Merck & Co. Inc.', 'sector': 'Healthcare', 'market_cap': 240000000000},
            'GILD': {'price': 65.00, 'name': 'Gilead Sciences Inc.', 'sector': 'Healthcare', 'market_cap': 85000000000},
            'BMY': {'price': 45.00, 'name': 'Bristol-Myers Squibb Company', 'sector': 'Healthcare', 'market_cap': 95000000000},
            'REGN': {'price': 680.00, 'name': 'Regeneron Pharmaceuticals Inc.', 'sector': 'Healthcare', 'market_cap': 75000000000},
            'BDX': {'price': 220.00, 'name': 'Becton Dickinson and Company', 'sector': 'Healthcare', 'market_cap': 65000000000},
            'LLY': {'price': 580.00, 'name': 'Eli Lilly and Company', 'sector': 'Healthcare', 'market_cap': 500000000000},
            'AMGN': {'price': 220.00, 'name': 'Amgen Inc.', 'sector': 'Healthcare', 'market_cap': 120000000000},
            'BIIB': {'price': 220.00, 'name': 'Biogen Inc.', 'sector': 'Healthcare', 'market_cap': 30000000000},
            'VRTX': {'price': 380.00, 'name': 'Vertex Pharmaceuticals Inc.', 'sector': 'Healthcare', 'market_cap': 90000000000},
            'BMRN': {'price': 85.00, 'name': 'BioMarin Pharmaceutical Inc.', 'sector': 'Healthcare', 'market_cap': 15000000000},
            'ILMN': {'price': 120.00, 'name': 'Illumina Inc.', 'sector': 'Healthcare', 'market_cap': 20000000000},
            'WAT': {'price': 320.00, 'name': 'Waters Corporation', 'sector': 'Healthcare', 'market_cap': 18000000000},
            'IDXX': {'price': 420.00, 'name': 'IDEXX Laboratories Inc.', 'sector': 'Healthcare', 'market_cap': 35000000000},
            'ALNY': {'price': 140.00, 'name': 'Alnylam Pharmaceuticals Inc.', 'sector': 'Healthcare', 'market_cap': 18000000000},
            
            # Consumer Defensive (4 stocks)
            'PG': {'price': 140.00, 'name': 'Procter & Gamble Co.', 'sector': 'Consumer Defensive', 'market_cap': 330000000000},
            'KO': {'price': 55.00, 'name': 'The Coca-Cola Company', 'sector': 'Consumer Defensive', 'market_cap': 240000000000},
            'PEP': {'price': 160.00, 'name': 'PepsiCo Inc.', 'sector': 'Consumer Defensive', 'market_cap': 220000000000},
            'MDLZ': {'price': 65.00, 'name': 'Mondelez International Inc.', 'sector': 'Consumer Defensive', 'market_cap': 90000000000},
            
            # Industrials (15 stocks)
            'RTX': {'price': 75.00, 'name': 'RTX Corporation', 'sector': 'Industrials', 'market_cap': 110000000000},
            'HON': {'price': 180.00, 'name': 'Honeywell International Inc.', 'sector': 'Industrials', 'market_cap': 120000000000},
            'GE': {'price': 85.00, 'name': 'General Electric Company', 'sector': 'Industrials', 'market_cap': 95000000000},
            'LMT': {'price': 420.00, 'name': 'Lockheed Martin Corporation', 'sector': 'Industrials', 'market_cap': 100000000000},
            'NEE': {'price': 55.00, 'name': 'NextEra Energy Inc.', 'sector': 'Industrials', 'market_cap': 110000000000},
            'DUK': {'price': 85.00, 'name': 'Duke Energy Corporation', 'sector': 'Industrials', 'market_cap': 70000000000},
            
            # Communication Services (3 stocks)
            'CMCSA': {'price': 40.00, 'name': 'Comcast Corporation', 'sector': 'Communication Services', 'market_cap': 100000000000},
            'T': {'price': 15.00, 'name': 'AT&T Inc.', 'sector': 'Communication Services', 'market_cap': 110000000000},
            'VZ': {'price': 35.00, 'name': 'Verizon Communications Inc.', 'sector': 'Communication Services', 'market_cap': 140000000000},
            
            # Energy (14 stocks)
            'PM': {'price': 85.00, 'name': 'Philip Morris International Inc.', 'sector': 'Energy', 'market_cap': 140000000000},
            'SO': {'price': 65.00, 'name': 'The Southern Company', 'sector': 'Energy', 'market_cap': 75000000000},
            'XOM': {'price': 95.00, 'name': 'Exxon Mobil Corporation', 'sector': 'Energy', 'market_cap': 400000000000},
            'CVX': {'price': 140.00, 'name': 'Chevron Corporation', 'sector': 'Energy', 'market_cap': 280000000000}
        }

        stocks_data = []
        symbols_to_process = top_symbols[:limit]

        for symbol in symbols_to_process:
            try:
                # Check if we have CSV data first
                csv_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "stock_history_data", f"{symbol.upper()}_history.csv")
                if os.path.exists(csv_file):
                    # Load latest price from CSV
                    df = pd.read_csv(csv_file)
                    latest_price = df['Close'].iloc[-1]
                    
                    # Calculate change from previous day
                    if len(df) > 1:
                        prev_price = df['Close'].iloc[-2]
                        change = latest_price - prev_price
                        change_percent = (change / prev_price) * 100
                    else:
                        change = 0
                        change_percent = 0
                    
                    # Convert to INR
                    latest_price_inr = self._convert_to_inr(latest_price)
                    change_inr = self._convert_to_inr(change)
                    
                    stock_info = {
                        'symbol': symbol,
                        'name': fallback_data.get(symbol, {}).get('name', symbol),
                        'current_price': round(latest_price_inr, 2),
                        'change': round(change_inr, 2),
                        'change_percent': round(change_percent, 2),
                        'sector': fallback_data.get(symbol, {}).get('sector', 'N/A'),
                        'market_cap': self._convert_to_inr(fallback_data.get(symbol, {}).get('market_cap', 0)),
                        'source': 'CSV'
                    }
                else:
                    # Use fallback data if CSV not available
                    fallback = fallback_data.get(symbol, {})
                    if fallback:
                        # Convert to INR
                        price_inr = self._convert_to_inr(fallback.get('price', 0))
                        market_cap_inr = self._convert_to_inr(fallback.get('market_cap', 0))
                        
                        stock_info = {
                            'symbol': symbol,
                            'name': fallback.get('name', symbol),
                            'current_price': price_inr,
                            'change': 0,
                            'change_percent': 0,
                            'sector': fallback.get('sector', 'N/A'),
                            'market_cap': market_cap_inr,
                            'source': 'Fallback'
                        }
                    else:
                        continue
                
                stocks_data.append(stock_info)
                
            except Exception as e:
                print(f"❌ Error processing {symbol}: {str(e)}")
                continue

        # Cache the results
        self.cache[cache_key] = (time.time(), stocks_data)
        return stocks_data

    def get_stock_info(self, symbol):
        """Get current stock information"""
        try:
            # Check if we have CSV data first
            csv_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "stock_history_data", f"{symbol.upper()}_history.csv")
            if os.path.exists(csv_file):
                # Load latest data from CSV
                df = pd.read_csv(csv_file)
                latest_price = df['Close'].iloc[-1]
                
                # Calculate change from previous day
                if len(df) > 1:
                    prev_price = df['Close'].iloc[-2]
                    change = latest_price - prev_price
                    change_percent = (change / prev_price) * 100
                else:
                    change = 0
                    change_percent = 0
                
                # Convert to INR
                latest_price_inr = self._convert_to_inr(latest_price)
                change_inr = self._convert_to_inr(change)
                
                return {
                    'symbol': symbol.upper(),
                    'name': symbol,
                    'current_price': round(latest_price_inr, 2),
                    'change': round(change_inr, 2),
                    'change_percent': round(change_percent, 2),
                    'sector': 'N/A',
                    'market_cap': 0,
                    'source': 'CSV'
                }
            else:
                # Use fallback data if CSV not available
                fallback = self.get_top_stocks(1)[0] if self.get_top_stocks(1) else {}
                return {
                    'symbol': symbol.upper(),
                    'name': fallback.get('name', symbol),
                    'current_price': fallback.get('current_price', 0),
                    'change': fallback.get('change', 0),
                    'change_percent': fallback.get('change_percent', 0),
                    'sector': fallback.get('sector', 'N/A'),
                    'market_cap': fallback.get('market_cap', 0),
                    'source': 'Fallback'
                }
                
        except Exception as e:
            print(f"❌ Error getting stock info for {symbol}: {str(e)}")
            return None

    def predict_stock_price(self, symbol, months=6):
        """Predict stock price using Prophet ML model with CSV data"""
        try:
            # Load data directly from CSV
            csv_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "stock_history_data", f"{symbol.upper()}_history.csv")
            if not os.path.exists(csv_file):
                print(f"❌ CSV file not found for {symbol}: {csv_file}")
                return None
            
            # Load and prepare data
            data = pd.read_csv(csv_file, parse_dates=['Date'])
            data.set_index('Date', inplace=True)
            
            if 'Close' not in data.columns:
                print(f"❌ CSV file must contain a 'Close' column for {symbol}")
                return None
            
            if len(data) < 30:
                print(f"⚠️ Insufficient data for {symbol} ({len(data)} points)")
                return None
            
            # Prepare data for Prophet
            df = data.reset_index()[['Date','Close']].rename(columns={'Date':'ds','Close':'y'})
            
            # Create and fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                changepoint_prior_scale=0.05
            )
            model.fit(df)
            
            # Generate future predictions
            future = model.make_future_dataframe(periods=months*30)
            forecast = model.predict(future)
            
            # Calculate metrics
            metrics = self._calculate_metrics(df['y'], forecast['yhat'][:len(df)])
            
            # Convert predictions to INR
            current_price_inr = self._convert_to_inr(df['y'].iloc[-1])
            predicted_price_inr = self._convert_to_inr(forecast['yhat'].iloc[-1])
            
            # Generate plot with historical and prediction data
            plot_base64 = self._create_advanced_plot(data, forecast['yhat'].values, months, symbol)
            # Generate historical graph
            historical_plot_base64 = self._create_historical_plot(data, symbol)
            return {
               'symbol': symbol,
                'predicted_price': round(predicted_price_inr, 2),
                'current_price': round(current_price_inr, 2),
                'metrics': metrics,
                'prediction_plot': plot_base64,
                'historical_plot': historical_plot_base64,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error predicting stock price for {symbol}: {str(e)}")
            return None
    
    def _calculate_metrics(self, true_values, predicted_values):
        """Calculate prediction metrics"""
        try:
            rmse = mean_squared_error(true_values, predicted_values, squared=False)
            mae = mean_absolute_error(true_values, predicted_values)
            r2 = r2_score(true_values, predicted_values)
            mape = np.mean(np.abs((true_values - predicted_values) / true_values)) * 100
            
            # Direction accuracy (up/down match)
            true_dir = np.sign(np.diff(true_values))
            pred_dir = np.sign(np.diff(predicted_values))
            direction_acc = np.mean(true_dir == pred_dir) * 100
            
            return {
                "RMSE": rmse,
                "MAE": mae,
                "R2": r2,
                "MAPE": mape,
                "Direction_Accuracy": direction_acc
            }
        except Exception as e:
            print(f"❌ Error calculating metrics: {str(e)}")
            return {
                "RMSE": 0,
                "MAE": 0,
                "R2": 0,
                "MAPE": 0,
                "Direction_Accuracy": 0
            }
    
    def _create_advanced_plot(self, history, forecast, months, symbol):
        """Create advanced prediction plot with historical and prediction data"""
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            import base64
            from io import BytesIO
            import pandas as pd
            
            plt.figure(figsize=(14, 7))
            
            # Convert to INR
            history_inr = history['Close'] * self.usd_to_inr
            forecast_inr = forecast * self.usd_to_inr
            
            # Historical data
            plt.plot(history.index, history_inr, 
                     label='Historical Price', color='#1f77b4', linewidth=2)
            
            # Prediction period
            future_dates = pd.date_range(
                start=history.index[-1],
                periods=months*30+1,
                freq="D"
            )[1:]
            
            plt.plot(future_dates, forecast_inr[-months*30:], 
                     label='Predicted Price', color='#ff7f0e', 
                     linestyle='--', linewidth=2)
            
            # Formatting
            plt.title(f"{symbol} Price Prediction\nNext {months} Months (INR)", pad=20)
            plt.xlabel("Date", labelpad=10)
            plt.ylabel("Price (INR)", labelpad=10)
            plt.legend()
            plt.grid(True, alpha=0.3)
            
            # Annotate last known price
            last_price = history_inr.iloc[-1]
            plt.annotate(f'Current: ₹{last_price:.2f}',
                         xy=(history.index[-1], last_price),
                         xytext=(10, 10), textcoords='offset points',
                         bbox=dict(boxstyle='round,pad=0.5', fc='yellow', alpha=0.5))
            
            plt.tight_layout()
            
            # Convert plot to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            buffer.seek(0)
            plot_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return plot_base64
            
        except Exception as e:
            print(f"❌ Error creating plot: {str(e)}")
            return None

    def _create_historical_plot(self, data, symbol):
        """Create a plot of historical stock prices"""
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            import base64
            from io import BytesIO
            
            plt.figure(figsize=(14, 7))
            
            # Convert to INR
            history_inr = data['Close'] * self.usd_to_inr
            
            # Plot historical data
            plt.plot(data.index, history_inr, 
                    label='Historical Price', color='#1f77b4', linewidth=2)
            
            # Formatting
            plt.title(f"{symbol} Historical Price (INR)", pad=20)
            plt.xlabel("Date", labelpad=10)
            plt.ylabel("Price (INR)", labelpad=10)
            plt.legend()
            plt.grid(True, alpha=0.3)
            
            # Annotate last known price
            last_price = history_inr.iloc[-1]
            plt.annotate(f'Current: ₹{last_price:.2f}',
                        xy=(data.index[-1], last_price),
                        xytext=(10, 10), textcoords='offset points',
                        bbox=dict(boxstyle='round,pad=0.5', fc='yellow', alpha=0.5))
            
            plt.tight_layout()
            
            # Convert plot to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            buffer.seek(0)
            plot_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return plot_base64
            
        except Exception as e:
            print(f"❌ Error creating historical plot: {str(e)}")
            return None

# Create a singleton instance
stock_service = StockService()