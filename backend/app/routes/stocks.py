from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.stock_service import StockService
import pandas as pd

stocks_bp = Blueprint('stocks', __name__)

@stocks_bp.route('/search', methods=['GET'])
def search_stocks():
    """Search for stocks by name or symbol"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        if len(query) < 2:
            return jsonify({'error': 'Search query must be at least 2 characters'}), 400

        stock_service = StockService()
        results = stock_service.search_stocks(query) or []

        return jsonify({
            'stocks': results,
            'query': query,
            'count': len(results)
        }), 200
    except Exception as e:
        print(f"Error in search_stocks: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@stocks_bp.route('/top', methods=['GET'])
def get_top_stocks():
    """Get top performing stocks"""
    try:
        limit = request.args.get('limit', 10, type=int)
        if limit < 1 or limit > 50:
            return jsonify({'error': 'Limit must be between 1 and 50'}), 400

        stock_service = StockService()
        top_stocks = stock_service.get_top_stocks(limit) or []

        if not top_stocks:
            return jsonify({'message': 'No top stocks available at this time'}), 200

        return jsonify({
            'stocks': top_stocks,
            'count': len(top_stocks)
        }), 200
    except Exception as e:
        print(f"Error in get_top_stocks: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@stocks_bp.route('/<symbol>', methods=['GET'])
def get_stock_info(symbol):
    """Get detailed stock information"""
    try:
        symbol = symbol.upper().strip()
        if not symbol:
            return jsonify({'error': 'Stock symbol is required'}), 400

        stock_service = StockService()
        stock_info = stock_service.get_stock_info(symbol)

        if not stock_info:
            return jsonify({'error': f'No data available for {symbol}'}), 404

        return jsonify({'stock': stock_info}), 200
    except Exception as e:
        print(f"Error in get_stock_info: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@stocks_bp.route('/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    """Get historical stock data"""
    try:
        symbol = symbol.upper().strip()
        period = request.args.get('period', '1y')
        if not symbol:
            return jsonify({'error': 'Stock symbol is required'}), 400

        valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
        if period not in valid_periods:
            return jsonify({'error': 'Invalid period'}), 400

        stock_service = StockService()
        historical_data = stock_service.get_historical_data(symbol, period) or []

        if not historical_data:
            return jsonify({'error': f'Historical data not available for {symbol}'}), 404

        return jsonify({
            'symbol': symbol,
            'period': period,
            'data': historical_data,
            'count': len(historical_data)
        }), 200
    except Exception as e:
        print(f"Error in get_stock_history: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@stocks_bp.route('/<symbol>/predict', methods=['GET'])
def predict_stock(symbol):
    """Get stock price predictions using ML model"""
    try:
        symbol = symbol.upper().strip()
        months = request.args.get('months', 6, type=int)
        if not symbol:
            return jsonify({'error': 'Stock symbol is required'}), 400
        if months < 1 or months > 24:
            return jsonify({'error': 'Prediction months must be between 1 and 24'}), 400

        stock_service = StockService()
        # Try real prediction first, fallback to mock if it fails
        prediction = stock_service.predict_stock_price(symbol, months)
        if not prediction:
            prediction = stock_service.predict_stock_price_mock(symbol, months)
        
        if not prediction:
            return jsonify({'error': f'No prediction available for {symbol}'}), 404

        return jsonify({'prediction': prediction}), 200
    except Exception as e:
        print(f"Error in predict_stock: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@stocks_bp.route('/<symbol>/analysis', methods=['GET'])
@jwt_required()
def get_stock_analysis(symbol):
    """Get comprehensive stock analysis including user's holdings"""
    try:
        user_id = get_jwt_identity()
        symbol = symbol.upper().strip()
        if not symbol:
            return jsonify({'error': 'Stock symbol is required'}), 400

        stock_service = StockService()
        stock_info = stock_service.get_stock_info(symbol)
        if not stock_info:
            return jsonify({'error': f'No data available for {symbol}'}), 404

        historical_data = stock_service.get_historical_data(symbol, '1y') or []
        prediction = stock_service.predict_stock_price(symbol, 6)

        from app.models.portfolio import Portfolio
        portfolio_summary = Portfolio.get_portfolio_summary(user_id)

        user_holding = next((h for h in portfolio_summary['holdings'] if h['symbol'] == symbol), None)
        risk_metrics = calculate_risk_metrics(historical_data)

        analysis = {
            'symbol': symbol,
            'stock_info': stock_info,
            'historical_data': historical_data,
            'prediction': prediction,
            'user_holding': user_holding,
            'risk_metrics': risk_metrics
        }

        return jsonify({'analysis': analysis}), 200
    except Exception as e:
        print(f"Error in get_stock_analysis: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@stocks_bp.route('/<symbol>/public-analysis', methods=['GET'])
def get_public_stock_analysis(symbol):
    """Get public stock analysis without authentication"""
    try:
        symbol = symbol.upper().strip()
        if not symbol:
            return jsonify({'error': 'Stock symbol is required'}), 400

        stock_service = StockService()
        # Use public stock info (fallback data, no API calls)
        stock_info = stock_service.get_public_stock_info(symbol)
        if not stock_info:
            return jsonify({'error': f'No data available for {symbol}'}), 404

        # Skip historical data and predictions to avoid API calls
        historical_data = []
        prediction = None

        analysis = {
            'symbol': symbol,
            'stock_info': stock_info,
            'historical_data': historical_data,
            'prediction': prediction,
            'user_holding': None,  # No user data for public endpoint
            'risk_metrics': calculate_risk_metrics(historical_data) if historical_data else None
        }

        return jsonify({'analysis': analysis}), 200
    except Exception as e:
        print(f"Error in get_public_stock_analysis: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@stocks_bp.route('/<symbol>/ml-prediction', methods=['GET'])
def get_stock_ml_analysis(symbol):
    """Get ML prediction for a stock using CSV data"""
    try:
        symbol = symbol.upper().strip()
        months = request.args.get('months', 6, type=int)
        
        if not symbol:
            return jsonify({'error': 'Stock symbol is required'}), 400
        
        if months < 1 or months > 24:
            return jsonify({'error': 'Months must be between 1 and 24'}), 400

        stock_service = StockService()
        
        # Get ML prediction using CSV data
        prediction = stock_service.predict_stock_price(symbol, months)
        
        if not prediction:
            return jsonify({
                'success': False,
                'error': f'No prediction data available for {symbol}. Please ensure CSV data exists.'
            }), 404

        return jsonify({
            'success': True,
            'data': prediction
        }), 200
        
    except Exception as e:
        print(f"Error in get_stock_ml_analysis: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate ML prediction: {str(e)}'
        }), 500


@stocks_bp.route('/market/overview', methods=['GET'])
def get_market_overview():
    """Get static market indices data"""
    try:
        # Return static market data
        market_data = [
            {
                'symbol': '^NSEI',
                'name': 'NIFTY 50',
                'current_price': '22,419.95',
                'change_percent': 0.85,
                'change': '+189.40',
                'trend': 'up',
                'sector': 'Index',
                'redirect_url': 'https://www.nseindia.com/index-tracker/NIFTY%2050',
                'external_source': 'NSE India'
            },
            {
                'symbol': '^BSESN',
                'name': 'SENSEX',
                'current_price': '73,852.94',
                'change_percent': 0.72,
                'change': '+526.10',
                'trend': 'up',
                'sector': 'Index',
                'redirect_url': 'https://www.moneycontrol.com/indian-indices/sensex-4.html',
                'external_source': 'Money Control'
            },
            {
                'symbol': '^NSEBANK',
                'name': 'BANK NIFTY',
                'current_price': '48,234.67',
                'change_percent': 1.12,
                'change': '+534.20',
                'trend': 'up',
                'sector': 'Banking',
                'redirect_url': 'https://www.nseindia.com/index-tracker/BANKNIFTY',
                'external_source': 'NSE India'
            },
            {
                'symbol': '^NSEIT',
                'name': 'NIFTY IT',
                'current_price': '36,789.45',
                'change_percent': -0.45,
                'change': '-167.30',
                'trend': 'down',
                'sector': 'Technology',
                'redirect_url': 'https://www.nseindia.com/index-tracker/NIFTY%20IT',
                'external_source': 'NSE India'
            }
        ]
        
        return jsonify({
            'market_overview': market_data,
            'timestamp': pd.Timestamp.now().isoformat(),
            'source': 'static'
        }), 200
            
    except Exception as e:
        print(f"Error in get_market_overview: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# New route for direct prediction (matching the user's Flask app structure)
@stocks_bp.route('/predict', methods=['GET'])
def predict_stock_direct():
    """Direct prediction endpoint matching the user's Flask app"""
    try:
        symbol = request.args.get('symbol')
        months = int(request.args.get('months', 6))

        if not symbol:
            return jsonify({'error':'Symbol required'}), 400

        stock_service = StockService()
        # Try real prediction first, fallback to mock if it fails
        prediction = stock_service.predict_stock_price(symbol, months)
        if not prediction:
            prediction = stock_service.predict_stock_price_mock(symbol, months)
        
        if not prediction:
            return jsonify({'error': 'Not enough data'}), 400

        return jsonify({
            'symbol': symbol,
            'metrics': prediction['metrics'],
            'plot': prediction['plot'],
            'lastUpdated': prediction['last_updated']
        })
    except Exception as e:
        print(f"Error in predict_stock_direct: {e}")
        return jsonify({'error': 'Internal server error'}), 500


def calculate_risk_metrics(historical_data):
    """Calculate risk metrics for a stock"""
    try:
        if not historical_data or len(historical_data) < 30:
            return None

        prices = [float(day['close']) for day in historical_data]
        returns = [(prices[i] - prices[i - 1]) / prices[i - 1] for i in range(1, len(prices))]

        if not returns:
            return None

        import numpy as np
        volatility = np.std(returns) * np.sqrt(252) * 100
        avg_return = np.mean(returns) * 252 * 100
        risk_free_rate = 0.02
        sharpe_ratio = (avg_return - risk_free_rate) / volatility if volatility > 0 else 0

        cumulative_returns = np.cumprod(1 + np.array(returns))
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = np.min(drawdown) * 100
        var_95 = np.percentile(returns, 5) * 100

        return {
            'volatility': round(volatility, 2),
            'avg_return': round(avg_return, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'max_drawdown': round(max_drawdown, 2),
            'var_95': round(var_95, 2),
            'risk_level': get_risk_level(volatility)
        }
    except Exception:
        return None


def get_risk_level(volatility):
    """Determine risk level based on volatility"""
    if volatility < 15:
        return 'Low'
    elif volatility < 25:
        return 'Medium'
    elif volatility < 35:
        return 'High'
    else:
        return 'Very High'


