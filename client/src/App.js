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

const API = axios.create({
  baseURL: '/api'
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

        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error checking setup:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSetup();
  }, []);

  const handleLogin = async (pin) => {
    try {
      const res = await API.post('/auth/login', { pin });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleSetup = async (pin, businessName) => {
    try {
      const res = await API.post('/auth/setup', { pin, business_name: businessName });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsConfigured(true);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
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
          <Route path="/sales" element={<Sales user={user} onLogout={handleLogout} />} />
          <Route path="/purchase" element={<Purchase user={user} onLogout={handleLogout} />} />
          <Route path="/stock" element={<Stock user={user} onLogout={handleLogout} />} />
          <Route path="/reports" element={<Reports user={user} onLogout={handleLogout} />} />
          <Route path="/customers" element={<Customers user={user} onLogout={handleLogout} />} />
          <Route path="/suppliers" element={<Suppliers user={user} onLogout={handleLogout} />} />
          <Route path="/expenses" element={<Expenses user={user} onLogout={handleLogout} />} />
          <Route path="/collections" element={<Collections user={user} onLogout={handleLogout} />} />
          <Route path="/customer/:id/ledger" element={<CustomerLedger user={user} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;

export { API };
