import React, { useState, useEffect, useCallback } from 'react';
import { getErrorLogs, toggleResolveErrorLog, deleteErrorLog, clearAllErrorLogs } from '../api/client';

export default function AdminErrorLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unresolved', 'resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [copiedStack, setCopiedStack] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchLogs = useCallback(async (targetPage = 1, currentFilter = statusFilter, currentSearch = searchQuery) => {
    setLoading(true);
    try {
      const data = await getErrorLogs(targetPage, pageSize, currentFilter, currentSearch);
      setLogs(data.logs || []);
      setPage(data.page || targetPage);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setGlobalTotal(data.globalTotal || data.totalCount || 0);
      setUnresolvedCount(data.unresolvedCount || 0);
      setResolvedCount(data.resolvedCount || 0);
    } catch (err) {
      console.error('Failed to load error logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, statusFilter, searchQuery]);

  useEffect(() => {
    fetchLogs(1, statusFilter, searchQuery);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1, statusFilter, searchQuery);
  };

  const handleToggleResolve = async (log, e) => {
    if (e) e.stopPropagation();
    setActionInProgress(true);
    try {
      const nextStatus = !log.is_resolved;
      await toggleResolveErrorLog(log.id || log._id, nextStatus);
      // Update local state
      setLogs(prev => prev.map(item => (item.id === log.id || item._id === log._id) ? { ...item, is_resolved: nextStatus } : item));
      if (selectedLog && (selectedLog.id === log.id || selectedLog._id === log._id)) {
        setSelectedLog(prev => ({ ...prev, is_resolved: nextStatus }));
      }
      setUnresolvedCount(prev => nextStatus ? Math.max(0, prev - 1) : prev + 1);
      setResolvedCount(prev => nextStatus ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      alert(err.message || 'Failed to update error log status');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteLog = async (log, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this error log entry?')) return;
    setActionInProgress(true);
    try {
      await deleteErrorLog(log.id || log._id);
      if (selectedLog && (selectedLog.id === log.id || selectedLog._id === log._id)) {
        setSelectedLog(null);
      }
      fetchLogs(page, statusFilter, searchQuery);
    } catch (err) {
      alert(err.message || 'Failed to delete error log');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleClearAll = async () => {
    setShowClearConfirm(false);
    setActionInProgress(true);
    try {
      await clearAllErrorLogs();
      setSelectedLog(null);
      fetchLogs(1, statusFilter, searchQuery);
    } catch (err) {
      alert(err.message || 'Failed to clear error logs');
    } finally {
      setActionInProgress(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedStack(true);
    setTimeout(() => setCopiedStack(false), 2000);
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    fetchLogs(nextPage, statusFilter, searchQuery);
  };

  const pageStart = Math.max(1, page - 2);
  const pageEnd = Math.min(totalPages, pageStart + 4);
  const visiblePages = [];
  for (let i = pageStart; i <= pageEnd; i += 1) {
    visiblePages.push(i);
  }

  return (
    <div className="admin-card error-logs-container" style={{ padding: '24px' }}>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="admin-page-title serif" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--navy)' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--magenta)' }} />
              System Error Logs & Bug Reports
            </h2>
            <p className="admin-page-subtitle">
              Monitor, diagnose, and resolve runtime exceptions, failed API requests, and user bug reports.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="admin-btn admin-btn-outline"
              onClick={() => fetchLogs(page, statusFilter, searchQuery)}
              disabled={loading || actionInProgress}
              style={{ fontSize: '0.82rem', padding: '7px 12px' }}
            >
              <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} style={{ marginRight: 6 }} />
              Refresh
            </button>
            {globalTotal > 0 && (
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => setShowClearConfirm(true)}
                disabled={loading || actionInProgress}
                style={{ fontSize: '0.82rem', padding: '7px 12px' }}
              >
                <i className="fa-solid fa-trash-can" style={{ marginRight: 6 }} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}>
        <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Logged
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy)', marginTop: 4 }}>
            {globalTotal}
          </div>
        </div>

        <div style={{ background: unresolvedCount > 0 ? 'rgba(121, 33, 60, 0.05)' : '#f8fafc', padding: '16px 20px', borderRadius: 12, border: `1px solid ${unresolvedCount > 0 ? 'rgba(121, 33, 60, 0.2)' : '#e2e8f0'}` }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--magenta)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Unresolved Bugs
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--magenta)', marginTop: 4 }}>
            {unresolvedCount}
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Resolved Issues
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
      }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Logs', icon: 'fa-list' },
            { id: 'unresolved', label: `Unresolved (${unresolvedCount})`, icon: 'fa-triangle-exclamation' },
            { id: 'resolved', label: `Resolved (${resolvedCount})`, icon: 'fa-circle-check' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className="admin-btn"
              style={{
                background: statusFilter === tab.id ? 'var(--magenta)' : 'white',
                color: statusFilter === tab.id ? 'white' : '#475569',
                border: `1px solid ${statusFilter === tab.id ? 'var(--magenta)' : '#cbd5e1'}`,
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              <i className={`fa-solid ${tab.icon}`} style={{ marginRight: 6 }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: '1 1 240px', maxWidth: '380px' }}>
          <input
            type="text"
            placeholder="Search error, endpoint, user…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ padding: '7px 12px', fontSize: '0.85rem' }}
          />
          <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          {searchQuery && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => { setSearchQuery(''); fetchLogs(1, statusFilter, ''); }}
              style={{ padding: '7px 10px', fontSize: '0.85rem' }}
              title="Clear search"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </form>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', flexDirection: 'column', gap: 12 }}>
          <span className="admin-spinner" style={{ width: 36, height: 36, borderWidth: 3, borderTopColor: 'var(--magenta)' }} />
          <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Loading error logs…</span>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          <i className="fa-solid fa-shield-check" style={{ fontSize: '3rem', color: '#10b981', marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--navy)', fontSize: '1.15rem' }}>No Error Logs Found</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
            {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters or search query.' : 'System health is optimal. No errors have been recorded.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="admin-table-container desktop-only-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th style={{ width: '130px' }}>Method / HTTP</th>
                  <th>Error Summary</th>
                  <th style={{ width: '120px' }}>User</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const logId = log.id || log._id;
                  const isResolved = Boolean(log.is_resolved);
                  return (
                    <tr
                      key={logId}
                      onClick={() => setSelectedLog(log)}
                      style={{ cursor: 'pointer', background: isResolved ? 'transparent' : 'rgba(121, 33, 60, 0.02)' }}
                    >
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: isResolved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(121, 33, 60, 0.12)',
                            color: isResolved ? '#059669' : 'var(--magenta)',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <i className={`fa-solid ${isResolved ? 'fa-check' : 'fa-circle-exclamation'}`} />
                          {isResolved ? 'Resolved' : 'Unresolved'}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {log.method && (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: log.method === 'POST' ? '#3b82f6' : log.method === 'DELETE' ? '#ef4444' : '#64748b',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}>
                              {log.method}
                            </span>
                          )}
                          {log.status_code && (
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: log.status_code >= 500 ? 'var(--magenta)' : '#d97706',
                            }}>
                              {log.status_code}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.88rem', marginBottom: 2 }}>
                          {log.error_message}
                        </div>
                        {log.endpoint && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {log.endpoint}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="fa-solid fa-user" style={{ fontSize: '11px', color: 'var(--magenta)' }} />
                          {log.username || 'anon'}
                        </div>
                        {log.user_role && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.user_role}</div>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="admin-btn admin-btn-outline"
                            onClick={() => setSelectedLog(log)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="View details"
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                          <button
                            className="admin-btn admin-btn-outline"
                            onClick={(e) => handleToggleResolve(log, e)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: isResolved ? '#64748b' : '#059669',
                              borderColor: isResolved ? '#cbd5e1' : '#10b981',
                            }}
                            title={isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
                          >
                            <i className={`fa-solid ${isResolved ? 'fa-rotate-left' : 'fa-check'}`} />
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            onClick={(e) => handleDeleteLog(log, e)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Delete log"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Touch Cards View */}
          <div className="mobile-only-cards">
            {logs.map((log) => {
              const logId = log.id || log._id;
              const isResolved = Boolean(log.is_resolved);
              return (
                <div
                  key={logId}
                  className="mobile-admin-card"
                  onClick={() => setSelectedLog(log)}
                  style={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${isResolved ? '#10b981' : 'var(--magenta)'}`,
                    marginBottom: '12px',
                  }}
                >
                  <div className="mobile-card-top" style={{ marginBottom: 6 }}>
                    <div>
                      <span
                        className="admin-badge"
                        style={{
                          background: isResolved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(121, 33, 60, 0.12)',
                          color: isResolved ? '#059669' : 'var(--magenta)',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      >
                        <i className={`fa-solid ${isResolved ? 'fa-check' : 'fa-triangle-exclamation'}`} style={{ marginRight: 4 }} />
                        {isResolved ? 'Resolved' : 'Unresolved'}
                      </span>
                      {log.status_code && (
                        <span style={{ marginLeft: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy)' }}>
                          HTTP {log.status_code}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <h4 className="mobile-card-title" style={{ fontSize: '0.92rem', marginBottom: 4, color: 'var(--navy)' }}>
                    {log.error_message}
                  </h4>

                  {log.endpoint && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginBottom: 8, wordBreak: 'break-all' }}>
                      {log.method ? `[${log.method}] ` : ''}{log.endpoint}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <i className="fa-solid fa-user" style={{ color: 'var(--magenta)', marginRight: 4 }} />
                      {log.username || 'anon'}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="admin-btn admin-btn-outline"
                        onClick={(e) => handleToggleResolve(log, e)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <i className={`fa-solid ${isResolved ? 'fa-rotate-left' : 'fa-check'}`} style={{ marginRight: 4 }} />
                        {isResolved ? 'Reopen' : 'Resolve'}
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={(e) => handleDeleteLog(log, e)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
            <button className="admin-btn admin-btn-outline" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
              <i className="fa-solid fa-chevron-left" style={{ marginRight: 4 }} /> Prev
            </button>
            {pageStart > 1 && <span style={{ color: '#94a3b8' }}>…</span>}
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`admin-btn ${pageNumber === page ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => goToPage(pageNumber)}
                disabled={pageNumber === page}
                style={{ minWidth: 38, padding: '6px 10px' }}
              >
                {pageNumber}
              </button>
            ))}
            {pageEnd < totalPages && <span style={{ color: '#94a3b8' }}>…</span>}
            <button className="admin-btn admin-btn-outline" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
              Next <i className="fa-solid fa-chevron-right" style={{ marginLeft: 4 }} />
            </button>
          </div>
        </>
      )}

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className="admin-badge"
                  style={{
                    background: selectedLog.is_resolved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(121, 33, 60, 0.12)',
                    color: selectedLog.is_resolved ? '#059669' : 'var(--magenta)',
                    fontWeight: 700,
                  }}
                >
                  {selectedLog.is_resolved ? 'RESOLVED' : 'UNRESOLVED'}
                </span>
                <h3 className="serif" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy)' }}>
                  Error Log #{selectedLog.id || selectedLog._id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Error Message Box */}
              <div style={{
                background: 'rgba(121, 33, 60, 0.05)',
                borderLeft: '4px solid var(--magenta)',
                padding: '14px 18px',
                borderRadius: '8px',
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--magenta)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  Exception / Error Message
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)', wordBreak: 'break-word' }}>
                  {selectedLog.error_message}
                </div>
              </div>

              {/* Quick Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                background: '#f8fafc',
                padding: '14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ENDPOINT & METHOD</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', fontFamily: 'monospace', marginTop: 2 }}>
                    {selectedLog.method ? `[${selectedLog.method}] ` : ''}{selectedLog.endpoint || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS CODE / ERROR CODE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--magenta)', marginTop: 2 }}>
                    {selectedLog.status_code ? `HTTP ${selectedLog.status_code}` : ''} {selectedLog.error_code ? `(${selectedLog.error_code})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>REPORTED BY</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: 2 }}>
                    {selectedLog.username || 'anonymous'} {selectedLog.user_role ? `(${selectedLog.user_role})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TIMESTAMP</div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', marginTop: 2 }}>
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* User Notes (if provided by user when submitting bug report) */}
              {selectedLog.user_notes && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                    <i className="fa-solid fa-comment-dots" style={{ marginRight: 6, color: 'var(--magenta)' }} />
                    User Description / Notes
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                    {selectedLog.user_notes}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {selectedLog.error_stack && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy)' }}>
                      <i className="fa-solid fa-code" style={{ marginRight: 6, color: 'var(--magenta)' }} />
                      Stack Trace
                    </span>
                    <button
                      className="admin-btn admin-btn-outline"
                      onClick={() => copyToClipboard(selectedLog.error_stack)}
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    >
                      <i className={`fa-solid ${copiedStack ? 'fa-check' : 'fa-copy'}`} style={{ marginRight: 4 }} />
                      {copiedStack ? 'Copied!' : 'Copy Stack Trace'}
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    background: '#0f172a',
                    color: '#f87171',
                    padding: '14px',
                    borderRadius: 8,
                    overflowX: 'auto',
                    lineHeight: 1.4,
                    maxHeight: '220px',
                  }}>
                    {selectedLog.error_stack}
                  </pre>
                </div>
              )}

              {/* Client Diagnostics */}
              {selectedLog.client_info && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                    <i className="fa-solid fa-laptop-code" style={{ marginRight: 6, color: 'var(--magenta)' }} />
                    Client & Environment Diagnostics
                  </div>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    background: '#f8fafc',
                    color: '#334155',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    overflowX: 'auto',
                  }}>
                    {typeof selectedLog.client_info === 'string' ? selectedLog.client_info : JSON.stringify(selectedLog.client_info, null, 2)}
                  </pre>
                </div>
              )}

              {/* Request Payload / Response Data */}
              {(selectedLog.request_payload || selectedLog.response_data) && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                    <i className="fa-solid fa-database" style={{ marginRight: 6, color: 'var(--magenta)' }} />
                    Payload & Response Snapshot
                  </div>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    background: '#f8fafc',
                    color: '#334155',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    overflowX: 'auto',
                  }}>
                    {JSON.stringify({
                      requestPayload: selectedLog.request_payload,
                      responseData: selectedLog.response_data,
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}>
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => handleDeleteLog(selectedLog)}
                disabled={actionInProgress}
                style={{ fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-trash" style={{ marginRight: 6 }} />
                Delete Log
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="admin-btn admin-btn-outline"
                  onClick={() => setSelectedLog(null)}
                  style={{ fontSize: '0.85rem' }}
                >
                  Close
                </button>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleToggleResolve(selectedLog)}
                  disabled={actionInProgress}
                  style={{ fontSize: '0.85rem' }}
                >
                  <i className={`fa-solid ${selectedLog.is_resolved ? 'fa-rotate-left' : 'fa-check'}`} style={{ marginRight: 6 }} />
                  {selectedLog.is_resolved ? 'Mark Unresolved' : 'Mark as Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              margin: '0 auto 16px',
            }}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <h3 className="serif" style={{ margin: '0 0 8px', color: 'var(--navy)' }}>Clear All Error Logs?</h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.88rem', lineHeight: 1.4 }}>
              This will permanently delete all {globalTotal} error records from the database. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="admin-btn admin-btn-outline"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleClearAll}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
