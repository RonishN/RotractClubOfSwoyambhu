import React, { useRef, useState, useEffect } from 'react';
import { useEditMode } from '../context/EditModeContext';
import { uploadImage } from '../api/client';
import ImageCropModal from './ImageCropModal';

// Placeholder SVG shown when an image URL is broken or missing
const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ENo Image%3C/text%3E%3Ctext x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%23cbd5e1'%3EClick to upload%3C/text%3E%3C/svg%3E";

/**
 * Reads a File as a base64 data URL for local preview.
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditableImage({ src, alt, className, style, onChange, cropType, hideEditBadge }) {
  const { isEditMode, showToast } = useEditMode();
  const fileInputRef = useRef(null);
  
  const [uploading, setUploading] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null); // base64 source for cropping
  const [hasError, setHasError] = useState(false);

  // Reset error state when the src URL changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Fallback to placeholder if there is no src or if the image fails to load
  const displaySrc = hasError || !src ? PLACEHOLDER_SVG : src;

  // In non-edit mode: render a plain <img>, with dynamic fallback on loading error
  if (!isEditMode) {
    return (
      <img 
        src={displaySrc} 
        alt={alt} 
        className={className} 
        style={style} 
        onError={() => setHasError(true)}
      />
    );
  }

  // Intercept file selection to prompt cropping first
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Src = await readFileAsBase64(file);
      if (cropType) {
        setTempImageSrc(base64Src);
      } else {
        await handleUpload(file);
      }
    } catch {
      showToast('error', 'Failed to load the selected image file.', false);
    }

    if (e.target) e.target.value = '';
  };

  // Perform upload to server
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange?.(url);
      showToast('success', 'Image uploaded successfully!');
    } catch (err) {
      if (err?.code === 'IMAGEKIT_NOT_CONFIGURED') {
        try {
          const base64url = await readFileAsBase64(file);
          onChange?.(base64url);
          showToast('error',
            '⚠️ ImageKit is not configured. Image is a local preview only — it will be lost on page reload. ' +
            'Configure IMAGEKIT keys in your server .env to persist images.',
            false
          );
        } catch {
          showToast('error', 'Failed to read the image file. Please try again.', false);
        }
      } else {
        showToast('error', err?.message || 'Image upload failed. Please try again.', false);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCropConfirm = (croppedFile) => {
    setTempImageSrc(null); // Close crop modal
    handleUpload(croppedFile);
  };

  const hStyle = cropType === 'dynamic' ? 'auto' : '100%';

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: hStyle, overflow: 'visible' }}>
        <label
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            height: hStyle,
            cursor: uploading ? 'wait' : 'pointer',
            overflow: 'hidden',
            // For circle crops: apply circle radius. For others: 12px.
            borderRadius: cropType === 'circle' ? '50%' : '12px',
            ...style,
          }}
          title={uploading ? 'Uploading…' : 'Click to replace image'}
          onMouseEnter={e => {
            if (!uploading) e.currentTarget.style.boxShadow = '0 0 0 3px var(--magenta)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            style={{
              opacity: 0,
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 10,
            }}
            disabled={uploading}
          />
          <img
            src={displaySrc}
            alt={alt}
            className={className}
            style={{
              display: 'block',
              width: '100%',
              height: hStyle,
              objectFit: cropType === 'dynamic' ? 'contain' : 'cover',
              opacity: uploading ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
            onError={() => {
              setHasError(true);
            }}
          />

          {/* Upload spinner overlay */}
          {uploading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              color: 'white', fontSize: '0.8rem', gap: 8,
              pointerEvents: 'none',
            }}>
              <div className="admin-spinner" style={{ width: 24, height: 24 }} />
              <span>Uploading…</span>
            </div>
          )}
        </label>

        {/* Edit badge */}
        {!uploading && !hideEditBadge && (
          <div style={{
            position: 'absolute',
            top: cropType === 'circle' ? -4 : 8,
            right: cropType === 'circle' ? -4 : 8,
            background: 'var(--magenta)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            boxShadow: '0 2px 8px rgba(226,0,122,0.45)',
            pointerEvents: 'none',
            fontWeight: 600,
            zIndex: 12
          }}>
            ✏️ Edit
          </div>
        )}
      </div>

      {/* Render Image Cropping Overlay if there is an image to crop */}
      {tempImageSrc && (
        <ImageCropModal
          imageSrc={tempImageSrc}
          cropType={cropType}
          onConfirm={handleCropConfirm}
          onClose={() => setTempImageSrc(null)}
        />
      )}
    </>
  );
}
