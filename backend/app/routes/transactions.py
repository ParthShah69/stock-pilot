from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
from app import db

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_transactions():
    """Get all transactions for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all transactions for this user
        transactions = list(db.transactions.find({'user_id': user_id}).sort('transaction_date', -1))
        
        # Convert to list of dictionaries with profit/loss calculation
        transaction_list = []
        for transaction in transactions:
            # Calculate profit/loss for sell transactions
            profit_loss = None
            if transaction.get('transaction_type') == 'sell':
                # Find all buy transactions for this stock
                buy_transactions = list(db.transactions.find({
                    'user_id': user_id,
                    'symbol': transaction['symbol'],
                    'transaction_type': 'buy'
                }))
                
                if buy_transactions:
                    # Calculate total bought value for this stock
                    total_bought_value = sum(buy['quantity'] * buy['price'] for buy in buy_transactions)
                    total_bought_quantity = sum(buy['quantity'] for buy in buy_transactions)
                    
                    # Calculate profit/loss using simple approach
                    sell_value = transaction['quantity'] * transaction['price']
                    
                    # Calculate the proportion of total bought shares that this sell represents
                    if total_bought_quantity > 0:
                        proportion_sold = transaction['quantity'] / total_bought_quantity
                        cost_basis_for_sold = total_bought_value * proportion_sold
                        profit_loss = sell_value - cost_basis_for_sold
            
            transaction_list.append({
                'id': str(transaction['_id']),
                'symbol': transaction['symbol'],
                'quantity': transaction['quantity'],
                'price': transaction['price'],
                'transaction_type': transaction['transaction_type'],
                'transaction_date': transaction['transaction_date'].isoformat() if isinstance(transaction['transaction_date'], datetime) else transaction['transaction_date'],
                'notes': transaction.get('notes', ''),
                'created_at': transaction.get('created_at', datetime.utcnow()).isoformat(),
                'profit_loss': profit_loss,
                'total_value': transaction['quantity'] * transaction['price']
            })
        
        return jsonify({
            'transactions': transaction_list,
            'user': {
                'id': str(user['_id']),
                'name': user.get('name', 'User')
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_user_transactions: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@transactions_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_transaction_summary():
    """Get transaction summary for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all transactions for this user
        transactions = list(db.transactions.find({'user_id': user_id}))
        
        # Separate buy and sell transactions
        buy_transactions = [t for t in transactions if t.get('transaction_type') == 'buy']
        sell_transactions = [t for t in transactions if t.get('transaction_type') == 'sell']
        
        # Calculate totals
        total_buy_value = sum(t['quantity'] * t['price'] for t in buy_transactions)
        total_sell_value = sum(t['quantity'] * t['price'] for t in sell_transactions)
        total_buy_quantity = sum(t['quantity'] for t in buy_transactions)
        total_sell_quantity = sum(t['quantity'] for t in sell_transactions)
        
        # Calculate profit/loss using simple method: Total Sell - Total Buy
        total_profit_loss = total_sell_value - total_buy_value
        
        # Calculate return percentage
        total_return_percentage = 0
        if total_buy_value > 0:
            total_return_percentage = (total_profit_loss / total_buy_value) * 100
        
        # Get unique symbols
        unique_symbols = list(set([t['symbol'] for t in transactions]))
        
        # Calculate per-symbol summary
        symbol_summary = {}
        for symbol in unique_symbols:
            symbol_buys = [t for t in buy_transactions if t['symbol'] == symbol]
            symbol_sells = [t for t in sell_transactions if t['symbol'] == symbol]
            
            symbol_buy_value = sum(t['quantity'] * t['price'] for t in symbol_buys)
            symbol_sell_value = sum(t['quantity'] * t['price'] for t in symbol_sells)
            symbol_profit_loss = symbol_sell_value - symbol_buy_value
            
            symbol_summary[symbol] = {
                'total_bought_value': symbol_buy_value,
                'total_sold_value': symbol_sell_value,
                'profit_loss': symbol_profit_loss,
                'buy_transactions': len(symbol_buys),
                'sell_transactions': len(symbol_sells)
            }
        
        return jsonify({
            'summary': {
                'total_buy_value': total_buy_value,
                'total_sell_value': total_sell_value,
                'total_buy_quantity': total_buy_quantity,
                'total_sell_quantity': total_sell_quantity,
                'total_profit_loss': total_profit_loss,
                'total_return_percentage': total_return_percentage
            },
            'symbol_summary': symbol_summary,
            'transaction_counts': {
                'total_transactions': len(transactions),
                'buy_transactions': len(buy_transactions),
                'sell_transactions': len(sell_transactions)
            },
            'user': {
                'id': str(user['_id']),
                'name': user.get('name', 'User')
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_transaction_summary: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@transactions_bp.route('/add', methods=['POST'])
@jwt_required()
def add_transaction():
    """Add a new transaction"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['symbol', 'quantity', 'price', 'transaction_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate transaction type
        if data['transaction_type'] not in ['buy', 'sell']:
            return jsonify({'error': 'transaction_type must be either "buy" or "sell"'}), 400
        
        # Parse date
        transaction_date = datetime.utcnow()
        if data.get('transaction_date'):
            try:
                if 'T' in data['transaction_date']:
                    transaction_date = datetime.fromisoformat(data['transaction_date'].replace('Z', '+00:00'))
                else:
                    transaction_date = datetime.strptime(data['transaction_date'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid transaction date format. Expected YYYY-MM-DD format.'}), 400
        
        # Create transaction data
        transaction_data = {
            'user_id': user_id,
            'symbol': data['symbol'].upper().strip(),
            'quantity': float(data['quantity']),
            'price': float(data['price']),
            'transaction_type': data['transaction_type'],
            'transaction_date': transaction_date,
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert into transactions collection
        result = db.transactions.insert_one(transaction_data)
        
        if result.inserted_id:
            transaction_data['_id'] = result.inserted_id
            
            return jsonify({
                'message': f'Transaction added successfully',
                'transaction': {
                    'id': str(transaction_data['_id']),
                    'symbol': transaction_data['symbol'],
                    'quantity': transaction_data['quantity'],
                    'price': transaction_data['price'],
                    'transaction_type': transaction_data['transaction_type'],
                    'transaction_date': transaction_data['transaction_date'].isoformat(),
                    'notes': transaction_data['notes']
                }
            }), 201
        else:
            return jsonify({'error': 'Failed to add transaction'}), 500
        
    except Exception as e:
        print(f"Error in add_transaction: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@transactions_bp.route('/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if transaction exists and belongs to user
        transaction = db.transactions.find_one({
            '_id': ObjectId(transaction_id),
            'user_id': user_id
        })
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Delete transaction
        result = db.transactions.delete_one({'_id': ObjectId(transaction_id)})
        
        if result.deleted_count > 0:
            return jsonify({
                'message': 'Transaction deleted successfully'
            }), 200
        else:
            return jsonify({'error': 'Failed to delete transaction'}), 500
        
    except Exception as e:
        print(f"Error in delete_transaction: {e}")
        return jsonify({'error': 'Internal server error'}), 500
