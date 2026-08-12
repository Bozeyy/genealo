'use client';

import React, { useState } from 'react';
import { createPerson } from '@/actions/personActions';
import { Plus, X, UserPlus, Calendar } from 'lucide-react';

type AddPersonButtonProps = {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
};

export default function AddPersonButton({ isAuthenticated, onRequireAuth }: AddPersonButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeathDate, setShowDeathDate] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      onRequireAuth();
    } else {
      setShowDeathDate(false);
      setIsOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createPerson(formData);
      setIsOpen(false);
      setShowDeathDate(false);
      (e.target as HTMLFormElement).reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (+), always visible */}
      <button
        onClick={handleClick}
        title={isAuthenticated ? 'Ajouter une personne' : 'Déverrouiller pour ajouter une personne'}
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c0956a, #a07850)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 6px 24px rgba(160, 120, 80, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          transition: 'transform 0.2s ease, boxShadow 0.2s ease',
        }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Modal */}
      {isOpen && isAuthenticated && (
        <div onClick={() => setIsOpen(false)} className="modal-overlay">
          <div onClick={e => e.stopPropagation()} className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-color)" />
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Ajouter une personne</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div className="label-field">Prénom *</div>
                  <input type="text" id="firstName" name="firstName" required className="input-field" autoFocus />
                </div>
                <div>
                  <div className="label-field">Nom</div>
                  <input type="text" id="lastName" name="lastName" className="input-field" />
                </div>
              </div>

              <div>
                <div className="label-field" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Date de naissance
                </div>
                <input type="date" id="birthDate" name="birthDate" className="input-field" />
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
                  <input type="date" id="deathDate" name="deathDate" className="input-field" />
                </div>
              )}

              <div>
                <div className="label-field">URL de la photo</div>
                <input type="url" id="photoUrl" name="photoUrl" placeholder="https://..." className="input-field" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
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
