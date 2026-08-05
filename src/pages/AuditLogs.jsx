import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../api/client';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadLogs = async (nextPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs(nextPage, pageSize);
      setLogs(data.logs || []);
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    loadLogs(nextPage);
  };

  const pageStart = Math.max(1, page - 2);
  const pageEnd = Math.min(totalPages, pageStart + 4);
  const visiblePages = [];
  for (let i = pageStart; i <= pageEnd; i += 1) {
    visiblePages.push(i);
  }

  if (loading) return (
    <div className="admin-card">
      <div className="admin-page-header">
        <h2 className="admin-page-title serif">Audit Logs</h2>
        <p className="admin-page-subtitle">Track administrative actions and system events.</p>
      </div>
      <div className="admin-table-container desktop-only-table" aria-busy="true" aria-label="Loading logs">
        <table className="admin-table">
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td><div className="sk" style={{ height: 15, width: 150 }} /></td>
                <td><div className="sk" style={{ height: 15, width: 90 }} /></td>
                <td><div className="sk" style={{ height: 15, width: 110 }} /></td>
                <td><div className="sk" style={{ height: 40, width: '80%' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-card">
      <div className="admin-page-header">
        <h2 className="admin-page-title serif">Audit Logs</h2>
        <p className="admin-page-subtitle">Track administrative actions and system events.</p>
        <p className="admin-page-subtitle" style={{ marginTop: 4 }}>
          Showing {logs.length} of {totalCount} logs, page {page} of {totalPages}.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>Error loading audit logs:</strong> {error}
          </div>
          <button className="admin-btn admin-btn-outline" style={{ borderColor: '#fca5a5', color: '#991b1b' }} onClick={() => loadLogs(page)}>
            Retry
          </button>
        </div>
      )}
      {/* Desktop Table View */}
      <div className="admin-table-container desktop-only-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Username</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No logs found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id || log._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <span className="admin-badge admin-badge-info" style={{ background: '#f1f5f9', color: '#334155' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{log.username}</td>
                  <td><pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{JSON.stringify(log.details || {}, null, 2)}</pre></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Touch Cards View */}
      <div className="mobile-only-cards">
        {logs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No logs found.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id || log._id} className="mobile-admin-card">
              <div className="mobile-card-top">
                <div>
                  <h4 className="mobile-card-title">{log.action}</h4>
                  <div className="mobile-card-subtitle">
                    <i className="fa-solid fa-user" style={{ marginRight: 4, color: 'var(--magenta)' }} /> {log.username}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(log.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 8 }}>
                <i className="fa-solid fa-clock" style={{ marginRight: 4, color: '#94a3b8' }} /> {new Date(log.created_at).toLocaleTimeString()}
              </div>
              <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                {JSON.stringify(log.details || {}, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
        <button className="admin-btn admin-btn-outline" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        {pageStart > 1 && <span style={{ color: '#94a3b8' }}>…</span>}
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`admin-btn ${pageNumber === page ? 'admin-btn-primary' : 'admin-btn-outline'}`}
            onClick={() => goToPage(pageNumber)}
            disabled={pageNumber === page}
            style={{ minWidth: 44 }}
          >
            {pageNumber}
          </button>
        ))}
        {pageEnd < totalPages && <span style={{ color: '#94a3b8' }}>…</span>}
        <button className="admin-btn admin-btn-outline" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
