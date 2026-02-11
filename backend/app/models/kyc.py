from datetime import datetime
from bson import ObjectId

class KYC:
    def __init__(self, user_id, aadhar_number, name, date_of_birth, gender, address, 
                 photo_path=None, status='Pending', admin_notes=None, verified_at=None):
        self.user_id = user_id
        self.aadhar_number = aadhar_number
        self.name = name
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.address = address
        self.photo_path = photo_path
        self.status = status  # Pending, Rejected, Verified
        self.admin_notes = admin_notes
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.verified_at = verified_at
    
    def to_dict(self):
        """Convert KYC object to dictionary"""
        return {
            'user_id': self.user_id,
            'aadhar_number': self.aadhar_number,
            'name': self.name,
            'date_of_birth': self.date_of_birth,
            'gender': self.gender,
            'address': self.address,
            'photo_path': self.photo_path,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'verified_at': self.verified_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create KYC object from dictionary"""
        kyc = KYC(
            user_id=data['user_id'],
            aadhar_number=data['aadhar_number'],
            name=data['name'],
            date_of_birth=data['date_of_birth'],
            gender=data['gender'],
            address=data['address'],
            photo_path=data.get('photo_path'),
            status=data.get('status', 'Pending'),
            admin_notes=data.get('admin_notes'),
            verified_at=data.get('verified_at')
        )
        kyc.created_at = data.get('created_at', datetime.utcnow())
        kyc.updated_at = data.get('updated_at', datetime.utcnow())
        return kyc
    
    @staticmethod
    def create_kyc(user_id, aadhar_data, photo_path=None):
        """Create a new KYC record"""
        from app import db
        
        # Check if KYC already exists for this user
        existing_kyc = db.kyc.find_one({'user_id': user_id})
        if existing_kyc:
            raise ValueError('KYC already exists for this user')
        
        # Create KYC object
        kyc = KYC(
            user_id=user_id,
            aadhar_number=aadhar_data['aadhar_number'],
            name=aadhar_data['name'],
            date_of_birth=aadhar_data['date_of_birth'],
            gender=aadhar_data['gender'],
            address=aadhar_data['address'],
            photo_path=photo_path,
            status='Pending'  # Always start with Pending
        )
        
        # Save to database
        result = db.kyc.insert_one(kyc.to_dict())
        kyc._id = result.inserted_id
        
        return kyc
    
    @staticmethod
    def get_by_user_id(user_id):
        """Get KYC by user ID"""
        from app import db
        kyc_data = db.kyc.find_one({'user_id': user_id})
        if kyc_data:
            kyc = KYC.from_dict(kyc_data)
            kyc._id = kyc_data['_id']
            return kyc
        return None
    
    @staticmethod
    def get_by_id(kyc_id):
        """Get KYC by ID"""
        from app import db
        kyc_data = db.kyc.find_one({'_id': ObjectId(kyc_id)})
        if kyc_data:
            kyc = KYC.from_dict(kyc_data)
            kyc._id = kyc_data['_id']
            return kyc
        return None
    
    @staticmethod
    def get_all_pending():
        """Get all pending KYC submissions"""
        from app import db
        try:
            kyc_list = []
            cursor = db.kyc.find({'status': 'Pending'}).sort('created_at', -1)
            for kyc_data in cursor:
                try:
                    kyc = KYC.from_dict(kyc_data)
                    kyc._id = kyc_data['_id']
                    kyc_list.append(kyc)
                except Exception as e:
                    print(f"Error processing KYC data: {e}")
                    continue
            
            return kyc_list
        except Exception as e:
            print(f"Error in get_all_pending: {e}")
            return []
    
    def update_status(self, status, admin_notes=None):
        """Update KYC status and admin notes"""
        from app import db
        self.status = status
        self.admin_notes = admin_notes
        self.updated_at = datetime.utcnow()
        
        if status == 'Verified':
            self.verified_at = datetime.utcnow()
        
        db.kyc.update_one(
            {'_id': self._id},
            {'$set': {
                'status': status,
                'admin_notes': admin_notes,
                'updated_at': self.updated_at,
                'verified_at': self.verified_at
            }}
        )
    
    def is_verified(self):
        """Check if KYC is verified"""
        return self.status == 'Verified'
