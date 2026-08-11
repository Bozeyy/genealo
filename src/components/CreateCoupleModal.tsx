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

  const partner1 = people.find(p => p.id === partner1Id);
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

  const selectStyle: React.CSSProperties = {
    padding: '0.7rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#f8f9fa',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
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
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>💍 Former un couple</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#a0aab2' }}>
              Sélectionnez 2 personnes pour créer une union
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aab2', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#a0aab2', marginBottom: '4px' }}>Partenaire 1</div>
            <select value={partner1Id} onChange={e => setPartner1Id(e.target.value)} style={selectStyle}>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: '#a0aab2', marginBottom: '4px' }}>Partenaire 2</div>
            <input
              type="text"
              placeholder="🔍 Rechercher par nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, marginBottom: '8px' }}
            />
            <select value={partner2Id} onChange={e => setPartner2Id(e.target.value)} style={selectStyle}>
              <option value="">— Sélectionner partenaire 2 ({candidatePartner2s.length}) —</option>
              {candidatePartner2s.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !partner1Id || !partner2Id}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: (loading || !partner1Id || !partner2Id) ? 'not-allowed' : 'pointer',
              opacity: (loading || !partner1Id || !partner2Id) ? 0.5 : 1,
              fontSize: '1rem',
            }}
          >
            {loading ? 'Création...' : '💍 Former le couple'}
          </button>
        </form>
      </div>
    </div>
  );
}
