'use client';

import React, { useState } from 'react';
import { updatePerson } from '@/actions/personActions';
import { PersonNodeData } from './PersonNode';

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

type Props = {
  person: PersonNodeData;
  onClose: () => void;
};

export default function EditPersonModal({ person, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const formatDateInput = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updatePerson(person.id, formData);
      onClose();
    } finally {
      setLoading(false);
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
          maxWidth: '420px',
          margin: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Modifier la personne</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aab2', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={labelStyle}>Prénom *</div>
              <input type="text" name="firstName" required defaultValue={person.firstName} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Nom</div>
              <input type="text" name="lastName" defaultValue={person.lastName ?? ''} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={labelStyle}>Date de naissance</div>
              <input type="date" name="birthDate" defaultValue={formatDateInput(person.birthDate)} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Date de décès</div>
              <input type="date" name="deathDate" defaultValue={formatDateInput(person.deathDate)} style={inputStyle} />
            </div>
          </div>
          <div>
            <div style={labelStyle}>URL de la photo</div>
            <input type="url" name="photoUrl" defaultValue={person.photoUrl ?? ''} placeholder="https://..." style={inputStyle} />
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
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>
    </div>
  );
}
