import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShinyText from '../components/ShinyText';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Send login request to the backend
      const res = await fetch('http://localhost:8000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          // Store token in localStorage
          localStorage.setItem('admin_token', data.token);
          // Redirect to the dashboard
          navigate('/admin');
        } else {
          setError('Invalid credentials');
        }
      } else {
        setError('Incorrect administrator password');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    }
  };

  return (
    <div className="admin-login-page page-enter">
      <div className="admin-login-container glass-card">
        <header className="admin-login-header">
          <ShinyText text="System Override" speed={3} color="#f43f5e" shineColor="#ffffff" direction="right" />
          <h1>Admin Access</h1>
          <p>Please authenticate to access site analytics.</p>
        </header>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <input
              type="password"
              placeholder="Enter master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Authenticate
          </button>
        </form>
        
        <button className="btn btn-secondary back-home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
