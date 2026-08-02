import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * ImageCropModal — Pure React Zoom & Pan Cropper.
 * No external dependencies needed. Highly performant Canvas-based cropping.
 * Rendered in document.body to bypass parent overflow:hidden structures.
 * 
 * Props:
 * - imageSrc: base64 or URL of the image to crop
 * - cropType: "circle" (for team members) or "landscape" (for gallery)
 * - onConfirm: callback passing the cropped Blob/File
 * - onClose: callback when modal is cancelled
 */
export default function ImageCropModal({ imageSrc, cropType, onConfirm, onClose }) {
  const [activeRatio, setActiveRatio] = useState(cropType === 'circle' ? 1 : (16 / 9));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const viewportRef = useRef(null);
  const imgRef = useRef(null);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });

  // Viewport sizes
  const maxDim = 352;
  const viewportWidth = activeRatio >= 1 ? maxDim : maxDim * activeRatio;
  const viewportHeight = activeRatio >= 1 ? maxDim / activeRatio : maxDim;

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageLoaded(false);
  }, [imageSrc]);

  useEffect(() => {
    setZoom(1);
    if (imgRef.current && imageLoaded) {
      calculateLayout(imgRef.current, viewportWidth, viewportHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRatio]);

  const calculateLayout = (imgElement, vpW, vpH) => {
    const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    const vpRatio = vpW / vpH;

    let initWidth = 0;
    let initHeight = 0;

    if (imgRatio > vpRatio) {
      initHeight = vpH;
      initWidth = vpH * imgRatio;
    } else {
      initWidth = vpW;
      initHeight = vpW / imgRatio;
    }

    setDimensions({ width: initWidth, height: initHeight });
    setPan({
      x: (vpW - initWidth) / 2,
      y: (vpH - initHeight) / 2
    });
  };

  const handleImageLoad = (e) => {
    calculateLayout(e.currentTarget, viewportWidth, viewportHeight);
    setImageLoaded(true);
  };

  // Zoom logic
  const handleZoomChange = (e) => {
    const nextZoom = parseFloat(e.target.value);
    
    // Zoom around the viewport center
    setPan((prev) => {
      const currWidth = dimensions.width * zoom;
      const currHeight = dimensions.height * zoom;
      
      const nextWidth = dimensions.width * nextZoom;
      const nextHeight = dimensions.height * nextZoom;
      
      // Calculate delta offsets
      const dx = (viewportWidth - nextWidth) / 2 - (viewportWidth - currWidth) / 2;
      const dy = (viewportHeight - nextHeight) / 2 - (viewportHeight - currHeight) / 2;
      
      return clampPan({ x: prev.x + dx, y: prev.y + dy }, nextZoom);
    });

    setZoom(nextZoom);
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    startDrag.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const nextX = e.clientX - startDrag.current.x;
    const nextY = e.clientY - startDrag.current.y;
    
    setPan(clampPan({ x: nextX, y: nextY }, zoom));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch handlers for mobile support
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true;
    startDrag.current = {
      x: e.touches[0].clientX - pan.x,
      y: e.touches[0].clientY - pan.y
    };
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const nextX = e.touches[0].clientX - startDrag.current.x;
    const nextY = e.touches[0].clientY - startDrag.current.y;
    
    setPan(clampPan({ x: nextX, y: nextY }, zoom));
  };

  // Constraint checking: image must fully cover the crop viewport
  const clampPan = (position, currentZoom) => {
    const w = dimensions.width * currentZoom;
    const h = dimensions.height * currentZoom;

    // Bounds limits
    const minX = viewportWidth - w;
    const maxX = 0;
    const minY = viewportHeight - h;
    const maxY = 0;

    return {
      x: Math.min(maxX, Math.max(minX, position.x)),
      y: Math.min(maxY, Math.max(minY, position.y))
    };
  };

  // Canvas Crop & Upload
  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    // Set output crop dimensions based on ratio
    const destWidth = activeRatio >= 1 ? 800 : 800 * activeRatio;
    const destHeight = activeRatio >= 1 ? 800 / activeRatio : 800;

    canvas.width = destWidth;
    canvas.height = destHeight;
    const ctx = canvas.getContext('2d');

    // Display scale ratio
    const displayWidth = dimensions.width * zoom;
    const scale = img.naturalWidth / displayWidth;

    // Math: offset viewport crop coordinates relative to the image scale
    const sx = -pan.x * scale;
    const sy = -pan.y * scale;
    const sw = viewportWidth * scale;
    const sh = viewportHeight * scale;

    // Perform drawing on canvas
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, destWidth, destHeight);

    // Convert to Blob and confirm
    canvas.toBlob((blob) => {
      if (blob) {
        // Create file name
        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onConfirm(file);
      }
    }, 'image/jpeg', 0.95);
  };

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
            Drag to pan, slide to zoom.
          </p>
        </div>

        {/* Viewport Box */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
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
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={handleImageLoad}
              alt="Source to crop"
              style={{
                position: 'absolute',
                width: dimensions.width,
                height: dimensions.height,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                userSelect: 'none',
                pointerEvents: 'none', // Prevents default drag and drop
                display: imageLoaded ? 'block' : 'none'
              }}
            />
            
            {/* Dark Mask for Crop boundaries */}
            {cropType === 'circle' ? (
              <div style={{
                position: 'absolute', inset: -2,
                borderRadius: '50%',
                border: '4px solid white',
                boxShadow: '0 0 0 9999px rgba(10, 14, 26, 0.4)',
                pointerEvents: 'none', zIndex: 10
              }} />
            ) : (
              <div style={{
                position: 'absolute', inset: -2,
                borderRadius: '12px',
                border: '3px solid white',
                boxShadow: '0 0 0 9999px rgba(10, 14, 26, 0.4)',
                pointerEvents: 'none', zIndex: 10
              }} />
            )}
          </div>
        </div>

        {/* Aspect Ratio Selector (only if not circle) */}
        {cropType !== 'circle' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            {[
              { label: '16:9', val: 16/9 },
              { label: '4:3', val: 4/3 },
              { label: '1:1', val: 1 },
              { label: '3:4', val: 3/4 },
              { label: '9:16', val: 9/16 }
            ].map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setActiveRatio(ratio.val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: activeRatio === ratio.val ? 'var(--magenta)' : '#f1f5f9',
                  color: activeRatio === ratio.val ? 'white' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>➖</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              style={{
                flexGrow: 1,
                accentColor: 'var(--magenta)',
                cursor: 'pointer',
                height: '6px',
                background: '#e2e8f0',
                borderRadius: '3px',
              }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>➕</span>
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
              padding: '10px 24px', borderRadius: 10, background: 'var(--magenta)',
              border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', transition: 'all 0.25s',
              boxShadow: '0 4px 12px rgba(226, 0, 122, 0.25)'
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
