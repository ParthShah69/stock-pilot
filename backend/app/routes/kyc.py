from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from bson import ObjectId
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from app.services.aadhar_service import AadharService
from app.models.kyc import KYC

kyc_bp = Blueprint('kyc', __name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@kyc_bp.route('/extract', methods=['POST'])
@jwt_required()
def extract_aadhar_data():
    """Extract data from Aadhaar card image"""
    try:
        user_id = get_jwt_identity()
        
        # Check if file is provided
        if 'aadhar_image' not in request.files:
            return jsonify({'error': 'No Aadhaar card image provided'}), 400
        
        aadhar_image = request.files['aadhar_image']
        
        if aadhar_image.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(aadhar_image.filename):
            return jsonify({'error': 'Invalid file type. Please upload an image file.'}), 400
        
        # Save the uploaded image temporarily
        temp_filename = secure_filename(f"temp_aadhar_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg")
        temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], temp_filename)
        aadhar_image.save(temp_path)
        
        try:
            # Verify Aadhaar card format first
            aadhar_service = AadharService()
            if not aadhar_service.verify_aadhar_format(temp_path):
                return jsonify({'error': 'Invalid Aadhaar card format. Please upload a clear image of your Aadhaar card.'}), 400
            
            # Extract data using AadharService
            extracted_data = aadhar_service.extract_aadhar_data(temp_path)
            
            if not extracted_data:
                return jsonify({'error': 'Could not extract data from Aadhaar card. Please ensure the image is clear and readable.'}), 400
            
            # Parse address to extract city, state, pincode
            city = extracted_data.get('city', '')
            state = extracted_data.get('state', '')
            pincode = extracted_data.get('pincode', '')
            
            # Format the extracted data
            formatted_data = {
                'name': extracted_data.get('name', ''),
                'date_of_birth': extracted_data.get('date_of_birth', ''),
                'gender': extracted_data.get('gender', ''),
                'aadhar_number': extracted_data.get('aadhar_number', ''),
                'address': extracted_data.get('address', ''),
                'city': city,
                'state': state,
                'pincode': pincode
            }
            
            # Check if all required fields are present
            required_fields = ['name', 'date_of_birth', 'gender', 'aadhar_number', 'address']
            missing_fields = [field for field in required_fields if not formatted_data.get(field)]
            
            if missing_fields:
                return jsonify({
                    'error': f'Could not extract all required information. Missing: {", ".join(missing_fields)}. Please upload a clearer image.',
                    'extracted_data': formatted_data
                }), 400
            
            return jsonify({
                'message': 'Data extracted successfully',
                'extracted_data': formatted_data,
                'verification_status': 'ready_for_submission'
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        print(f"Error in extract_aadhar_data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_kyc():
    """Submit KYC form with extracted Aadhaar data"""
    try:
        user_id = get_jwt_identity()
        
        # Check if KYC already exists
        existing_kyc = db.kyc.find_one({'user_id': user_id})
        if existing_kyc:
            return jsonify({'error': 'KYC already exists for this user'}), 400
        
        # Get form data
        form_data = request.form.to_dict()
        
        # Handle file upload
        aadhar_image = request.files.get('aadhar_image')
        
        # Save file if provided
        aadhar_path = None
        if aadhar_image and allowed_file(aadhar_image.filename):
            aadhar_filename = secure_filename(f"aadhar_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg")
            aadhar_path = os.path.join(current_app.config['UPLOAD_FOLDER'], aadhar_filename)
            aadhar_image.save(aadhar_path)
        
        # Validate extracted data
        required_fields = ['name', 'date_of_birth', 'gender', 'aadhar_number', 'address']
        missing_fields = [field for field in required_fields if not form_data.get(field)]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Validate Aadhaar number format
        aadhar_number = form_data.get('aadhar_number', '')
        if not aadhar_number.isdigit() or len(aadhar_number) != 12:
            return jsonify({'error': 'Invalid Aadhaar number format'}), 400
        
        # Validate date format
        try:
            datetime.strptime(form_data.get('date_of_birth', ''), '%d/%m/%Y')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Expected DD/MM/YYYY'}), 400
        
        # Create KYC using the model (status will be 'Pending' by default)
        try:
            aadhar_data = {
                'aadhar_number': form_data.get('aadhar_number'),
                'name': form_data.get('name'),
                'date_of_birth': form_data.get('date_of_birth'),
                'gender': form_data.get('gender'),
                'address': form_data.get('address')
            }
            
            kyc = KYC.create_kyc(user_id, aadhar_data, aadhar_path)
            
            print(f"✅ KYC created successfully for user {user_id}")
            print(f"✅ KYC status: {kyc.status}")
            print(f"✅ KYC ID: {kyc._id}")
            
            # Sync missing fields from KYC to user profile
            user_update_fields = {}
            
            # Check which fields are missing in user profile but present in KYC
            user_data = db.users.find_one({'_id': ObjectId(user_id)})
            if user_data:
                # Always sync address fields to keep profile updated
                if form_data.get('address'):
                    user_update_fields['address'] = form_data['address']
                
                if form_data.get('city'):
                    user_update_fields['city'] = form_data['city']
                
                if form_data.get('state'):
                    user_update_fields['state'] = form_data['state']
                
                if form_data.get('pincode'):
                    user_update_fields['pincode'] = form_data['pincode']
                
                # Update user profile if there are fields to sync
                if user_update_fields:
                    user_update_fields['updated_at'] = datetime.utcnow()
                    db.users.update_one(
                        {'_id': ObjectId(user_id)},
                        {'$set': user_update_fields}
                    )
            
            return jsonify({
                'message': 'KYC submitted successfully! Your application is pending admin verification.',
                'kyc_id': str(kyc._id),
                'status': kyc.status
            }), 201
            
        except Exception as e:
            print(f"Error creating KYC: {e}")
            return jsonify({'error': 'Failed to create KYC record'}), 500
            
    except Exception as e:
        print(f"Error in submit_kyc: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/status', methods=['GET'])
@jwt_required()
def get_kyc_status():
    """Get KYC status for current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get user data to check kyc_verified status
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Find KYC for user
        kyc = db.kyc.find_one({'user_id': user_id})
        
        if not kyc:
            return jsonify({
                'kyc_status': 'not_submitted',
                'kyc_verified': False,
                'message': 'KYC not submitted'
            }), 200
        
        # Get KYC status and user verification status
        kyc_status = kyc.get('status', 'pending')
        kyc_verified = user.get('kyc_verified', False)
        
        print(f"🔍 KYC status for user {user_id}: {kyc_status}")
        print(f"🔍 User kyc_verified: {kyc_verified}")
        
        return jsonify({
            'kyc_status': kyc_status,
            'kyc_verified': kyc_verified,
            'kyc_id': str(kyc['_id']),
            'submitted_at': kyc.get('created_at', datetime.utcnow()).isoformat(),
            'message': f'KYC status: {kyc_status}, Verified: {kyc_verified}'
        }), 200
        
    except Exception as e:
        print(f"Error in get_kyc_status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/details', methods=['GET'])
@jwt_required()
def get_kyc_details():
    """Get KYC details for current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get user data to check kyc_verified status
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Find KYC for user
        kyc = db.kyc.find_one({'user_id': user_id})
        
        if not kyc:
            return jsonify({'error': 'KYC not submitted'}), 404
        
        # Get KYC status and user verification status
        kyc_status = kyc.get('status', 'pending')
        kyc_verified = user.get('kyc_verified', False)
        
        # Return masked data for security
        return jsonify({
            'kyc_id': str(kyc['_id']),
            'status': kyc_status,
            'kyc_verified': kyc_verified,
            'full_name': kyc.get('name'),
            'aadhar_number': kyc.get('aadhar_number', '')[:4] + '****' + kyc.get('aadhar_number', '')[-4:] if kyc.get('aadhar_number') else '',
            'date_of_birth': kyc.get('date_of_birth'),
            'gender': kyc.get('gender'),
            'address': kyc.get('address'),
            'city': kyc.get('city'),
            'state': kyc.get('state'),
            'pincode': kyc.get('pincode'),
            'verification_method': kyc.get('verification_method', 'manual'),
            'verification_notes': kyc.get('verification_notes', ''),
            'submitted_at': kyc.get('created_at', datetime.utcnow()).isoformat(),
            'updated_at': kyc.get('updated_at', datetime.utcnow()).isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error in get_kyc_details: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/verify/<kyc_id>', methods=['POST'])
@jwt_required()
def verify_kyc(kyc_id):
    """Verify KYC (Admin only - for demo purposes)"""
    try:
        # In a real application, this would be restricted to admin users
        result = db.kyc.update_one(
            {'_id': ObjectId(kyc_id)},
            {
                '$set': {
                    'status': 'verified',
                    'verification_method': 'manual_admin',
                    'verification_notes': 'KYC verified manually by admin',
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'KYC not found'}), 404
        
        return jsonify({
            'message': 'KYC verified successfully',
            'kyc_id': kyc_id,
            'status': 'verified'
        }), 200
        
    except Exception as e:
        print(f"Error in verify_kyc: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/reject/<kyc_id>', methods=['POST'])
@jwt_required()
def reject_kyc(kyc_id):
    """Reject KYC (Admin only - for demo purposes)"""
    try:
        # In a real application, this would be restricted to admin users
        result = db.kyc.update_one(
            {'_id': ObjectId(kyc_id)},
            {
                '$set': {
                    'status': 'rejected',
                    'verification_method': 'manual_admin',
                    'verification_notes': 'KYC rejected by admin',
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'KYC not found'}), 404
        
        return jsonify({
            'message': 'KYC rejected',
            'kyc_id': kyc_id,
            'status': 'rejected'
        }), 200
        
    except Exception as e:
        print(f"Error in reject_kyc: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_kyc():
    """Get all KYC submissions (Admin only - for demo purposes)"""
    try:
        # In a real application, this would be restricted to admin users
        all_kyc = list(db.kyc.find({}).sort('created_at', -1))
        
        # Format the data for response
        formatted_kyc = []
        for kyc in all_kyc:
            formatted_kyc.append({
                'kyc_id': str(kyc['_id']),
                'user_id': kyc.get('user_id'),
                'name': kyc.get('name'),
                'aadhar_number': kyc.get('aadhar_number', '')[:4] + '****' + kyc.get('aadhar_number', '')[-4:] if kyc.get('aadhar_number') else '',
                'status': kyc.get('status', 'pending'),
                'verification_method': kyc.get('verification_method', 'manual'),
                'verification_notes': kyc.get('verification_notes', ''),
                'submitted_at': kyc.get('created_at', datetime.utcnow()).isoformat(),
                'updated_at': kyc.get('updated_at', datetime.utcnow()).isoformat()
            })
        
        return jsonify({
            'kyc_submissions': formatted_kyc,
            'total_count': len(formatted_kyc)
        }), 200
        
    except Exception as e:
        print(f"Error in get_all_kyc: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/admin/update-pending', methods=['POST'])
@jwt_required()
def update_pending_kyc():
    """Update all pending KYC records to verified (for existing users)"""
    try:
        # In a real application, this would be restricted to admin users
        
        # Find all pending KYC records
        pending_kyc = list(db.kyc.find({'status': 'pending'}))
        
        if not pending_kyc:
            return jsonify({'message': 'No pending KYC records found'}), 200
        
        # Update all pending KYC records to verified
        result = db.kyc.update_many(
            {'status': 'pending'},
            {
                '$set': {
                    'status': 'verified',
                    'verification_method': 'automatic_ocr',
                    'verification_notes': 'KYC verified automatically through OCR data extraction (updated for existing users)',
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            'message': f'Successfully updated {result.modified_count} pending KYC records to verified',
            'updated_count': result.modified_count
        }), 200
        
    except Exception as e:
        print(f"Error in update_pending_kyc: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@kyc_bp.route('/admin/verify-user/<user_id>', methods=['POST'])
@jwt_required()
def verify_user_kyc(user_id):
    """Verify KYC for a specific user (Admin only)"""
    try:
        # In a real application, this would be restricted to admin users
        
        # Find KYC for the specific user
        kyc = db.kyc.find_one({'user_id': user_id})
        
        if not kyc:
            return jsonify({'error': 'KYC not found for this user'}), 404
        
        # Update KYC status to verified
        result = db.kyc.update_one(
            {'user_id': user_id},
            {
                '$set': {
                    'status': 'verified',
                    'verification_method': 'manual_admin',
                    'verification_notes': 'KYC verified manually by admin for user: ' + user_id,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to update KYC status'}), 500
        
        return jsonify({
            'message': 'KYC verified successfully for user',
            'user_id': user_id,
            'status': 'verified'
        }), 200
        
    except Exception as e:
        print(f"Error in verify_user_kyc: {e}")
        return jsonify({'error': 'Internal server error'}), 500
