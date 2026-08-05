import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { globalLoadingState } from '../api/client';
import logo from '../assets/images/logo.png';

export default function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const showTimer = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = globalLoadingState.subscribe((loading) => {
      setIsLoading(loading);
      if (loading) {
        clearTimeout(showTimer.current);
        // Only show the overlay when a request takes a while, so quick
        // navigation fetches don't make the whole screen flash.
        showTimer.current = setTimeout(() => setShowOverlay(true), 300);
      } else {
        clearTimeout(showTimer.current);
        setShowOverlay(false);
      }
    });
    return () => {
      clearTimeout(showTimer.current);
      unsubscribe();
    };
  }, []);

  // Only show the processing modal overlay on admin routes (/admin)
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (!isLoading || !showOverlay || !isAdminRoute) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
    }}>
      <div style={{
        background: 'white',
        padding: '32px 48px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <img src={logo} alt="Rotaract Logo" style={{ width: 80, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
        
        <div style={{ width: '160px', height: '4px', background: 'rgba(121, 33, 60, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: '40%',
            height: '100%',
            background: 'var(--magenta, #79213C)',
            borderRadius: '4px',
            animation: 'btn-progress 1s ease-in-out infinite'
          }} />
        </div>
        
        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, letterSpacing: '0.5px' }}>Processing...</span>
      </div>
    </div>
  );
}
