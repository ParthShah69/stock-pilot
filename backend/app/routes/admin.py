from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models.kyc import KYC
from app.models.user import User
from bson import ObjectId

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator to check if user is admin"""
    from functools import wraps
    from flask_jwt_extended import jwt_required, get_jwt_identity
    
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        # Get counts
        total_users = db.users.count_documents({})
        total_kyc = db.kyc.count_documents({})
        pending_kyc = db.kyc.count_documents({'status': 'Pending'})
        total_queries = db.queries.count_documents({})
        new_queries = db.queries.count_documents({'status': 'New'})
        
        # Get recent activity (limit to 5 each)
        recent_kyc = list(db.kyc.find().sort('created_at', -1).limit(5))
        recent_queries = list(db.queries.find().sort('created_at', -1).limit(5))
        
        # Convert ObjectId to string for JSON serialization
        for kyc in recent_kyc:
            kyc['_id'] = str(kyc['_id'])
            if 'created_at' in kyc:
                kyc['created_at'] = kyc['created_at'].isoformat()
            if 'updated_at' in kyc:
                kyc['updated_at'] = kyc['updated_at'].isoformat()
        
        for query in recent_queries:
            query['_id'] = str(query['_id'])
            if 'created_at' in query:
                query['created_at'] = query['created_at'].isoformat()
            if 'updated_at' in query:
                query['updated_at'] = query['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'total_kyc': total_kyc,
                'pending_kyc': pending_kyc,
                'total_queries': total_queries,
                'new_queries': new_queries
            },
            'recent_kyc': recent_kyc,
            'recent_queries': recent_queries
        }), 200
        
    except Exception as e:
        print(f"Error in admin_dashboard: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to get dashboard data: {str(e)}'
        }), 500

@admin_bp.route('/kyc/pending', methods=['GET'])
@admin_required
def get_pending_kyc():
    """Get all pending KYC submissions"""
    try:
        pending_kyc = KYC.get_all_pending()
        
        # Convert to list of dictionaries
        kyc_list = []
        for kyc in pending_kyc:
            kyc_dict = kyc.to_dict()
            kyc_dict['_id'] = str(kyc._id)
            if hasattr(kyc, 'created_at') and kyc.created_at:
                kyc_dict['created_at'] = kyc.created_at.isoformat()
            if hasattr(kyc, 'updated_at') and kyc.updated_at:
                kyc_dict['updated_at'] = kyc.updated_at.isoformat()
            kyc_list.append(kyc_dict)
        
        return jsonify({
            'success': True,
            'kyc_list': kyc_list,
            'count': len(kyc_list)
        }), 200
        
    except Exception as e:
        print(f"Error in get_pending_kyc: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to get pending KYC: {str(e)}'
        }), 500

@admin_bp.route('/kyc/<kyc_id>/approve', methods=['PUT'])
@admin_required
def approve_kyc(kyc_id):
    """Approve KYC submission"""
    try:
        data = request.get_json()
        admin_notes = data.get('admin_notes', '')
        
        # Get KYC record
        kyc = KYC.get_by_id(kyc_id)
        if not kyc:
            return jsonify({
                'success': False,
                'error': 'KYC record not found'
            }), 404
        
        # Update KYC status to Verified
        kyc.update_status('Verified', admin_notes)
        
        # Update user's KYC verification status
        user = User.get_by_id(kyc.user_id)
        if user:
            user.update_kyc_id(str(kyc._id))
            user.update_kyc_verification(True)  # Set KYC as verified
        
        return jsonify({
            'success': True,
            'message': 'KYC approved successfully'
        }), 200
        
    except Exception as e:
        print(f"Error in approve_kyc: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to approve KYC: {str(e)}'
        }), 500

@admin_bp.route('/kyc/<kyc_id>/reject', methods=['PUT'])
@admin_required
def reject_kyc(kyc_id):
    """Reject KYC submission"""
    try:
        data = request.get_json()
        admin_notes = data.get('admin_notes', '')
        
        # Get KYC record
        kyc = KYC.get_by_id(kyc_id)
        if not kyc:
            return jsonify({
                'success': False,
                'error': 'KYC record not found'
            }), 404
        
        # Update KYC status to Rejected
        kyc.update_status('Rejected', admin_notes)
        
        return jsonify({
            'success': True,
            'message': 'KYC rejected successfully'
        }), 200
        
    except Exception as e:
        print(f"Error in reject_kyc: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to reject KYC: {str(e)}'
        }), 500

@admin_bp.route('/queries', methods=['GET'])
@admin_required
def get_all_queries():
    """Get all contact queries"""
    try:
        queries = list(db.queries.find().sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for query in queries:
            query['_id'] = str(query['_id'])
            if 'created_at' in query and query['created_at']:
                query['created_at'] = query['created_at'].isoformat()
            if 'updated_at' in query and query['updated_at']:
                query['updated_at'] = query['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'queries': queries,
            'count': len(queries)
        }), 200
        
    except Exception as e:
        print(f"Error in get_all_queries: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to get queries: {str(e)}'
        }), 500

@admin_bp.route('/queries/<query_id>/update', methods=['PUT'])
@admin_required
def update_query(query_id):
    """Update query status and admin notes"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        admin_notes = data.get('admin_notes', '')
        
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        # Update query
        result = db.queries.update_one(
            {'_id': ObjectId(query_id)},
            {
                '$set': {
                    'status': new_status,
                    'admin_notes': admin_notes,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Query updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Query not found'
            }), 404
            
    except Exception as e:
        print(f"Error in update_query: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to update query: {str(e)}'
        }), 500
