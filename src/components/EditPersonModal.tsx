'use client';

import React, { useState } from 'react';
import { updatePerson } from '@/actions/personActions';
import { PersonNodeData } from './PersonNode';

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
    <div onClick={onClose} className="modal-overlay">
      <div onClick={e => e.stopPropagation()} className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Modifier la personne</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div className="label-field">Prénom *</div>
              <input type="text" name="firstName" required defaultValue={person.firstName} className="input-field" />
            </div>
            <div>
              <div className="label-field">Nom</div>
              <input type="text" name="lastName" defaultValue={person.lastName ?? ''} className="input-field" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div className="label-field">Date de naissance</div>
              <input type="date" name="birthDate" defaultValue={formatDateInput(person.birthDate)} className="input-field" />
            </div>
            <div>
              <div className="label-field">Date de décès</div>
              <input type="date" name="deathDate" defaultValue={formatDateInput(person.deathDate)} className="input-field" />
            </div>
          </div>
          <div>
            <div className="label-field">URL de la photo</div>
            <input type="url" name="photoUrl" defaultValue={person.photoUrl ?? ''} placeholder="https://..." className="input-field" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>
    </div>
  );
}
