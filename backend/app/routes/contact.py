from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
import re

contact_bp = Blueprint('contact', __name__)

def validate_indian_phone(phone):
    """Validate Indian phone number format"""
    if not phone:
        return True  # Phone is optional
    
    # Remove all non-digit characters
    phone_clean = re.sub(r'\D', '', phone)
    
    # Indian phone number patterns:
    # 1. 10 digits (without country code)
    # 2. 11 digits starting with 0 (without country code)
    # 3. 12 digits starting with 91 (with country code)
    # 4. 13 digits starting with +91 (with country code and +)
    
    if len(phone_clean) == 10:
        # 10 digits - standard Indian mobile number
        return True
    elif len(phone_clean) == 11 and phone_clean.startswith('0'):
        # 11 digits starting with 0
        return True
    elif len(phone_clean) == 12 and phone_clean.startswith('91'):
        # 12 digits starting with 91
        return True
    elif len(phone_clean) == 13 and phone_clean.startswith('91'):
        # 13 digits starting with +91 (after removing +)
        return True
    
    return False

@contact_bp.route('/submit', methods=['POST'])
def submit_contact():
    """Submit contact form and store in MongoDB"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate phone number if provided
        phone = data.get('phone', '')
        if phone and not validate_indian_phone(phone):
            return jsonify({'error': 'Please enter a valid Indian phone number'}), 400
        
        # Create contact query document
        contact_query = {
            'name': data['name'],
            'email': data['email'],
            'phone': phone,
            'subject': data['subject'],
            'message': data['message'],
            'status': 'New',  # New, Read, Resolved
            'admin_notes': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = db.queries.insert_one(contact_query)
        
        if result.inserted_id:
            return jsonify({
                'message': 'Contact form submitted successfully',
                'query_id': str(result.inserted_id)
            }), 201
        else:
            return jsonify({'error': 'Failed to submit contact form'}), 500
            
    except Exception as e:
        print(f"Error in submit_contact: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@contact_bp.route('/queries', methods=['GET'])
def get_queries():
    """Get all contact queries (admin only)"""
    try:
        queries = list(db.queries.find().sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for query in queries:
            query['_id'] = str(query['_id'])
            query['created_at'] = query['created_at'].isoformat()
            query['updated_at'] = query['updated_at'].isoformat()
        
        return jsonify({
            'queries': queries,
            'count': len(queries)
        }), 200
        
    except Exception as e:
        print(f"Error in get_queries: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@contact_bp.route('/queries/<query_id>/status', methods=['PUT'])
def update_query_status(query_id):
    """Update query status and admin notes (admin only)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        admin_notes = data.get('admin_notes')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        # Update query status and admin notes
        update_data = {
            'status': new_status,
            'updated_at': datetime.utcnow()
        }
        
        if admin_notes is not None:
            update_data['admin_notes'] = admin_notes
        
        result = db.queries.update_one(
            {'_id': query_id},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Query status updated successfully'}), 200
        else:
            return jsonify({'error': 'Query not found'}), 404
            
    except Exception as e:
        print(f"Error in update_query_status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@contact_bp.route('/queries/stats', methods=['GET'])
def get_query_stats():
    """Get query statistics (admin only)"""
    try:
        total_queries = db.queries.count_documents({})
        new_queries = db.queries.count_documents({'status': 'New'})
        read_queries = db.queries.count_documents({'status': 'Read'})
        resolved_queries = db.queries.count_documents({'status': 'Resolved'})
        
        return jsonify({
            'total': total_queries,
            'new': new_queries,
            'read': read_queries,
            'resolved': resolved_queries
        }), 200
        
    except Exception as e:
        print(f"Error in get_query_stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500
