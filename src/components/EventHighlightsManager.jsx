import React, { useState, useEffect } from 'react';
import { getAdminContent, updateAdminContent, uploadImage } from '../api/client';
import ImageCropModal from './ImageCropModal';

const MAX_HIGHLIGHTS = 8;

export default function EventHighlightsManager() {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({ title: '', titleNe: '', description: '', badge: '', imageUrl: '' });

  const [croppingImageSrc, setCroppingImageSrc] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await getAdminContent();
        setHighlights(Array.isArray(result.websiteData?.highlights) ? result.websiteData.highlights : []);
      } catch (err) {
        setError(err.message || 'Failed to load highlights.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resetForm = () => {
    setForm({ title: '', titleNe: '', description: '', badge: '', imageUrl: '' });
    setEditingIndex(null);
    setCroppingImageSrc(null);
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (index) => {
    const h = highlights[index];
    setForm({
      title: h.title || '',
      titleNe: h.titleNe || '',
      description: h.description || '',
      badge: h.badge || '',
      imageUrl: h.imageUrl || '',
    });
    setEditingIndex(index);
    setError('');
    setIsModalOpen(true);
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCroppingImageSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (croppedFile) => {
    setUploading(true);
    try {
      let url = '';
      try {
        url = await uploadImage(croppedFile);
      } catch (err) {
        if (err.code === 'IMAGEKIT_NOT_CONFIGURED') {
          url = URL.createObjectURL(croppedFile);
        } else {
          setError(`Failed to upload image: ${err.message}`);
          return;
        }
      }
      if (url) {
        setForm((prev) => ({ ...prev, imageUrl: url }));
        setError('');
      }
    } finally {
      setUploading(false);
      setCroppingImageSrc(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Highlight Title is required.');
      return;
    }
    if (!form.imageUrl.trim()) {
      setError('Please upload a highlight image.');
      return;
    }

    const next = { ...form, title: form.title.trim(), titleNe: form.titleNe.trim(), badge: form.badge.trim(), description: form.description.trim() };

    if (editingIndex === null) {
      if (highlights.length >= MAX_HIGHLIGHTS) {
        setError(`You can only have up to ${MAX_HIGHLIGHTS} highlights.`);
        return;
      }
      setHighlights((prev) => [...prev, { id: `highlight-${Date.now()}`, ...next }]);
    } else {
      setHighlights((prev) => {
        const arr = [...prev];
        arr[editingIndex] = { ...arr[editingIndex], ...next };
        return arr;
      });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (index) => {
    const h = highlights[index];
    if (!window.confirm(`Delete highlight "${h.title}"?`)) return;
    setHighlights((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= highlights.length) return;
    setHighlights((prev) => {
      const arr = [...prev];
      const tmp = arr[index];
      arr[index] = arr[target];
      arr[target] = tmp;
      return arr;
    });
  };

  const handleSaveAll = async () => {
    setError('');
    setSuccessMsg('');
    setSaving(true);
    try {
      const result = await getAdminContent();
      const content = result.websiteData || {};
      const updated = await updateAdminContent({ ...content, highlights });
      setHighlights(Array.isArray(updated.websiteData?.highlights) ? updated.websiteData.highlights : highlights);
      setSuccessMsg('Highlights saved successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save highlights.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card" style={{ marginBottom: 28 }}>
      <div className="admin-page-header-row">
        <div>
          <h2 className="admin-page-title serif">Event Highlights</h2>
          <p className="admin-page-subtitle">
            Showcase top events, achievements, and awards on the public Events page.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-primary"
            onClick={openCreate}
            disabled={highlights.length >= MAX_HIGHLIGHTS}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="fa-solid fa-star" style={{ fontSize: '0.85rem' }} /> Add Highlight
          </button>
        </div>
      </div>

      {error && <div className="login-alert login-alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {successMsg && <div className="login-alert login-alert-info" style={{ marginBottom: 16, background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>{successMsg}</div>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 4 }} aria-busy="true" aria-label="Loading highlights">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}>
              <div className="sk" style={{ height: 170, borderRadius: 0 }} />
              <div style={{ padding: '14px 16px' }}>
                <div className="sk" style={{ height: 15, width: '60%', marginBottom: 8 }} />
                <div className="sk" style={{ height: 12, width: '40%', marginBottom: 10 }} />
                <div className="sk" style={{ height: 12, width: '95%', marginBottom: 6 }} />
                <div className="sk" style={{ height: 12, width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : highlights.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
          <i className="fa-regular fa-star" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: 12, display: 'block' }} />
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#0f172a' }}>No highlights yet</p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Add highlights to celebrate the club's top events and achievements.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 4 }}>
            {highlights.map((h, index) => (
              <div
                key={h.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div style={{ position: 'relative', height: 170, background: '#1e293b' }}>
                  {h.imageUrl ? (
                    <img src={h.imageUrl} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <i className="fa-regular fa-image" style={{ fontSize: '2rem' }} />
                    </div>
                  )}
                  {h.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'linear-gradient(135deg, #79213C, #E8871A)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 20,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {h.badge}
                    </span>
                  )}
                </div>
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: 4 }}>{h.title}</div>
                  {h.titleNe && <div className="devanagari" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>{h.titleNe}</div>}
                  <div style={{ fontSize: '0.8rem', color: '#64748b', flex: 1 }}>{h.description}</div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      title="Move up"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <i className="fa-solid fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === highlights.length - 1}
                      title="Move down"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <i className="fa-solid fa-arrow-down" />
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      onClick={() => openEdit(index)}
                      title="Edit"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleDelete(index)}
                      title="Delete"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSaveAll}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <i className={`fa-solid ${saving ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'}`} />
              {saving ? 'Saving...' : 'Save Highlights'}
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
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
              background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: '640px',
              maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>
                {editingIndex === null ? 'Add Highlight' : 'Edit Highlight'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="login-alert login-alert-error" style={{ marginBottom: 16 }}>{error}</div>}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Highlight Image *</label>
                {form.imageUrl ? (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', maxWidth: 360 }}>
                    <img src={form.imageUrl} alt="Highlight preview" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                        style={{ background: 'rgba(15,23,42,0.8)', color: '#fff', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer' }}
                        title="Remove image"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      border: '2px dashed #cbd5e1', borderRadius: 12, padding: '2rem',
                      cursor: 'pointer', color: '#64748b', fontSize: '0.88rem', fontWeight: 600,
                      maxWidth: 360, background: '#f8fafc'
                    }}
                  >
                    <i className="fa-solid fa-upload" />
                    {uploading ? 'Uploading...' : 'Click to upload image'}
                    <input type="file" accept="image/*" onChange={handleImageFileSelect} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Title (English) *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Best Community Service Project"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Title (Nepali)</label>
                  <input
                    type="text"
                    value={form.titleNe}
                    onChange={(e) => setForm((prev) => ({ ...prev, titleNe: e.target.value }))}
                    placeholder="e.g. उत्कृष्ट सामुदायिक सेवा परियोजना"
                    className="admin-input devanagari"
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Badge / Tag (Optional)</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm((prev) => ({ ...prev, badge: e.target.value }))}
                  placeholder="e.g. Winner 2024, District Award, 50+ Events"
                  className="admin-input"
                  maxLength={100}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="A short description of this highlight..."
                  className="admin-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingIndex === null ? 'Add Highlight' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {croppingImageSrc && (
        <ImageCropModal
          imageSrc={croppingImageSrc}
          cropType="landscape"
          onConfirm={handleCropConfirm}
          onClose={() => setCroppingImageSrc(null)}
        />
      )}
    </div>
  );
}
