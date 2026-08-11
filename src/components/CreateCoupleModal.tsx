'use client';

import React, { useState } from 'react';
import { createCouple } from '@/actions/coupleActions';
import { PersonNodeData } from './PersonNode';

type Props = {
  initialPartner1Id?: string | null;
  people: PersonNodeData[];
  onClose: () => void;
};

export default function CreateCoupleModal({ initialPartner1Id, people, onClose }: Props) {
  const [partner1Id, setPartner1Id] = useState(initialPartner1Id ?? people[0]?.id ?? '');
  const [partner2Id, setPartner2Id] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const candidatePartner2s = people.filter(p => p.id !== partner1Id && `${p.firstName} ${p.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner1Id || !partner2Id) {
      setError('Veuillez sélectionner 2 personnes');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await createCouple(partner1Id, partner2Id);
      if ('error' in result && result.error) {
        setError(result.error as string);
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} className="modal-overlay">
      <div onClick={e => e.stopPropagation()} className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>💍 Former un couple</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Sélectionnez 2 personnes pour créer une union
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div className="label-field">Partenaire 1</div>
            <select value={partner1Id} onChange={e => setPartner1Id(e.target.value)} className="input-field">
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="label-field">Partenaire 2</div>
            <input
              type="text"
              placeholder="🔍 Rechercher par nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ marginBottom: '8px' }}
            />
            <select value={partner2Id} onChange={e => setPartner2Id(e.target.value)} className="input-field">
              <option value="">— Sélectionner partenaire 2 ({candidatePartner2s.length}) —</option>
              {candidatePartner2s.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: '#b03c3c', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !partner1Id || !partner2Id}
            className="btn-primary"
            style={{
              opacity: (loading || !partner1Id || !partner2Id) ? 0.5 : 1,
              cursor: (loading || !partner1Id || !partner2Id) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Création...' : '💍 Former le couple'}
          </button>
        </form>
      </div>
    </div>
  );
}
