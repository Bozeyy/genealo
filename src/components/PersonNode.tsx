'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export type PersonNodeData = {
  id: string;
  firstName: string;
  lastName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  photoUrl?: string | null;
  parentCoupleId?: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreateCouple?: (id: string) => void;
  onDetachParent?: (id: string) => void;
};

function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const [showActions, setShowActions] = useState(false);

  const initials = `${data.firstName.charAt(0)}${data.lastName ? data.lastName.charAt(0) : ''}`.toUpperCase();

  const formatYear = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  };

  const birthYear = formatYear(data.birthDate);
  const deathYear = formatYear(data.deathDate);

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))'
          : 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${selected ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '180px',
        maxWidth: '220px',
        boxShadow: selected
          ? '0 0 0 2px rgba(99,102,241,0.4), 0 8px 32px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(0,0,0,0.25)',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Handles on top and bottom */}
      <Handle type="target" position={Position.Top} id="top-target" style={{ background: '#60a5fa', opacity: 0.7, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: '#a78bfa', opacity: 0.7, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ background: '#a78bfa', opacity: 0.7, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ background: '#a78bfa', opacity: 0.7, width: 8, height: 8 }} />

      {/* Action buttons */}
      {showActions && (
        <div style={{
          position: 'absolute',
          top: '-38px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px',
          background: 'rgba(15,17,21,0.95)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '4px',
          zIndex: 10,
          whiteSpace: 'nowrap',
        }}>
          <button
            title="Former un couple"
            onClick={() => data.onCreateCouple?.(data.id)}
            style={{ background: 'rgba(167,139,250,0.3)', border: 'none', color: '#c084fc', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '13px' }}
          >💍</button>

          {data.parentCoupleId && (
            <button
              title="Détacher de ses parents"
              onClick={() => {
                if (confirm('Détacher cette personne de ses parents ?')) {
                  data.onDetachParent?.(data.id);
                }
              }}
              style={{ background: 'rgba(234,179,8,0.2)', border: 'none', color: '#fde047', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '13px' }}
            >🔗</button>
          )}

          <button
            title="Modifier"
            onClick={() => data.onEdit?.(data.id)}
            style={{ background: 'rgba(99,102,241,0.3)', border: 'none', color: '#a5b4fc', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '13px' }}
          >✏️</button>

          <button
            title="Supprimer"
            onClick={() => data.onDelete?.(data.id)}
            style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#f87171', borderRadius: '5px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '13px' }}
          >🗑️</button>
        </div>
      )}

      {/* Card content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Avatar */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          fontSize: '14px',
          fontWeight: '700',
          color: '#fff',
        }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : initials}
        </div>

        {/* Info */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{ color: '#f8f9fa', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.firstName} {data.lastName}
          </div>
          {(birthYear || deathYear) && (
            <div style={{ color: '#a0aab2', fontSize: '11px', marginTop: '2px' }}>
              {birthYear && <span>🎂 {birthYear}</span>}
              {deathYear && <span style={{ marginLeft: '6px' }}>✝️ {deathYear}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(PersonNode);
