import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { changePassword } from '../api/client';

export default function AdminSettings() {
  const { currentUser } = useOutletContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Live password validation checklist status
  const passChecklist = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^a-zA-Z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passChecklist).every(Boolean);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      setError('Please ensure your new password satisfies all security requirements.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <div className="admin-card">
      <div className="admin-page-header">
        <h2 className="admin-page-title serif">Account Security & Settings</h2>
        <p className="admin-page-subtitle">Manage your account preferences, password, and security.</p>
      </div>
      
      <div style={{ maxWidth: 480 }}>
        <h3 className="admin-card-title">Change Password</h3>
        {error && <div className="login-alert login-alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="login-alert login-alert-info" style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0', marginBottom: 16 }}>{success}</div>}
        
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Current Password *</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>New Password *</label>
            <input
              type="password"
              placeholder="Enter new strong password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          {newPassword.length > 0 && (
            <div className="password-requirements-box" style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div className="req-header" style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#79213C' }}></i>
                <span>Password Security Requirements:</span>
              </div>
              <div className="req-grid" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className={`req-item ${passChecklist.length ? 'valid' : 'invalid'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: passChecklist.length ? '#166534' : '#64748b' }}>
                  <span className="req-icon">
                    {passChecklist.length ? (
                      <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle-xmark" style={{ color: '#dc2626' }}></i>
                    )}
                  </span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`req-item ${passChecklist.uppercase ? 'valid' : 'invalid'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: passChecklist.uppercase ? '#166534' : '#64748b' }}>
                  <span className="req-icon">
                    {passChecklist.uppercase ? (
                      <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle-xmark" style={{ color: '#dc2626' }}></i>
                    )}
                  </span>
                  <span>At least 1 uppercase letter (A-Z)</span>
                </div>
                <div className={`req-item ${passChecklist.lowercase ? 'valid' : 'invalid'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: passChecklist.lowercase ? '#166534' : '#64748b' }}>
                  <span className="req-icon">
                    {passChecklist.lowercase ? (
                      <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle-xmark" style={{ color: '#dc2626' }}></i>
                    )}
                  </span>
                  <span>At least 1 lowercase letter (a-z)</span>
                </div>
                <div className={`req-item ${passChecklist.number ? 'valid' : 'invalid'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: passChecklist.number ? '#166534' : '#64748b' }}>
                  <span className="req-icon">
                    {passChecklist.number ? (
                      <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle-xmark" style={{ color: '#dc2626' }}></i>
                    )}
                  </span>
                  <span>At least 1 number (0-9)</span>
                </div>
                <div className={`req-item ${passChecklist.special ? 'valid' : 'invalid'}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: passChecklist.special ? '#166534' : '#64748b' }}>
                  <span className="req-icon">
                    {passChecklist.special ? (
                      <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
                    ) : (
                      <i className="fa-solid fa-circle-xmark" style={{ color: '#dc2626' }}></i>
                    )}
                  </span>
                  <span>At least 1 special char (e.g. £, @, #, $, !, %, &)</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (newPassword.length > 0 && !isPasswordValid)}
            className="admin-btn admin-btn-primary"
            style={{ alignSelf: 'flex-start', minWidth: 160 }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
