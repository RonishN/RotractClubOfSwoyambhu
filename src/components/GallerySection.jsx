import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import { uploadImage } from '../api/client';
import ImageCropModal from './ImageCropModal';
import GalleryLightbox from './GalleryLightbox';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function isSameImage(url1, url2) {
  if (!url1 || !url2) return false;
  let u1 = url1.split('?')[0].replace(/\/tr:[^/]+\//g, '/');
  let u2 = url2.split('?')[0].replace(/\/tr:[^/]+\//g, '/');
  return u1.trim() === u2.trim();
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}



function SortableGalleryItem({
  item,
  index,
  total,
  lightboxIndex,
  handleUpdate,
  handleDelete,
  setEditingCaptionIndex,
  onOpenLightbox,
  onTriggerReplace,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const { isEditMode } = useEditMode();
  const { lang } = useLang();
  const [hovered, setHovered] = useState(false);
  const longPressRef = useRef(null);

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 99 : hovered ? 10 : 1,
    opacity: isDragging ? 0.75 : 1,
  };

  // Mobile long-press to reveal toolbar
  const handlePointerDown = () => {
    longPressRef.current = setTimeout(() => setHovered(true), 400);
  };
  const handlePointerUp = () => {
    clearTimeout(longPressRef.current);
  };

  const actions = [
    {
      icon: 'fa-eye',
      label: 'Preview',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.18)',
      onClick: () => onOpenLightbox(lightboxIndex),
    },
    {
      icon: 'fa-camera',
      label: 'Replace',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.18)',
      onClick: () => onTriggerReplace(index),
    },
    {
      icon: 'fa-pen',
      label: 'Caption',
      color: '#f9a8d4',
      bg: 'rgba(249,168,212,0.18)',
      onClick: () => setEditingCaptionIndex(index),
    },
    {
      icon: 'fa-trash-can',
      label: 'Delete',
      color: '#f87171',
      bg: 'rgba(248,113,113,0.18)',
      onClick: () => {
        if (window.confirm('Delete this photo from the gallery?')) handleDelete(index);
      },
    },
  ];

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={isEditMode ? handlePointerDown : undefined}
      onPointerUp={isEditMode ? handlePointerUp : undefined}
      onPointerCancel={isEditMode ? handlePointerUp : undefined}
    >
      {/* ── Card Image Container ── */}
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: '#111',
          border: isDragging
            ? '2px solid #79213C'
            : hovered && isEditMode
            ? '2px solid rgba(232,135,26,0.6)'
            : '2px solid rgba(121,33,60,0.15)',
          boxShadow: isDragging
            ? '0 12px 30px rgba(121,33,60,0.35)'
            : hovered && isEditMode
            ? '0 8px 32px rgba(0,0,0,0.22)'
            : '0 4px 16px rgba(0,0,0,0.06)',
          transition: 'border 0.2s, box-shadow 0.2s',
          position: 'relative',
          cursor: isEditMode ? 'default' : 'pointer',
          aspectRatio: '1 / 1',
          width: '100%',
        }}
        onClick={() => {
          if (!isEditMode) onOpenLightbox(lightboxIndex);
        }}
      >
        {/* Photo */}
        <img
          src={item.imgUrl}
          alt={item.captionEn || `Photo ${index + 1}`}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease',
            transform: hovered && isEditMode ? 'scale(1.04)' : 'scale(1)',
          }}
        />

        {/* Caption overlay (always visible) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(15,5,10,0.92), transparent)',
            padding: '1.75rem 0.75rem 0.55rem',
            color: 'white',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            opacity: hovered && isEditMode ? 0 : 1,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        >
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
            {lang === 'en' ? item.captionEn || item.captionNe : item.captionNe || item.captionEn || '—'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, flexShrink: 0 }}>
            #{index + 1}
          </span>
        </div>

        {/* ── Edit Mode Hover Overlay ── */}
        {isEditMode && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(160deg, rgba(10,4,8,0.72) 0%, rgba(20,6,14,0.88) 100%)',
              backdropFilter: 'blur(3px)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.22s ease',
              pointerEvents: hovered ? 'auto' : 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Top row: index badge + drag handle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Index badge */}
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '2px 8px',
                  letterSpacing: '0.5px',
                }}
              >
                #{index + 1}
              </span>

              {/* Drag handle */}
              <div
                {...attributes}
                {...listeners}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  color: 'rgba(255,255,255,0.7)',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                title="Drag to reorder"
              >
                <i className="fa-solid fa-grip-vertical" style={{ fontSize: 11 }} />
              </div>
            </div>

            {/* Bottom action bar */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                justifyContent: 'space-around',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 12,
                padding: '8px 4px',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                  title={action.label}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '7px 2px',
                    borderRadius: 9,
                    border: 'none',
                    background: action.bg,
                    color: action.color,
                    cursor: 'pointer',
                    transition: 'background 0.15s, transform 0.12s',
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = action.bg.replace('0.18', '0.35');
                    e.currentTarget.style.transform = 'scale(1.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = action.bg;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i className={`fa-solid ${action.icon}`} style={{ fontSize: 13 }} />
                  <span style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.3px', opacity: 0.85 }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GallerySection({ content = {}, albumId = null }) {
  const { lang } = useLang();
  const { draft, updateDraftArray, persistContent, isEditMode, showToast } = useEditMode();
  const navigate = useNavigate();

  const [editingCaptionIndex, setEditingCaptionIndex] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Index view tabs: 'albums' (default) | 'photos'
  const [tab, setTab] = useState('albums');

  // Album state
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [albumForm, setAlbumForm] = useState({ titleEn: '', titleNe: '', description: '', eventId: '', coverImage: '' });
  const [uploadingCover, setUploadingCover] = useState(false);

  // Cropper state
  const [cropSrc, setCropSrc] = useState(null);
  const [replacingIndex, setReplacingIndex] = useState(null);

  const singleFileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);
  const replaceFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  const hasDraft = draft && Object.keys(draft).length > 0;
  const galleryList = hasDraft ? draft.gallery || [] : content?.gallery || [];
  const albumList = hasDraft ? draft.albums || [] : content?.albums || [];
  const eventList = hasDraft ? draft.eventsList || [] : content?.eventsList || [];

  // Ensure every item has a unique string ID for dnd-kit
  const items = galleryList.map((g, i) => ({ ...g, id: g.id || `img-${i}-${Date.now()}` }));

  // ── View resolution ──
  const isAlbumView = Boolean(albumId);
  const activeAlbum = isAlbumView ? albumList.find(a => a.id === albumId) || null : null;

  // Photos shown in the current view:
  //  - album detail  → only that album's photos
  //  - "All Photos"  → every photo
  //  - "All Albums"  → none (the grid shows album cards instead)
  const scopedItems = isAlbumView
    ? items.filter(g => (g.albumId || '') === albumId && !isSameImage(g.imgUrl, activeAlbum?.coverImage))
    : (tab === 'photos' ? items : []);

  const visibleItems = scopedItems
    .map((item, scopedIndex) => ({
      ...item,
      scopedIndex,
      originalIndex: items.indexOf(item),
    }))
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.captionEn && item.captionEn.toLowerCase().includes(q)) ||
        (item.captionNe && item.captionNe.toLowerCase().includes(q))
      );
    });

  // Intercept the saveAll call from EditModeContext
  const editMode = useEditMode();
  
  useEffect(() => {
    // Monitor global saving state to run bulk upload pre-save sequence
    const interceptSave = async () => {
      const keys = Object.keys(pendingUploadsRef.current);
      if (keys.length > 0 && editMode.saving && !bulkUploading) {
        try {
          const { nextItems, nextAlbums } = await processPendingUploads(items, albumList);
          editMode.updateDraftArray('gallery', nextItems);
          editMode.updateDraftArray('albums', nextAlbums);
        } catch (err) {
          console.error('Error during bulk upload pre-save:', err);
        }
      }
    };
    interceptSave();
  }, [editMode.saving]);

  const openGalleryIndex = () => navigate('/admin/edit/gallery');
  const openAlbum = (id) => navigate(`/admin/edit/gallery/album/${id}`);
  const albumCover = (a) => {
    if (!a) return null;
    if (a.coverImage) return a.coverImage;
    return items.find(g => (g.albumId || '') === a.id)?.imgUrl || null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUpdate = (index, field, value) => {
    const newList = [...items];
    newList[index] = { ...newList[index], [field]: value };
    updateDraftArray('gallery', newList);
  };

  const handleDelete = (index) => {
    const newList = [...items];
    newList.splice(index, 1);
    updateDraftArray('gallery', newList);
    showToast('success', 'Photo removed from gallery');
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      updateDraftArray('gallery', newItems);
    }
  };

  // ── Album management ──
  const openCreateAlbum = () => {
    setEditingAlbum(null);
    setAlbumForm({ titleEn: '', titleNe: '', description: '', eventId: '', coverImage: '' });
    setAlbumModalOpen(true);
  };

  const openEditAlbum = (album) => {
    setEditingAlbum(album);
    setAlbumForm({
      titleEn: album.titleEn || '',
      titleNe: album.titleNe || '',
      description: album.description || '',
      eventId: album.eventId || '',
      coverImage: album.coverImage || '',
    });
    setAlbumModalOpen(true);
  };

  const handleCoverSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const localUrl = await readFileAsBase64(file);
      pendingUploadsRef.current['cover-image'] = file;
      setAlbumForm(prev => ({ ...prev, coverImage: localUrl }));
      showToast('success', 'Album cover preview set! Click Save Album to finalize.');
    } catch (err) {
      showToast('error', 'Failed to read cover image preview.');
    } finally {
      setUploadingCover(false);
    }
    if (e.target) e.target.value = '';
  };

  // Interceptive upload queue for bulk save
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ current: 0, total: 0, actionText: '' });

  const processPendingUploads = async (currentItems, currentAlbums) => {
    const keys = Object.keys(pendingUploadsRef.current);
    if (keys.length === 0 && !albumForm.coverImage?.startsWith('data:image')) {
      return { nextItems: currentItems, nextAlbums: currentAlbums };
    }

    setBulkUploading(true);
    let nextItems = [...currentItems];
    let nextAlbums = [...currentAlbums];

    const totalSteps = keys.length + (albumForm.coverImage?.startsWith('data:image') ? 1 : 0);
    let currentStep = 0;

    // 1. Upload pending cover image if it is base64/local
    if (albumForm.coverImage && albumForm.coverImage.startsWith('data:image') && coverFileInputRef.current) {
      currentStep++;
      setBulkUploadProgress({
        current: currentStep,
        total: totalSteps,
        actionText: 'Uploading album cover image to ImageKit...'
      });
      try {
        // If we cached the cover file, use it
        const coverFile = pendingUploadsRef.current['cover-image'];
        if (coverFile) {
          const remoteUrl = await uploadImage(coverFile);
          albumForm.coverImage = remoteUrl;
          delete pendingUploadsRef.current['cover-image'];
        }
      } catch (err) {
        console.error('Failed to upload cover image:', err);
      }
    }

    // 2. Upload other pending gallery images
    for (let i = 0; i < keys.length; i++) {
      const idKey = keys[i];
      if (idKey === 'cover-image') continue;
      currentStep++;
      
      const fileToUpload = pendingUploadsRef.current[idKey];
      setBulkUploadProgress({
        current: currentStep,
        total: totalSteps,
        actionText: `Uploading image #${currentStep} of ${totalSteps} (${fileToUpload?.name || 'photo'})...`
      });

      try {
        if (fileToUpload) {
          const remoteUrl = await uploadImage(fileToUpload);
          // Find the item with this temporary id and replace its imgUrl/id
          const idx = nextItems.findIndex(item => item.id === idKey);
          if (idx !== -1) {
            nextItems[idx] = {
              ...nextItems[idx],
              id: idKey.startsWith('temp-') ? `img-${Date.now()}-${i}` : idKey,
              imgUrl: remoteUrl
            };
          }
          delete pendingUploadsRef.current[idKey];
        }
      } catch (err) {
        console.error(`Failed to upload item ${idKey}:`, err);
      }
    }

    setBulkUploading(false);
    return { nextItems, nextAlbums };
  };

  const handleSaveAlbum = async () => {
    if (!albumForm.titleEn.trim()) {
      showToast('error', 'Album title (English) is required.');
      return;
    }

    // Upload cover image first if it's local
    let finalCover = albumForm.coverImage;
    if (albumForm.coverImage && albumForm.coverImage.startsWith('data:image')) {
      const coverFile = pendingUploadsRef.current['cover-image'];
      if (coverFile) {
        setBulkUploading(true);
        setBulkUploadProgress({ current: 1, total: 1, actionText: 'Uploading album cover...' });
        try {
          finalCover = await uploadImage(coverFile);
          delete pendingUploadsRef.current['cover-image'];
        } catch (err) {
          showToast('error', 'Failed to upload cover image.');
          setBulkUploading(false);
          return;
        }
        setBulkUploading(false);
      }
    }

    const newList = [...albumList];
    if (editingAlbum) {
      const idx = newList.findIndex(a => a.id === editingAlbum.id);
      if (idx !== -1) {
        newList[idx] = { 
          ...newList[idx], 
          ...albumForm, 
          coverImage: finalCover,
          titleEn: albumForm.titleEn.trim(), 
          titleNe: albumForm.titleNe.trim(), 
          description: albumForm.description.trim() 
        };
      }
      showToast('success', 'Album updated successfully!');
    } else {
      newList.push({
        id: `album-${Date.now()}`,
        titleEn: albumForm.titleEn.trim(),
        titleNe: albumForm.titleNe.trim(),
        description: albumForm.description.trim(),
        eventId: albumForm.eventId,
        coverImage: finalCover,
      });
      showToast('success', 'Album created successfully!');
    }

    // Upload any other pending images in the background if they belong to this album
    const { nextItems, nextAlbums } = await processPendingUploads(items, newList);

    updateDraftArray('albums', nextAlbums);
    updateDraftArray('gallery', nextItems);
    // Persist immediately so the album survives a refresh even if Save isn't clicked
    persistContent({ ...draft, albums: nextAlbums, gallery: nextItems }).catch(() => {});
    setEditingAlbum(null);
    setAlbumModalOpen(false);
  };

  const handleDeleteAlbum = (album) => {
    if (!window.confirm(`Delete album "${album.titleEn}"? Photos in this album will be kept but moved to All Photos.`)) return;
    const nextAlbums = albumList.filter(a => a.id !== album.id);
    const nextGallery = items.map(g => (g.albumId || '') === album.id ? { ...g, albumId: '' } : g);
    updateDraftArray('albums', nextAlbums);
    updateDraftArray('gallery', nextGallery);
    // Persist immediately so the deletion survives a refresh even if Save isn't clicked
    persistContent({ ...draft, albums: nextAlbums, gallery: nextGallery }).catch(() => {});
    if (isAlbumView) openGalleryIndex();
    showToast('success', 'Album deleted.');
  };

  // ── Single file selected: prompt crop modal ──
  const handleSingleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await readFileAsBase64(file);
      setReplacingIndex(null); // Adding new image
      setCropSrc(base64);
    } catch {
      showToast('error', 'Failed to read selected image file.');
    }
    if (e.target) e.target.value = '';
  };

  // ── Replace specific image file selected ──
  const handleReplaceFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) return;
    try {
      const base64 = await readFileAsBase64(file);
      setCropSrc(base64);
    } catch {
      showToast('error', 'Failed to read selected image file.');
    }
    if (e.target) e.target.value = '';
  };

  // Cache of original Files/Blobs that need uploading on bulk save
  const pendingUploadsRef = useRef({});

  // ── Confirm crop and update/add local preview ──
  const handleCropConfirm = async (croppedBlobOrFile) => {
    setCropSrc(null);
    try {
      const localUrl = await readFileAsBase64(croppedBlobOrFile);
      const tempId = `temp-${Date.now()}`;

      if (replacingIndex !== null) {
        // Replacing existing image
        const targetItem = items[replacingIndex];
        // Cache original file for upload using the original item ID or tempId
        const uploadKey = targetItem.id;
        pendingUploadsRef.current[uploadKey] = croppedBlobOrFile;

        handleUpdate(replacingIndex, 'imgUrl', localUrl);
        showToast('success', 'Photo preview updated! Click Save in the Admin bar to save.');
        setReplacingIndex(null);
      } else {
        // Adding new image locally
        pendingUploadsRef.current[tempId] = croppedBlobOrFile;

        const newItem = {
          id: tempId,
          imgUrl: localUrl,
          captionEn: '',
          captionNe: '',
          albumId: isAlbumView ? albumId : '',
        };
        const newList = [...items, newItem];
        updateDraftArray('gallery', newList);
        showToast('success', 'Photo added to album preview! Click Save in the Admin bar to save.');

        // Automatically prompt for captions on the new item
        setEditingCaptionIndex(newList.length - 1);
      }
    } catch (err) {
      showToast('error', 'Failed to read image preview.');
    }
  };

  // ── Batch select multiple photos (stores local previews) ──
  const handleBatchFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsBatchUploading(true);
    setBatchProgress({ current: 0, total: files.length, actionText: 'Generating local previews...' });

    const localItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBatchProgress({ current: i + 1, total: files.length, actionText: `Loading ${file.name}...` });
      try {
        const localUrl = await readFileAsBase64(file);
        const tempId = `temp-${Date.now()}-${i}`;
        
        pendingUploadsRef.current[tempId] = file;

        // Clean caption default from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        localItems.push({
          id: tempId,
          imgUrl: localUrl,
          captionEn: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          captionNe: '',
          albumId: isAlbumView ? albumId : '',
        });
      } catch (err) {
        console.error(`Failed to read local preview for ${file.name}:`, err);
      }
    }

    setIsBatchUploading(false);

    if (localItems.length > 0) {
      updateDraftArray('gallery', [...items, ...localItems]);
      showToast('success', `Added ${localItems.length} photos to preview! Click Save in the Admin bar to save.`);
    } else {
      showToast('error', 'Failed to read selected photos.');
    }

    if (e.target) e.target.value = '';
  };

  const triggerReplace = (index) => {
    setReplacingIndex(index);
    replaceFileInputRef.current?.click();
  };

  return (
    <section id="gallery" style={{ padding: '0 5%', paddingBottom: '4rem' }}>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={singleFileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleSingleFileSelected}
      />
      <input
        type="file"
        ref={batchFileInputRef}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleBatchFileSelected}
      />
      <input
        type="file"
        ref={replaceFileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleReplaceFileSelected}
      />
      <input
        type="file"
        ref={coverFileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCoverSelected}
      />

      {/* ── Top Header Toolbar (Admin Visual Edit Mode) ── */}
      <div
        style={{
          marginTop: '1.5rem',
          marginBottom: '2rem',
          padding: isEditMode ? '16px 20px' : '0',
          background: isEditMode ? 'white' : 'transparent',
          borderRadius: 16,
          boxShadow: isEditMode ? '0 4px 20px rgba(121, 33, 60, 0.08)' : 'none',
          border: isEditMode ? '1px solid rgba(121, 33, 60, 0.12)' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Title & Count */}
          <div>
              {isAlbumView ? (
                <>
                  {activeAlbum && (
                    <button
                      type="button"
                      onClick={openGalleryIndex}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 6,
                        padding: '4px 10px',
                        borderRadius: 20,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#64748b',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.7rem' }} />
                      All Albums
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {activeAlbum?.coverImage && (
                      <img
                        src={activeAlbum.coverImage}
                        alt="Album cover"
                        style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', boxShadow: '0 4px 14px rgba(121,33,60,0.2)' }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <h2
                        className="serif"
                        style={{ margin: 0, textAlign: 'left', fontSize: '1.55rem', color: '#79213C', letterSpacing: '0.3px' }}
                      >
                        {activeAlbum ? activeAlbum.titleEn : 'Album'}
                      </h2>
                      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                        {activeAlbum?.titleNe && <span className="devanagari" style={{ marginRight: 6 }}>{activeAlbum.titleNe}</span>}
                        {activeAlbum?.description || (lang === 'en'
                          ? 'Upload and manage photos in this album.'
                          : 'यस एल्बममा तस्बिरहरू अपलोड र व्यवस्थापन गर्नुहोस्।')}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 6,
                          color: '#64748b',
                          fontSize: '0.86rem',
                        }}
                      >
                        <i className="fa-solid fa-images" style={{ color: '#E8871A' }} />
                        <span>
                          <strong>{scopedItems.length}</strong> {lang === 'en' ? 'Photos in this album' : 'यस एल्बममा तस्बिरहरू'}
                        </span>
                        {activeAlbum?.eventId && (() => {
                          const ev = eventList.find(x => x.id === activeAlbum.eventId);
                          return ev ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', fontWeight: 600, color: '#79213C', background: 'rgba(121,33,60,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                              <i className="fa-solid fa-calendar-day" style={{ fontSize: '0.68rem' }} />
                              {ev.title}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
              <>
                <h2
                  className="serif"
                  style={{ margin: 0, textAlign: 'left', fontSize: '1.55rem', color: '#79213C', letterSpacing: '0.3px' }}
                >
                  {lang === 'en' ? 'Edit Gallery' : <span className="devanagari">ग्यालरी सम्पादन</span>}
                </h2>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                  {lang === 'en'
                    ? 'Upload, caption, and organize photos into albums.'
                    : 'तस्बिरहरू अपलोड, क्याप्सन र एल्बमहरूमा मिलाउनुहोस्।'}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 6,
                    color: '#64748b',
                    fontSize: '0.86rem',
                  }}
                >
                  <i className="fa-solid fa-images" style={{ color: '#E8871A' }} />
                  <span>
                    <strong>{items.length}</strong> {lang === 'en' ? 'Photos in Gallery' : 'तस्बिरहरू'}
                    {albumList.length > 0 && (
                      <span style={{ color: '#94a3b8' }}>
                        {' '}· <strong style={{ color: '#79213C' }}>{albumList.length}</strong> {lang === 'en' ? 'Albums' : 'एल्बमहरू'}
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Admin Action Buttons */}
          {isEditMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {isAlbumView && activeAlbum ? (
                <>
                  {/* Upload Single Photo — opens file picker directly */}
                  <button
                    type="button"
                    onClick={() => singleFileInputRef.current?.click()}
                    style={{
                      background: '#79213C',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(121, 33, 60, 0.35)',
                      transition: 'background 0.2s, transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#61162d';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(121, 33, 60, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#79213C';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(121, 33, 60, 0.35)';
                    }}
                  >
                    <i className="fa-solid fa-camera" /> Upload Photo
                  </button>

                  {/* Batch Upload — opens multi-file picker directly */}
                  <button
                    type="button"
                    onClick={() => batchFileInputRef.current?.click()}
                    style={{
                      background: '#E8871A',
                      color: 'white',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(232, 135, 26, 0.35)',
                      transition: 'background 0.2s, transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#c96e0f';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(232, 135, 26, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#E8871A';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(232, 135, 26, 0.35)';
                    }}
                  >
                    <i className="fa-solid fa-layer-group" /> Bulk Upload
                  </button>

                  {/* Divider */}
                  <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />

                  {/* Edit Album */}
                  <button
                    type="button"
                    onClick={() => openEditAlbum(activeAlbum)}
                    style={{
                      background: 'rgba(121,33,60,0.08)',
                      color: '#79213C',
                      border: '1px solid rgba(121,33,60,0.2)',
                      padding: '10px 16px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-pen" /> Edit Album
                  </button>

                  {/* Delete Album */}
                  <button
                    type="button"
                    onClick={() => handleDeleteAlbum(activeAlbum)}
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.25)',
                      padding: '10px 16px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-trash-can" /> Delete Album
                  </button>
                </>
              ) : tab === 'albums' ? (
                <button
                  type="button"
                  onClick={openCreateAlbum}
                  style={{
                    background: '#E8871A',
                    color: 'white',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(232, 135, 26, 0.35)',
                    transition: 'background 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#c96e0f';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#E8871A';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fa-solid fa-folder-plus" /> New Album
                </button>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#94a3b8', padding: '10px 4px' }}>
                  <i className="fa-solid fa-circle-info" />
                  Upload photos from inside an album
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search bar inside admin view */}
        {isEditMode && (isAlbumView || tab === 'photos') && scopedItems.length > 3 && (
          <div style={{ marginTop: 14, position: 'relative', maxWidth: 360 }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '0.82rem',
              }}
            />
            <input
              type="text"
              placeholder="Filter photos by caption..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#f8fafc',
              }}
            />
          </div>
        )}
      </div>

      {/* ── View Tabs (Index Mode) ── */}
      {!isAlbumView && isEditMode && (
        <div
          style={{
            marginBottom: '1.5rem',
            marginTop: '1rem',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('albums')}
            style={{
              padding: '10px 22px',
              borderRadius: 24,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: tab === 'albums' ? '#79213C' : '#ffffff',
              color: tab === 'albums' ? '#ffffff' : '#475569',
              boxShadow: tab === 'albums' ? '0 4px 14px rgba(121,33,60,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s',
            }}
          >
            <i className="fa-solid fa-folder-open" style={{ marginRight: 8 }} />
            All Albums ({albumList.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('photos')}
            style={{
              padding: '10px 22px',
              borderRadius: 24,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: tab === 'photos' ? '#79213C' : '#ffffff',
              color: tab === 'photos' ? '#ffffff' : '#475569',
              boxShadow: tab === 'photos' ? '0 4px 14px rgba(121,33,60,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s',
            }}
          >
            <i className="fa-solid fa-images" style={{ marginRight: 8 }} />
            All Photos ({items.length})
          </button>
        </div>
      )}

      {/* ── Album Detail: Album Not Found ── */}
      {isAlbumView && !activeAlbum && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: 16,
            border: '2px dashed rgba(121, 33, 60, 0.2)',
            margin: '2rem 0',
          }}
        >
          <i className="fa-solid fa-folder-xmark" style={{ fontSize: '3rem', color: '#79213C', marginBottom: 16, opacity: 0.6 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Album Not Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 20px' }}>
            This album may have been deleted.
          </p>
          <button
            type="button"
            onClick={openGalleryIndex}
            style={{
              background: '#79213C',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i className="fa-solid fa-arrow-left" /> Back to All Albums
          </button>
        </div>
      )}

      {/* ── All Albums Grid (Index Mode Default) ── */}
      {!isAlbumView && tab === 'albums' && (
        <div style={{ marginTop: '0.5rem' }}>
          {albumList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'white',
                borderRadius: 16,
                border: '2px dashed rgba(121, 33, 60, 0.2)',
                margin: '1.5rem 0',
              }}
            >
              <i className="fa-solid fa-folder-plus" style={{ fontSize: '3rem', color: '#79213C', marginBottom: 16, opacity: 0.6 }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No Albums Yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 20px' }}>
                {isEditMode
                  ? 'Create an album to start organizing your photos. Photos are uploaded inside each album.'
                  : 'No albums have been created yet.'}
              </p>
              {isEditMode && (
                <button
                  type="button"
                  onClick={openCreateAlbum}
                  style={{
                    background: '#E8871A',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(232, 135, 26, 0.3)',
                  }}
                >
                  <i className="fa-solid fa-folder-plus" /> Create First Album
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 22,
              }}
            >
              {albumList.map(a => {
                const count = items.filter(g => (g.albumId || '') === a.id).length;
                const cover = a.coverImage || albumCover(a);
                const linkedEvent = a.eventId ? eventList.find(ev => ev.id === a.eventId) : null;
                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openAlbum(a.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAlbum(a.id); } }}
                    style={{
                      background: 'white',
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: '1px solid rgba(121, 33, 60, 0.15)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(121,33,60,0.18)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
                    }}
                  >
                    {/* Cover */}
                    <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'linear-gradient(135deg, #79213C 0%, #3D0C1B 100%)' }}>
                      {cover ? (
                        <img
                          src={cover}
                          alt={a.titleEn}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.85)' }}>
                          <i className="fa-solid fa-images" style={{ fontSize: '2.4rem', opacity: 0.7 }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.5px' }}>NO PHOTOS YET</span>
                        </div>
                      )}

                      {/* Photo count badge */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          background: 'rgba(36,7,19,0.82)',
                          color: 'white',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <i className="fa-solid fa-camera" style={{ fontSize: '0.66rem' }} />
                        {count} photo{count === 1 ? '' : 's'}
                      </div>

                      {/* Admin quick actions */}
                      {isEditMode && (
                        <div
                          style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openEditAlbum(a)}
                            title="Edit Album"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: 'none',
                              background: 'rgba(255,255,255,0.92)', color: '#79213C', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <i className="fa-solid fa-pen" style={{ fontSize: '0.8rem' }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAlbum(a)}
                            title="Delete Album"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: 'none',
                              background: 'rgba(255,255,255,0.92)', color: '#ef4444', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <i className="fa-solid fa-trash-can" style={{ fontSize: '0.8rem' }} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '14px 16px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.titleEn}
                          </div>
                          {a.titleNe && (
                            <div className="devanagari" style={{ fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {a.titleNe}
                            </div>
                          )}
                        </div>
                        <i className="fa-solid fa-angle-right" style={{ color: '#E8871A', marginTop: 3, flexShrink: 0 }} />
                      </div>
                      {linkedEvent && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: '0.72rem', fontWeight: 600, color: '#79213C', background: 'rgba(121,33,60,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                          <i className="fa-solid fa-calendar-day" style={{ fontSize: '0.68rem' }} />
                          {linkedEvent.title}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Photo Views (Album Detail or All Photos) ── */}
      {((!isAlbumView && tab === 'photos') || (isAlbumView && activeAlbum)) && (
        <>
          {/* Batch Upload Progress Overlay */}
          {isBatchUploading && (
            <div
              style={{
                background: 'linear-gradient(135deg, #79213C 0%, #3D0C1B 100%)',
                color: 'white',
                borderRadius: 14,
                padding: '16px 24px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(121, 33, 60, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className="admin-spinner"
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderTopColor: '#E8871A',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                    {batchProgress.actionText || 'Batch uploading photos...'}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    Processing {batchProgress.current} of {batchProgress.total} images
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                {batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0}%
              </div>
            </div>
          )}

          {/* Empty State */}
          {visibleItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'white',
                borderRadius: 16,
                border: '2px dashed rgba(121, 33, 60, 0.2)',
                margin: '1.5rem 0',
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '3rem', color: '#79213C', marginBottom: 16, opacity: 0.6 }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                {isAlbumView ? (isEditMode ? 'This Album is Empty' : 'No Photos Yet') : 'No Photos Yet'}
              </h3>
              {isAlbumView ? (
                <>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 20px' }}>
                    {isEditMode
                      ? <>Upload the first photo into <strong style={{ color: '#79213C' }}>{activeAlbum.titleEn}</strong>.</>
                      : 'This album has no photos yet.'}
                  </p>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => singleFileInputRef.current?.click()}
                      style={{
                        background: '#79213C',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(121, 33, 60, 0.3)',
                      }}
                    >
                      <i className="fa-solid fa-camera" /> Upload First Photo
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 20px' }}>
                    {isEditMode
                      ? <>No photos in the gallery yet. Open an album from the <strong style={{ color: '#79213C' }}>All Albums</strong> tab and upload there.</>
                      : 'No photos have been added to the gallery yet.'}
                  </p>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => setTab('albums')}
                      style={{
                        background: '#E8871A',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(232, 135, 26, 0.3)',
                      }}
                    >
                      <i className="fa-solid fa-folder-open" /> Go to Albums
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="gallery-uniform-grid" style={{ marginTop: '1rem' }}>
                  {visibleItems.map((item) => (
                    <SortableGalleryItem
                      key={item.id}
                      item={item}
                      index={item.originalIndex}
                      lightboxIndex={item.scopedIndex}
                      total={scopedItems.length}
                      handleUpdate={handleUpdate}
                      handleDelete={handleDelete}
                      setEditingCaptionIndex={setEditingCaptionIndex}
                      onOpenLightbox={(idx) => setLightboxIndex(idx)}
                      onTriggerReplace={triggerReplace}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Bottom padding spacer in edit mode */}
          {isEditMode && visibleItems.length > 0 && <div style={{ marginBottom: '2rem' }} />}
        </>
      )}

      {/* ── Bulk / Pending Uploading processing spinner modal ── */}
      {bulkUploading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 380,
              padding: '32px 24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16
            }}
          >
            <span
              className="admin-spinner"
              style={{
                width: 44,
                height: 44,
                borderWidth: 3,
                borderColor: 'rgba(121, 33, 60, 0.15)',
                borderTopColor: '#79213C'
              }}
            />
            <div>
              <h3 className="serif" style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#79213C' }}>
                Processing...
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4 }}>
                {bulkUploadProgress.actionText || 'Saving items...'}
              </p>
              {bulkUploadProgress.total > 0 && (
                <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500 }}>
                  Progress: {bulkUploadProgress.current} / {bulkUploadProgress.total} ({Math.round((bulkUploadProgress.current / bulkUploadProgress.total) * 100)}%)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Image Cropping Modal ── */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          cropType="dynamic"
          onConfirm={handleCropConfirm}
          onClose={() => {
            setCropSrc(null);
            setReplacingIndex(null);
          }}
        />
      )}

      {/* ── Fullscreen Interactive Lightbox ── */}
      <GalleryLightbox
        images={scopedItems}
        currentIndex={lightboxIndex !== null ? lightboxIndex : 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />

      {/* ── Album Management Modal ── */}
      {albumModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setAlbumModalOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 560,
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#79213C', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-folder-open" />
                <span>{editingAlbum ? 'Edit Album' : 'Create New Album'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAlbumModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Album Cover (Thumbnail)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 104,
                      height: 104,
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px dashed #cbd5e1',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {albumForm.coverImage ? (
                      <img
                        src={albumForm.coverImage}
                        alt="Album cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <i className="fa-solid fa-image" style={{ color: '#cbd5e1', fontSize: '1.8rem' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={uploadingCover}
                      style={{
                        background: 'rgba(121,33,60,0.08)',
                        color: '#79213C',
                        border: '1px solid rgba(121,33,60,0.25)',
                        padding: '9px 16px',
                        borderRadius: 8,
                        cursor: uploadingCover ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: uploadingCover ? 0.7 : 1,
                      }}
                    >
                      {uploadingCover ? (
                        <>
                          <span className="admin-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-camera" /> Upload Cover
                        </>
                      )}
                    </button>
                    {albumForm.coverImage && (
                      <button
                        type="button"
                        onClick={() => setAlbumForm(prev => ({ ...prev, coverImage: '' }))}
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.25)',
                          padding: '9px 16px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <i className="fa-solid fa-xmark" /> Remove Cover
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                  If no cover is set, the first photo in the album is used automatically.
                </p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Album Title (English) *</label>
                <input
                  type="text"
                  value={albumForm.titleEn}
                  onChange={(e) => setAlbumForm({ ...albumForm, titleEn: e.target.value })}
                  placeholder="e.g. Heritage Clean-up Drive 2024"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Album Title (Nepali)</label>
                <input
                  type="text"
                  value={albumForm.titleNe}
                  onChange={(e) => setAlbumForm({ ...albumForm, titleNe: e.target.value })}
                  className="devanagari"
                  placeholder="e.g. सम्पदा सरसफाई अभियान २०२४"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Description (Optional)</label>
                <textarea
                  rows={3}
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                  placeholder="Briefly describe this album..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.92rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Linked Event <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                </label>
                <select
                  value={albumForm.eventId}
                  onChange={(e) => setAlbumForm({ ...albumForm, eventId: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.92rem', outline: 'none', background: '#ffffff' }}
                >
                  <option value="">None — standalone album</option>
                  {eventList.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                      {ev.eventDate ? ` (${ev.eventDate})` : ''}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                  Connect this album to an event so its photos appear alongside that event.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setEditingAlbum(null); setAlbumModalOpen(false); }}
                  style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAlbum}
                  style={{ padding: '10px 20px', background: '#79213C', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Album
                </button>
              </div>
            </>
          </div>
        </div>
      )}

      {/* ── Caption Edit Modal ── */}
      {editingCaptionIndex !== null && items[editingCaptionIndex] && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setEditingCaptionIndex(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, color: '#79213C', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-pen-to-square" />
                <span>Edit Photo Caption</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCaptionIndex(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
                padding: 10,
                background: '#f8fafc',
                borderRadius: 10,
              }}
            >
              <img
                src={items[editingCaptionIndex]?.imgUrl}
                alt="Selected"
                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
              />
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                <div><strong>Photo #{editingCaptionIndex + 1}</strong></div>
                <div>Add bilingual descriptions for your gallery photo.</div>
              </div>
            </div>

            {/* English input */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                English Caption
              </label>
              <input
                type="text"
                value={items[editingCaptionIndex]?.captionEn || ''}
                onChange={(e) => handleUpdate(editingCaptionIndex, 'captionEn', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
                placeholder="e.g. Tree plantation drive at Swoyambhu..."
              />
            </div>

            {/* Nepali input */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                Nepali Caption (नेपाली)
              </label>
              <input
                type="text"
                value={items[editingCaptionIndex]?.captionNe || ''}
                onChange={(e) => handleUpdate(editingCaptionIndex, 'captionNe', e.target.value)}
                className="devanagari"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
                placeholder="उदा. स्वयम्भूमा वृक्षारोपण कार्यक्रम..."
              />
            </div>

            {/* Album assignment */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                Album
              </label>
              <select
                value={items[editingCaptionIndex]?.albumId || ''}
                onChange={(e) => handleUpdate(editingCaptionIndex, 'albumId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  background: '#ffffff',
                }}
              >
                <option value="">All Photos (No Album)</option>
                {albumList.map(a => (
                  <option key={a.id} value={a.id}>{a.titleEn}</option>
                ))}
              </select>
              {albumList.length === 0 && (
                <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                  No albums yet. Create an album from the Albums bar to organize your photos.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEditingCaptionIndex(null)}
                style={{
                  padding: '10px 20px',
                  background: '#79213C',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
