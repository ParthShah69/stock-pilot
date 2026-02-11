import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

    try {
      const response = await login(formData.email, formData.password, rememberMe);
      
      // Extract user from response
      const user = response.user;
      
      console.log('✅ Login successful, user data:', user);
      console.log('✅ Is admin:', user.is_admin);
      console.log('✅ Redirecting to:', user.is_admin ? '/admin' : '/dashboard');
      
      // Redirect based on user type
      if (user.is_admin) {
        navigate('/admin');  // Admin goes directly to admin panel
      } else {
        navigate('/dashboard');  // Regular users go to dashboard
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-4 col-md-6 col-sm-8">
          <div className="card shadow-lg animate-on-scroll">
            <div className="card-header text-center py-4 bg-primary">
              <h2 className="text-white mb-0">
                <i className="fas fa-rocket me-2"></i>
                Stock Pilot
              </h2>
              <p className="text-white-50 mb-0">Welcome back! Please sign in to your account.</p>
            </div>
            
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    <i className="fas fa-envelope me-2"></i>Email Address
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
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <i className="fas fa-lock me-2"></i>Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                  />
                </div>

                <div className="mb-3 form-check">
                  <input type="checkbox" className="form-check-input" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <label className="form-check-label" htmlFor="remember">
                    Remember me
                  </label>
                </div>

                <div className="d-grid mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary text-decoration-none">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-4 animate-on-scroll">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="mb-2">🇮🇳 Made in India</h5>
                <p className="mb-0 small">
                  Empowering Indian investors with world-class technology and local expertise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
