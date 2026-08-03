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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
        <h2 className="admin-page-title serif">Settings</h2>
        <p className="admin-page-subtitle">Manage your account preferences and security.</p>
      </div>
      
      <div>
        <h3 className="admin-card-title">Change Password</h3>
        {error && <div className="login-alert login-alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="login-alert login-alert-info" style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0', marginBottom: 16 }}>{success}</div>}
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="admin-input" />
          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="admin-input" />
          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ alignSelf: 'flex-start' }}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
