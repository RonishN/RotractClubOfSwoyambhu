import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { checkAdminSession, loginAdmin } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [checking, setChecking]     = useState(true);

  useEffect(() => {
    checkAdminSession()
      .then(() => navigate('/admin'))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err?.message || 'Incorrect email or password. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-bg">
      <div className="login-card" style={{ transition: 'all 0.3s ease' }}>
        
        {/* Subtle top progress bar if checking session or logging in */}
        {(checking || loading) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'rgba(201, 150, 43, 0.1)',
            overflow: 'hidden',
            borderRadius: '24px 24px 0 0'
          }}>
            <div style={{
              width: '40%',
              height: '100%',
              background: 'var(--magenta)',
              borderRadius: '24px',
              animation: 'btn-progress 1s ease-in-out infinite'
            }} />
          </div>
        )}

        <img 
          src={logo} 
          style={{ 
            width: 84, 
            marginBottom: 20,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' 
          }} 
          alt="Logo" 
        />
        
        <h2 className="serif" style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '1.8rem', letterSpacing: '0.5px' }}>
          Swoyambhu C-Panel
        </h2>
        
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500, marginBottom: 28 }}>
          Rotaract Club of Swoyambhu
        </p>

        {checking ? (
          <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span className="admin-spinner" style={{ 
              width: 32, 
              height: 32, 
              borderWidth: '3px',
              borderColor: 'rgba(226, 0, 122, 0.15)',
              borderTopColor: 'var(--magenta)' 
            }} />
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
              Checking active session...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="username"
                  autoComplete="username"
                  placeholder="admin@rotaractswoyambhu.org"
                  required
                  maxLength={320}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    required
                    maxLength={256}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <div 
                    className="eye-icon" 
                    onClick={() => setShowPass(p => !p)} 
                    role="button" 
                    aria-label="Toggle password"
                    style={{ opacity: loading ? 0.4 : 1, pointerEvents: loading ? 'none' : 'auto' }}
                  >
                    {showPass ? (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="extra-options" style={{ marginTop: '2px' }}>
                <label className="remember-me" style={{ fontSize: '0.85rem' }}>
                  <input type="checkbox" id="remember" style={{ width: 'auto', padding: 0 }} /> Remember this device
                </label>
              </div>

              <button 
                type="submit" 
                className="btn login-btn" 
                disabled={loading}
                style={{
                  background: 'var(--magenta)',
                  borderColor: 'var(--magenta)',
                  color: 'white',
                  fontWeight: 700,
                  transition: 'all 0.25s',
                  boxShadow: '0 8px 24px rgba(226, 0, 122, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {loading ? (
                  <>
                    <span className="admin-spinner" style={{ width: 16, height: 16 }} />
                    Authenticating…
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
