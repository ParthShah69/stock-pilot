from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from config import config
import os

# Initialize extensions
jwt = JWTManager()
db = None

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Setup MongoDB connection (non-blocking)
    global db
    try:
        client = MongoClient(
            app.config['MONGODB_URI'], 
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000
        )
        # Test the connection
        client.admin.command('ping')
        db = client.get_database()
        print("✅ MongoDB connected successfully")
        
        # Create default admin user
        try:
            from app.models.user import User
            admin_user = User.create_admin_user()
            print(f"✅ Admin user created/verified: {admin_user.email}")
        except Exception as e:
            print(f"⚠️ Admin user creation failed: {e}")
            
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {e}")
        print("⚠️ Running without database (some features may not work)")
        db = None
    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.kyc import kyc_bp
    from app.routes.portfolio import portfolio_bp
    from app.routes.transactions import transactions_bp
    from app.routes.stocks import stocks_bp
    from app.routes.contact import contact_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(kyc_bp, url_prefix='/api/kyc')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(stocks_bp, url_prefix='/api/stocks')
    app.register_blueprint(contact_bp, url_prefix='/api/contact')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app
