from datetime import datetime
from bson import ObjectId

class Transaction:
    def __init__(self, user_id, symbol, quantity, price, transaction_type, transaction_date, notes=None):
        self.user_id = user_id
        self.symbol = symbol.upper()
        self.quantity = quantity
        self.price = price
        self.transaction_type = transaction_type  # 'buy' or 'sell'
        self.transaction_date = transaction_date
        self.notes = notes
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert transaction object to dictionary"""
        return {
            'user_id': self.user_id,
            'symbol': self.symbol,
            'quantity': self.quantity,
            'price': self.price,
            'transaction_type': self.transaction_type,
            'transaction_date': self.transaction_date,
            'notes': self.notes,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create transaction object from dictionary"""
        transaction = Transaction(
            user_id=data['user_id'],
            symbol=data['symbol'],
            quantity=data['quantity'],
            price=data['price'],
            transaction_type=data['transaction_type'],
            transaction_date=data['transaction_date'],
            notes=data.get('notes')
        )
        transaction.created_at = data.get('created_at', datetime.utcnow())
        transaction.updated_at = data.get('updated_at', datetime.utcnow())
        return transaction

class Portfolio:
    def __init__(self, user_id, symbol, quantity, purchase_price, purchase_date, 
                 transaction_type='buy', notes=None):
        self.user_id = user_id
        self.symbol = symbol.upper()
        self.quantity = quantity
        self.purchase_price = purchase_price
        self.purchase_date = purchase_date
        self.transaction_type = transaction_type  # buy, sell
        self.notes = notes
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert portfolio object to dictionary"""
        return {
            'user_id': self.user_id,
            'symbol': self.symbol,
            'quantity': self.quantity,
            'purchase_price': self.purchase_price,
            'purchase_date': self.purchase_date,
            'transaction_type': self.transaction_type,
            'notes': self.notes,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create portfolio object from dictionary"""
        portfolio = Portfolio(
            user_id=data['user_id'],
            symbol=data['symbol'],
            quantity=data['quantity'],
            purchase_price=data['purchase_price'],
            purchase_date=data['purchase_date'],
            transaction_type=data.get('transaction_type', 'buy'),
            notes=data.get('notes')
        )
        portfolio.created_at = data.get('created_at', datetime.utcnow())
        portfolio.updated_at = data.get('updated_at', datetime.utcnow())
        return portfolio
    
    @staticmethod
    def add_stock(user_id, symbol, quantity, purchase_price, purchase_date, notes=None):
        """Add a stock to user's portfolio"""
        from app import db
        
        portfolio = Portfolio(
            user_id=user_id,
            symbol=symbol,
            quantity=quantity,
            purchase_price=purchase_price,
            purchase_date=purchase_date,
            notes=notes
        )
        
        # Save to database
        result = db.portfolio.insert_one(portfolio.to_dict())
        portfolio._id = result.inserted_id
        
        return portfolio
    
    @staticmethod
    def get_user_portfolio(user_id):
        """Get all stocks in user's portfolio"""
        from app import db
        portfolio_data = list(db.portfolio.find({'user_id': user_id}))
        
        portfolios = []
        for data in portfolio_data:
            portfolio = Portfolio.from_dict(data)
            portfolio._id = data['_id']
            portfolios.append(portfolio)
        
        return portfolios
    
    @staticmethod
    def get_portfolio_summary(user_id):
        """Get portfolio summary with current holdings"""
        from app import db
        from app.services.stock_service import StockService
        
        # Get all user's stocks
        portfolio_data = list(db.portfolio.find({'user_id': user_id}))
        
        # Group by symbol and calculate totals using FIFO method
        holdings = {}
        
        # First pass: collect all buy transactions
        buy_transactions = {}
        for data in portfolio_data:
            if data.get('transaction_type') == 'buy':
                symbol = data['symbol']
                if symbol not in buy_transactions:
                    buy_transactions[symbol] = []
                buy_transactions[symbol].append({
                    'quantity': data['quantity'],
                    'price': data['purchase_price'],
                    'date': data['purchase_date']
                })
        
        # Second pass: process sell transactions using FIFO
        sell_transactions = {}
        for data in portfolio_data:
            if data.get('transaction_type') == 'sell':
                symbol = data['symbol']
                if symbol not in sell_transactions:
                    sell_transactions[symbol] = []
                sell_transactions[symbol].append({
                    'quantity': data['quantity'],
                    'price': data['purchase_price'],
                    'date': data['purchase_date']
                })
        
        # Calculate holdings for each symbol
        for symbol in set([data['symbol'] for data in portfolio_data]):
            holdings[symbol] = {
                'symbol': symbol,
                'total_quantity': 0,
                'total_investment': 0,
                'transactions': []
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
                
                holdings[symbol]['total_quantity'] = remaining_quantity
                holdings[symbol]['total_investment'] = remaining_investment
                
                # Get the most recent purchase price for display
                if buy_transactions.get(symbol):
                    latest_buy = max(buy_transactions[symbol], key=lambda x: x['date'])
                    holdings[symbol]['last_purchase_price'] = latest_buy['price']
            
            # Add all transactions for this symbol
            for data in portfolio_data:
                if data['symbol'] == symbol:
                    holdings[symbol]['transactions'].append({
                        'id': str(data['_id']),
                        'quantity': data['quantity'],
                        'price': data['purchase_price'],
                        'date': data['purchase_date'],
                        'type': data.get('transaction_type', 'buy'),
                        'notes': data.get('notes')
                    })
        
        # Remove stocks with zero quantity
        holdings = {k: v for k, v in holdings.items() if v['total_quantity'] > 0}
        
        # Get current prices and calculate current value
        portfolio_summary = {
            'total_investment': 0,
            'current_value': 0,
            'total_profit_loss': 0,
            'holdings': []
        }
        
        for symbol, holding in holdings.items():
            try:
                current_price = StockService.get_current_price(symbol)
                current_value = holding['total_quantity'] * current_price
                profit_loss = current_value - holding['total_investment']
                
                holding['current_price'] = current_price
                holding['current_value'] = current_value
                holding['profit_loss'] = profit_loss
                holding['profit_loss_percentage'] = (profit_loss / holding['total_investment']) * 100 if holding['total_investment'] > 0 else 0
                
                portfolio_summary['total_investment'] += holding['total_investment']
                portfolio_summary['current_value'] += current_value
                portfolio_summary['total_profit_loss'] += profit_loss
                portfolio_summary['holdings'].append(holding)
                
            except Exception as e:
                # If we can't get current price, use purchase price
                holding['current_price'] = holding['total_investment'] / holding['total_quantity'] if holding['total_quantity'] > 0 else 0
                holding['current_value'] = holding['total_investment']
                holding['profit_loss'] = 0
                holding['profit_loss_percentage'] = 0
                portfolio_summary['holdings'].append(holding)
        
        portfolio_summary['total_profit_loss_percentage'] = (portfolio_summary['total_profit_loss'] / portfolio_summary['total_investment']) * 100 if portfolio_summary['total_investment'] > 0 else 0
        
        return portfolio_summary
    
    @staticmethod
    def remove_stock(transaction_id):
        """Remove a stock transaction from portfolio"""
        from app import db
        result = db.portfolio.delete_one({'_id': ObjectId(transaction_id)})
        return result.deleted_count > 0
