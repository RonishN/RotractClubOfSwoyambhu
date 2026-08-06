import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { checkAdminSession, updateAdminContent, restoreToDefaults, flushPendingImageDeletions } from '../api/client';

const EditModeContext = createContext();

export function EditModeProvider({ children, initialContent = {} }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [draft, setDraft] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // Always-fresh mirror of `draft` so save flows can serialize the latest value
  // after async pre-save steps (e.g. gallery bulk upload) mutate it.
  const draftRef = useRef(initialContent);

  // Components (e.g. GallerySection) register async steps that must complete
  // before the content payload is serialized and sent to the server.
  const preSaveHooksRef = useRef(new Set());

  // Track whether we have already seeded from initialContent.
  // After the first seed, we never overwrite draft/original from the prop
  // (to avoid clobbering in-flight edits if the parent re-renders).
  const seededRef = useRef(false);

  // hasChanges: computed via ref to avoid JSON.stringify on every render
  const originalJsonRef = useRef(JSON.stringify(originalContent));
  const draftJsonRef = useRef(JSON.stringify(draft));
  const [hasChanges, setHasChanges] = useState(false);

  // Seed once from initialContent when it first becomes non-empty
  useEffect(() => {
    if (seededRef.current) return;
    const hasData = initialContent && Object.keys(initialContent).length > 0;
    if (!hasData) return;

    seededRef.current = true;
    setOriginalContent(initialContent);
    setDraft(initialContent);
    draftRef.current = initialContent;
    originalJsonRef.current = JSON.stringify(initialContent);
    draftJsonRef.current = JSON.stringify(initialContent);
    setHasChanges(false);
  }, [initialContent]);

  // Check if admin session exists
  useEffect(() => {
    checkAdminSession()
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false));
  }, []);

  const showToast = useCallback((type, message, autoDismiss = true, errorData = null) => {
    // Clear any pending auto-dismiss timer
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast({ type, message, errorData });

    // Auto-dismiss success toasts after 4 seconds
    if (type === 'success' && autoDismiss) {
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, 4000);
    }
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const registerPreSaveHook = useCallback((fn) => {
    preSaveHooksRef.current.add(fn);
    return () => {
      preSaveHooksRef.current.delete(fn);
    };
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  useEffect(() => {
    if (isEditMode) {
      document.body.classList.add('edit-mode-active');
    } else {
      document.body.classList.remove('edit-mode-active');
    }
    return () => {
      document.body.classList.remove('edit-mode-active');
    };
  }, [isEditMode]);

  const discard = useCallback(() => {
    setDraft(originalContent);
    draftRef.current = originalContent;
    draftJsonRef.current = originalJsonRef.current;
    setHasChanges(false);
    setIsEditMode(false);
  }, [originalContent]);

  const saveAll = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Let components (e.g. gallery bulk upload) push local preview images to
      // the remote before we serialize the draft — otherwise base64 data URLs
      // end up in the saved payload and blow the server body limit (413).
      for (const hook of Array.from(preSaveHooksRef.current)) {
        await hook();
      }
      const result = await updateAdminContent(draftRef.current);
      const saved = result.websiteData;
      setOriginalContent(saved);
      setDraft(saved);
      draftRef.current = saved;
      originalJsonRef.current = JSON.stringify(saved);
      draftJsonRef.current = JSON.stringify(saved);
      setHasChanges(false);
      // Now that the saved content is live, clean up ImageKit files that are no
      // longer referenced anywhere (shared images are kept by the server).
      await flushPendingImageDeletions();
      showToast('success', 'Changes saved successfully!');
      setIsEditMode(false);
    } catch (err) {
      // Handle session expiry
      if (err?.status === 401) {
        showToast('error', 'Your session has expired. Please log in again.', false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2500);
        return;
      }
      showToast('error', err?.message || 'Failed to save changes', false, err);
    } finally {
      setSaving(false);
    }
  }, [saving, showToast]);

  const handleRestoreDefaults = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await restoreToDefaults();
      const restored = result.websiteData;
      setOriginalContent(restored);
      setDraft(restored);
      draftRef.current = restored;
      originalJsonRef.current = JSON.stringify(restored);
      draftJsonRef.current = JSON.stringify(restored);
      setHasChanges(false);
      showToast('success', 'Restored to defaults successfully!');
      setIsEditMode(false);
    } catch (err) {
      if (err?.status === 401) {
        showToast('error', 'Your session has expired. Please log in again.', false, err);
        setTimeout(() => { window.location.href = '/login'; }, 2500);
        return;
      }
      showToast('error', err?.message || 'Failed to restore defaults', false, err);
    } finally {
      setSaving(false);
    }
  }, [saving, showToast]);

  const updateDraftField = useCallback((field, value) => {
    setDraft(prev => {
      const next = { ...prev, [field]: value };
      draftRef.current = next;
      draftJsonRef.current = JSON.stringify(next);
      setHasChanges(draftJsonRef.current !== originalJsonRef.current);
      return next;
    });
  }, []);

  const updateDraftArray = useCallback((arrayField, newList) => {
    setDraft((prev) => {
      const next = { ...prev, [arrayField]: newList };
      draftRef.current = next;
      draftJsonRef.current = JSON.stringify(next);
      setHasChanges(draftJsonRef.current !== originalJsonRef.current);
      return next;
    });
  }, []);

  // Immediately persist a full content object (e.g. after album CRUD) so changes
  // survive a page refresh without requiring the manual Save button first.
  const persistContent = useCallback(async (content) => {
    try {
      const result = await updateAdminContent(content);
      const saved = result.websiteData;
      setOriginalContent(saved);
      setDraft(saved);
      draftRef.current = saved;
      originalJsonRef.current = JSON.stringify(saved);
      draftJsonRef.current = JSON.stringify(saved);
      setHasChanges(false);
      await flushPendingImageDeletions();
      return saved;
    } catch (err) {
      if (err?.status === 401) {
        showToast('error', 'Your session has expired. Please log in again.', false);
        setTimeout(() => { window.location.href = '/login'; }, 2500);
      } else {
        showToast('error', err?.message || 'Failed to save changes', false, err);
      }
      throw err;
    }
  }, [showToast]);

  return (
    <EditModeContext.Provider value={{
      isAdmin,
      isEditMode,
      toggleEditMode,
      draft,
      updateDraftField,
      updateDraftArray,
      registerPreSaveHook,
      persistContent,
      saveAll,
      saving,
      discard,
      handleRestoreDefaults,
      hasChanges,
      toast,
      showToast,
      closeToast,
    }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) {
    // If used outside of a provider (e.g., on the public / route), default to read-only
    return {
      isEditMode: false,
      draft: {},
      showToast: () => {},
      updateDraftField: () => {},
      updateDraftArray: () => {},
      registerPreSaveHook: () => () => {},
      persistContent: () => Promise.resolve(),
    };
  }
  return context;
}
