import React, { useState, useEffect } from 'react';
import { PravahAdmin } from './components/PravahAdmin';
import { AnubhavPilgrim } from './components/AnubhavPilgrim';
import { KiskoKiosk } from './components/KiskoKiosk';
import { UnifiedShowcase } from './components/UnifiedShowcase';
import {
  Smartphone,
  Tv,
  Radio,
  Layers,
  Compass
} from 'lucide-react';
import './styles/app.css';

type ActiveSurface = 'showcase' | 'pilgrim' | 'kisko' | 'admin';

export const App: React.FC = () => {
  const [activeSurface, setActiveSurface] = useState<ActiveSurface>('showcase');

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path.includes('admin') || hash.includes('admin')) {
        setActiveSurface('admin');
      } else if (path.includes('pilgrim') || hash.includes('pilgrim')) {
        setActiveSurface('pilgrim');
      } else if (path.includes('kisko') || hash.includes('kisko')) {
        setActiveSurface('kisko');
      } else {
        setActiveSurface('showcase');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleTabChange = (surface: ActiveSurface) => {
    setActiveSurface(surface);
    window.location.hash = surface === 'showcase' ? '' : `#${surface}`;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="top-nav">
        <div className="brand-badge">
          <div className="brand-mark" style={{ backgroundColor: 'var(--marigold)', color: 'var(--indigo-dusk)' }}>
            <Compass size={20} />
          </div>
          <div className="brand-titles">
            <div className="brand-name" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              ANUBHAV (अनुभव) — Kumbh Saathi
            </div>
            <div className="brand-sub" style={{ fontSize: '0.74rem', opacity: 0.85 }}>
              Tower 4: Pilgrim Experience • Team Sanket • Kumbhathon SPRINT 2026
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            onClick={() => handleTabChange('showcase')}
            className={`nav-tab-btn ${activeSurface === 'showcase' ? 'active' : ''}`}
          >
            <Layers size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            डेमो दृश्य (Demo Mode: Side-by-Side)
          </button>

          <button
            onClick={() => handleTabChange('pilgrim')}
            className={`nav-tab-btn ${activeSurface === 'pilgrim' ? 'active' : ''}`}
          >
            <Smartphone size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            यात्रेकरू फोन (ANUBHAV Mobile)
          </button>

          <button
            onClick={() => handleTabChange('admin')}
            className={`nav-tab-btn ${activeSurface === 'admin' ? 'active' : ''}`}
          >
            <Radio size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            पोलीस नियंत्रण (PRAVAH Admin)
          </button>

          <button
            onClick={() => handleTabChange('kisko')}
            className={`nav-tab-btn ${activeSurface === 'kisko' ? 'active' : ''}`}
          >
            <Tv size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            ध्वनी किओस्क (KISKO Kiosk)
          </button>
        </div>

        {/* Calm Status Indicator */}
        <div className="nav-status-indicator">
          <span className="status-dot-calm" />
          <span>थेट जोडणी सक्रिय</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {activeSurface === 'showcase' && <UnifiedShowcase />}
        {activeSurface === 'pilgrim' && <AnubhavPilgrim />}
        {activeSurface === 'kisko' && <KiskoKiosk />}
        {activeSurface === 'admin' && <PravahAdmin />}
      </main>

      {/* Calm Civic Footer */}
      <footer className="civic-footer">
        <div>
          नाशिक कुंभमेळा संयुक्त पोलीस व जिल्हा प्रशासन २०२६ • एकच अधिकृत मार्ग स्रोत थेट यात्रेकरूंपर्यंत
        </div>
      </footer>
    </div>
  );
};
