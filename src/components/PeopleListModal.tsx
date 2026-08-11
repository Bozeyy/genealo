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
      setCenter(node.position.x + 100, node.position.y + 40, { zoom: 1, duration: 800 });
      onClose();
    }
  };

  const formatYear = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  };

  return (
    <div onClick={onClose} className="modal-overlay">
      <div onClick={e => e.stopPropagation()} className="modal-card" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 Membres <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({people.length})</span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
          />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
          {filteredPeople.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>Aucun membre trouvé</p>
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
                    padding: '0.65rem 0.75rem',
                    borderRadius: '10px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    onClick={() => handleFocusNode(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, overflow: 'hidden' }}
                    title="Cliquer pour localiser sur le canvas"
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #c0956a, #a07850)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#fff',
                    }}>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : initials}
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.firstName} {p.lastName}
                      </div>
                      {(birthYear || deathYear) && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                          {birthYear && <span>🎂 {birthYear}</span>}
                          {deathYear && <span style={{ marginLeft: '6px' }}>✝️ {deathYear}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                    <button
                      title="Localiser"
                      onClick={() => handleFocusNode(p.id)}
                      style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent-color)', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >🎯</button>
                    {onEdit && <button
                      title="Modifier"
                      onClick={() => { onEdit(p.id); onClose(); }}
                      style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent-color)', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✏️</button>}
                    {onDelete && <button
                      title="Supprimer"
                      onClick={() => { onDelete(p.id); }}
                      style={{ background: 'rgba(180,60,60,0.08)', border: 'none', color: '#b03c3c', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
