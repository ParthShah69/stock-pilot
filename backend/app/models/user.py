from datetime import datetime
import bcrypt
from bson import ObjectId

class User:
    def __init__(self, email, password, name=None, kyc_id=None, is_admin=False, kyc_verified=False):
        self.email = email
        self.password = password
        self.name = name
        self.kyc_id = kyc_id
        self.kyc_verified = kyc_verified
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.is_active = True
        self.is_admin = is_admin
    
    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    @staticmethod
    def check_password(password, hashed):
        """Check if a password matches the hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'email': self.email,
            'password': self.password,
            'name': self.name,
            'kyc_id': self.kyc_id,
            'kyc_verified': self.kyc_verified,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'is_active': self.is_active,
            'is_admin': self.is_admin
        }
    
    @staticmethod
    def from_dict(data):
        """Create user object from dictionary"""
        user = User(
            email=data['email'],
            password=data['password'],
            name=data.get('name'),
            kyc_id=data.get('kyc_id'),
            is_admin=data.get('is_admin', False),
            kyc_verified=data.get('kyc_verified', False)
        )
        user.created_at = data.get('created_at', datetime.utcnow())
        user.updated_at = data.get('updated_at', datetime.utcnow())
        user.is_active = data.get('is_active', True)
        return user
    
    @staticmethod
    def create_user(email, password, name=None, is_admin=False):
        """Create a new user"""
        from app import db
        
        # Check if user already exists
        existing_user = db.users.find_one({'email': email})
        if existing_user:
            raise ValueError('User with this email already exists')
        
        # Hash password
        hashed_password = User.hash_password(password)
        
        # Create user object
        user = User(email, hashed_password.decode('utf-8'), name, is_admin=is_admin)
        
        # Save to database
        result = db.users.insert_one(user.to_dict())
        user._id = result.inserted_id
        
        return user
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        from app import db
        user_data = db.users.find_one({'email': email})
        if user_data:
            user = User.from_dict(user_data)
            user._id = user_data['_id']
            return user
        return None
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        from app import db
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if user_data:
            user = User.from_dict(user_data)
            user._id = user_data['_id']
            return user
        return None
    
    @staticmethod
    def create_admin_user():
        """Create default admin user"""
        from app import db
        
        # Check if admin already exists
        existing_admin = db.users.find_one({'is_admin': True})
        if existing_admin:
            # Return User object instead of raw document
            user = User.from_dict(existing_admin)
            user._id = existing_admin['_id']
            return user
        
        # Create admin user
        admin_user = User.create_user(
            email='admin@gmail.com',
            password='123456',
            name='Admin User',
            is_admin=True
        )
        
        return admin_user
    
    def update_kyc_id(self, kyc_id):
        """Update user's KYC ID"""
        from app import db
        self.kyc_id = kyc_id
        self.updated_at = datetime.utcnow()
        
        db.users.update_one(
            {'_id': self._id},
            {'$set': {
                'kyc_id': kyc_id,
                'updated_at': self.updated_at
            }}
        )
    
    def update_kyc_verification(self, kyc_verified=True):
        """Update user's KYC verification status"""
        from app import db
        self.kyc_verified = kyc_verified
        self.updated_at = datetime.utcnow()
        
        db.users.update_one(
            {'_id': self._id},
            {'$set': {
                'kyc_verified': kyc_verified,
                'updated_at': self.updated_at
            }}
        )
    
    def verify_password(self, password):
        """Verify user password"""
        return User.check_password(password, self.password.encode('utf-8'))
