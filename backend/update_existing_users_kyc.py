#!/usr/bin/env python3
"""
Migration script to update existing users with KYC verification status
This script will:
1. Add kyc_verified field to existing users
2. Update kyc_verified status based on existing KYC records
"""

from app import create_app, db
from app.models.user import User
from app.models.kyc import KYC
from bson import ObjectId

def migrate_users_kyc():
    """Migrate existing users to include KYC verification status"""
    app = create_app()
    
    with app.app_context():
        try:
            print("Starting KYC migration for existing users...")
            
            # Get all users
            users = list(db.users.find({}))
            print(f"Found {len(users)} users to migrate")
            
            updated_count = 0
            
            for user_data in users:
                user_id = user_data['_id']
                email = user_data.get('email', '')
                
                # Check if user already has kyc_verified field
                if 'kyc_verified' in user_data:
                    print(f"User {email} already has kyc_verified field, skipping...")
                    continue
                
                # Check if user has KYC record
                kyc_record = db.kyc.find_one({'user_id': str(user_id)})
                
                # Set kyc_verified based on KYC status
                kyc_verified = False
                if kyc_record:
                    kyc_status = kyc_record.get('status', 'pending')
                    kyc_verified = (kyc_status == 'Verified')
                    print(f"User {email}: KYC status = {kyc_status}, kyc_verified = {kyc_verified}")
                else:
                    print(f"User {email}: No KYC record found, kyc_verified = False")
                
                # Update user with kyc_verified field
                result = db.users.update_one(
                    {'_id': user_id},
                    {'$set': {'kyc_verified': kyc_verified}}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"✓ Updated user {email} with kyc_verified = {kyc_verified}")
                else:
                    print(f"⚠ No changes needed for user {email}")
            
            print(f"\nMigration completed! Updated {updated_count} users.")
            
            # Verify migration
            print("\nVerifying migration...")
            users_with_kyc_verified = db.users.count_documents({'kyc_verified': {'$exists': True}})
            total_users = db.users.count_documents({})
            print(f"Users with kyc_verified field: {users_with_kyc_verified}/{total_users}")
            
            if users_with_kyc_verified == total_users:
                print("✅ All users have been migrated successfully!")
            else:
                print("⚠ Some users may not have been migrated properly.")
                
        except Exception as e:
            print(f"Error during migration: {e}")
            raise

if __name__ == "__main__":
    migrate_users_kyc()
