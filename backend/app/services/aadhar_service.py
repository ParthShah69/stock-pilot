import cv2
import pytesseract
import re
from PIL import Image
import numpy as np
from datetime import datetime

class AadharService:
    def __init__(self):
        # Configure pytesseract path for Windows
        try:
            pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        except:
            pass  # Use default path for other OS
    
    def extract_aadhar_data(self, image_path):
        """
        Extract Aadhar card data from image using OCR
        Returns: Dictionary with extracted data or None if validation fails
        """
        try:
            # Read and preprocess image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Could not read image file")
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply preprocessing
            processed_image = self._preprocess_image(gray)
            
            # Extract text using OCR
            text = pytesseract.image_to_string(processed_image, lang='eng')
            
            # Save extracted text for debugging (optional)
            with open('extracted_text.txt', 'w') as file:
                file.write(text)
            
            # Parse extracted text
            aadhar_data = self._parse_aadhar_text(text)
            
            # Validate extracted data
            if self._validate_aadhar_data(aadhar_data):
                return aadhar_data
            else:
                return None
                
        except Exception as e:
            print(f"Error processing Aadhar card: {str(e)}")
            return None
    
    def _preprocess_image(self, gray_image):
        """Preprocess image for better OCR results"""
        # Apply thresholding for better OCR results (from project_old)
        _, thresh = cv2.threshold(gray_image, 150, 255, cv2.THRESH_BINARY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(thresh, (5, 5), 0)
        
        # Apply morphological operations to clean up
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(blurred, cv2.MORPH_CLOSE, kernel)
        
        return cleaned
    
    def _parse_aadhar_text(self, text):
        """Parse OCR text to extract Aadhar card information (improved from project_old)"""
        lines = text.split('\n')
        
        aadhar_data = {
            'aadhar_number': None,
            'name': None,
            'date_of_birth': None,
            'gender': None,
            'address': []
        }
        
        address_started = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Extract Name (improved pattern matching)
            if line.startswith("Name :") or line.startswith("Name:"):
                name = line.split(":", 1)[1].strip()
                aadhar_data['name'] = name
            
            # Extract D.O.B.
            elif line.startswith("D.O.B :") or line.startswith("D.O.B:"):
                dob = line.split(":", 1)[1].strip()
                aadhar_data['date_of_birth'] = dob
            
            # Extract Gender
            elif line.startswith("Sex :") or line.startswith("Sex:"):
                gender = line.split(":", 1)[1].strip()
                aadhar_data['gender'] = gender
            
            # Extract Address (improved address capture)
            elif "address" in line.lower() or address_started:
                if "address" in line.lower() and not address_started:
                    address_started = True
                    cleaned_line = line.split(":", 1)[1].strip() if ":" in line else line.strip()
                    if cleaned_line:
                        aadhar_data['address'].append(cleaned_line)
                elif address_started and line.strip():
                    aadhar_data['address'].append(line.strip())
                elif address_started and not line.strip():
                    address_started = False
            
            # Extract Aadhaar number (12 digits, with or without spaces)
            aadhaar_pattern = re.compile(r'\b\d{4}\s?\d{4}\s?\d{4}\b')
            match = aadhaar_pattern.search(line)
            if match and not aadhar_data['aadhar_number']:
                aadhar_data['aadhar_number'] = match.group(0).replace(" ", "")
        
        # Clean up address and improve parsing
        full_address = " ".join(aadhar_data['address'])
        
        # Try to extract city, state, pincode from address
        address_parts = full_address.split(',')
        if len(address_parts) >= 3:
            # Look for pincode pattern (6 digits) in the last few parts
            for i in range(len(address_parts) - 1, max(0, len(address_parts) - 4), -1):
                part = address_parts[i].strip()
                if re.match(r'\d{6}', part):
                    # Found pincode, extract state and city
                    if i >= 2:
                        aadhar_data['state'] = address_parts[i-1].strip()
                        aadhar_data['city'] = address_parts[i-2].strip()
                    elif i >= 1:
                        aadhar_data['state'] = address_parts[i-1].strip()
                    break
        
        aadhar_data['address'] = full_address
        
        return aadhar_data
    
    def _validate_aadhar_data(self, data):
        """Validate extracted Aadhar data"""
        if not data:
            return False
        
        # Check if Aadhar number is valid (12 digits)
        if not data.get('aadhar_number') or len(data['aadhar_number']) != 12:
            return False
        
        # Check if name is present
        if not data.get('name') or data['name'] == "Not found":
            return False
        
        # Check if date of birth is present and valid
        if not data.get('date_of_birth') or data['date_of_birth'] == "Not found":
            return False
        
        try:
            datetime.strptime(data['date_of_birth'], '%d/%m/%Y')
        except ValueError:
            return False
        
        # Check if gender is present
        if not data.get('gender') or data['gender'] == "Not found":
            return False
        
        return True
    
    def verify_aadhar_format(self, image_path):
        """
        Verify if the uploaded image is a valid Aadhar card format
        Returns: True if valid format, False otherwise
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return False
            
            # Check image dimensions (Aadhar cards are typically rectangular)
            height, width = image.shape[:2]
            aspect_ratio = width / height
            
            # Aadhar cards typically have aspect ratio between 1.5 and 2.0
            if aspect_ratio < 1.5 or aspect_ratio > 2.0:
                return False
            
            # Check if image contains text (basic OCR check)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            text = pytesseract.image_to_string(gray, lang='eng')
            
            # Check if text contains Aadhar-related keywords
            aadhar_keywords = ['aadhar', 'uidai', 'government', 'india', 'unique']
            text_lower = text.lower()
            
            keyword_count = sum(1 for keyword in aadhar_keywords if keyword in text_lower)
            
            return keyword_count >= 2  # At least 2 keywords should be present
            
        except Exception as e:
            print(f"Error verifying Aadhar format: {str(e)}")
            return False
