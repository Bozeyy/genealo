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
    <div onClick={onClose} className="modal-overlay">
      <div onClick={e => e.stopPropagation()} className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>🔓 Déverrouiller l'édition</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Veuillez entrer le code PIN pour modifier l'arbre généalogique.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Code PIN"
              className="input-field"
              style={{
                fontSize: '1.2rem',
                textAlign: 'center',
                letterSpacing: '0.2em',
              }}
              autoFocus
            />
          </div>

          {error && <p style={{ color: '#b03c3c', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !pin}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #7a9b6d, #5a8a48)',
                opacity: (loading || !pin) ? 0.5 : 1,
                cursor: (loading || !pin) ? 'not-allowed' : 'pointer',
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
