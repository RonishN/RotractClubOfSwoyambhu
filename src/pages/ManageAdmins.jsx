import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getUsers, createUser, sendAdminCredentials, toggleUserStatus, deleteUser, generateResetCode, updateUserPermissions } from '../api/client';

const ALL_AVAILABLE_PERMISSIONS = [
  'VISUAL_EDITOR',
  'ACCOUNT_PASSWORD_RESET',
  'VIEW_LOGS',
  'DEACTIVATE_ACCOUNT',
  'DELETE_ACCOUNT',
  'ADMIN_CREATOR',
  'EVENT_MANAGER'
];

export default function ManageAdmins() {
  const { currentUser } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Admin Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [permissions, setPermissions] = useState({
    VISUAL_EDITOR: false,
    ACCOUNT_PASSWORD_RESET: false,
    VIEW_LOGS: false,
    DEACTIVATE_ACCOUNT: false,
    DELETE_ACCOUNT: false,
    ADMIN_CREATOR: false,
    EVENT_MANAGER: false
  });
  const [creating, setCreating] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState('');

  // Edit Permissions Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [savingPerms, setSavingPerms] = useState(false);
  
  const canCreate = currentUser.role === 'SUPERADMIN' || currentUser.permissions?.includes('ADMIN_CREATOR');
  const canReset = currentUser.role === 'SUPERADMIN' || currentUser.permissions?.includes('ACCOUNT_PASSWORD_RESET');
  const canDeactivate = currentUser.role === 'SUPERADMIN' || currentUser.permissions?.includes('DEACTIVATE_ACCOUNT');
  const canDelete = currentUser.role === 'SUPERADMIN' || currentUser.permissions?.includes('DELETE_ACCOUNT');
  const canEditPermissions = currentUser.role === 'SUPERADMIN' || currentUser.permissions?.includes('ADMIN_CREATOR');

  const hasPerm = (p) => currentUser.role === 'SUPERADMIN' || currentUser.permissions?.includes(p);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setNewUsername('');
    setNewEmail('');
    setPermissions({
      VISUAL_EDITOR: false,
      ACCOUNT_PASSWORD_RESET: false,
      VIEW_LOGS: false,
      DEACTIVATE_ACCOUNT: false,
      DELETE_ACCOUNT: false,
      ADMIN_CREATOR: false,
      EVENT_MANAGER: false
    });
    setCreatedInfo(null);
    setEmailSentStatus('');
    setError('');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreatedInfo(null);
    setEmailSentStatus('');
    setError('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedInfo(null);
    setEmailSentStatus('');

    if (!newEmail.trim()) {
      setError('Email address is required.');
      return;
    }

    setCreating(true);
    try {
      const perms = Object.keys(permissions).filter(k => permissions[k]);
      const res = await createUser(newUsername.trim(), newEmail.trim(), perms);
      setCreatedInfo(res);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleSendCredentialsEmail = async () => {
    if (!createdInfo) return;
    setSendingEmail(true);
    setEmailSentStatus('');
    setError('');
    try {
      await sendAdminCredentials(createdInfo.username, createdInfo.email, createdInfo.tempPassword);
      setEmailSentStatus(`✅ Credentials email sent successfully to ${createdInfo.email}`);
    } catch (err) {
      setError(err.message || 'Failed to send credentials email');
    } finally {
      setSendingEmail(false);
    }
  };

  const openEditPermissionsModal = (user) => {
    setEditingUser(user);
    const currentPermMap = {};
    ALL_AVAILABLE_PERMISSIONS.forEach(p => {
      currentPermMap[p] = user.permissions?.includes(p) || false;
    });
    setEditPerms(currentPermMap);
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setSavingPerms(true);
    try {
      const selectedPerms = Object.keys(editPerms).filter(k => editPerms[k]);
      await updateUserPermissions(editingUser.username, selectedPerms);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const handleToggle = async (username, currentStatus) => {
    try {
      await toggleUserStatus(username, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleGenerateCode = async (username) => {
    try {
      const res = await generateResetCode(username);
      alert(`Reset code for ${username}: ${res.resetCode}\n\nPlease share this securely with the user.`);
    } catch (err) {
      alert('Failed to generate code');
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Are you sure you want to delete admin ${username}? This cannot be undone.`)) return;
    try {
      await deleteUser(username);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete admin');
    }
  };

  if (!canCreate && !canReset && !canDeactivate && !canDelete && !canEditPermissions) return <div>Access Denied</div>;

  return (
    <div className="admin-card">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="admin-page-title serif">Manage Admins</h2>
          <p className="admin-page-subtitle">Create and manage access levels and user permissions for administrative accounts.</p>
        </div>
        {canCreate && (
          <button className="admin-btn admin-btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            + Create New Admin
          </button>
        )}
      </div>
      
      {error && <div className="login-alert login-alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Create Admin Modal Overlay */}
      {isCreateModalOpen && (
        <div
          onClick={closeCreateModal}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: '620px',
              maxHeight: '90vh', overflowY: 'auto', padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a' }}>
                Create New Admin Account
              </h3>
              <button
                type="button"
                onClick={closeCreateModal}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            {!createdInfo ? (
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. janesmith"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. jane.smith@rotaractswoyambhu.org"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Permissions & Access Scope</label>
                  <div className="admin-checkbox-grid">
                    {(hasPerm('VISUAL_EDITOR') || canEditPermissions) && <label className="admin-checkbox-label"><input type="checkbox" checked={permissions.VISUAL_EDITOR} onChange={e => setPermissions({...permissions, VISUAL_EDITOR: e.target.checked})} /> VISUAL_EDITOR</label>}
                    {(hasPerm('EVENT_MANAGER') || canEditPermissions) && <label className="admin-checkbox-label"><input type="checkbox" checked={permissions.EVENT_MANAGER} onChange={e => setPermissions({...permissions, EVENT_MANAGER: e.target.checked})} /> EVENT_MANAGER</label>}
                    {(hasPerm('ADMIN_CREATOR') || canEditPermissions) && <label className="admin-checkbox-label"><input type="checkbox" checked={permissions.ADMIN_CREATOR} onChange={e => setPermissions({...permissions, ADMIN_CREATOR: e.target.checked})} /> ADMIN_CREATOR</label>}
                    {(hasPerm('ACCOUNT_PASSWORD_RESET') || canEditPermissions) && <label className="admin-checkbox-label"><input type="checkbox" checked={permissions.ACCOUNT_PASSWORD_RESET} onChange={e => setPermissions({...permissions, ACCOUNT_PASSWORD_RESET: e.target.checked})} /> ACCOUNT_PASSWORD_RESET</label>}
                    {(hasPerm('VIEW_LOGS') || canEditPermissions) && <label className="admin-checkbox-label"><input type="checkbox" checked={permissions.VIEW_LOGS} onChange={e => setPermissions({...permissions, VIEW_LOGS: e.target.checked})} /> VIEW_LOGS</label>}
                    {(hasPerm('DEACTIVATE_ACCOUNT') || canEditPermissions) && <label className="admin-checkbox-label"><input type="checkbox" checked={permissions.DEACTIVATE_ACCOUNT} onChange={e => setPermissions({...permissions, DEACTIVATE_ACCOUNT: e.target.checked})} /> DEACTIVATE_ACCOUNT</label>}
                    {(hasPerm('DELETE_ACCOUNT') || canEditPermissions) && <label className="admin-checkbox-label"><input type="checkbox" checked={permissions.DELETE_ACCOUNT} onChange={e => setPermissions({...permissions, DELETE_ACCOUNT: e.target.checked})} /> DELETE_ACCOUNT</label>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="admin-btn admin-btn-outline" onClick={closeCreateModal}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={creating}>
                    {creating ? 'Creating Admin...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="login-alert login-alert-info" style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0', padding: 20 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>🎉 Admin Account Created Successfully!</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
                    <div><strong>Username:</strong> {createdInfo.username}</div>
                    <div><strong>Email:</strong> {createdInfo.email}</div>
                    <div><strong>Temporary Password:</strong> <span style={{ background: '#ffffff', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, border: '1px solid #86efac' }}>{createdInfo.tempPassword}</span></div>
                  </div>
                </div>

                {emailSentStatus && (
                  <div className="login-alert login-alert-info" style={{ background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>
                    {emailSentStatus}
                  </div>
                )}

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#475569' }}>
                    Send login details (Username & Temporary Password) directly to <strong>{createdInfo.email}</strong> via Google SMTP:
                  </p>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={handleSendCredentialsEmail}
                    disabled={sendingEmail}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {sendingEmail ? 'Sending Email via Google SMTP...' : `Send Credentials to ${createdInfo.email}`}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <button type="button" className="admin-btn admin-btn-outline" onClick={closeCreateModal}>
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="admin-card-title">Existing Admins</h3>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><span className="admin-spinner" style={{ borderTopColor: 'var(--navy)' }} /></div> : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User & Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.username}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.username}</div>
                      {u.email && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>}
                    </td>
                    <td>
                      <span className={`admin-badge ${u.role === 'SUPERADMIN' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'SUPERADMIN' ? (
                        <span className="admin-badge admin-badge-neutral">ALL (SUPERADMIN)</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {u.permissions && u.permissions.length > 0 ? (
                            u.permissions.map(p => (
                              <span key={p} className="admin-badge admin-badge-neutral">{p.replace('_', ' ')}</span>
                            ))
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No permissions assigned</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${u.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {canEditPermissions && u.role !== 'SUPERADMIN' && (
                          <button className="admin-btn admin-btn-primary" onClick={() => openEditPermissionsModal(u)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Edit Perms
                          </button>
                        )}
                        {canDeactivate && u.username !== currentUser.username && u.role !== 'SUPERADMIN' && (
                          <button className="admin-btn admin-btn-outline" onClick={() => handleToggle(u.username, u.is_active)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {canReset && u.username !== currentUser.username && (
                          <button className="admin-btn admin-btn-outline" onClick={() => handleGenerateCode(u.username)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Reset Code</button>
                        )}
                        {canDelete && u.username !== currentUser.username && u.role !== 'SUPERADMIN' && (
                          <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(u.username)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Permissions Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }} className="serif">
              Edit Permissions for <span style={{ color: 'var(--navy)' }}>{editingUser.username}</span>
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem' }}>
              Select the administrative permissions to assign to this user.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 24 }}>
              {ALL_AVAILABLE_PERMISSIONS.map(perm => (
                <label key={perm} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: editPerms[perm] ? '#eff6ff' : '#f8fafc',
                  border: editPerms[perm] ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={!!editPerms[perm]}
                    onChange={e => setEditPerms({ ...editPerms, [perm]: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--navy)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{perm}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {perm === 'EVENT_MANAGER' && 'Can create, edit, delete, and publish events'}
                      {perm === 'ADMIN_CREATOR' && 'Can create new admin accounts and manage access permissions'}
                      {perm === 'VISUAL_EDITOR' && 'Can edit site visual content and text'}
                      {perm === 'ACCOUNT_PASSWORD_RESET' && 'Can generate password reset codes'}
                      {perm === 'VIEW_LOGS' && 'Can view audit logs'}
                      {perm === 'DEACTIVATE_ACCOUNT' && 'Can activate/deactivate admin accounts'}
                      {perm === 'DELETE_ACCOUNT' && 'Can delete admin accounts'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setEditingUser(null)}
                disabled={savingPerms}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleSavePermissions}
                disabled={savingPerms}
              >
                {savingPerms ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
