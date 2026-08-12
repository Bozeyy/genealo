'use client';

import React, { useState } from 'react';
import { updatePerson } from '@/actions/personActions';
import { PersonNodeData } from './PersonNode';
import { Pencil, X, Calendar } from 'lucide-react';

type Props = {
  person: PersonNodeData;
  onClose: () => void;
};

export default function EditPersonModal({ person, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [showDeathDate, setShowDeathDate] = useState(Boolean(person.deathDate));

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pencil size={20} color="var(--accent-color)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Modifier la personne</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X size={20} />
          </button>
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

          <div>
            <div className="label-field" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Date de naissance
            </div>
            <input type="date" name="birthDate" defaultValue={formatDateInput(person.birthDate)} className="input-field" />
          </div>

          {/* Optional / Collapsible Death Date */}
          {!showDeathDate ? (
            <div>
              <button
                type="button"
                onClick={() => setShowDeathDate(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                + Indiquer une date de décès
              </button>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div className="label-field" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Calendar size={14} /> Date de décès
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeathDate(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Masquer
                </button>
              </div>
              <input type="date" name="deathDate" defaultValue={formatDateInput(person.deathDate)} className="input-field" />
            </div>
          )}

          <div>
            <div className="label-field">URL de la photo</div>
            <input type="url" name="photoUrl" defaultValue={person.photoUrl ?? ''} placeholder="https://..." className="input-field" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>
    </div>
  );
}
