import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAdminEvents, createEvent, updateEvent, deleteEvent, uploadImage, deleteImage, notifyEventSubscribers, resetEventNotifiedStates, setPriorityEvent } from '../api/client';
import EventCarousel from '../components/EventCarousel';
import ImageCropModal from '../components/ImageCropModal';
import EventHighlightsManager from '../components/EventHighlightsManager';
import RowActions from '../components/RowActions';

export default function AdminEvents() {
  const { currentUser } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [notifyingId, setNotifyingId] = useState(null);
  const [settingPriorityId, setSettingPriorityId] = useState(null);

  // Form & Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [attendees, setAttendees] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [status, setStatus] = useState('Published');
  const [tagsInput, setTagsInput] = useState('');
  const [pictures, setPictures] = useState([]);
  const [collaborators, setCollaborators] = useState([]); // [{ name, logoUrl }]

  const [pendingFiles, setPendingFiles] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [croppingImageSrc, setCroppingImageSrc] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadingCollabLogo, setUploadingCollabLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pictures of the event being edited (before any edits), so we can clean up
  // ImageKit files for photos the admin removes.
  const originalEventPicturesRef = useRef([]);

  // Search & Filter in Admin list
  const [searchTerm, setSearchTerm] = useState('');

  const canManage = currentUser.role === 'SUPERADMIN' || currentUser.permissions?.includes('EVENT_MANAGER');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getAdminEvents();
      setEvents(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setEventDate('');
    setEventTime('');
    setVenue('');
    setAttendees('');
    setRegistrationLink('');
    setRegistrationClosed(false);
    setStatus('Published');
    setTagsInput('');
    setPictures([]);
    setCollaborators([]);
    originalEventPicturesRef.current = [];
    setPendingFiles([]);
    setCurrentCropIndex(0);
    setCroppingImageSrc(null);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEditClick = (ev) => {
    setIsEditing(true);
    setEditingId(ev.id);
    setTitle(ev.title || '');
    setDescription(ev.description || '');
    setEventDate(ev.eventDate || '');
    setEventTime(ev.eventTime || '');
    setVenue(ev.venue || '');
    setAttendees(ev.attendees || '');
    setRegistrationLink(ev.registrationLink || '');
    setRegistrationClosed(Boolean(ev.registrationClosed));
    setStatus(ev.status || 'Published');
    setTagsInput(Array.isArray(ev.tags) ? ev.tags.join(', ') : '');
    setPictures(Array.isArray(ev.pictures) ? ev.pictures : []);
    originalEventPicturesRef.current = Array.isArray(ev.pictures) ? [...ev.pictures] : [];
    setCollaborators(Array.isArray(ev.collaborators) ? ev.collaborators : []);
    setError('');
    setIsModalOpen(true);
  };

  const handleAddCollaborator = () => {
    setCollaborators((prev) => [...prev, { name: '', logoUrl: '' }]);
  };

  const handleUpdateCollaborator = (index, field, value) => {
    setCollaborators((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveCollaborator = (index) => {
    setCollaborators((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCollaboratorLogoUpload = async (index, file) => {
    if (!file) return;
    setUploadingCollabLogo(true);
    try {
      let url = '';
      try {
        url = await uploadImage(file);
      } catch (err) {
        if (err.code === 'IMAGEKIT_NOT_CONFIGURED') {
          url = URL.createObjectURL(file);
        } else {
          alert(`Failed to upload logo: ${err.message}`);
          return;
        }
      }
      handleUpdateCollaborator(index, 'logoUrl', url);
    } finally {
      setUploadingCollabLogo(false);
    }
  };

  const handleImageFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (pictures.length + files.length > 10) {
      alert(`You can only have up to 10 pictures per event. Currently selected: ${pictures.length}`);
      return;
    }

    setPendingFiles(files);
    setCurrentCropIndex(0);
    // Read first file as data URL to pass to ImageCropModal
    const reader = new FileReader();
    reader.onload = () => {
      setCroppingImageSrc(reader.result);
    };
    reader.readAsDataURL(files[0]);
  };

  const handleCropConfirm = async (croppedFile) => {
    setUploading(true);
    setError('');

    try {
      let url = '';
      try {
        url = await uploadImage(croppedFile);
      } catch (err) {
        if (err.code === 'IMAGEKIT_NOT_CONFIGURED') {
          url = URL.createObjectURL(croppedFile);
        } else {
          alert(`Failed to upload image: ${err.message}`);
        }
      }

      if (url) {
        setPictures((prev) => [...prev, url].slice(0, 10));
      }
    } finally {
      setUploading(false);
    }

    // Process next pending file if any
    const nextIndex = currentCropIndex + 1;
    if (pendingFiles && nextIndex < pendingFiles.length && pictures.length + 1 < 10) {
      setCurrentCropIndex(nextIndex);
      const reader = new FileReader();
      reader.onload = () => {
        setCroppingImageSrc(reader.result);
      };
      reader.readAsDataURL(pendingFiles[nextIndex]);
    } else {
      setPendingFiles([]);
      setCurrentCropIndex(0);
      setCroppingImageSrc(null);
    }
  };

  const handleCropClose = () => {
    const nextIndex = currentCropIndex + 1;
    if (pendingFiles && nextIndex < pendingFiles.length) {
      setCurrentCropIndex(nextIndex);
      const reader = new FileReader();
      reader.onload = () => {
        setCroppingImageSrc(reader.result);
      };
      reader.readAsDataURL(pendingFiles[nextIndex]);
    } else {
      setPendingFiles([]);
      setCurrentCropIndex(0);
      setCroppingImageSrc(null);
    }
  };

  const handleRemovePicture = (index) => {
    setPictures((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMovePicture = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= pictures.length) return;
    const nextPics = [...pictures];
    const temp = nextPics[index];
    nextPics[index] = nextPics[targetIdx];
    nextPics[targetIdx] = temp;
    setPictures(nextPics);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Event Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Event Description is required.');
      return;
    }
    if (!eventDate) {
      setError('Event Date is required.');
      return;
    }
    if (pictures.length === 0) {
      setError('At least 1 event photo is required. You can optionally upload up to 10 photos.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 3); // Max 3 tags

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      eventDate,
      eventTime: eventTime.trim(),
      venue: venue.trim(),
      attendees: attendees.trim(),
      registrationLink: registrationLink.trim(),
      registrationClosed,
      collaborators: collaborators.filter(c => c.name && c.name.trim()),
      status,
      tags: parsedTags,
      pictures,
    };

    try {
      if (isEditing && editingId) {
        await updateEvent(editingId, payload);
        // Clean up ImageKit files for photos that were removed during editing
        const removedPics = originalEventPicturesRef.current.filter(u => !pictures.includes(u));
        removedPics.forEach((u) => { if (u.startsWith('http')) deleteImage(u); });
        setSuccessMsg('Event updated successfully!');
      } else {
        await createEvent(payload);
        setSuccessMsg('Event created successfully!');
      }
      resetForm();
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) return;
    try {
      const ev = events.find((e) => e.id === id);
      await deleteEvent(id);
      // Clean up all uploaded photos for the deleted event
      (ev?.pictures || []).forEach((u) => { if (u.startsWith('http')) deleteImage(u); });
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to delete event.');
    }
  };

  const handleNotifySubscribers = async (ev) => {
    if (!window.confirm(`Send email notification for "${ev.title}" to all subscribers now?`)) return;
    setNotifyingId(ev.id);
    setError('');
    setSuccessMsg('');
    try {
      const res = await notifyEventSubscribers(ev.id);
      setSuccessMsg(res.message || 'Subscribers notified successfully!');
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to notify subscribers.');
    } finally {
      setNotifyingId(null);
    }
  };

  const handleSetPriority = async (ev) => {
    setSettingPriorityId(ev.id);
    setError('');
    setSuccessMsg('');
    try {
      const res = await setPriorityEvent(ev.id);
      setSuccessMsg(res.message || 'Priority updated!');
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to update priority.');
    } finally {
      setSettingPriorityId(null);
    }
  };

  const handleResetNotified = async () => {
    if (!window.confirm('Are you sure you want to reset notification state for ALL events? This will make the Notify button active again for all upcoming events.')) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await resetEventNotifiedStates();
      setSuccessMsg(res.message || 'Reset all event notified states!');
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to reset notified states.');
    }
  };

  const handleExportEvents = () => {
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swoyambhu_events_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canManage) return <div>Access Denied: Requires EVENT_MANAGER or SUPERADMIN permission.</div>;

  const filteredEvents = events.filter((ev) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      ev.title?.toLowerCase().includes(q) ||
      ev.description?.toLowerCase().includes(q) ||
      ev.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-card">
      <div className="admin-page-header-row">
        <div>
          <h2 className="admin-page-title serif">Events Manager</h2>
          <p className="admin-page-subtitle">Add, edit, publish, and manage past and upcoming events done by the club.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            + Create New Event
          </button>
          <button className="admin-btn admin-btn-outline" onClick={handleExportEvents} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Data
          </button>
        </div>
      </div>

      {error && <div className="login-alert login-alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {successMsg && <div className="login-alert login-alert-info" style={{ marginBottom: 16, background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>{successMsg}</div>}

      {/* Event Creator Modal Overlay */}
      {isModalOpen && (
        <div
          onClick={closeModal}
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
              background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: '850px',
              maxHeight: '90vh', overflowY: 'auto', padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>
                {isEditing ? 'Edit Event Record' : 'Create New Event'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Event Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Heritage Clean-up Drive"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input">
                    <option value="Published">Published (Visible on site)</option>
                    <option value="Draft">Draft (Hidden from public)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Event Description *</label>
                <textarea
                  rows="4"
                  placeholder="Describe the event, objectives, highlights and impact..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="admin-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Event Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Event Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 2:00 PM"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Attendees / Guests</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 Rotaractors, 3 Guests"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Swayambhu Community Hall, Kathmandu"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Registration Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://forms.google.com/... or https://event.com/register"
                    value={registrationLink}
                    onChange={(e) => setRegistrationLink(e.target.value)}
                    className="admin-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, display: 'block' }}>Registration Control</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: registrationClosed ? '#fef2f2' : '#f0fdf4', padding: '10px 14px', borderRadius: 10, border: registrationClosed ? '1px solid #fca5a5' : '1px solid #86efac' }}>
                    <input
                      type="checkbox"
                      checked={registrationClosed}
                      onChange={(e) => setRegistrationClosed(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#ef4444' }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: registrationClosed ? '#991b1b' : '#166534', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i className={`fa-solid ${registrationClosed ? 'fa-ban' : 'fa-circle-check'}`} />
                      {registrationClosed ? 'Registration Closed (Disabled)' : 'Registration Open'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Tags (Up to 3, comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Community, Environment, Swoyambhu"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="admin-input"
                />
              </div>

              {/* Collaborators Section */}
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Collaborators / Partner Organizations
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={handleAddCollaborator}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    + Add Collaborator
                  </button>
                </div>

                {collaborators.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {collaborators.map((collab, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {collab.logoUrl ? (
                            <img src={collab.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Logo</span>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Collaborator / Partner Name (e.g. Rotary Club of Swoyambhu)"
                          value={collab.name}
                          onChange={(e) => handleUpdateCollaborator(idx, 'name', e.target.value)}
                          className="admin-input"
                          style={{ flex: 1 }}
                        />

                        <input
                          type="file"
                          id={`collab-logo-${idx}`}
                          accept="image/*"
                          onChange={(e) => handleCollaboratorLogoUpload(idx, e.target.files[0])}
                          style={{ display: 'none' }}
                          disabled={uploadingCollabLogo}
                        />
                        <label
                          htmlFor={`collab-logo-${idx}`}
                          className="admin-btn admin-btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
                        >
                          {collab.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </label>

                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleRemoveCollaborator(idx)}
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    No collaborators added. Click <strong>+ Add Collaborator</strong> if this event was organized jointly with partner clubs or sponsors.
                  </div>
                )}
              </div>

              {/* Pictures Upload Section */}
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Event Pictures * <span style={{ color: '#64748b', fontWeight: 400 }}>({pictures.length}/10 selected)</span>
                  </label>
                  <input
                    type="file"
                    id="event-photos-input"
                    multiple
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    style={{ display: 'none' }}
                    disabled={pictures.length >= 10 || uploading}
                  />
                  <label
                    htmlFor="event-photos-input"
                    className={`admin-btn ${pictures.length >= 10 || uploading ? 'admin-btn-outline' : 'admin-btn-primary'}`}
                    style={{ cursor: pictures.length >= 10 || uploading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', margin: 0 }}
                  >
                    {uploading ? 'Uploading...' : '+ Upload Photos'}
                  </label>
                </div>

                {/* Cropping Modal for Event Pictures */}
                {croppingImageSrc && (
                  <ImageCropModal
                    imageSrc={croppingImageSrc}
                    cropType="landscape"
                    onConfirm={handleCropConfirm}
                    onClose={handleCropClose}
                  />
                )}

                {/* Picture Thumbnails with Order controls */}
                {pictures.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, marginTop: 16 }}>
                    {pictures.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ width: '100%', height: 110, background: '#1e293b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Controls overlay */}
                        <div style={{
                          background: '#0f172a', color: '#fff',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderTop: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleMovePicture(idx, -1)}
                            disabled={idx === 0}
                            style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: 2 }}
                          >
                            ◀
                          </button>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>#{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleMovePicture(idx, 1)}
                            disabled={idx === pictures.length - 1}
                            style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', opacity: idx === pictures.length - 1 ? 0.3 : 1, padding: 2 }}
                          >
                            ▶
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePicture(idx)}
                          title="Remove image"
                          style={{
                            position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                            background: '#ef4444', color: '#fff', border: 'none', fontSize: '0.8rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 5
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                    No images uploaded yet. Click <strong>+ Upload Photos</strong> to select up to 10 images for this event.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting || uploading}>
                  {submitting ? 'Saving Event...' : isEditing ? 'Update Event' : 'Create & Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Events List: Desktop Table vs Mobile Cards */}
      <div>
        <div className="admin-filter-bar">
          <h3 className="admin-card-title" style={{ margin: 0 }}>Managed Events ({events.length})</h3>
          <input
            type="text"
            placeholder="Filter list by title or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input"
            style={{ maxWidth: 280 }}
          />
        </div>

        {/* Event View Modal (Read-only) */}
        {viewingEvent && (
          <div
            onClick={() => setViewingEvent(null)}
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
                background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: '720px',
                maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <h3 className="serif" style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Event Details</h3>
                <button
                  type="button"
                  onClick={() => setViewingEvent(null)}
                  style={{
                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <span className={`admin-badge ${viewingEvent.status === 'Draft' ? 'admin-badge-neutral' : 'admin-badge-success'}`}>
                  {viewingEvent.status || 'Published'}
                </span>
                {viewingEvent.isPriority && (
                  <span className="admin-badge" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff' }}>
                    <i className="fa-solid fa-star" style={{ marginRight: 4 }} /> Priority
                  </span>
                )}
              </div>

              <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.5rem', lineHeight: 1.3 }} className="serif">{viewingEvent.title}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: '#64748b', fontSize: '0.88rem', fontWeight: 600, margin: '4px 0 18px' }}>
                <span><i className="fa-regular fa-calendar" style={{ marginRight: 5, color: 'var(--magenta)' }} />{viewingEvent.eventDate}</span>
                {viewingEvent.eventTime && <span><i className="fa-regular fa-clock" style={{ marginRight: 5, color: '#94a3b8' }} />{viewingEvent.eventTime}</span>}
                {viewingEvent.venue && <span><i className="fa-solid fa-location-dot" style={{ marginRight: 5, color: '#94a3b8' }} />{viewingEvent.venue}</span>}
                {viewingEvent.attendees && <span><i className="fa-solid fa-users" style={{ marginRight: 5, color: '#94a3b8' }} />{viewingEvent.attendees}</span>}
              </div>

              {viewingEvent.description && (
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 18px' }}>{viewingEvent.description}</p>
              )}

              {viewingEvent.pictures?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    <i className="fa-solid fa-images" style={{ marginRight: 5 }} /> Photos ({viewingEvent.pictures.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                    {viewingEvent.pictures.map((url, idx) => (
                      <img key={idx} src={url} alt={`${viewingEvent.title} ${idx + 1}`} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                {viewingEvent.tags?.map((t) => (
                  <span key={t} className="admin-badge admin-badge-info">#{t}</span>
                ))}
                {(!viewingEvent.tags || viewingEvent.tags.length === 0) && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No tags</span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                {viewingEvent.registrationLink && (
                  <a
                    href={viewingEvent.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: 6 }} /> Open Registration Link
                  </a>
                )}
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => { setViewingEvent(null); handleEditClick(viewingEvent); }}>
                  <i className="fa-solid fa-pen" style={{ marginRight: 6 }} /> Edit Event
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="admin-table-container desktop-only-table" aria-busy="true" aria-label="Loading events">
            <table className="admin-table">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ width: 48 }}><div className="sk" style={{ height: 18, width: 18, margin: '0 auto' }} /></td>
                    <td><div className="sk" style={{ height: 16, width: '40%' }} /></td>
                    <td><div className="sk" style={{ height: 16, width: '65%' }} /></td>
                    <td><div className="sk" style={{ height: 16, width: 60 }} /></td>
                    <td><div className="sk" style={{ height: 18, width: 80 }} /></td>
                    <td><div className="sk" style={{ height: 16, width: 100 }} /></td>
                    <td style={{ width: 150 }}><div className="sk" style={{ height: 28, width: 90 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 12 }}>
            No events found.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="admin-table-container desktop-only-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 48, textAlign: 'center' }}>⭐</th>
                    <th>Event</th>
                    <th>Date &amp; Time</th>
                    <th>Photos</th>
                    <th>Status</th>
                    <th>Tags</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev) => (
                    <tr key={ev.id} style={{ background: ev.isPriority ? 'linear-gradient(90deg,rgba(251,191,36,0.09),transparent)' : undefined, outline: ev.isPriority ? '2px solid rgba(245,158,11,0.3)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          title={ev.isPriority ? 'Remove priority' : 'Set as priority (shown to first-time visitors)'}
                          onClick={() => handleSetPriority(ev)}
                          disabled={settingPriorityId === ev.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, filter: ev.isPriority ? 'drop-shadow(0 0 5px rgba(245,158,11,0.9))' : 'grayscale(1) opacity(0.4)', transition: 'filter 0.2s, transform 0.2s', transform: settingPriorityId === ev.id ? 'scale(0.85)' : 'scale(1)' }}
                        >{ev.isPriority ? '⭐' : '⭐'}</button>
                      </td>
                      <td>
                        {ev.isPriority && <div style={{ fontSize: '0.7rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontWeight: 700, marginBottom: 4, letterSpacing: '0.3px' }}>PRIORITY EVENT</div>}
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{ev.title}</div>
                        {ev.attendees && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Attendees: {ev.attendees}</div>}
                        {ev.venue && <div style={{ fontSize: '0.75rem', color: '#475569' }}><i className="fa-solid fa-location-dot" style={{ marginRight: 4 }} />{ev.venue}</div>}
                        {ev.collaborators && ev.collaborators.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                            Collabs: {ev.collaborators.map(c => c.name).join(', ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{ev.eventDate}</div>
                        {ev.eventTime && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ev.eventTime}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="admin-badge admin-badge-info">{ev.pictures?.length || 0} Photos</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${ev.status === 'Draft' ? 'admin-badge-neutral' : 'admin-badge-success'}`}>
                          {ev.status || 'Published'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {ev.tags?.map((t) => (
                            <span key={t} className="admin-badge admin-badge-neutral">#{t}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <RowActions
                          onView={() => setViewingEvent(ev)}
                          onEdit={() => handleEditClick(ev)}
                          onDelete={() => handleDelete(ev.id, ev.title)}
                          viewTitle="View Event"
                          more={[
                            {
                              label: ev.notifiedSubscribers ? 'Notified Subscribers' : 'Notify Subscribers',
                              icon: ev.notifiedSubscribers ? 'fa-bell-slash' : 'fa-bell',
                              disabled: ev.notifiedSubscribers || notifyingId === ev.id,
                              hidden: ev.eventDate < new Date().toISOString().split('T')[0] || ev.status === 'Draft',
                              onClick: () => handleNotifySubscribers(ev),
                            },
                            {
                              label: ev.isPriority ? 'Remove Priority' : 'Set as Priority',
                              icon: ev.isPriority ? 'fa-star' : 'fa-star',
                              disabled: settingPriorityId === ev.id,
                              onClick: () => handleSetPriority(ev),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="mobile-only-cards">
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="mobile-admin-card" style={{ borderLeft: ev.isPriority ? '4px solid #79213C' : undefined, background: ev.isPriority ? '#fdf2f4' : undefined }}>
                  <div className="mobile-card-top">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {ev.isPriority && (
                        <div style={{ fontSize: '0.7rem', background: 'var(--magenta)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontWeight: 700, marginBottom: 4 }}>
                          <i className="fa-solid fa-star" /> PRIORITY
                        </div>
                      )}
                      <h4 className="mobile-card-title">{ev.title}</h4>
                      <div className="mobile-card-subtitle">
                        <i className="fa-regular fa-calendar" style={{ marginRight: 4, color: 'var(--magenta)' }} />
                        {ev.eventDate} {ev.eventTime ? `| ` : ''}
                        {ev.eventTime && <><i className="fa-regular fa-clock" style={{ marginLeft: 4, marginRight: 4, color: '#94a3b8' }} />{ev.eventTime}</>}
                      </div>
                    </div>
                    <span className={`admin-badge ${ev.status === 'Draft' ? 'admin-badge-neutral' : 'admin-badge-success'}`}>
                      {ev.status || 'Published'}
                    </span>
                  </div>

                  {ev.venue && (
                    <div className="mobile-card-meta">
                      <i className="fa-solid fa-location-dot" style={{ marginRight: 4, color: 'var(--magenta)' }} />
                      {ev.venue}
                    </div>
                  )}

                  {ev.attendees && (
                    <div className="mobile-card-meta">
                      <i className="fa-solid fa-users" style={{ marginRight: 4, color: 'var(--magenta)' }} />
                      {ev.attendees}
                    </div>
                  )}
                  
                  <div className="mobile-card-tags">
                    <span className="admin-badge admin-badge-info">
                      <i className="fa-solid fa-camera" style={{ marginRight: 4 }} />
                      {ev.pictures?.length || 0} Photos
                    </span>
                    {ev.tags?.map((t) => (
                      <span key={t} className="admin-badge admin-badge-neutral">#{t}</span>
                    ))}
                  </div>

                  <div className="mobile-card-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      onClick={() => handleSetPriority(ev)}
                      disabled={settingPriorityId === ev.id}
                      style={{ padding: '8px 12px', fontSize: '0.82rem', borderColor: ev.isPriority ? 'var(--magenta)' : undefined, color: ev.isPriority ? 'var(--magenta)' : undefined, fontWeight: ev.isPriority ? 700 : undefined }}
                    >
                      <i className={`fa-${ev.isPriority ? 'solid' : 'regular'} fa-star`} style={{ marginRight: 4 }} />
                      {settingPriorityId === ev.id ? '...' : ev.isPriority ? 'Remove Priority' : 'Set Priority'}
                    </button>
                    {ev.eventDate >= new Date().toISOString().split('T')[0] && ev.status !== 'Draft' && (
                      <button
                        type="button"
                        className={`admin-btn ${ev.notifiedSubscribers ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                        onClick={() => handleNotifySubscribers(ev)}
                        disabled={ev.notifiedSubscribers || notifyingId === ev.id}
                        style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                      >
                        <i className={`fa-solid ${ev.notifiedSubscribers ? 'fa-check' : notifyingId === ev.id ? 'fa-spinner fa-spin' : 'fa-bell'}`} style={{ marginRight: 4 }} />
                        {ev.notifiedSubscribers ? 'Notified' : notifyingId === ev.id ? 'Sending...' : 'Notify'}
                      </button>
                    )}
                    <button className="admin-btn admin-btn-outline" onClick={() => handleEditClick(ev)} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                      <i className="fa-solid fa-pen" style={{ marginRight: 4 }} /> Edit
                    </button>
                    <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(ev.id, ev.title)} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                      <i className="fa-solid fa-trash" style={{ marginRight: 4 }} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) on Mobile */}
      <button 
        className="admin-mobile-fab"
        onClick={openCreateModal}
        title="Create New Event"
        aria-label="Create Event"
      >
        +
      </button>

      <EventHighlightsManager />
    </div>
  );
}