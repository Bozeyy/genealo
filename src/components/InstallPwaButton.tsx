'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setDeferredPrompt(null);
        setIsStandalone(true);
        setInstalledSuccess(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  if (isStandalone || installedSuccess) {
    return null; // Already installed as PWA app
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // Trigger native browser install prompt or guidance
      alert("Pour installer l'application : ouvrez le menu de votre navigateur et sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.");
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="header-btn"
        style={{
          background: 'rgba(85, 107, 47, 0.15)',
          borderColor: 'rgba(85, 107, 47, 0.35)',
          color: 'var(--accent-color)',
          fontWeight: '700',
        }}
        title="Installer l'application Genealo sur votre écran d'accueil"
      >
        <Download size={15} />
        <span>Installer</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIosModal && (
        <div onClick={() => setShowIosModal(false)} className="modal-overlay">
          <div onClick={e => e.stopPropagation()} className="modal-card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={20} color="var(--accent-color)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Installer sur iPhone / iPad</h3>
              </div>
              <button onClick={() => setShowIosModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.6' }}>
              Pour installer <strong>Genealo</strong> sur votre écran d'accueil iOS :
            </p>
            <ol style={{ textAlign: 'left', fontSize: '0.9rem', color: 'var(--text-primary)', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
              <li>Appuyez sur le bouton <strong>Partager</strong> <span style={{ fontSize: '1.2rem' }}>⎋</span> dans la barre Safari.</li>
              <li>Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong> <span style={{ fontSize: '1.1rem' }}>➕</span>.</li>
              <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
            </ol>
            <button onClick={() => setShowIosModal(false)} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
