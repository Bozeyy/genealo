'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export type UnionNodeData = {
  coupleId: string;
  partner1Id: string;
  partner2Id: string;
  isSeparated?: boolean;
  children: { id: string; firstName: string; lastName?: string | null }[];
  onAddChild?: (coupleId: string) => void;
  onDeleteCouple?: (coupleId: string) => void;
  onToggleSeparated?: (coupleId: string, isSeparated: boolean) => void;
  onRemoveChild?: (childId: string) => void;
};

function UnionNode({ data, selected }: NodeProps<UnionNodeData>) {
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSep = Boolean(data.isSeparated);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Circle Icon */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(prev => !prev);
        }}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isSep
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : 'linear-gradient(135deg, #a78bfa, #ec4899)',
          border: selected
            ? '2px solid #fff'
            : isSep
            ? '2px dashed rgba(255,255,255,0.9)'
            : '2px solid rgba(255,255,255,0.9)',
          boxShadow: isSep
            ? '0 0 14px rgba(245,158,11,0.8)'
            : '0 0 14px rgba(236,72,153,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '13px',
          transition: 'all 0.2s ease',
        }}
        title={isSep ? 'Couple séparé/divorcé (cliquez pour gérer)' : 'Couple uni (cliquez pour gérer)'}
      >
        {isSep ? '💔' : '💍'}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="union-top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="union-bottom" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="union-left" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="union-right" style={{ opacity: 0 }} />

      {/* Action Popup */}
      {showMenu && (
        <div
          onClick={e => e.stopPropagation()}
          className="nopan nodrag"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            paddingTop: '6px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'rgba(20,22,28,0.96)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${isSep ? 'rgba(245,158,11,0.3)' : 'rgba(236,72,153,0.3)'}`,
              borderRadius: '12px',
              padding: '12px 14px',
              minWidth: '230px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              color: '#f8f9fa',
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: isSep ? '#f59e0b' : '#ec4899',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{isSep ? '💔 Union Séparée' : '💍 Union Familiale'}</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: isSep ? 'rgba(245,158,11,0.2)' : 'rgba(236,72,153,0.2)' }}>
                {isSep ? 'Séparés' : 'Unis'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onAddChild?.(data.coupleId);
                }}
                style={{
                  background: 'rgba(56,189,248,0.2)',
                  border: '1px solid rgba(56,189,248,0.4)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                👶 Ajouter un enfant au couple
              </button>

              {/* Toggle Separation Status */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onToggleSeparated?.(data.coupleId, !isSep);
                }}
                style={{
                  background: isSep ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.2)',
                  border: `1px solid ${isSep ? 'rgba(167,139,250,0.4)' : 'rgba(245,158,11,0.4)'}`,
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: isSep ? '#c084fc' : '#fbbf24',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSep ? '💍 Marquer comme uni(e)s' : '💔 Marquer comme séparé(e)s'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Dissoudre ce couple ? (Les enfants seront détachés, pas supprimés)')) {
                    data.onDeleteCouple?.(data.coupleId);
                  }
                }}
                style={{
                  background: 'rgba(239,68,68,0.18)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🗑️ Supprimer le couple
              </button>
            </div>

            {/* Children list */}
            {data.children && data.children.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', color: '#a0aab2', marginBottom: '4px' }}>
                  Enfants du couple ({data.children.length}) :
                </div>
                {data.children.map(child => (
                  <div
                    key={child.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      padding: '4px 0',
                      color: '#e2e8f0',
                    }}
                  >
                    <span>👶 {child.firstName} {child.lastName ?? ''}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        data.onRemoveChild?.(child.id);
                      }}
                      title="Détacher cet enfant"
                      style={{
                        background: 'rgba(239,68,68,0.2)',
                        border: 'none',
                        color: '#f87171',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px 6px',
                      }}
                    >
                      ✕ Détacher
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(UnionNode);
