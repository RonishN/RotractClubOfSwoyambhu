import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { checkAdminSession, loginAdmin } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [checking, setChecking]       = useState(true);
  const [view, setView]               = useState('LOGIN'); // LOGIN, FORGOT, FORCE_CHANGE
  const [resetCode, setResetCode]     = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempToken, setTempToken]     = useState(null);

  // Live password validation checklist status
  const passChecklist = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^a-zA-Z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passChecklist).every(Boolean);

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
    if (!isPasswordValid) {
      setError('Please ensure your new password satisfies all security requirements.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { forgotPassword } = await import('../api/client');
      await forgotPassword(username, resetCode, newPassword);
      setView('LOGIN');
      setPassword('');
      setNewPassword('');
      alert('Password reset successfully. Please login with your new password.');
    } catch (err) {
      setError(err?.message || 'Failed to reset password.');
    }
    setLoading(false);
  };

  const handleForceChange = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please ensure your new password satisfies all security requirements.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { changePassword } = await import('../api/client');
      await changePassword(password, newPassword, tempToken);
      setView('LOGIN');
      setPassword('');
      setNewPassword('');
      alert('Password updated successfully. Please login with your new password.');
    } catch (err) {
      setError(err?.message || 'Failed to update password.');
    }
    setLoading(false);
  };

  const renderPasswordChecklist = () => (
    <div className="password-requirements-box">
      <div className="req-header">
        <i className="fa-solid fa-shield-halved" style={{ marginRight: 6, color: '#79213C' }}></i>
        Password Security Requirements
      </div>
      <div className="req-grid">
        <div className={`req-item ${passChecklist.length ? 'valid' : 'invalid'}`}>
          <span className="req-icon">
            {passChecklist.length ? (
              <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
            ) : (
              <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
            )}
          </span>
          <span>At least 8 characters</span>
        </div>
        <div className={`req-item ${passChecklist.uppercase ? 'valid' : 'invalid'}`}>
          <span className="req-icon">
            {passChecklist.uppercase ? (
              <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
            ) : (
              <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
            )}
          </span>
          <span>At least 1 uppercase letter (A-Z)</span>
        </div>
        <div className={`req-item ${passChecklist.lowercase ? 'valid' : 'invalid'}`}>
          <span className="req-icon">
            {passChecklist.lowercase ? (
              <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
            ) : (
              <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
            )}
          </span>
          <span>At least 1 lowercase letter (a-z)</span>
        </div>
        <div className={`req-item ${passChecklist.number ? 'valid' : 'invalid'}`}>
          <span className="req-icon">
            {passChecklist.number ? (
              <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
            ) : (
              <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
            )}
          </span>
          <span>At least 1 number (0-9)</span>
        </div>
        <div className={`req-item ${passChecklist.special ? 'valid' : 'invalid'}`}>
          <span className="req-icon">
            {passChecklist.special ? (
              <i className="fa-solid fa-circle-check" style={{ color: '#22c55e' }}></i>
            ) : (
              <i className="fa-solid fa-circle-xmark" style={{ color: '#ef4444' }}></i>
            )}
          </span>
          <span>At least 1 special char (e.g. £, @, #, $, !, %, &)</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="login-page-wrapper">
      <div className="login-glass-card">
        
        {/* Top subtle accent bar */}
        {(checking || loading) && (
          <div className="login-top-bar-loader">
            <div className="login-top-bar-progress" />
          </div>
        )}

        <div className="login-logo">
          <img src={logo} alt="Logo" className="login-logo-img" />
          <h1>Rotaract Swoyambhu</h1>
          <p>Admin Control Panel</p>
        </div>

        {checking ? (
          <div className="login-checking-state">
            <span className="admin-spinner" />
            <p>Verifying secure session...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="login-alert login-alert-error">
                <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '1rem', flexShrink: 0 }}></i>
                <span>{error}</span>
              </div>
            )}

            {/* LOGIN VIEW */}
            {view === 'LOGIN' && (
              <form onSubmit={handleLogin}>
                <div className="login-input-group">
                  <label htmlFor="username">
                    <i className="fa-solid fa-user" style={{ marginRight: 6, fontSize: '0.8rem', color: '#94a3b8' }}></i>
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="Enter your username"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                    className="login-input"
                  />
                </div>

                <div className="login-input-group">
                  <label htmlFor="password">
                    <i className="fa-solid fa-lock" style={{ marginRight: 6, fontSize: '0.8rem', color: '#94a3b8' }}></i>
                    Password
                  </label>
                  <div className="input-pass-wrapper">
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                      className="login-input"
                    />
                    <button
                      type="button"
                      className="pass-toggle-btn"
                      onClick={() => setShowPass(!showPass)}
                      title={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? (
                        <i className="fa-solid fa-eye-slash"></i>
                      ) : (
                        <i className="fa-solid fa-eye"></i>
                      )}
                    </button>
                  </div>
                </div>

                <div className="login-options-row">
                  <label className="remember-me-label">
                    <input type="checkbox" id="remember" /> Remember me
                  </label>
                  <button type="button" className="login-link" onClick={() => { setView('FORGOT'); setError(''); }}>
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Authenticating…</span>
                  ) : (
                    <span><i className="fa-solid fa-right-to-bracket" style={{ marginRight: 8 }}></i>Sign In</span>
                  )}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD VIEW */}
            {view === 'FORGOT' && (
              <form onSubmit={handleForgotPassword}>
                <h3 className="view-title">Reset Admin Password</h3>
                <p className="view-subtitle">Enter your account username, 16-character reset code, and choose a new secure password.</p>
                
                <div className="login-input-group">
                  <label>
                    <i className="fa-solid fa-user" style={{ marginRight: 6, fontSize: '0.8rem', color: '#94a3b8' }}></i>
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                    className="login-input"
                  />
                </div>

                <div className="login-input-group">
                  <label>
                    <i className="fa-solid fa-key" style={{ marginRight: 6, fontSize: '0.8rem', color: '#94a3b8' }}></i>
                    16-Character Reset Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4a8b1c9d2e3f5a7b"
                    required
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    disabled={loading}
                    className="login-input"
                  />
                </div>

                <div className="login-input-group">
                  <label>
                    <i className="fa-solid fa-lock" style={{ marginRight: 6, fontSize: '0.8rem', color: '#94a3b8' }}></i>
                    New Password
                  </label>
                  <div className="input-pass-wrapper">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Create a strong password (e.g. £SafePass2026)"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={loading}
                      className="login-input"
                    />
                    <button
                      type="button"
                      className="pass-toggle-btn"
                      onClick={() => setShowPass(!showPass)}
                      title={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? (
                        <i className="fa-solid fa-eye-slash"></i>
                      ) : (
                        <i className="fa-solid fa-eye"></i>
                      )}
                    </button>
                  </div>
                </div>

                {renderPasswordChecklist()}

                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading || !isPasswordValid}
                  style={{ opacity: isPasswordValid ? 1 : 0.65, cursor: isPasswordValid ? 'pointer' : 'not-allowed' }}
                >
                  {loading ? (
                    <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Resetting…</span>
                  ) : (
                    <span><i className="fa-solid fa-key" style={{ marginRight: 8 }}></i>Reset Password</span>
                  )}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" className="login-link" onClick={() => { setView('LOGIN'); setError(''); }}>
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i>
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* FORCE CHANGE PASSWORD VIEW (TEMP PASSWORD) */}
            {view === 'FORCE_CHANGE' && (
              <form onSubmit={handleForceChange}>
                <h3 className="view-title">Set Permanent Password</h3>
                <p className="view-subtitle">You signed in with a temporary password. Please set a new secure password to proceed.</p>
                
                <div className="login-input-group">
                  <label>
                    <i className="fa-solid fa-shield-halved" style={{ marginRight: 6, fontSize: '0.8rem', color: '#94a3b8' }}></i>
                    New Permanent Password
                  </label>
                  <div className="input-pass-wrapper">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter new password (e.g. £SafePass2026)"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={loading}
                      className="login-input"
                    />
                    <button
                      type="button"
                      className="pass-toggle-btn"
                      onClick={() => setShowPass(!showPass)}
                      title={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? (
                        <i className="fa-solid fa-eye-slash"></i>
                      ) : (
                        <i className="fa-solid fa-eye"></i>
                      )}
                    </button>
                  </div>
                </div>

                {renderPasswordChecklist()}

                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading || !isPasswordValid}
                  style={{ opacity: isPasswordValid ? 1 : 0.65, cursor: isPasswordValid ? 'pointer' : 'not-allowed' }}
                >
                  {loading ? (
                    <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Updating…</span>
                  ) : (
                    <span><i className="fa-solid fa-check" style={{ marginRight: 8 }}></i>Save & Continue</span>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
