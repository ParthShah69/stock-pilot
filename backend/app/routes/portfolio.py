from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from bson import ObjectId
from datetime import datetime

portfolio_bp = Blueprint('portfolio', __name__)

@portfolio_bp.route('/', methods=['GET'])
@jwt_required()
def get_portfolio():
    """Get user's portfolio summary"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has KYC (simplified check)
        kyc = db.kyc.find_one({'user_id': user_id})
        if not kyc:
            # For now, allow without KYC for testing
            # return jsonify({'error': 'KYC verification required'}), 403
            print(f"KYC not found for user: {user_id}, allowing access for testing")
            kyc = {'status': 'pending'}  # Create dummy KYC data
        
        # Get portfolio transactions
        transactions = list(db.portfolio.find({'user_id': user_id}))
        
        # Calculate portfolio summary using FIFO method
        total_investment = 0
        total_buy_value = 0
        total_sell_value = 0
        holdings = {}
        
        # First pass: collect all buy transactions
        buy_transactions = {}
        for transaction in transactions:
            if transaction.get('transaction_type') == 'buy':
                symbol = transaction['symbol']
                if symbol not in buy_transactions:
                    buy_transactions[symbol] = []
                buy_transactions[symbol].append({
                    'quantity': transaction['quantity'],
                    'price': transaction['purchase_price'],
                    'date': transaction['purchase_date']
                })
        
        # Second pass: process sell transactions using FIFO
        sell_transactions = {}
        for transaction in transactions:
            if transaction.get('transaction_type') == 'sell':
                symbol = transaction['symbol']
                if symbol not in sell_transactions:
                    sell_transactions[symbol] = []
                sell_transactions[symbol].append({
                    'quantity': transaction['quantity'],
                    'price': transaction['purchase_price'],
                    'date': transaction['purchase_date']
                })
        
        # Calculate holdings for each symbol with improved profit/loss tracking
        for symbol in set([t['symbol'] for t in transactions]):
            if symbol not in holdings:
                holdings[symbol] = {
                    'symbol': symbol,
                    'quantity': 0,
                    'total_investment': 0,
                    'avg_purchase_price': 0,
                    'last_purchase_price': 0,
                    'realized_profit_loss': 0,  # Profit from completed sell transactions
                    'unrealized_profit_loss': 0,  # Current paper profit/loss on holdings
                    'total_bought_quantity': 0,
                    'total_sold_quantity': 0,
                    'total_bought_value': 0,
                    'total_sold_value': 0
                }
            
            # Calculate total bought quantity and investment
            total_bought = sum(t['quantity'] for t in buy_transactions.get(symbol, []))
            total_bought_investment = sum(t['quantity'] * t['price'] for t in buy_transactions.get(symbol, []))
            
            # Calculate total sold quantity and value
            total_sold = sum(t['quantity'] for t in sell_transactions.get(symbol, []))
            total_sold_value = sum(t['quantity'] * t['price'] for t in sell_transactions.get(symbol, []))
            
            # Store totals for reference
            holdings[symbol]['total_bought_quantity'] = total_bought
            holdings[symbol]['total_sold_quantity'] = total_sold
            holdings[symbol]['total_bought_value'] = total_bought_investment
            holdings[symbol]['total_sold_value'] = total_sold_value
            
            # Calculate remaining quantity and investment using FIFO
            remaining_quantity = total_bought - total_sold
            if remaining_quantity > 0:
                # Sort buy transactions by date (FIFO)
                sorted_buys = sorted(buy_transactions.get(symbol, []), key=lambda x: x['date'])
                
                # Calculate remaining investment using FIFO
                remaining_investment = 0
                quantity_needed = remaining_quantity
                
                for buy in sorted_buys:
                    if quantity_needed <= 0:
                        break
                    if buy['quantity'] <= quantity_needed:
                        remaining_investment += buy['quantity'] * buy['price']
                        quantity_needed -= buy['quantity']
                    else:
                        remaining_investment += quantity_needed * buy['price']
                        quantity_needed = 0
                
                holdings[symbol]['quantity'] = remaining_quantity
                holdings[symbol]['total_investment'] = remaining_investment
                holdings[symbol]['avg_purchase_price'] = remaining_investment / remaining_quantity if remaining_quantity > 0 else 0
                
                # Get the most recent purchase price for display
                if buy_transactions.get(symbol):
                    latest_buy = max(buy_transactions[symbol], key=lambda x: x['date'])
                    holdings[symbol]['last_purchase_price'] = latest_buy['price']
                
                # Calculate realized profit/loss from completed sell transactions
                # This is the profit/loss from shares that were actually sold
                if total_sold > 0:
                    # Calculate average cost of sold shares using FIFO
                    sold_investment = 0
                    sold_quantity_needed = total_sold
                    
                    for buy in sorted_buys:
                        if sold_quantity_needed <= 0:
                            break
                        if buy['quantity'] <= sold_quantity_needed:
                            sold_investment += buy['quantity'] * buy['price']
                            sold_quantity_needed -= buy['quantity']
                        else:
                            sold_investment += sold_quantity_needed * buy['price']
                            sold_quantity_needed = 0
                    
                    holdings[symbol]['realized_profit_loss'] = total_sold_value - sold_investment
                
                total_investment += remaining_investment
                total_buy_value += total_bought_investment
                total_sell_value += total_sold_value
        
        # Filter out holdings with zero or negative quantity
        holdings_list = []
        for symbol, holding in holdings.items():
            if holding['quantity'] > 0:
                holdings_list.append(holding)
        
        # Calculate summary metrics with improved profit/loss breakdown
        total_value = total_investment  # Current portfolio value (sum of all holdings)
        
        # Calculate total realized profit/loss from ALL completed sell transactions
        # This should work even when portfolio is empty (all shares sold)
        total_realized_profit_loss = 0
        
        # Get all transactions for this user to calculate profit/loss
        all_transactions = list(db.transactions.find({'user_id': user_id}))
        
        # Separate buy and sell transactions
        user_buy_transactions = [t for t in all_transactions if t.get('transaction_type') == 'buy']
        user_sell_transactions = [t for t in all_transactions if t.get('transaction_type') == 'sell']
        
        # Calculate total buy and sell values using simple method
        total_buy_value_all = sum(t['quantity'] * t['price'] for t in user_buy_transactions)
        total_sell_value_all = sum(t['quantity'] * t['price'] for t in user_sell_transactions)
        
        # Calculate realized profit/loss using simple method: Total Sell - Total Buy
        total_realized_profit_loss = total_sell_value_all - total_buy_value_all
        
        # Debug logging
        print(f"User: {user_id}")
        print(f"  Total buy value: {total_buy_value_all}")
        print(f"  Total sell value: {total_sell_value_all}")
        print(f"  Calculated profit/loss: {total_realized_profit_loss}")
        
        # Total profit/loss (realized + unrealized)
        total_profit_loss = total_realized_profit_loss  # Only realized for now, unrealized calculated in frontend
        
        # Calculate return percentage from ALL transactions (buy and sell)
        # This should include both completed transactions and current holdings
        total_return_percentage = 0
        if total_buy_value_all > 0:
            # Calculate total return using simple approach: (Total Sell - Total Buy) / Total Buy * 100
            total_return_percentage = ((total_sell_value_all - total_buy_value_all) / total_buy_value_all * 100) if total_buy_value_all > 0 else 0
        
        # Always return profit/loss data even when portfolio is empty
        return jsonify({
            'total_value': total_value,
            'total_investment': total_investment,
            'total_profit': total_profit_loss,
            'total_realized_profit_loss': total_realized_profit_loss,
            'total_return_percentage': total_return_percentage,
            'total_buy_value': total_buy_value_all,  # From transactions
            'total_sell_value': total_sell_value_all,  # From transactions
            'stocks': holdings_list,
            'user': {
                'id': str(user['_id']),
                'name': user.get('name', 'User'),
                'kyc_status': kyc.get('status', 'pending')
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_portfolio: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@portfolio_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get all portfolio transactions"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has KYC (simplified check)
        kyc = db.kyc.find_one({'user_id': user_id})
        if not kyc:
            # For now, allow without KYC for testing
            print(f"KYC not found for user: {user_id}, allowing access for testing")
        
        # Get all transactions
        transactions = list(db.portfolio.find({'user_id': user_id}).sort('created_at', -1))
        
        # Convert to list of dictionaries with profit/loss calculation
        transaction_list = []
        for transaction in transactions:
            # Calculate profit/loss for sell transactions
            profit_loss = None
            if transaction.get('transaction_type') == 'sell':
                # Find all buy transactions for this stock
                buy_transactions = list(db.portfolio.find({
                    'user_id': user_id,
                    'symbol': transaction['symbol'],
                    'transaction_type': 'buy'
                }))
                
                if buy_transactions:
                    # Calculate total bought value for this stock
                    total_bought_value = sum(buy['quantity'] * buy['purchase_price'] for buy in buy_transactions)
                    total_bought_quantity = sum(buy['quantity'] for buy in buy_transactions)
                    
                    # Calculate profit/loss using simple approach
                    # For individual sell transaction: (Sell Value * Sell Quantity) - (Total Bought Value * Proportion Sold)
                    sell_value = transaction['quantity'] * transaction['purchase_price']
                    
                    # Calculate the proportion of total bought shares that this sell represents
                    if total_bought_quantity > 0:
                        proportion_sold = transaction['quantity'] / total_bought_quantity
                        cost_basis_for_sold = total_bought_value * proportion_sold
                        profit_loss = sell_value - cost_basis_for_sold
                        
                        print(f"Transaction {transaction['_id']}: {transaction['symbol']}")
                        print(f"  Sell value: {sell_value}, Cost basis: {cost_basis_for_sold}")
                        print(f"  Profit/Loss: {profit_loss}")
            
            transaction_list.append({
                'id': str(transaction['_id']),
                'symbol': transaction['symbol'],
                'quantity': transaction['quantity'],
                'purchase_price': transaction['purchase_price'],
                'purchase_date': transaction['purchase_date'].isoformat() if isinstance(transaction['purchase_date'], datetime) else transaction['purchase_date'],
                'transaction_type': transaction.get('transaction_type', 'buy'),
                'notes': transaction.get('notes', ''),
                'created_at': transaction.get('created_at', datetime.utcnow()).isoformat(),
                'profit_loss': profit_loss  # Add profit/loss for sell transactions
            })
        
        return jsonify({
            'transactions': transaction_list
        }), 200
        
    except Exception as e:
        print(f"Error in get_transactions: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@portfolio_bp.route('/add', methods=['POST'])
@jwt_required()
def add_stock():
    """Add stock to portfolio"""
    try:
        user_id = get_jwt_identity()
        print(f"Adding stock for user: {user_id}")
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            print(f"User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"User found: {user.get('name', 'Unknown')}")
        
        # Check if user has KYC (more lenient check for now)
        kyc = db.kyc.find_one({'user_id': user_id})
        if not kyc:
            print(f"KYC not found for user: {user_id}")
            # For now, allow without KYC for testing
            # return jsonify({'error': 'KYC verification required'}), 403
            print("Allowing without KYC for testing")
        
        data = request.get_json()
        print(f"Received data: {data}")
        
        # Validate required fields
        required_fields = ['symbol', 'quantity', 'purchase_price', 'purchase_date']
        for field in required_fields:
            if not data.get(field):
                print(f"Missing required field: {field}")
                return jsonify({'error': f'{field} is required'}), 400
        
        symbol = data['symbol'].upper().strip()
        quantity = float(data['quantity'])
        purchase_price = float(data['purchase_price'])
        purchase_date = data['purchase_date']
        transaction_type = data.get('transaction_type', 'buy')
        notes = data.get('notes', '').strip()
        
        print(f"Parsed data - Symbol: {symbol}, Quantity: {quantity}, Price: {purchase_price}, Date: {purchase_date}")
        
        # Validate data
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        if purchase_price <= 0:
            return jsonify({'error': 'Purchase price must be greater than 0'}), 400
        
        if transaction_type not in ['buy', 'sell']:
            return jsonify({'error': 'Transaction type must be either "buy" or "sell"'}), 400
        
        # Parse purchase date
        try:
            if isinstance(purchase_date, str):
                # Try different date formats
                if 'T' in purchase_date:
                    # ISO format
                    purchase_date = datetime.fromisoformat(purchase_date.replace('Z', '+00:00'))
                else:
                    # Simple date format (YYYY-MM-DD)
                    purchase_date = datetime.strptime(purchase_date, '%Y-%m-%d')
        except ValueError as e:
            print(f"Date parsing error: {e}")
            print(f"Date string received: {purchase_date}")
            return jsonify({'error': f'Invalid purchase date format: {purchase_date}. Expected YYYY-MM-DD format.'}), 400
        
        # Create portfolio transaction
        portfolio_data = {
            'user_id': user_id,
            'symbol': symbol,
            'quantity': quantity,
            'purchase_price': purchase_price,
            'purchase_date': purchase_date,
            'transaction_type': transaction_type,
            'notes': notes,
            'created_at': datetime.utcnow()
        }
        
        print(f"Portfolio data to insert: {portfolio_data}")
        
        # Insert into MongoDB
        result = db.portfolio.insert_one(portfolio_data)
        
        if result.inserted_id:
            portfolio_data['_id'] = result.inserted_id
            
            # Also add to transactions collection
            transaction_data = {
                'user_id': user_id,
                'symbol': symbol,
                'quantity': quantity,
                'price': purchase_price,
                'transaction_type': 'buy',
                'transaction_date': purchase_date,
                'notes': notes,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            try:
                db.transactions.insert_one(transaction_data)
                print(f"Transaction added to transactions collection for {symbol}")
            except Exception as e:
                print(f"Warning: Failed to add transaction to transactions collection: {e}")
            
            return jsonify({
                'message': 'Stock added to portfolio successfully',
                'portfolio': {
                    'id': str(portfolio_data['_id']),
                    'symbol': portfolio_data['symbol'],
                    'quantity': portfolio_data['quantity'],
                    'purchase_price': portfolio_data['purchase_price'],
                    'purchase_date': portfolio_data['purchase_date'].isoformat() if isinstance(portfolio_data['purchase_date'], datetime) else portfolio_data['purchase_date'],
                    'notes': portfolio_data['notes']
                }
            }), 201
        else:
            print("Failed to insert portfolio data")
            return jsonify({'error': 'Failed to add stock to portfolio'}), 500
        
    except ValueError as e:
        print(f"ValueError in add_stock: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error in add_stock: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@portfolio_bp.route('/sell', methods=['POST'])
@jwt_required()
def sell_stock():
    """Sell stock from portfolio"""
    try:
        user_id = get_jwt_identity()
        print(f"Selling stock for user: {user_id}")
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            print(f"User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        print(f"Received sell data: {data}")
        
        # Validate required fields
        required_fields = ['symbol', 'quantity', 'sell_price', 'sell_date']
        for field in required_fields:
            if not data.get(field):
                print(f"Missing required field: {field}")
                return jsonify({'error': f'{field} is required'}), 400
        
        symbol = data['symbol'].upper().strip()
        quantity = float(data['quantity'])
        sell_price = float(data['sell_price'])
        sell_date = data['sell_date']
        notes = data.get('notes', '').strip()
        
        # Validate data
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        if sell_price <= 0:
            return jsonify({'error': 'Sell price must be greater than 0'}), 400
        
        # Check if user has enough shares to sell
        buy_transactions = list(db.portfolio.find({
            'user_id': user_id,
            'symbol': symbol,
            'transaction_type': 'buy'
        }))
        
        sell_transactions = list(db.portfolio.find({
            'user_id': user_id,
            'symbol': symbol,
            'transaction_type': 'sell'
        }))
        
        total_bought = sum(t['quantity'] for t in buy_transactions)
        total_sold = sum(t['quantity'] for t in sell_transactions)
        available_quantity = total_bought - total_sold
        
        if quantity > available_quantity:
            return jsonify({'error': f'Insufficient shares. You only have {available_quantity} shares of {symbol}'}), 400
        
        # Parse sell date
        try:
            if isinstance(sell_date, str):
                if 'T' in sell_date:
                    sell_date = datetime.fromisoformat(sell_date.replace('Z', '+00:00'))
                else:
                    sell_date = datetime.strptime(sell_date, '%Y-%m-%d')
        except ValueError as e:
            print(f"Date parsing error: {e}")
            return jsonify({'error': f'Invalid sell date format: {sell_date}. Expected YYYY-MM-DD format.'}), 400
        
        # Create sell transaction
        sell_data = {
            'user_id': user_id,
            'symbol': symbol,
            'quantity': quantity,
            'purchase_price': sell_price,  # Using purchase_price field for sell price
            'purchase_date': sell_date,    # Using purchase_date field for sell date
            'transaction_type': 'sell',
            'notes': notes,
            'created_at': datetime.utcnow()
        }
        
        print(f"Sell data to insert: {sell_data}")
        
        # Insert into MongoDB
        result = db.portfolio.insert_one(sell_data)
        
        if result.inserted_id:
            sell_data['_id'] = result.inserted_id

            # Also add to transactions collection
            transaction_data = {
                'user_id': user_id,
                'symbol': symbol,
                'quantity': quantity,
                'price': sell_price,
                'transaction_type': 'sell',
                'transaction_date': sell_date,
                'notes': notes,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            try:
                db.transactions.insert_one(transaction_data)
                print(f"Sell transaction added to transactions collection for {symbol}")
            except Exception as e:
                print(f"Warning: Failed to add sell transaction to transactions collection: {e}")
            
            return jsonify({
                'message': 'Stock sold successfully',
                'transaction': {
                    'id': str(sell_data['_id']),
                    'symbol': sell_data['symbol'],
                    'quantity': sell_data['quantity'],
                    'sell_price': sell_data['purchase_price'],  # Return as sell_price for clarity
                    'sell_date': sell_data['purchase_date'].isoformat() if isinstance(sell_data['purchase_date'], datetime) else sell_data['purchase_date'],
                    'transaction_type': sell_data['transaction_type'],
                    'notes': sell_data['notes']
                }
            }), 201
        else:
            print("Failed to insert sell data")
            return jsonify({'error': 'Failed to sell stock'}), 500
        
    except ValueError as e:
        print(f"ValueError in sell_stock: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error in sell_stock: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@portfolio_bp.route('/remove/<transaction_id>', methods=['DELETE'])
@jwt_required()
def remove_stock(transaction_id):
    """Remove stock transaction from portfolio"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has KYC (simplified check)
        kyc = db.kyc.find_one({'user_id': user_id})
        if not kyc:
            return jsonify({'error': 'KYC verification required'}), 403
        
        # Remove transaction
        result = db.portfolio.delete_one({'_id': ObjectId(transaction_id)})
        
        if result.deleted_count > 0:
            return jsonify({
                'message': 'Stock transaction removed successfully'
            }), 200
        else:
            return jsonify({'error': 'Transaction not found or could not be removed'}), 404
        
    except Exception as e:
        print(f"Error in remove_stock: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@portfolio_bp.route('/holdings', methods=['GET'])
@jwt_required()
def get_holdings():
    """Get current holdings summary"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has KYC (simplified check)
        kyc = db.kyc.find_one({'user_id': user_id})
        if not kyc:
            return jsonify({'error': 'KYC verification required'}), 403
        
        # Get portfolio summary
        transactions = list(db.portfolio.find({'user_id': user_id}))
        
        # Calculate portfolio summary using FIFO method
        total_investment = 0
        total_buy_value = 0
        total_sell_value = 0
        holdings = {}
        
        # First pass: collect all buy transactions
        buy_transactions = {}
        for transaction in transactions:
            if transaction.get('transaction_type') == 'buy':
                symbol = transaction['symbol']
                if symbol not in buy_transactions:
                    buy_transactions[symbol] = []
                buy_transactions[symbol].append({
                    'quantity': transaction['quantity'],
                    'price': transaction['purchase_price'],
                    'date': transaction['purchase_date']
                })
        
        # Second pass: process sell transactions using FIFO
        sell_transactions = {}
        for transaction in transactions:
            if transaction.get('transaction_type') == 'sell':
                symbol = transaction['symbol']
                if symbol not in sell_transactions:
                    sell_transactions[symbol] = []
                sell_transactions[symbol].append({
                    'quantity': transaction['quantity'],
                    'price': transaction['purchase_price'],
                    'date': transaction['purchase_date']
                })
        
        # Calculate holdings for each symbol
        for symbol in set([t['symbol'] for t in transactions]):
            if symbol not in holdings:
                holdings[symbol] = {
                    'symbol': symbol,
                    'quantity': 0,
                    'total_investment': 0,
                    'avg_purchase_price': 0,
                    'last_purchase_price': 0  # Add actual purchase price
                }
            
            # Calculate total bought quantity and investment
            total_bought = sum(t['quantity'] for t in buy_transactions.get(symbol, []))
            total_bought_investment = sum(t['quantity'] * t['price'] for t in buy_transactions.get(symbol, []))
            
            # Calculate total sold quantity
            total_sold = sum(t['quantity'] for t in sell_transactions.get(symbol, []))
            
            # Calculate remaining quantity and investment using FIFO
            remaining_quantity = total_bought - total_sold
            if remaining_quantity > 0:
                # Sort buy transactions by date (FIFO)
                sorted_buys = sorted(buy_transactions.get(symbol, []), key=lambda x: x['date'])
                
                # Calculate remaining investment using FIFO
                remaining_investment = 0
                quantity_needed = remaining_quantity
                
                for buy in sorted_buys:
                    if quantity_needed <= 0:
                        break
                    if buy['quantity'] <= quantity_needed:
                        remaining_investment += buy['quantity'] * buy['price']
                        quantity_needed -= buy['quantity']
                    else:
                        remaining_investment += quantity_needed * buy['price']
                        quantity_needed = 0
                
                holdings[symbol]['quantity'] = remaining_quantity
                holdings[symbol]['total_investment'] = remaining_investment
                holdings[symbol]['avg_purchase_price'] = remaining_investment / remaining_quantity if remaining_quantity > 0 else 0
                
                # Get the most recent purchase price for display
                if buy_transactions.get(symbol):
                    latest_buy = max(buy_transactions[symbol], key=lambda x: x['date'])
                    holdings[symbol]['last_purchase_price'] = latest_buy['price']
                
                total_investment += remaining_investment
                total_buy_value += total_bought_investment
                total_sell_value += sum(t['quantity'] * t['price'] for t in sell_transactions.get(symbol, []))
        
        # Filter out holdings with zero or negative quantity
        holdings_list = []
        for symbol, holding in holdings.items():
            if holding['quantity'] > 0:
                holdings_list.append(holding)
        
        # Calculate summary metrics
        total_value = total_investment  # Current portfolio value (sum of all holdings)
        total_profit_loss = total_sell_value - total_buy_value  # Profit from sell transactions
        total_return_percentage = ((total_sell_value - total_buy_value) / total_buy_value * 100) if total_buy_value > 0 else 0
        
        return jsonify({
            'holdings': holdings_list,
            'summary': {
                'total_investment': total_investment,
                'current_value': total_value,
                'total_profit_loss': total_profit_loss,
                'total_profit_loss_percentage': total_return_percentage,
                'total_buy_value': total_buy_value,
                'total_sell_value': total_sell_value
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_holdings: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@portfolio_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_performance():
    """Get portfolio performance metrics"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has KYC (simplified check)
        kyc = db.kyc.find_one({'user_id': user_id})
        if not kyc:
            return jsonify({'error': 'KYC verification required'}), 403
        
        # Get portfolio summary
        transactions = list(db.portfolio.find({'user_id': user_id}))
        
        # Calculate portfolio summary using FIFO method
        total_investment = 0
        total_buy_value = 0
        total_sell_value = 0
        holdings = {}
        
        # First pass: collect all buy transactions
        buy_transactions = {}
        for transaction in transactions:
            if transaction.get('transaction_type') == 'buy':
                symbol = transaction['symbol']
                if symbol not in buy_transactions:
                    buy_transactions[symbol] = []
                buy_transactions[symbol].append({
                    'quantity': transaction['quantity'],
                    'price': transaction['purchase_price'],
                    'date': transaction['purchase_date']
                })
        
        # Second pass: process sell transactions using FIFO
        sell_transactions = {}
        for transaction in transactions:
            if transaction.get('transaction_type') == 'sell':
                symbol = transaction['symbol']
                if symbol not in sell_transactions:
                    sell_transactions[symbol] = []
                sell_transactions[symbol].append({
                    'quantity': transaction['quantity'],
                    'price': transaction['purchase_price'],
                    'date': transaction['purchase_date']
                })
        
        # Calculate holdings for each symbol
        for symbol in set([t['symbol'] for t in transactions]):
            if symbol not in holdings:
                holdings[symbol] = {
                    'symbol': symbol,
                    'quantity': 0,
                    'total_investment': 0,
                    'avg_purchase_price': 0,
                    'last_purchase_price': 0  # Add actual purchase price
                }
            
            # Calculate total bought quantity and investment
            total_bought = sum(t['quantity'] for t in buy_transactions.get(symbol, []))
            total_bought_investment = sum(t['quantity'] * t['price'] for t in buy_transactions.get(symbol, []))
            
            # Calculate total sold quantity
            total_sold = sum(t['quantity'] for t in sell_transactions.get(symbol, []))
            
            # Calculate remaining quantity and investment using FIFO
            remaining_quantity = total_bought - total_sold
            if remaining_quantity > 0:
                # Sort buy transactions by date (FIFO)
                sorted_buys = sorted(buy_transactions.get(symbol, []), key=lambda x: x['date'])
                
                # Calculate remaining investment using FIFO
                remaining_investment = 0
                quantity_needed = remaining_quantity
                
                for buy in sorted_buys:
                    if quantity_needed <= 0:
                        break
                    if buy['quantity'] <= quantity_needed:
                        remaining_investment += buy['quantity'] * buy['price']
                        quantity_needed -= buy['quantity']
                    else:
                        remaining_investment += quantity_needed * buy['price']
                        quantity_needed = 0
                
                holdings[symbol]['quantity'] = remaining_quantity
                holdings[symbol]['total_investment'] = remaining_investment
                holdings[symbol]['avg_purchase_price'] = remaining_investment / remaining_quantity if remaining_quantity > 0 else 0
                
                # Get the most recent purchase price for display
                if buy_transactions.get(symbol):
                    latest_buy = max(buy_transactions[symbol], key=lambda x: x['date'])
                    holdings[symbol]['last_purchase_price'] = latest_buy['price']
                
                total_investment += remaining_investment
                total_buy_value += total_bought_investment
                total_sell_value += sum(t['quantity'] * t['price'] for t in sell_transactions.get(symbol, []))
        
        # Filter out holdings with zero or negative quantity
        holdings_list = []
        for symbol, holding in holdings.items():
            if holding['quantity'] > 0:
                holdings_list.append(holding)
        
        # Calculate performance metrics
        total_value = total_investment  # Current portfolio value (sum of all holdings)
        total_profit_loss = total_sell_value - total_buy_value  # Profit from sell transactions
        total_return_percentage = ((total_sell_value - total_buy_value) / total_buy_value * 100) if total_buy_value > 0 else 0
        
        # Calculate additional metrics
        performance_metrics = {
            'total_investment': total_investment,
            'current_value': total_value,
            'total_profit_loss': total_profit_loss,
            'total_profit_loss_percentage': total_return_percentage,
            'total_return': (total_value / total_investment - 1) * 100 if total_investment > 0 else 0,
            'number_of_holdings': len(holdings_list),
            'best_performer': None,
            'worst_performer': None
        }
        
        # Find best and worst performers
        if holdings_list:
            best_performer = max(holdings_list, key=lambda x: x['avg_purchase_price'])
            worst_performer = min(holdings_list, key=lambda x: x['avg_purchase_price'])
            
            performance_metrics['best_performer'] = {
                'symbol': best_performer['symbol'],
                'avg_price': best_performer['avg_purchase_price']
            }
            performance_metrics['worst_performer'] = {
                'symbol': worst_performer['symbol'],
                'avg_price': worst_performer['avg_purchase_price']
            }
        
        return jsonify({
            'performance': performance_metrics,
            'holdings': holdings_list
        }), 200
        
    except Exception as e:
        print(f"Error in get_performance: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@portfolio_bp.route('/analysis/<symbol>', methods=['GET'])
@jwt_required()
def get_stock_analysis(symbol):
    """Get detailed profit/loss analysis for a specific stock"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all transactions for this stock
        transactions = list(db.portfolio.find({
            'user_id': user_id,
            'symbol': symbol.upper()
        }).sort('purchase_date', 1))
        
        if not transactions:
            return jsonify({'error': 'No transactions found for this stock'}), 404
        
        # Separate buy and sell transactions
        buy_transactions = [t for t in transactions if t.get('transaction_type') == 'buy']
        sell_transactions = [t for t in transactions if t.get('transaction_type') == 'sell']
        
        # Calculate total quantities and values
        total_bought_quantity = sum(t['quantity'] for t in buy_transactions)
        total_bought_value = sum(t['quantity'] * t['purchase_price'] for t in buy_transactions)
        total_sold_quantity = sum(t['quantity'] for t in sell_transactions)
        total_sold_value = sum(t['quantity'] * t['purchase_price'] for t in sell_transactions)
        
        # Calculate remaining holdings
        remaining_quantity = total_bought_quantity - total_sold_quantity
        
        # Calculate realized profit/loss using simple method
        realized_profit_loss = 0
        if sell_transactions:
            # Calculate total sold value and total bought value
            total_sold_value = sum(t['quantity'] * t['purchase_price'] for t in sell_transactions)
            total_bought_value = sum(t['quantity'] * t['purchase_price'] for t in buy_transactions)
            
            # Simple profit/loss calculation: Total Sell - Total Buy
            realized_profit_loss = total_sold_value - total_bought_value
        
        # Calculate average purchase price for remaining holdings
        avg_purchase_price = 0
        if remaining_quantity > 0:
            # Simple average purchase price: Total Bought Value / Total Bought Quantity
            avg_purchase_price = total_bought_value / total_bought_quantity if total_bought_quantity > 0 else 0
        
        # Calculate return percentage using simple method
        total_return_percentage = 0
        if total_bought_value > 0:
            # Simple return calculation: (Total Sell - Total Buy) / Total Buy * 100
            total_return_percentage = ((total_sold_value - total_bought_value) / total_bought_value * 100) if total_bought_value > 0 else 0
        
        return jsonify({
            'symbol': symbol.upper(),
            'total_bought_quantity': total_bought_quantity,
            'total_bought_value': total_bought_value,
            'total_sold_quantity': total_sold_quantity,
            'total_sold_value': total_sold_value,
            'remaining_quantity': remaining_quantity,
            'avg_purchase_price': avg_purchase_price,
            'realized_profit_loss': realized_profit_loss,
            'total_return_percentage': total_return_percentage,
            'transactions': {
                'buy': [{
                    'date': t['purchase_date'].isoformat() if isinstance(t['purchase_date'], datetime) else t['purchase_date'],
                    'quantity': t['quantity'],
                    'price': t['purchase_price']
                } for t in buy_transactions],
                'sell': [{
                    'date': t['purchase_date'].isoformat() if isinstance(t['purchase_date'], datetime) else t['purchase_date'],
                    'quantity': t['quantity'],
                    'price': t['purchase_price']
                } for t in sell_transactions]
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_stock_analysis: {e}")
        return jsonify({'error': 'Internal server error'}), 500
