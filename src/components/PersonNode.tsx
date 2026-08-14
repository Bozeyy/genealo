'use client';

import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from 'reactflow';
import { Baby, Heart, Unlink, Pencil, Trash2, X } from 'lucide-react';

export type PersonNodeData = {
  id: string;
  firstName: string;
  lastName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  photoUrl?: string | null;
  parentCoupleId?: string | null;
  positionX?: number;
  positionY?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreateCouple?: (id: string) => void;
  onAddChildPerson?: (id: string) => void;
  onDetachParent?: (id: string) => void;
};

function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const [showActions, setShowActions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasActions = data.onEdit || data.onDelete || data.onCreateCouple;

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const initials = `${data.firstName.charAt(0)}${data.lastName ? data.lastName.charAt(0) : ''}`.toUpperCase();

  const formatYear = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  };

  const birthYear = formatYear(data.birthDate);
  const deathYear = formatYear(data.deathDate);

  const renderDateText = () => {
    if (birthYear && deathYear) {
      return `${birthYear} – ${deathYear}`;
    }
    if (birthYear) {
      return `° ${birthYear}`;
    }
    if (deathYear) {
      return `† ${deathYear}`;
    }
    return null;
  };

  const dateText = renderDateText();

  return (
    <div
      onMouseEnter={() => hasActions && !isMobile && setShowActions(true)}
      onMouseLeave={() => !isMobile && setShowActions(false)}
      onClick={(e) => {
        if (hasActions) {
          e.stopPropagation();
          setShowActions(prev => !prev);
        }
      }}
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(85,107,47,0.15), rgba(124,142,81,0.1))'
          : 'rgba(254,253,249,0.94)',
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${selected ? 'rgba(85,107,47,0.5)' : 'rgba(40,51,24,0.12)'}`,
        borderRadius: '12px',
        padding: '10px 8px',
        width: '130px',
        height: '110px',
        boxShadow: selected
          ? '0 0 0 2px rgba(85,107,47,0.3), 0 6px 24px rgba(40,51,24,0.12)'
          : '0 2px 12px rgba(40,51,24,0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top-target" style={{ background: 'var(--child-link)', opacity: 0.6, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'var(--accent-color)', opacity: 0.6, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'var(--accent-color)', opacity: 0.6, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'var(--accent-color)', opacity: 0.6, width: 7, height: 7 }} />

      {/* Desktop Floating Action Bar */}
      {showActions && hasActions && !isMobile && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '-42px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            background: 'rgba(255,252,248,0.97)',
            border: '1px solid rgba(60,46,28,0.15)',
            borderRadius: '10px',
            padding: '4px',
            zIndex: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(60,46,28,0.12)',
          }}
        >
          {data.onAddChildPerson && (
            <button
              title="Ajouter un enfant"
              onClick={(e) => { e.stopPropagation(); data.onAddChildPerson?.(data.id); }}
              style={{ background: 'rgba(122,155,109,0.15)', border: 'none', color: '#5a8a48', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Baby size={16} />
            </button>
          )}

          {data.onCreateCouple && (
            <button
              title="Former un couple"
              onClick={(e) => { e.stopPropagation(); data.onCreateCouple?.(data.id); }}
              style={{ background: 'rgba(192,120,90,0.15)', border: 'none', color: '#a06848', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Heart size={16} />
            </button>
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
              style={{ background: 'rgba(196,154,60,0.15)', border: 'none', color: '#9a7a2e', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Unlink size={16} />
            </button>
          )}

          {data.onEdit && (
            <button
              title="Modifier"
              onClick={(e) => { e.stopPropagation(); data.onEdit?.(data.id); }}
              style={{ background: 'rgba(160,120,80,0.12)', border: 'none', color: '#8a6540', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil size={16} />
            </button>
          )}

          {data.onDelete && (
            <button
              title="Supprimer"
              onClick={(e) => { e.stopPropagation(); data.onDelete?.(data.id); }}
              style={{ background: 'rgba(180,60,60,0.1)', border: 'none', color: '#b03c3c', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {/* Card content */}
      {/* Avatar */}
      <div style={{
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c8e51, #556b2f)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        fontSize: '14px',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '6px',
        marginRight: '0',
      }}>
        {data.photoUrl ? (
          <img src={data.photoUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : initials}
      </div>

      {/* Info */}
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <div style={{ color: '#3d2e1c', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.firstName}
        </div>
        {data.lastName && (
          <div style={{ color: '#3d2e1c', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.lastName}
          </div>
        )}
        {dateText && (
          <div style={{ color: '#8a7560', fontSize: '11px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dateText}
          </div>
        )}
      </div>

      {/* Mobile Action Bottom Sheet via React Portal */}
      {showActions && hasActions && isMobile && mounted && createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(60, 46, 28, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(255, 252, 248, 0.98)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(160, 120, 80, 0.25)',
              borderRadius: '20px 20px 0 0',
              padding: '1.25rem 1.25rem 1.75rem 1.25rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 -8px 32px rgba(60, 46, 28, 0.2)',
              color: '#3d2e1c',
              animation: 'slideUp 0.2s ease-out',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Header / Person Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(60,46,28,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c0956a, #a07850)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#fff',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {data.photoUrl ? (
                    <img src={data.photoUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : initials}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {data.firstName} {data.lastName}
                  </h3>
                  {dateText && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {dateText}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowActions(false)}
                style={{
                  background: 'rgba(60, 46, 28, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Action buttons list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.onAddChildPerson && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    data.onAddChildPerson?.(data.id);
                  }}
                  style={{
                    background: 'rgba(122,155,109,0.12)',
                    border: '1px solid rgba(122,155,109,0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#5a8a48',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '44px',
                  }}
                >
                  <Baby size={18} /> Ajouter un enfant à cette personne
                </button>
              )}

              {data.onCreateCouple && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    data.onCreateCouple?.(data.id);
                  }}
                  style={{
                    background: 'rgba(192,120,90,0.12)',
                    border: '1px solid rgba(192,120,90,0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#a06848',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '44px',
                  }}
                >
                  <Heart size={18} /> Former un couple
                </button>
              )}

              {data.parentCoupleId && data.onDetachParent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Détacher cette personne de ses parents ?')) {
                      setShowActions(false);
                      data.onDetachParent?.(data.id);
                    }
                  }}
                  style={{
                    background: 'rgba(196,154,60,0.12)',
                    border: '1px solid rgba(196,154,60,0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#9a7a2e',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '44px',
                  }}
                >
                  <Unlink size={18} /> Détacher de ses parents
                </button>
              )}

              {data.onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    data.onEdit?.(data.id);
                  }}
                  style={{
                    background: 'rgba(160,120,80,0.12)',
                    border: '1px solid rgba(160,120,80,0.25)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#8a6540',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '44px',
                  }}
                >
                  <Pencil size={18} /> Modifier les informations
                </button>
              )}

              {data.onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    data.onDelete?.(data.id);
                  }}
                  style={{
                    background: 'rgba(180,60,60,0.08)',
                    border: '1px solid rgba(180,60,60,0.25)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#b03c3c',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '44px',
                  }}
                >
                  <Trash2 size={18} /> Supprimer la personne
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default memo(PersonNode);
