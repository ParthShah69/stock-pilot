import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  if (!user) return null;

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          🚀 Stock Pilot
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {!user.is_admin ? (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                    📊 Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/portfolio')}`} to="/portfolio">
                    💼 Portfolio
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/market')}`} to="/market">
                    📈 Market
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/kyc')}`} to="/kyc">
                    🆔 KYC
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/admin')}`} to="/admin">
                  ⚙️ Admin Panel
                </Link>
              </li>
            )}
          </ul>
          
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown"
              >
                👤 {user.name || user.email}
              </a>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
