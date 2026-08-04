import React, { useState } from 'react';
import { sendErrorReport } from '../api/client';

export default function ReportBugModal({ isOpen, onClose, initialData = null, onSuccess }) {
  const [userNotes, setUserNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        errorMessage: initialData?.errorMessage || 'User reported issue',
        errorStack: initialData?.errorStack || null,
        errorCode: initialData?.errorCode || initialData?.code || 'USER_REPORTED_BUG',
        endpoint: initialData?.endpoint || null,
        method: initialData?.method || null,
        statusCode: initialData?.statusCode || initialData?.status || null,
        requestPayload: initialData?.requestPayload || null,
        responseData: initialData?.responseData || null,
        userNotes: userNotes.trim(),
      };

      await sendErrorReport(payload);
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        setUserNotes('');
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
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
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: 'rgba(121, 33, 60, 0.1)',
              color: '#79213C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              <i className="fa-solid fa-bug" />
            </div>
            <div>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
                Report a Bug / Error
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Modal Content */}
        {success ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              margin: '0 auto 16px',
            }}>
              <i className="fa-solid fa-check" />
            </div>
            <h3 className="serif" style={{ margin: '0 0 6px', color: '#1e293b' }}>Report Submitted!</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
              The diagnostic report and error details have been logged for administrators to inspect.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '4px solid #ef4444',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            {/* Error context snippet if provided */}
            {initialData?.errorMessage && (
              <div style={{
                background: 'rgba(121, 33, 60, 0.05)',
                border: '1px solid rgba(121, 33, 60, 0.15)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '0.72rem', color: '#79213C', fontWeight: 700, textTransform: 'uppercase' }}>
                  Captured Error
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: 2, wordBreak: 'break-word' }}>
                  {initialData.errorMessage}
                </div>
              </div>
            )}

            {/* User Notes Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', marginBottom: 6 }}>
                What happened? (Optional)
              </label>
              <textarea
                placeholder="Describe what action you were trying to perform or any details that might help us fix it..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
                className="admin-input"
                style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Technical Diagnostics Accordion */}
            <div style={{ marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                }}
              >
                <i className={`fa-solid ${showTechnicalDetails ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                {showTechnicalDetails ? 'Hide' : 'View'} Automated Diagnostics
              </button>

              {showTechnicalDetails && (
                <div style={{
                  marginTop: 8,
                  padding: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#475569',
                  fontFamily: 'monospace',
                  maxHeight: '140px',
                  overflowY: 'auto',
                }}>
                  <div><strong>URL:</strong> {window.location.href}</div>
                  <div><strong>Browser:</strong> {navigator.userAgent.slice(0, 100)}…</div>
                  <div><strong>Screen:</strong> {window.innerWidth}x{window.innerHeight}</div>
                  {initialData?.endpoint && <div><strong>Endpoint:</strong> {initialData.endpoint}</div>}
                  {initialData?.statusCode && <div><strong>Status:</strong> {initialData.statusCode}</div>}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />
                    Sending Report…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
                    Send Bug Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
