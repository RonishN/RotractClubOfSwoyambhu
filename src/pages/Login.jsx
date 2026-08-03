import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { checkAdminSession, loginAdmin } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [checking, setChecking]     = useState(true);
  const [view, setView]             = useState('LOGIN'); // LOGIN, FORGOT, FORCE_CHANGE
  const [resetCode, setResetCode]   = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempToken, setTempToken]   = useState(null);

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
      const res = await loginAdmin(username, password);
      if (res.requirePasswordChange) {
        setTempToken(res.tempToken);
        setView('FORCE_CHANGE');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err?.message || 'Incorrect username or password.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { forgotPassword } = await import('../api/client');
      await forgotPassword(username, resetCode, newPassword);
      setView('LOGIN');
      setPassword('');
      alert('Password reset successfully. Please login.');
    } catch (err) {
      setError(err?.message || 'Failed to reset password.');
    }
    setLoading(false);
  };

  const handleForceChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { changePassword } = await import('../api/client');
      await changePassword(password, newPassword, tempToken);
      setView('LOGIN');
      setPassword('');
      alert('Password updated. Please login with new password.');
    } catch (err) {
      setError(err?.message || 'Failed to update password.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-glass-card">
        
        {/* Subtle top progress bar if checking session or logging in */}
        {(checking || loading) && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: 'rgba(201, 150, 43, 0.1)', overflow: 'hidden', borderRadius: '24px 24px 0 0'
          }}>
            <div style={{
              width: '40%', height: '100%', background: 'var(--magenta)',
              borderRadius: '24px', animation: 'btn-progress 1s ease-in-out infinite'
            }} />
          </div>
        )}

        <div className="login-logo">
          <img src={logo} style={{ width: 72, marginBottom: 16, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }} alt="Logo" />
          <h1>Swoyambhu C-Panel</h1>
          <p>Rotaract Club of Swoyambhu</p>
        </div>

        {checking ? (
          <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span className="admin-spinner" style={{ width: 32, height: 32, borderWidth: '3px', borderColor: 'rgba(226, 0, 122, 0.15)', borderTopColor: 'var(--magenta)' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 500 }}>
              Checking active session...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="login-alert login-alert-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {view === 'LOGIN' && (
              <form onSubmit={handleLogin}>
                <div className="login-input-group">
                  <label htmlFor="username">Username</label>
                  <input id="username" type="text" name="username" autoComplete="username" placeholder="admin" required maxLength={320} value={username} onChange={e => setUsername(e.target.value)} disabled={loading} className="login-input" />
                </div>

                <div className="login-input-group">
                  <label htmlFor="password">Password</label>
                  <input id="password" type={showPass ? 'text' : 'password'} name="password" autoComplete="current-password" placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} className="login-input" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" id="remember" style={{ accentColor: 'var(--magenta)', cursor: 'pointer' }} /> Remember me
                  </label>
                  <button type="button" className="login-link" onClick={() => setView('FORGOT')}>
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Authenticating…' : 'Sign In'}
                </button>
              </form>
            )}

            {view === 'FORGOT' && (
              <form onSubmit={handleForgotPassword}>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: 20, textAlign: 'center' }}>Enter your username, the 16-character reset code, and your new password.</p>
                
                <div className="login-input-group">
                  <input type="text" placeholder="Username" required value={username} onChange={e => setUsername(e.target.value)} disabled={loading} className="login-input" />
                </div>
                <div className="login-input-group">
                  <input type="text" placeholder="16-Character Reset Code" required value={resetCode} onChange={e => setResetCode(e.target.value)} disabled={loading} className="login-input" />
                </div>
                <div className="login-input-group">
                  <input type={showPass ? 'text' : 'password'} placeholder="New Password (e.g. Pass@123)" required value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} className="login-input" />
                </div>

                <button type="submit" className="login-btn" disabled={loading} style={{ marginBottom: 16 }}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
                
                <div style={{ textAlign: 'center' }}>
                  <button type="button" className="login-link" onClick={() => setView('LOGIN')}>Back to Login</button>
                </div>
              </form>
            )}

            {view === 'FORCE_CHANGE' && (
              <form onSubmit={handleForceChange}>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: 20, textAlign: 'center' }}>You are using a temporary password. Please set a new permanent password.</p>
                <div className="login-input-group">
                  <input type={showPass ? 'text' : 'password'} placeholder="New Password (e.g. Pass@123)" required value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} className="login-input" />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
