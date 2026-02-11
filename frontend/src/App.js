import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Market from './pages/Market';
import KYC from './pages/KYC';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import PrivateRoute from './components/PrivateRoute';
import Profile from './pages/Profile';
import StockAnalysis from './pages/StockAnalysis';
import AdminPanel from './pages/AdminPanel';
import './App.css';

// Loading component
const LoadingSpinner = () => (
  <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div className="text-center">
      <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted">Loading Stock Pilot...</p>
    </div>
  </div>
);

// Main app content
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      {user && <Navbar />}
      <main className={`main-content ${user ? 'with-navbar' : ''}`}>
        <Routes>
          <Route path="/login" element={
            user ? (
              user.is_admin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />
            ) : (
              <Login />
            )
          } />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
          <Route path="/market" element={<PrivateRoute><Market /></PrivateRoute>} />
          <Route path="/kyc" element={<PrivateRoute><KYC /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/stock/:symbol" element={<PrivateRoute><StockAnalysis /></PrivateRoute>} />
          <Route path="/stock-analysis/:symbol" element={<StockAnalysis />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
          <Route path="/" element={
            user ? (
              user.is_admin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
