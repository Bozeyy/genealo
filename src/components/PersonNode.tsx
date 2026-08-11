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
  onAddChildPerson?: (id: string) => void;
  onDetachParent?: (id: string) => void;
};

function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const [showActions, setShowActions] = useState(false);
  const hasActions = data.onEdit || data.onDelete || data.onCreateCouple;

  const initials = `${data.firstName.charAt(0)}${data.lastName ? data.lastName.charAt(0) : ''}`.toUpperCase();

  const formatYear = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  };

  const birthYear = formatYear(data.birthDate);
  const deathYear = formatYear(data.deathDate);

  return (
    <div
      onMouseEnter={() => hasActions && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => hasActions && setShowActions(prev => !prev)}
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(160,120,80,0.15), rgba(192,120,90,0.1))'
          : 'rgba(255,252,248,0.92)',
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${selected ? 'rgba(160,120,80,0.5)' : 'rgba(60,46,28,0.12)'}`,
        borderRadius: '12px',
        padding: '10px 14px',
        minWidth: '160px',
        maxWidth: '200px',
        boxShadow: selected
          ? '0 0 0 2px rgba(160,120,80,0.3), 0 6px 24px rgba(60,46,28,0.12)'
          : '0 2px 12px rgba(60,46,28,0.08)',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top-target" style={{ background: 'var(--child-link)', opacity: 0.6, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'var(--accent-color)', opacity: 0.6, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'var(--accent-color)', opacity: 0.6, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'var(--accent-color)', opacity: 0.6, width: 7, height: 7 }} />

      {/* Action buttons */}
      {showActions && hasActions && (
        <div style={{
          position: 'absolute',
          top: '-42px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px',
          background: 'rgba(255,252,248,0.97)',
          border: '1px solid rgba(60,46,28,0.15)',
          borderRadius: '10px',
          padding: '5px',
          zIndex: 10,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(60,46,28,0.12)',
        }}>
          {data.onAddChildPerson && (
            <button
              title="Ajouter un enfant"
              onClick={(e) => { e.stopPropagation(); data.onAddChildPerson?.(data.id); }}
              style={{ background: 'rgba(122,155,109,0.15)', border: 'none', color: '#5a8a48', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >👶</button>
          )}

          {data.onCreateCouple && (
            <button
              title="Former un couple"
              onClick={(e) => { e.stopPropagation(); data.onCreateCouple?.(data.id); }}
              style={{ background: 'rgba(192,120,90,0.15)', border: 'none', color: '#a06848', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >💍</button>
          )}

          {data.parentCoupleId && data.onDetachParent && (
            <button
              title="Détacher de ses parents"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Détacher cette personne de ses parents ?')) {
                  data.onDetachParent?.(data.id);
                }
              }}
              style={{ background: 'rgba(196,154,60,0.15)', border: 'none', color: '#9a7a2e', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >🔗</button>
          )}

          {data.onEdit && (
            <button
              title="Modifier"
              onClick={(e) => { e.stopPropagation(); data.onEdit?.(data.id); }}
              style={{ background: 'rgba(160,120,80,0.12)', border: 'none', color: '#8a6540', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >✏️</button>
          )}

          {data.onDelete && (
            <button
              title="Supprimer"
              onClick={(e) => { e.stopPropagation(); data.onDelete?.(data.id); }}
              style={{ background: 'rgba(180,60,60,0.1)', border: 'none', color: '#b03c3c', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >🗑️</button>
          )}
        </div>
      )}

      {/* Card content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c0956a, #a07850)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          fontSize: '13px',
          fontWeight: '700',
          color: '#fff',
        }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : initials}
        </div>

        {/* Info */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{ color: '#3d2e1c', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.firstName} {data.lastName}
          </div>
          {(birthYear || deathYear) && (
            <div style={{ color: '#8a7560', fontSize: '11px', marginTop: '2px' }}>
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
