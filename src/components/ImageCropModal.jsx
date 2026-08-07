import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

/**
 * ImageCropModal — Zoom & Pan cropper built on react-easy-crop.
 * Rendered in document.body to bypass parent overflow:hidden structures.
 *
 * Props:
 * - imageSrc: base64 or URL of the image to crop
 * - cropType: "circle", "landscape", "portrait", or "dynamic"
 * - fixedRatio: locked aspect ratio (e.g. 3/4); when set, ratio buttons are hidden
 * - onConfirm: callback passing the cropped Blob/File
 * - onClose: callback when modal is cancelled
 */
export default function ImageCropModal({ imageSrc, cropType, fixedRatio, onConfirm, onClose }) {
  const defaultRatio = fixedRatio || (cropType === 'circle' ? 1 : (16 / 9));
  const [activeRatio, setActiveRatio] = useState(defaultRatio);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Viewport sizes
  const maxDim = 352;
  const viewportWidth = activeRatio >= 1 ? maxDim : maxDim * activeRatio;
  const viewportHeight = activeRatio >= 1 ? maxDim / activeRatio : maxDim;

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [imageSrc]);

  useEffect(() => {
    setZoom(1);
  }, [activeRatio]);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', reject);
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');

    // Output dimensions based on ratio (max 800px on the long side)
    const destWidth = activeRatio >= 1 ? 800 : 800 * activeRatio;
    const destHeight = activeRatio >= 1 ? 800 / activeRatio : 800;

    canvas.width = destWidth;
    canvas.height = destHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, destWidth, destHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(file);
    } catch {
      // Ignore; user can retry crop.
    }
  };

  const ratioOptions = (cropType === 'landscape'
    ? [
        { label: '16:9', val: 16 / 9 },
        { label: '4:3', val: 4 / 3 }
      ]
    : [
        { label: '16:9', val: 16 / 9 },
        { label: '4:3', val: 4 / 3 },
        { label: '1:1', val: 1 },
        { label: '4:5', val: 4 / 5 },
        { label: '3:4', val: 3 / 4 },
        { label: '9:16', val: 9 / 16 }
      ]);

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: 'white', borderRadius: 24, width: '100%', maxWidth: 440,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)', padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: 20
      }}>
        {/* Header */}
        <div>
          <h3 className="serif" style={{ fontSize: '1.4rem', color: 'var(--navy)', margin: '0 0 4px' }}>
            Crop Image
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>
            Drag to pan, scroll or slide to zoom.
          </p>
        </div>

        {/* Viewport Box */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: viewportWidth,
              height: viewportHeight,
              position: 'relative',
              overflow: 'hidden',
              background: '#f1f5f9',
              borderRadius: cropType === 'circle' ? '50%' : '12px',
              cursor: 'move',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.08), inset 0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={activeRatio}
              cropShape={cropType === 'circle' ? 'round' : 'rect'}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { width: '100%', height: '100%' } }}
            />
          </div>
        </div>

        {/* Aspect Ratio Selector (hidden when a fixed ratio is locked) */}
        {!fixedRatio && cropType !== 'circle' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 4 }}>
            {ratioOptions.map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                onClick={() => setActiveRatio(ratio.val)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: activeRatio === ratio.val ? '#79213C' : '#f1f5f9',
                  color: activeRatio === ratio.val ? 'white' : '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeRatio === ratio.val ? '0 2px 8px rgba(121, 33, 60, 0.25)' : 'none'
                }}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        )}

        {/* Zoom Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Scale / Zoom
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-solid fa-minus" style={{ fontSize: '0.75rem', color: '#94a3b8' }}></i>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                flexGrow: 1,
                accentColor: '#79213C',
                cursor: 'pointer',
                height: '6px',
                background: '#e2e8f0',
                borderRadius: '3px',
              }}
            />
            <i className="fa-solid fa-plus" style={{ fontSize: '0.75rem', color: '#94a3b8' }}></i>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 10, background: '#f1f5f9',
              border: 'none', color: '#475569', fontWeight: 600, fontSize: '0.9rem',
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            style={{
              padding: '10px 24px', borderRadius: 10, background: '#79213C',
              border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', transition: 'all 0.25s',
              boxShadow: '0 4px 12px rgba(121, 33, 60, 0.25)'
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            Crop & Upload
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
