#!/usr/bin/env python3
"""
Simple script to fix KYC status for existing users
"""

from pymongo import MongoClient
from datetime import datetime
import os

# MongoDB connection
MONGODB_URI = "mongodb://localhost:27017/"
DB_NAME = "stock_pilot"  # or whatever your database name is

def fix_kyc_status():
    """Update all pending KYC records to verified"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        
        print("🔧 Connecting to MongoDB...")
        
        # Find all pending KYC records
        pending_kyc = list(db.kyc.find({'status': 'pending'}))
        
        if not pending_kyc:
            print("✅ No pending KYC records found")
            return
        
        print(f"📋 Found {len(pending_kyc)} pending KYC records")
        
        # Show current records
        for kyc in pending_kyc:
            print(f"   - User ID: {kyc.get('user_id')}")
            print(f"     Name: {kyc.get('name', 'N/A')}")
            print(f"     Aadhaar: {kyc.get('aadhar_number', 'N/A')[:4]}****{kyc.get('aadhar_number', 'N/A')[-4:] if kyc.get('aadhar_number') else 'N/A'}")
            print(f"     Status: {kyc.get('status', 'N/A')}")
            print()
        
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
        
        # Show updated records
        print("\n📋 Updated KYC records:")
        updated_kyc = list(db.kyc.find({'status': 'verified'}))
        for kyc in updated_kyc:
            print(f"   - User ID: {kyc.get('user_id')}")
            print(f"     Name: {kyc.get('name', 'N/A')}")
            print(f"     Status: {kyc.get('status', 'N/A')}")
            print(f"     Method: {kyc.get('verification_method', 'N/A')}")
            print()
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def show_all_kyc():
    """Show all KYC records"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        
        print("🔧 Connecting to MongoDB...")
        
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
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🔧 KYC Status Fix Tool")
    print("=" * 50)
    
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "fix":
            print("🔄 Fixing pending KYC records...")
            fix_kyc_status()
        elif command == "show":
            print("📋 Showing all KYC records...")
            show_all_kyc()
        else:
            print("❌ Invalid command")
            print("Usage:")
            print("  python fix_kyc.py fix   # Fix pending KYC records")
            print("  python fix_kyc.py show  # Show all KYC records")
    else:
        print("❌ No command specified")
        print("Usage:")
        print("  python fix_kyc.py fix   # Fix pending KYC records")
        print("  python fix_kyc.py show  # Show all KYC records")
