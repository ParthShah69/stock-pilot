import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
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

  return (
    <div className="container mt-5">
      {/* Hero Section */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-10 text-center animate-on-scroll">
          <h1 className="display-3 fw-bold text-primary mb-4">🚀 About Stock Pilot</h1>
          <p className="lead text-muted mb-4">
            Empowering Indian investors with cutting-edge AI technology and comprehensive 
            financial insights to make informed investment decisions.
          </p>
          <div className="d-flex justify-content-center gap-4">
            <div className="text-center">
              <h3 className="text-primary fw-bold">10K+</h3>
              <p className="text-muted">Active Users</p>
            </div>
            <div className="text-center">
              <h3 className="text-primary fw-bold">₹50Cr+</h3>
              <p className="text-muted">Portfolio Value</p>
            </div>
            <div className="text-center">
              <h3 className="text-primary fw-bold">95%</h3>
              <p className="text-muted">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="row mb-5">
        <div className="col-lg-6 mb-4 animate-on-scroll">
          <div className="card h-100">
            <div className="card-body text-center">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                <i className="fas fa-bullseye fa-2x"></i>
              </div>
              <h4 className="card-title text-primary">🎯 Our Mission</h4>
              <p className="card-text">
                To democratize investment knowledge and provide every Indian investor with 
                professional-grade tools and insights, making wealth creation accessible to all.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6 mb-4 animate-on-scroll">
          <div className="card h-100">
            <div className="card-body text-center">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                <i className="fas fa-eye fa-2x"></i>
              </div>
              <h4 className="card-title text-primary">👁️ Our Vision</h4>
              <p className="card-text">
                To become India's most trusted financial technology platform, empowering 
                millions of investors with AI-driven insights and comprehensive portfolio management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="row mb-5">
        <div className="col-12 animate-on-scroll">
          <div className="card">
            <div className="card-body">
              <h3 className="text-primary mb-4">📖 Our Story</h3>
              <div className="row">
                <div className="col-md-6">
                  <p className="mb-3">
                    Founded in 2023 in the heart of Ahmedabad, Stock Pilot was born from a simple 
                    observation: Indian investors needed better tools to navigate the complex world 
                    of stock markets.
                  </p>
                  <p className="mb-3">
                    Our team of financial experts, data scientists, and technology enthusiasts came 
                    together with a shared vision - to create a platform that combines the power of 
                    artificial intelligence with deep market understanding.
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-3">
                    Today, we serve thousands of investors across India, providing them with 
                    real-time market data, AI-powered predictions, and comprehensive portfolio 
                    management tools.
                  </p>
                  <p className="mb-3">
                    We're proud to be a Made-in-India solution, built by Indians, for Indians, 
                    with a deep understanding of the local market dynamics and regulatory environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="row mb-5">
        <div className="col-12 animate-on-scroll">
          <h3 className="text-center text-primary mb-5">💎 Our Core Values</h3>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="fas fa-shield-alt"></i>
              </div>
              <h5 className="card-title">Trust & Security</h5>
              <p className="card-text">
                Your financial data and investments are protected with bank-grade security.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="fas fa-lightbulb"></i>
              </div>
              <h5 className="card-title">Innovation</h5>
              <p className="card-text">
                Continuously evolving with cutting-edge AI and machine learning technologies.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="fas fa-users"></i>
              </div>
              <h5 className="card-title">Customer First</h5>
              <p className="card-text">
                Every feature and decision is made with our users' success in mind.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-4 animate-on-scroll">
          <div className="card text-center h-100">
            <div className="card-body">
              <div className="bg-danger text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="fas fa-heart"></i>
              </div>
              <h5 className="card-title">Made in India</h5>
              <p className="card-text">
                Proudly serving Indian investors with local expertise and global standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="row mb-5">
        <div className="col-12 animate-on-scroll">
          <h3 className="text-center text-primary mb-5">👥 Our Leadership Team</h3>
        </div>
        
        <div className="col-lg-4 col-md-6 mb-4 animate-on-scroll">
          <div className="card text-center">
            <div className="card-body">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '100px', height: '100px'}}>
                <i className="fas fa-user-tie fa-2x"></i>
              </div>
              <h5 className="card-title">Rajesh Kumar</h5>
              <p className="text-muted">CEO & Founder</p>
              <p className="card-text">
                Former VP at HDFC Bank with 15+ years in financial services and technology.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6 mb-4 animate-on-scroll">
          <div className="card text-center">
            <div className="card-body">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '100px', height: '100px'}}>
                <i className="fas fa-user-tie fa-2x"></i>
              </div>
              <h5 className="card-title">Priya Sharma</h5>
              <p className="text-muted">CTO</p>
              <p className="card-text">
                Ex-Google engineer with expertise in AI/ML and financial technology platforms.
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6 mb-4 animate-on-scroll">
          <div className="card text-center">
            <div className="card-body">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '100px', height: '100px'}}>
                <i className="fas fa-user-tie fa-2x"></i>
              </div>
              <h5 className="card-title">Amit Patel</h5>
              <p className="text-muted">Head of Research</p>
              <p className="card-text">
                CFA charterholder with 12+ years in equity research and portfolio management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="row mb-5">
        <div className="col-12 animate-on-scroll">
          <div className="card bg-light">
            <div className="card-body">
              <h3 className="text-primary mb-4">🔬 Our Technology</h3>
              <div className="row">
                <div className="col-md-6">
                  <h5>🤖 AI & Machine Learning</h5>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success me-2"></i>Prophet Time Series Forecasting</li>
                    <li><i className="fas fa-check text-success me-2"></i>Natural Language Processing</li>
                    <li><i className="fas fa-check text-success me-2"></i>Sentiment Analysis</li>
                    <li><i className="fas fa-check text-success me-2"></i>Risk Assessment Models</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>💻 Modern Tech Stack</h5>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success me-2"></i>React.js Frontend</li>
                    <li><i className="fas fa-check text-success me-2"></i>Python Flask Backend</li>
                    <li><i className="fas fa-check text-success me-2"></i>MongoDB Database</li>
                    <li><i className="fas fa-check text-success me-2"></i>AWS Cloud Infrastructure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="row mb-5">
        <div className="col-12 text-center animate-on-scroll">
          <div className="card bg-primary text-white">
            <div className="card-body py-5">
              <h3 className="mb-3">🚀 Ready to Start Your Investment Journey?</h3>
              <p className="mb-4">
                Join thousands of Indian investors who trust Stock Pilot for their financial success.
              </p>
              <Link to="/dashboard" className="btn btn-light btn-lg me-3">
                <i className="fas fa-rocket me-2"></i>Get Started
              </Link>
              <Link to="/contact" className="btn btn-outline-light btn-lg">
                <i className="fas fa-phone me-2"></i>Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="row">
        <div className="col-12 text-center animate-on-scroll">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="text-primary mb-3">🔗 Quick Navigation</h5>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Link to="/" className="btn btn-outline-primary">
                  <i className="fas fa-home me-2"></i>Home Page
                </Link>
                <Link to="/contact" className="btn btn-outline-primary">
                  <i className="fas fa-envelope me-2"></i>Contact Us
                </Link>
                <Link to="/dashboard" className="btn btn-outline-primary">
                  <i className="fas fa-chart-line me-2"></i>Dashboard
                </Link>
                <Link to="/portfolio" className="btn btn-outline-primary">
                  <i className="fas fa-briefcase me-2"></i>Portfolio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
