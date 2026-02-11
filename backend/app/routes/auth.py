from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from app import db
from bson import ObjectId
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data.get('name', '').strip()
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Create user
        user = User.create_user(email, password, name)
        
        # Create access token
        token = create_access_token(identity=str(user._id))
        
        # Remove password from response
        user_dict = user.to_dict()
        user_dict.pop('password', None)
        user_dict['_id'] = str(user._id)
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': user_dict
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user by email
        user = User.get_by_email(email)
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not user.verify_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Create access token
        token = create_access_token(identity=str(user._id))
        
        # Remove password from response
        user_dict = user.to_dict()
        user_dict.pop('password', None)
        user_dict['_id'] = str(user._id)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_dict
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user details"""
    try:
        user_id = get_jwt_identity()
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove password from response
        user_data.pop('password', None)
        user_data['_id'] = str(user_data['_id'])
        
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile and sync with KYC if needed"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        # Fields that can be updated
        update_fields = {
            'name': data.get('name'),
            'phone': data.get('phone'),
            'address': data.get('address'),
            'city': data.get('city'),
            'state': data.get('state'),
            'pincode': data.get('pincode'),
            'updated_at': datetime.utcnow()
        }
        
        # Remove None values
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        # Update user in database
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'User not found or no changes made'}), 404
        
        # Check if user has KYC and sync missing fields
        kyc_data = db.kyc.find_one({'user_id': user_id})
        if kyc_data:
            # Fields to sync from profile to KYC
            kyc_update_fields = {}
            
            # Check which fields are missing in KYC but present in profile update
            if not kyc_data.get('phone_number') and update_fields.get('phone'):
                kyc_update_fields['phone_number'] = update_fields['phone']
            
            # Always sync address fields to keep KYC updated
            if update_fields.get('address'):
                kyc_update_fields['address'] = update_fields['address']
            
            if update_fields.get('city'):
                kyc_update_fields['city'] = update_fields['city']
            
            if update_fields.get('state'):
                kyc_update_fields['state'] = update_fields['state']
            
            if update_fields.get('pincode'):
                kyc_update_fields['pincode'] = update_fields['pincode']
            
            # Update KYC if there are fields to sync
            if kyc_update_fields:
                kyc_update_fields['updated_at'] = datetime.utcnow()
                db.kyc.update_one(
                    {'user_id': user_id},
                    {'$set': kyc_update_fields}
                )
        
        # Get updated user data
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        user_data.pop('password', None)
        user_data['_id'] = str(user_data['_id'])
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({'message': 'Logout successful'}), 200
