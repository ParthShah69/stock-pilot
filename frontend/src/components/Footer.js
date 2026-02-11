import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-6 mb-4">
            <h5>🚀 Stock Pilot</h5>
            <p>
              Empowering Indian investors with cutting-edge AI-driven stock analysis, 
              real-time market insights, and comprehensive portfolio management tools. 
              Your trusted partner in the world of investments.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="https://facebook.com/stockpilot" target="_blank" rel="noopener noreferrer" className="text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com/stockpilot" target="_blank" rel="noopener noreferrer" className="text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://linkedin.com/company/stockpilot" target="_blank" rel="noopener noreferrer" className="text-white">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="https://instagram.com/stockpilot" target="_blank" rel="noopener noreferrer" className="text-white">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-6 mb-4">
            <h5>📊 Services</h5>
            <ul className="footer-links">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/portfolio">Portfolio</Link></li>
              <li><Link to="/market">Market</Link></li>
              <li><Link to="/kyc">KYC</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-2 col-md-6 mb-4">
            <h5>🔗 Quick Links</h5>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
          
          <div className="col-lg-4 col-md-6 mb-4">
            <h5>📞 Contact Info</h5>
            <div className="mb-3">
              <p><i className="fas fa-map-marker-alt me-2"></i> Ahmedabad, Gujarat, India</p>
              <p><i className="fas fa-phone me-2"></i> +91 98765 43210</p>
              <p><i className="fas fa-envelope me-2"></i> info@stockpilot.in</p>
            </div>
            <div className="mt-3">
              <h6>🇮🇳 Made in India</h6>
              <p className="small">Proudly serving Indian investors with world-class technology</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="row">
            <div className="col-md-6">
              <p>&copy; 2025 Stock Pilot. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p>SEBI Registration No: INZ000123456 | NSE Member ID: 12345</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
