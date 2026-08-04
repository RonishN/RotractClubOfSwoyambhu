import React, { useState, useRef } from 'react';
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PillBtn({ onClick, disabled, title, style = {}, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'background 0.15s, transform 0.1s, opacity 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
}

function SortableGalleryItem({
  item,
  index,
  total,
  handleUpdate,
  handleDelete,
  handleMove,
  handleMoveToTop,
  handleMoveToBottom,
  setEditingCaptionIndex,
  onOpenLightbox,
  onTriggerReplace,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const { isEditMode } = useEditMode();
  const { lang } = useLang();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 99 : 1,
    opacity: isDragging ? 0.8 : 1,
    marginBottom: '24px',
    breakInside: 'avoid',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* ── Edit mode: floating pill toolbar ── */}
      {isEditMode && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: 'rgba(36, 7, 19, 0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: 50,
            padding: '4px 6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              color: 'white',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Drag to reorder"
          >
            <i className="fa-solid fa-grip-vertical" style={{ fontSize: '11px' }} />
          </div>

          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />

          {/* Quick Move: To Top */}
          <PillBtn
            onClick={() => handleMoveToTop(index)}
            disabled={index === 0}
            title="Move to Top"
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fbcfe8' }}
          >
            <i className="fa-solid fa-angles-up" style={{ fontSize: '10px' }} />
          </PillBtn>

          {/* Quick Move: Left / Up */}
          <PillBtn
            onClick={() => handleMove(index, index - 1)}
            disabled={index === 0}
            title="Move Earlier"
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fbcfe8' }}
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: '10px' }} />
          </PillBtn>

          {/* Quick Move: Right / Down */}
          <PillBtn
            onClick={() => handleMove(index, index + 1)}
            disabled={index === total - 1}
            title="Move Later"
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fbcfe8' }}
          >
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }} />
          </PillBtn>

          {/* Quick Move: To Bottom */}
          <PillBtn
            onClick={() => handleMoveToBottom(index)}
            disabled={index === total - 1}
            title="Move to Bottom"
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fbcfe8' }}
          >
            <i className="fa-solid fa-angles-down" style={{ fontSize: '10px' }} />
          </PillBtn>

          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />

          {/* Preview / Lightbox */}
          <PillBtn
            onClick={() => onOpenLightbox(index)}
            title="Enlarge & Preview Lightbox"
            style={{ background: 'rgba(232, 135, 26, 0.3)', color: '#fcd34d' }}
          >
            <i className="fa-solid fa-eye" style={{ fontSize: '10px' }} />
          </PillBtn>

          {/* Replace Photo */}
          <PillBtn
            onClick={() => onTriggerReplace(index)}
            title="Replace Photo"
            style={{ background: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd' }}
          >
            <i className="fa-solid fa-camera" style={{ fontSize: '10px' }} />
          </PillBtn>

          {/* Edit Captions */}
          <PillBtn
            onClick={() => setEditingCaptionIndex(index)}
            title="Edit Captions"
            style={{ background: 'rgba(121, 33, 60, 0.4)', color: '#fbcfe8' }}
          >
            <i className="fa-solid fa-pen" style={{ fontSize: '10px' }} />
          </PillBtn>

          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />

          {/* Delete */}
          <PillBtn
            onClick={() => {
              if (window.confirm('Delete this photo from the gallery?')) handleDelete(index);
            }}
            title="Delete Photo"
            style={{ background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
          >
            <i className="fa-solid fa-trash-can" style={{ fontSize: '10px' }} />
          </PillBtn>
        </div>
      )}

      {/* ── Card Image Container ── */}
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: 'white',
          border: isDragging ? '2px solid #79213C' : '2px solid rgba(121, 33, 60, 0.15)',
          boxShadow: isDragging
            ? '0 12px 30px rgba(121, 33, 60, 0.25)'
            : '0 4px 16px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          position: 'relative',
          cursor: isEditMode ? 'default' : 'pointer',
        }}
        onClick={() => {
          if (!isEditMode) onOpenLightbox(index);
        }}
      >
        <img
          src={item.imgUrl}
          alt={item.captionEn || `Photo ${index + 1}`}
          loading="lazy"
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
        />

        {/* Caption snippet banner */}
        {(item.captionEn || item.captionNe) && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.82rem',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
              {lang === 'en' ? item.captionEn || item.captionNe : item.captionNe || item.captionEn}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#79213C', fontWeight: 600, flexShrink: 0 }}>
              #{index + 1}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GallerySection({ content = {} }) {
  const { lang } = useLang();
  const { draft, updateDraftArray, isEditMode, showToast } = useEditMode();

  const [editingCaptionIndex, setEditingCaptionIndex] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [insertPosition, setInsertPosition] = useState('top'); // 'top' or 'bottom'
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Cropper state
  const [cropSrc, setCropSrc] = useState(null);
  const [replacingIndex, setReplacingIndex] = useState(null);

  const singleFileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);
  const replaceFileInputRef = useRef(null);

  const hasDraft = draft && Object.keys(draft).length > 0;
  const galleryList = hasDraft ? draft.gallery || [] : content?.gallery || [];

  // Ensure every item has a unique string ID for dnd-kit
  const items = galleryList.map((g, i) => ({ ...g, id: g.id || `img-${i}-${Date.now()}` }));

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

  const handleMove = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = arrayMove(items, fromIndex, toIndex);
    updateDraftArray('gallery', newItems);
  };

  const handleMoveToTop = (index) => {
    if (index === 0) return;
    const newItems = arrayMove(items, index, 0);
    updateDraftArray('gallery', newItems);
  };

  const handleMoveToBottom = (index) => {
    if (index === items.length - 1) return;
    const newItems = arrayMove(items, index, items.length - 1);
    updateDraftArray('gallery', newItems);
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

  // ── Confirm crop and upload ──
  const handleCropConfirm = async (croppedBlobOrFile) => {
    setCropSrc(null);
    try {
      showToast('info', 'Uploading cropped image...');
      let url;
      try {
        url = await uploadImage(croppedBlobOrFile);
      } catch (err) {
        if (err?.code === 'IMAGEKIT_NOT_CONFIGURED') {
          url = await readFileAsBase64(croppedBlobOrFile);
          showToast('error', 'ImageKit not configured; saved local preview.');
        } else {
          throw err;
        }
      }

      if (replacingIndex !== null) {
        // Replacing existing image
        handleUpdate(replacingIndex, 'imgUrl', url);
        showToast('success', 'Photo replaced successfully!');
        setReplacingIndex(null);
      } else {
        // Adding new image directly without empty box
        const newItem = {
          id: Date.now().toString(),
          imgUrl: url,
          captionEn: '',
          captionNe: '',
        };
        const newList = insertPosition === 'top' ? [newItem, ...items] : [...items, newItem];
        updateDraftArray('gallery', newList);
        showToast('success', `Photo added to ${insertPosition === 'top' ? 'top' : 'bottom'} of gallery!`);

        // Automatically prompt for captions on the new item
        const newIdx = insertPosition === 'top' ? 0 : newList.length - 1;
        setEditingCaptionIndex(newIdx);
      }
    } catch (err) {
      showToast('error', err?.message || 'Failed to upload photo.');
    }
  };

  // ── Batch upload multiple photos at once ──
  const handleBatchFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsBatchUploading(true);
    setBatchProgress({ current: 0, total: files.length });

    const uploadedItems = [];

    for (let i = 0; i < files.length; i++) {
      setBatchProgress({ current: i + 1, total: files.length });
      const file = files[i];
      try {
        let url;
        try {
          url = await uploadImage(file);
        } catch (err) {
          if (err?.code === 'IMAGEKIT_NOT_CONFIGURED') {
            url = await readFileAsBase64(file);
          } else {
            throw err;
          }
        }

        // Clean caption default from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        uploadedItems.push({
          id: `${Date.now()}-${i}`,
          imgUrl: url,
          captionEn: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          captionNe: '',
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setIsBatchUploading(false);

    if (uploadedItems.length > 0) {
      const newList =
        insertPosition === 'top' ? [...uploadedItems, ...items] : [...items, ...uploadedItems];
      updateDraftArray('gallery', newList);
      showToast('success', `Successfully uploaded ${uploadedItems.length} photos!`);
    } else {
      showToast('error', 'Failed to upload selected photos.');
    }

    if (e.target) e.target.value = '';
  };

  const triggerReplace = (index) => {
    setReplacingIndex(index);
    replaceFileInputRef.current?.click();
  };

  // Filter items if searching
  const filteredItems = items
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.captionEn && item.captionEn.toLowerCase().includes(q)) ||
        (item.captionNe && item.captionNe.toLowerCase().includes(q))
      );
    });

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
            <h2
              className="section-title"
              style={{ margin: 0, textAlign: 'left', fontSize: '1.75rem', color: '#79213C' }}
            >
              {lang === 'en' ? 'Edit Gallery' : <span className="devanagari">ग्यालरी सम्पादन</span>}
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
                color: '#64748b',
                fontSize: '0.86rem',
              }}
            >
              <i className="fa-solid fa-images" style={{ color: '#E8871A' }} />
              <span>
                <strong>{items.length}</strong> {lang === 'en' ? 'Photos in Gallery' : 'तस्बिरहरू'}
              </span>
            </div>
          </div>

          {/* Admin Action Buttons & Position Toggle */}
          {isEditMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {/* Insert Position Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '3px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: '0.8rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setInsertPosition('top')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 7,
                    border: 'none',
                    background: insertPosition === 'top' ? '#79213C' : 'transparent',
                    color: insertPosition === 'top' ? 'white' : '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                  }}
                  title="New photos will appear at the top"
                >
                  <i className="fa-solid fa-arrow-up" style={{ fontSize: '10px' }} /> Add to Top
                </button>
                <button
                  type="button"
                  onClick={() => setInsertPosition('bottom')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 7,
                    border: 'none',
                    background: insertPosition === 'bottom' ? '#79213C' : 'transparent',
                    color: insertPosition === 'bottom' ? 'white' : '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                  }}
                  title="New photos will appear at the bottom"
                >
                  <i className="fa-solid fa-arrow-down" style={{ fontSize: '10px' }} /> Add to Bottom
                </button>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />

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
            </div>
          )}
        </div>

        {/* Search bar inside admin view */}
        {isEditMode && items.length > 3 && (
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

      {/* ── Batch Upload Progress Overlay ── */}
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
                Batch uploading photos...
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
            {Math.round((batchProgress.current / batchProgress.total) * 100)}%
          </div>
        </div>
      )}

      {/* ── Masonry/Grid Photos Area ── */}
      {items.length === 0 ? (
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
          <i
            className="fa-solid fa-cloud-arrow-up"
            style={{ fontSize: '3rem', color: '#79213C', marginBottom: 16, opacity: 0.6 }}
          />
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Your Gallery is Empty</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 20px' }}>
            Click below to open your file explorer and upload your first high-quality photos.
          </p>
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
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div
              style={{
                columnCount: 3,
                columnGap: '24px',
                marginTop: '1rem',
              }}
              className="gallery-columns"
            >
              {filteredItems.map((item) => (
                <SortableGalleryItem
                  key={item.id}
                  item={item}
                  index={item.originalIndex}
                  total={items.length}
                  handleUpdate={handleUpdate}
                  handleDelete={handleDelete}
                  handleMove={handleMove}
                  handleMoveToTop={handleMoveToTop}
                  handleMoveToBottom={handleMoveToBottom}
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
      {isEditMode && items.length > 0 && <div style={{ marginBottom: '2rem' }} />}

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
        images={items}
        currentIndex={lightboxIndex !== null ? lightboxIndex : 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />

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
