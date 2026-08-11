'use client';

import React, { useState } from 'react';
import { PersonNodeData } from './PersonNode';
import { useReactFlow } from 'reactflow';

type Props = {
  people: PersonNodeData[];
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function PeopleListModal({ people, onClose, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const { setCenter, getNode } = useReactFlow();

  const filteredPeople = people.filter(p => {
    const fullName = `${p.firstName} ${p.lastName ?? ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const handleFocusNode = (id: string) => {
    const node = getNode(id);
    if (node) {
      // Center the view on this node
      setCenter(node.position.x + 100, node.position.y + 40, { zoom: 1, duration: 800 });
      onClose();
    }
  };

  const formatYear = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
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
          padding: '1.5rem',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 Liste des membres <span style={{ fontSize: '0.85rem', color: '#a0aab2', fontWeight: 'normal' }}>({people.length})</span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aab2', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#f8f9fa',
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
          {filteredPeople.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aab2', margin: '2rem 0' }}>Aucun membre trouvé</p>
          ) : (
            filteredPeople.map(p => {
              const initials = `${p.firstName.charAt(0)}${p.lastName ? p.lastName.charAt(0) : ''}`.toUpperCase();
              const birthYear = formatYear(p.birthDate);
              const deathYear = formatYear(p.deathDate);

              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    onClick={() => handleFocusNode(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1, overflow: 'hidden' }}
                    title="Cliquer pour localiser sur le canvas"
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#fff',
                    }}>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : initials}
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ color: '#f8f9fa', fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.firstName} {p.lastName}
                      </div>
                      {(birthYear || deathYear) && (
                        <div style={{ color: '#a0aab2', fontSize: '0.75rem' }}>
                          {birthYear && <span>🎂 {birthYear}</span>}
                          {deathYear && <span style={{ marginLeft: '6px' }}>✝️ {deathYear}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                    <button
                      title="Localiser sur le canvas"
                      onClick={() => handleFocusNode(p.id)}
                      style={{ background: 'rgba(99,102,241,0.2)', border: 'none', color: '#a5b4fc', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '13px' }}
                    >🎯</button>
                    {onEdit && <button
                      title="Modifier"
                      onClick={() => { onEdit(p.id); onClose(); }}
                      style={{ background: 'rgba(99,102,241,0.2)', border: 'none', color: '#a5b4fc', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '13px' }}
                    >✏️</button>}
                    {onDelete && <button
                      title="Supprimer"
                      onClick={() => { onDelete(p.id); }}
                      style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#f87171', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '13px' }}
                    >🗑️</button>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
