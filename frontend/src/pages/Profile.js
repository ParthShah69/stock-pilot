import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [kycData, setKycData] = useState(null);

  useEffect(() => {
    // Add animation on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Fetch KYC data to pre-populate missing fields
    fetchKycData();
  }, []);

  const fetchKycData = async () => {
    try {
      const response = await axios.get('/api/kyc/details');
      setKycData(response.data);
      
      // Pre-populate form with KYC data if profile fields are missing
      const updatedFormData = { ...formData };
      let hasChanges = false;
      
      if (!formData.phone && response.data.phone_number) {
        updatedFormData.phone = response.data.phone_number;
        hasChanges = true;
      }
      
      if (!formData.address && response.data.address) {
        updatedFormData.address = response.data.address;
        hasChanges = true;
      }
      
      if (!formData.city && response.data.city) {
        updatedFormData.city = response.data.city;
        hasChanges = true;
      }
      
      if (!formData.state && response.data.state) {
        updatedFormData.state = response.data.state;
        hasChanges = true;
      }
      
      if (!formData.pincode && response.data.pincode) {
        updatedFormData.pincode = response.data.pincode;
        hasChanges = true;
      }
      
      if (hasChanges) {
        setFormData(updatedFormData);
        setSuccess('Form pre-populated with data from your KYC submission.');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      // KYC data not found, which is fine
      console.log('No KYC data found for pre-population');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.put('/api/auth/profile', formData);
      updateUser(response.data.user);
      // Show additional message if KYC sync occurred
      if (response.data.message && response.data.message.includes('KYC')) {
        setSuccess('Profile updated successfully! Address and other fields have been synced with your KYC data.');
      } else {
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="text-center mb-5 animate-on-scroll">
            <h1 className="display-4 fw-bold text-primary mb-3">👤 My Profile</h1>
            <p className="lead text-muted">
              Update your account information
            </p>
          </div>

          {/* Profile Form */}
          <div className="animate-on-scroll">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">📝 Edit Profile Information</h5>
              </div>
              <div className="card-body">
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    Profile updated successfully!
                    <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">
                        <i className="fas fa-user me-2"></i>Full Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">
                        <i className="fas fa-phone me-2"></i>Phone Number
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                      <i className="fas fa-map-marker-alt me-2"></i>Address
                    </label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address"
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="city" className="form-label">
                        <i className="fas fa-city me-2"></i>City
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Enter your city"
                      />
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="state" className="form-label">
                        <i className="fas fa-map me-2"></i>State
                      </label>
                      <select
                        className="form-select"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      >
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Delhi">Delhi</option>
                      </select>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label htmlFor="pincode" className="form-label">
                        <i className="fas fa-map-pin me-2"></i>Pincode
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="Enter pincode"
                        maxLength="6"
                      />
                    </div>
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Updating Profile...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
