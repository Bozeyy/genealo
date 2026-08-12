'use client';

import React, { useState } from 'react';
import { login } from '@/actions/authActions';
import { LockKeyhole, Unlock, AlertCircle } from 'lucide-react';

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
      setError(res.error || 'Code PIN incorrect');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(60, 46, 28, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255, 252, 248, 0.96)',
          border: '1px solid rgba(160, 120, 80, 0.25)',
          borderRadius: '20px',
          padding: '2.25rem 2rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 50px rgba(60, 46, 28, 0.2)',
          textAlign: 'center',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Icon Header */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(160, 120, 80, 0.15), rgba(192, 120, 90, 0.15))',
            border: '1px solid rgba(160, 120, 80, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 4px 16px rgba(160, 120, 80, 0.15)',
          }}
        >
          <LockKeyhole size={30} color="var(--accent-color)" />
        </div>

        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          Déverrouiller l'édition
        </h2>
        <p style={{ margin: '0 0 1.75rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Entrez le code secret pour ajouter, modifier ou réorganiser l'arbre généalogique.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="input-field"
              style={{
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.4em',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1.5px solid rgba(160, 120, 80, 0.3)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--text-primary)',
                fontWeight: '600',
              }}
              autoFocus
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(180, 60, 60, 0.08)',
                border: '1px solid rgba(180, 60, 60, 0.2)',
                borderRadius: '8px',
                padding: '0.6rem',
                color: '#b03c3c',
                fontSize: '0.85rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #7c8e51, #556b2f)',
              opacity: (loading || !pin) ? 0.5 : 1,
              cursor: (loading || !pin) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(160, 120, 80, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Unlock size={18} /> {loading ? 'Vérification...' : 'Déverrouiller & Modifier'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.4rem',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              transition: 'color 0.2s',
            }}
          >
            Continuer en lecture seule
          </button>
        </form>
      </div>
    </div>
  );
}
