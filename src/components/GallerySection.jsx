import React, { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import EditableImage from './EditableImage';
import TraditionalDivider from './TraditionalDivider';

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
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icons
const EditIcon = () => <i className="fa-solid fa-pen" style={{ fontSize: '11px' }}></i>;
const TrashIcon = () => <i className="fa-solid fa-trash-can" style={{ fontSize: '11px' }}></i>;
const DragIcon = () => <i className="fa-solid fa-grip-vertical" style={{ fontSize: '12px' }}></i>;

function PillBtn({ onClick, disabled, title, style = {}, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 26, height: 26, borderRadius: '50%', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'background 0.15s, transform 0.1s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SortableGalleryItem({ item, index, handleUpdate, handleDelete, setEditingCaptionIndex }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const { isEditMode } = useEditMode();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 99 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* ── Edit mode: floating pill toolbar ── */}
      {isEditMode && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 3,
          background: 'rgba(36,7,19,0.88)', backdropFilter: 'blur(10px)',
          borderRadius: 50, padding: '4px 6px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        }}>
        <div 
          {...attributes} 
          {...listeners} 
          style={{ 
            cursor: 'grab', color: 'white', padding: '0 4px', 
            display: 'flex', alignItems: 'center' 
          }}
          title="Drag to reorder"
        >
          <DragIcon />
        </div>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
        <PillBtn onClick={() => setEditingCaptionIndex(index)} title="Edit Captions"
          style={{ background: 'rgba(121, 33, 60, 0.25)', color: '#fbcfe8' }}>
          <EditIcon />
        </PillBtn>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
          <PillBtn onClick={() => { if (window.confirm('Delete this image?')) handleDelete(index); }} title="Delete"
            style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            <TrashIcon />
          </PillBtn>
        </div>
      )}

      <div style={{
        borderRadius: 14, overflow: 'hidden', background: 'white',
        border: isDragging ? '2px solid #79213C' : '2px solid rgba(121, 33, 60, 0.18)',
        boxShadow: isDragging ? '0 10px 25px rgba(121, 33, 60, 0.2)' : '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}>
        <EditableImage
          src={item.imgUrl}
          alt={item.captionEn}
          onChange={(url) => handleUpdate(index, 'imgUrl', url)}
          cropType="dynamic"
          hideEditBadge={false}
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
        />
      </div>
    </div>
  );
}

export default function GallerySection({ content = {} }) {
  const { lang } = useLang();
  const { draft, updateDraftArray, isEditMode } = useEditMode();
  const [editingCaptionIndex, setEditingCaptionIndex] = useState(null);

  const hasDraft = draft && Object.keys(draft).length > 0;
  const galleryList = hasDraft ? (draft.gallery || []) : (content?.gallery || []);
  
  // Ensure every item has a unique string ID for dnd-kit
  const items = galleryList.map((g, i) => ({ ...g, id: g.id || `img-${i}` }));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px tolerance before drag starts
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
  };

  const handleAdd = () => {
    const newList = [...items, {
      id: Date.now().toString(),
      imgUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3EUpload Image%3C/text%3E%3C/svg%3E",
      captionEn: 'New Image',
      captionNe: 'नयाँ छवि',
    }];
    updateDraftArray('gallery', newList);
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

  return (
    <section id="gallery" style={{ padding: '0 5%' }}>
      <div className="section-header fade-in">
        <h2 className="section-title">
          {lang === 'en' ? 'Edit Gallery' : <span className="devanagari">ग्यालरी सम्पादन</span>}
        </h2>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(i => i.id)}
          strategy={rectSortingStrategy}
        >
          <div style={{
            columnCount: 3,
            columnGap: '24px',
            marginTop: '2rem'
          }}>
            {items.map((item, i) => (
              <div key={item.id} style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                <SortableGalleryItem 
                  item={item} 
                  index={i}
                  handleUpdate={handleUpdate}
                  handleDelete={handleDelete}
                  setEditingCaptionIndex={setEditingCaptionIndex}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isEditMode && (
        <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
          <button
            onClick={handleAdd}
            style={{
              background: 'transparent',
              border: '2px dashed #79213C',
              color: '#79213C',
              padding: '12px 28px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              letterSpacing: '0.3px',
              transition: 'background 0.2s, transform 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(121, 33, 60, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-plus"></i> Add Image
          </button>
        </div>
      )}

      {/* ── Caption Edit Modal ── */}
      {editingCaptionIndex !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 450,
            padding: '24px 32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--navy)', fontSize: '1.2rem' }}>Edit Captions</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5A6275', marginBottom: 6 }}>
                English Caption
              </label>
              <input
                type="text"
                value={items[editingCaptionIndex]?.captionEn || ''}
                onChange={e => handleUpdate(editingCaptionIndex, 'captionEn', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                placeholder="A beautiful moment..."
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5A6275', marginBottom: 6 }}>
                Nepali Caption (नेपाली)
              </label>
              <input
                type="text"
                value={items[editingCaptionIndex]?.captionNe || ''}
                onChange={e => handleUpdate(editingCaptionIndex, 'captionNe', e.target.value)}
                className="devanagari"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1.05rem' }}
                placeholder="एउटा सुन्दर पल..."
              />
            </div>
            <button
              onClick={() => setEditingCaptionIndex(null)}
              style={{ width: '100%', padding: '12px', background: '#79213C', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
