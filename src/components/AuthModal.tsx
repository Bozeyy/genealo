'use client';

import React, { useState } from 'react';
import { login } from '@/actions/authActions';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(pin);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Code incorrect');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(20,22,28,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          margin: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>🔓 Déverrouiller l'édition</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#a0aab2' }}>
              Veuillez entrer le code PIN pour modifier l'arbre généalogique.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aab2', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Code PIN"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: '1.2rem',
                textAlign: 'center',
                letterSpacing: '0.2em',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !pin}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: (loading || !pin) ? 'not-allowed' : 'pointer',
                opacity: (loading || !pin) ? 0.5 : 1,
              }}
            >
              {loading ? 'Vérification...' : 'Déverrouiller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
