#!/usr/bin/env python3
"""
Script to update pending KYC records to verified status
Run this script to update existing KYC submissions that are still pending
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from datetime import datetime

def update_pending_kyc():
    """Update all pending KYC records to verified status"""
    app = create_app()
    
    with app.app_context():
        try:
            # Find all pending KYC records
            pending_kyc = list(db.kyc.find({'status': 'pending'}))
            
            if not pending_kyc:
                print("✅ No pending KYC records found")
                return
            
            print(f"📋 Found {len(pending_kyc)} pending KYC records")
            
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
            
            print(f"✅ Successfully updated {result.modified_count} pending KYC records to verified")
            
            # Show details of updated records
            for kyc in pending_kyc:
                print(f"   - User ID: {kyc.get('user_id')}")
                print(f"     Name: {kyc.get('name', 'N/A')}")
                print(f"     Aadhaar: {kyc.get('aadhar_number', 'N/A')[:4]}****{kyc.get('aadhar_number', 'N/A')[-4:] if kyc.get('aadhar_number') else 'N/A'}")
                print(f"     Status: pending → verified")
                print()
                
        except Exception as e:
            print(f"❌ Error updating KYC records: {e}")

def verify_specific_user(user_id):
    """Verify KYC for a specific user"""
    app = create_app()
    
    with app.app_context():
        try:
            # Find KYC for the specific user
            kyc = db.kyc.find_one({'user_id': user_id})
            
            if not kyc:
                print(f"❌ KYC not found for user ID: {user_id}")
                return
            
            print(f"📋 Found KYC for user ID: {user_id}")
            print(f"   Name: {kyc.get('name', 'N/A')}")
            print(f"   Current Status: {kyc.get('status', 'N/A')}")
            
            if kyc.get('status') == 'verified':
                print("✅ KYC is already verified")
                return
            
            # Update KYC status to verified
            result = db.kyc.update_one(
                {'user_id': user_id},
                {
                    '$set': {
                        'status': 'verified',
                        'verification_method': 'manual_admin',
                        'verification_notes': f'KYC verified manually by admin for user: {user_id}',
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"✅ Successfully verified KYC for user ID: {user_id}")
            else:
                print(f"❌ Failed to update KYC status for user ID: {user_id}")
                
        except Exception as e:
            print(f"❌ Error verifying user KYC: {e}")

def show_all_kyc():
    """Show all KYC records"""
    app = create_app()
    
    with app.app_context():
        try:
            all_kyc = list(db.kyc.find({}).sort('created_at', -1))
            
            if not all_kyc:
                print("📋 No KYC records found")
                return
            
            print(f"📋 Found {len(all_kyc)} KYC records:")
            print("-" * 80)
            
            for kyc in all_kyc:
                print(f"User ID: {kyc.get('user_id')}")
                print(f"Name: {kyc.get('name', 'N/A')}")
                print(f"Aadhaar: {kyc.get('aadhar_number', 'N/A')[:4]}****{kyc.get('aadhar_number', 'N/A')[-4:] if kyc.get('aadhar_number') else 'N/A'}")
                print(f"Status: {kyc.get('status', 'N/A')}")
                print(f"Method: {kyc.get('verification_method', 'N/A')}")
                print(f"Submitted: {kyc.get('created_at', 'N/A')}")
                print("-" * 80)
                
        except Exception as e:
            print(f"❌ Error showing KYC records: {e}")

if __name__ == "__main__":
    print("🔧 KYC Status Update Tool")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "update-all":
            print("🔄 Updating all pending KYC records...")
            update_pending_kyc()
        elif command == "verify-user" and len(sys.argv) > 2:
            user_id = sys.argv[2]
            print(f"🔄 Verifying KYC for user ID: {user_id}")
            verify_specific_user(user_id)
        elif command == "show-all":
            print("📋 Showing all KYC records...")
            show_all_kyc()
        else:
            print("❌ Invalid command")
            print("Usage:")
            print("  python update_kyc_status.py update-all     # Update all pending KYC")
            print("  python update_kyc_status.py verify-user <user_id>  # Verify specific user")
            print("  python update_kyc_status.py show-all       # Show all KYC records")
    else:
        print("❌ No command specified")
        print("Usage:")
        print("  python update_kyc_status.py update-all     # Update all pending KYC")
        print("  python update_kyc_status.py verify-user <user_id>  # Verify specific user")
        print("  python update_kyc_status.py show-all       # Show all KYC records")
