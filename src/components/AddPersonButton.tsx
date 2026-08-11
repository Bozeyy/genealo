'use client';

import React, { useState } from 'react';
import { createPerson } from '@/actions/personActions';

export default function AddPersonButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createPerson(formData);
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        title="Ajouter une personne"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c0956a, #a07850)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 16px rgba(160,120,80,0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 100,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        +
      </button>

      {/* Modal */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="modal-overlay">
          <div onClick={e => e.stopPropagation()} className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Ajouter une personne</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div className="label-field">Prénom *</div>
                  <input type="text" id="firstName" name="firstName" required className="input-field" />
                </div>
                <div>
                  <div className="label-field">Nom</div>
                  <input type="text" id="lastName" name="lastName" className="input-field" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div className="label-field">Date de naissance</div>
                  <input type="date" id="birthDate" name="birthDate" className="input-field" />
                </div>
                <div>
                  <div className="label-field">Date de décès</div>
                  <input type="date" id="deathDate" name="deathDate" className="input-field" />
                </div>
              </div>
              <div>
                <div className="label-field">URL de la photo</div>
                <input type="url" id="photoUrl" name="photoUrl" placeholder="https://..." className="input-field" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Création...' : 'Créer la personne'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
