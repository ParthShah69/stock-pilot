import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KYC = () => {
  const [aadharImage, setAadharImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [kycStatus, setKycStatus] = useState(null);
  const [kycDetails, setKycDetails] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [processing, setProcessing] = useState(false);

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
    fetchKycStatus();
    fetchKycDetails();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const response = await axios.get('/api/kyc/status');
      setKycStatus(response.data.kyc_status);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const fetchKycDetails = async () => {
    try {
      const response = await axios.get('/api/kyc/details');
      setKycDetails(response.data);
    } catch (error) {
      // KYC details not found, which is fine for new users
      console.log('No KYC details found');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAadharImage(file);
      setExtractedData(null); // Reset extracted data when new file is selected
    }
  };

  const handleExtractData = async () => {
    if (!aadharImage) {
      setError('Please select an Aadhaar card image first');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('aadhar_image', aadharImage);

      const response = await axios.post('/api/kyc/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setExtractedData(response.data.extracted_data);
      setSuccess('Aadhaar card details extracted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extract data from Aadhaar card. Please ensure the image is clear and readable.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!extractedData) {
      setError('Please extract data from Aadhaar card first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('aadhar_image', aadharImage);
      
      // Add extracted data
      Object.keys(extractedData).forEach(key => {
        formData.append(key, extractedData[key]);
      });

      const response = await axios.post('/api/kyc/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ KYC submission response:', response.data);
      console.log('✅ KYC status from response:', response.data.status);
      
      setSuccess('KYC submitted successfully! Your verification will be processed within 24-48 hours.');
      setKycStatus('pending');
      fetchKycDetails();
      fetchKycStatus();  // Also refresh the KYC status
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status?.toLowerCase();
    
    switch (normalizedStatus) {
      case 'verified':
        return <span className="badge bg-success">✅ Verified</span>;
      case 'pending':
        return <span className="badge bg-warning">⏳ Pending</span>;
      case 'rejected':
        return <span className="badge bg-danger">❌ Rejected</span>;
      default:
        return <span className="badge bg-secondary">📝 Not Submitted</span>;
    }
  };

  // Show KYC details if they exist
  if (kycDetails) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Header */}
            <div className="text-center mb-5 animate-on-scroll">
              <h1 className="display-4 fw-bold text-primary mb-3">🆔 KYC Details</h1>
              <p className="lead text-muted">
                Your KYC information and verification status
              </p>
              <div className="mt-3">
                <h5>Status: {getStatusBadge(kycDetails.status)}</h5>
              </div>
            </div>

            {/* KYC Details Card */}
            <div className="animate-on-scroll">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">📋 Submitted KYC Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">👤 Personal Information</h6>
                      <div className="mb-3">
                        <strong>Full Name:</strong> {kycDetails.full_name || 'Not provided'}
                      </div>
                      <div className="mb-3">
                        <strong>Date of Birth:</strong> {kycDetails.date_of_birth || 'Not provided'}
                      </div>
                      <div className="mb-3">
                        <strong>Gender:</strong> {kycDetails.gender || 'Not provided'}
                      </div>
                      <div className="mb-3">
                        <strong>Aadhaar Number:</strong> {kycDetails.aadhar_number || 'Not provided'}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">🏠 Address Information</h6>
                      <div className="mb-3">
                        <strong>Address:</strong> {kycDetails.address || 'Not provided'}
                      </div>
                      <div className="mb-3">
                        <strong>City:</strong> {kycDetails.city || 'Not provided'}
                      </div>
                      <div className="mb-3">
                        <strong>State:</strong> {kycDetails.state || 'Not provided'}
                      </div>
                      <div className="mb-3">
                        <strong>Pincode:</strong> {kycDetails.pincode || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <hr />

                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">📅 Submission Details</h6>
                      <div className="mb-3">
                        <strong>Submitted On:</strong> {kycDetails.submitted_at ? new Date(kycDetails.submitted_at).toLocaleDateString() : 'Not available'}
                      </div>
                      <div className="mb-3">
                        <strong>Last Updated:</strong> {kycDetails.updated_at ? new Date(kycDetails.updated_at).toLocaleDateString() : 'Not available'}
                      </div>
                    </div>
                  </div>

                  {kycDetails.status?.toLowerCase() === 'pending' && (
                    <div className="alert alert-warning" role="alert">
                      <strong>Status:</strong> Your KYC is under review. We'll notify you once the verification is complete.
                    </div>
                  )}
                  
                  {kycDetails.status?.toLowerCase() === 'rejected' && (
                    <div className="alert alert-danger" role="alert">
                      <strong>Status:</strong> Your KYC was rejected. Please contact support for more information.
                    </div>
                  )}
                  
                  {kycDetails.status?.toLowerCase() === 'verified' && (
                    <div className="alert alert-success" role="alert">
                      <strong>Status:</strong> Your KYC has been verified successfully! You can now access all features.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus?.toLowerCase() === 'verified') {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card text-center animate-on-scroll">
              <div className="card-body py-5">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{width: '100px', height: '100px'}}>
                  <i className="fas fa-check fa-3x"></i>
                </div>
                <h2 className="text-success mb-3">🎉 KYC Verified!</h2>
                <p className="lead text-muted mb-4">
                  Your KYC has been successfully verified. You can now access all features of Stock Pilot.
                </p>
                <div className="mb-4">
                  {getStatusBadge(kycStatus)}
                </div>
                <p className="text-muted">
                  Thank you for completing the verification process. Your account is now fully activated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header */}
          <div className="text-center mb-5 animate-on-scroll">
            <h1 className="display-4 fw-bold text-primary mb-3">🆔 KYC Verification</h1>
            <p className="lead text-muted">
              Complete your Know Your Customer (KYC) verification using your Aadhaar card
            </p>
            {kycStatus && (
              <div className="mt-3">
                <h5>Current Status: {getStatusBadge(kycStatus)}</h5>
              </div>
            )}
          </div>

          <div className="row">
            {/* KYC Form */}
            <div className="col-lg-8 animate-on-scroll">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">📋 Aadhaar Card Upload</h5>
                </div>
                <div className="card-body">
                  {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                      <i className="fas fa-check-circle me-2"></i>
                      {success}
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
                    <div className="mb-4">
                      <label htmlFor="aadharImage" className="form-label">
                        <i className="fas fa-image me-2"></i>Upload Aadhaar Card Image *
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        id="aadharImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                      />
                      <small className="text-muted">
                        Upload a clear image of your Aadhaar card. We'll automatically extract your details.
                      </small>
                    </div>

                    {aadharImage && (
                      <div className="mb-4">
                        <button
                          type="button"
                          className="btn btn-info"
                          onClick={handleExtractData}
                          disabled={processing}
                        >
                          {processing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Extracting Data...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-magic me-2"></i>
                              Extract Data from Aadhaar Card
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {extractedData && (
                      <div className="mb-4">
                        <h6 className="text-primary mb-3">📋 Extracted Information</h6>
                        <div className="card bg-light">
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-6">
                                <div className="mb-2">
                                  <strong>Name:</strong> {extractedData.name}
                                </div>
                                <div className="mb-2">
                                  <strong>Date of Birth:</strong> {extractedData.date_of_birth}
                                </div>
                                <div className="mb-2">
                                  <strong>Gender:</strong> {extractedData.gender}
                                </div>
                                <div className="mb-2">
                                  <strong>Aadhaar Number:</strong> {extractedData.aadhar_number}
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="mb-2">
                                  <strong>Address:</strong> {extractedData.address}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading || !extractedData}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Submitting KYC...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Submit KYC
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="col-lg-4 animate-on-scroll">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary mb-4">ℹ️ KYC Information</h5>
                  
                  <div className="mb-4">
                    <h6>📋 What is KYC?</h6>
                    <p className="text-muted">
                      Know Your Customer (KYC) is a mandatory verification process required by SEBI for all investors.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h6>📄 Required Document</h6>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-check text-success me-2"></i>Aadhaar Card</li>
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h6>🤖 Automatic Extraction</h6>
                    <p className="text-muted">
                      We use advanced OCR technology to automatically extract your details from the Aadhaar card image.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h6>⏱️ Processing Time</h6>
                    <p className="text-muted">
                      KYC verification typically takes 24-48 hours after document submission.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h6>🔒 Security</h6>
                    <p className="text-muted">
                      All your documents are encrypted and stored securely as per SEBI guidelines.
                    </p>
                  </div>

                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Note:</strong> Only Aadhaar card is required. We'll extract all necessary information automatically.
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

export default KYC;
