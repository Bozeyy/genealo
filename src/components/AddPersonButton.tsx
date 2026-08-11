'use client';

import React, { useState } from 'react';
import { createPerson } from '@/actions/personActions';

const inputStyle: React.CSSProperties = {
  padding: '0.7rem',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#f8f9fa',
  fontFamily: 'inherit',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#a0aab2',
  marginBottom: '4px',
};

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
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        title="Ajouter une personne"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 100,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.7)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.5)'; }}
      >
        +
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
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
              maxWidth: '420px',
              margin: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Ajouter une personne</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#a0aab2', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={labelStyle}>Prénom *</div>
                  <input type="text" id="firstName" name="firstName" required style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Nom</div>
                  <input type="text" id="lastName" name="lastName" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={labelStyle}>Date de naissance</div>
                  <input type="date" id="birthDate" name="birthDate" style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>Date de décès</div>
                  <input type="date" id="deathDate" name="deathDate" style={inputStyle} />
                </div>
              </div>
              <div>
                <div style={labelStyle}>URL de la photo</div>
                <input type="url" id="photoUrl" name="photoUrl" placeholder="https://..." style={inputStyle} />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontSize: '1rem',
                }}
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
