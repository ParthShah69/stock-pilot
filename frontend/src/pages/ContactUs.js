import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ContactUs = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [phoneError, setPhoneError] = useState('');

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
    // Fetch user data and KYC data to auto-fill form
    if (user) {
      fetchUserAndKycData();
    }
  }, [user]);

  const fetchUserAndKycData = async () => {
    try {
      // Get user data from auth context
      if (user) {
        setUserData(user);
      }

      // Try to get KYC data
      try {
        const kycResponse = await axios.get('/api/kyc/details');
        setKycData(kycResponse.data);
      } catch (error) {
        // KYC not found, which is fine
        console.log('No KYC data found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Auto-fill form fields if user/KYC data is available
    if (userData || kycData) {
      const newFormData = { ...formData };
      
      // Priority: KYC data > User data > Empty
      if (kycData?.fullName) {
        newFormData.name = kycData.fullName;
      } else if (userData?.name) {
        newFormData.name = userData.name;
      }
      
      if (userData?.email) {
        newFormData.email = userData.email;
      }
      
      if (kycData?.phoneNumber) {
        newFormData.phone = kycData.phoneNumber;
      } else if (userData?.phone) {
        newFormData.phone = userData.phone;
      }
      
      setFormData(newFormData);
    }
  }, [userData, kycData]);

  const validateIndianPhone = (phone) => {
    if (!phone) return ''; 
    const phoneClean = phone.replace(/\D/g, '');
    
    // Indian phone number patterns
    if (phoneClean.length === 10) {
      return ''; 
    } else if (phoneClean.length === 11 && phoneClean.startsWith('0')) {
      return ''; 
    } else if (phoneClean.length === 12 && phoneClean.startsWith('91')) {
      return ''; 
    } else if (phoneClean.length === 13 && phoneClean.startsWith('91')) {
      return ''; 
    }
    
    return 'Please enter a valid Indian phone number (10 digits, or with country code)';
  };

  const formatPhoneNumber = (phone) => {
    
    const phoneClean = phone.replace(/\D/g, '');
    
    if (phoneClean.length === 10) {
      
      return phoneClean.replace(/(\d{5})(\d{5})/, '$1 $2');
    } else if (phoneClean.length === 11 && phoneClean.startsWith('0')) {
      
      return phoneClean.replace(/(\d{1})(\d{5})(\d{5})/, '$1 $2 $3');
    } else if (phoneClean.length === 12 && phoneClean.startsWith('91')) {
      
      return `+${phoneClean.replace(/(\d{2})(\d{5})(\d{5})/, '$1 $2 $3')}`;
    } else if (phoneClean.length === 13 && phoneClean.startsWith('91')) {
      
      return `+${phoneClean.replace(/(\d{2})(\d{5})(\d{5})/, '$1 $2 $3')}`;
    }

    return phone;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Validate phone number in real-time
      const phoneError = validateIndianPhone(value);
      setPhoneError(phoneError);
      
      // Format phone number as user types
      const formattedPhone = formatPhoneNumber(value);
      setFormData({
        ...formData,
        [name]: formattedPhone
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Final validation before submission
    if (formData.phone && validateIndianPhone(formData.phone)) {
      setError('Please enter a valid Indian phone number');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/contact/submit', formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setPhoneError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header Section */}
          <div className="text-center mb-5 animate-on-scroll">
            <h1 className="display-4 fw-bold text-primary mb-3">📞 Contact Us</h1>
            <p className="lead text-muted">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="row">
            {/* Contact Information */}
            <div className="col-lg-4 mb-4 animate-on-scroll">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5 className="card-title text-primary mb-4">📍 Get in Touch</h5>
                  
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary text-white rounded-circle p-2 me-3">
                        <i className="fas fa-map-marker-alt"></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Address</h6>
                        <p className="text-muted mb-0">Ahmedabad, Gujarat, India</p>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary text-white rounded-circle p-2 me-3">
                        <i className="fas fa-phone"></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Phone</h6>
                        <p className="text-muted mb-0">+91 98765 43210</p>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary text-white rounded-circle p-2 me-3">
                        <i className="fas fa-envelope"></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Email</h6>
                        <p className="text-muted mb-0">info@stockpilot.in</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h6 className="text-primary mb-3">🇮🇳 Made in India</h6>
                    <p className="small text-muted">
                      Proudly serving Indian investors with world-class technology and local expertise.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-8 animate-on-scroll">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">📝 Send us a Message</h5>
                </div>
                <div className="card-body">
                  {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                      <i className="fas fa-check-circle me-2"></i>
                      Thank you for your message! We'll get back to you soon.
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
                        {(userData?.name || kycData?.fullName) && (
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Pre-filled from your profile
                          </small>
                        )}
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                          <i className="fas fa-envelope me-2"></i>Email Address *
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="Enter your email"
                        />
                        {userData?.email && (
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Pre-filled from your profile
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="phone" className="form-label">
                          <i className="fas fa-phone me-2"></i>Phone Number (India Only)
                        </label>
                        <input
                          type="tel"
                          className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g., 98765 43210 or +91 98765 43210"
                          maxLength="15"
                        />
                        {phoneError && (
                          <div className="invalid-feedback">
                            {phoneError}
                          </div>
                        )}
                        {!phoneError && formData.phone && (
                          <small className="text-success">
                            <i className="fas fa-check-circle me-1"></i>
                            Valid Indian phone number
                          </small>
                        )}
                        {(userData?.phone || kycData?.phoneNumber) && (
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Pre-filled from your profile
                          </small>
                        )}
                        <small className="text-muted d-block mt-1">
                          <i className="fas fa-info-circle me-1"></i>
                          Accepts: 9876543210, 09876543210, +919876543210, 919876543210
                        </small>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="subject" className="form-label">
                          <i className="fas fa-tag me-2"></i>Subject *
                        </label>
                        <select
                          className="form-select"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select a subject</option>
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Account Issues">Account Issues</option>
                          <option value="Investment Advice">Investment Advice</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="message" className="form-label">
                        <i className="fas fa-comment me-2"></i>Message *
                      </label>
                      <textarea
                        className="form-control"
                        id="message"
                        name="message"
                        rows="5"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Tell us how we can help you..."
                      ></textarea>
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
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="row mt-5">
            <div className="col-12 animate-on-scroll">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h5 className="text-primary mb-3">🕒 Business Hours</h5>
                  <div className="row">
                    <div className="col-md-4">
                      <h6>Monday - Friday</h6>
                      <p className="text-muted">9:00 AM - 6:00 PM IST</p>
                    </div>
                    <div className="col-md-4">
                      <h6>Saturday</h6>
                      <p className="text-muted">9:00 AM - 2:00 PM IST</p>
                    </div>
                    <div className="col-md-4">
                      <h6>Sunday</h6>
                      <p className="text-muted">Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
