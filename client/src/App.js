import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchase from './pages/Purchase';
import Stock from './pages/Stock';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Expenses from './pages/Expenses';
import Collections from './pages/Collections';
import CustomerLedger from './pages/CustomerLedger';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AccessDenied from './pages/AccessDenied';

const API = axios.create({
  baseURL: '/api'
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isConfigured, setIsConfigured] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await API.get('/auth/check-setup');
        setIsConfigured(res.data.isConfigured);

        const token = localStorage.getItem('token');
        if (token) {
          try {
            const userRes = await API.get('/auth/me');
            setUser(userRes.data);
          } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking setup:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSetup();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const res = await API.post('/auth/login', credentials);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleSetup = async (setupData) => {
    try {
      const res = await API.post('/auth/setup', setupData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsConfigured(true);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const ProtectedRoute = ({ roles, children }) => {
    if (!user) return <Navigate to="/" />;
    if (roles && !roles.includes(user.role)) {
      return <AccessDenied user={user} onLogout={handleLogout} />;
    }
    return children;
  };

  return (
    <Router>
      {!user ? (
        isConfigured ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Setup onSetup={handleSetup} />
        )
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} />} />
          <Route path="/sales" element={<ProtectedRoute roles={['ADMIN', 'SALES_USER']}><Sales user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/purchase" element={<ProtectedRoute roles={['ADMIN']}><Purchase user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute roles={['ADMIN']}><Stock user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['ADMIN']}><Reports user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute roles={['ADMIN', 'SALES_USER']}><Customers user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute roles={['ADMIN']}><Suppliers user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute roles={['ADMIN']}><Expenses user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/collections" element={<ProtectedRoute roles={['ADMIN', 'SALES_USER']}><Collections user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/customer/:id/ledger" element={<ProtectedRoute roles={['ADMIN', 'SALES_USER']}><CustomerLedger user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><Users user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><Settings user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/access-denied" element={<AccessDenied user={user} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;

export { API };
