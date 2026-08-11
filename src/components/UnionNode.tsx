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
  const hasActions = data.onAddChild || data.onDeleteCouple;

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
      onMouseEnter={() => hasActions && setShowMenu(true)}
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
            ? 'linear-gradient(135deg, #c49a3c, #a88030)'
            : 'linear-gradient(135deg, #c0785a, #a06040)',
          border: selected
            ? '2px solid var(--text-primary)'
            : isSep
            ? '2px dashed rgba(60,46,28,0.6)'
            : '2px solid rgba(60,46,28,0.5)',
          boxShadow: isSep
            ? '0 0 10px rgba(196,154,60,0.5)'
            : '0 0 10px rgba(192,120,90,0.5)',
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
      {showMenu && hasActions && (
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
              background: 'rgba(255,252,248,0.97)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${isSep ? 'rgba(196,154,60,0.3)' : 'rgba(192,120,90,0.3)'}`,
              borderRadius: '12px',
              padding: '12px 14px',
              minWidth: '220px',
              boxShadow: '0 8px 28px rgba(60,46,28,0.15)',
              color: '#3d2e1c',
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: isSep ? '#a88030' : '#a06040',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{isSep ? '💔 Union Séparée' : '💍 Union Familiale'}</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: isSep ? 'rgba(196,154,60,0.15)' : 'rgba(192,120,90,0.15)' }}>
                {isSep ? 'Séparés' : 'Unis'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.onAddChild && (
                <button
                  onClick={(e) => { e.stopPropagation(); data.onAddChild?.(data.coupleId); }}
                  style={{
                    background: 'rgba(122,155,109,0.12)',
                    border: '1px solid rgba(122,155,109,0.3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#5a8a48',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '36px',
                  }}
                >
                  👶 Ajouter un enfant au couple
                </button>
              )}

              {data.onToggleSeparated && (
                <button
                  onClick={(e) => { e.stopPropagation(); data.onToggleSeparated?.(data.coupleId, !isSep); }}
                  style={{
                    background: isSep ? 'rgba(192,120,90,0.12)' : 'rgba(196,154,60,0.12)',
                    border: `1px solid ${isSep ? 'rgba(192,120,90,0.3)' : 'rgba(196,154,60,0.3)'}`,
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: isSep ? '#a06040' : '#a88030',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '36px',
                  }}
                >
                  {isSep ? '💍 Marquer comme uni(e)s' : '💔 Marquer comme séparé(e)s'}
                </button>
              )}

              {data.onDeleteCouple && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Dissoudre ce couple ? (Les enfants seront détachés, pas supprimés)')) {
                      data.onDeleteCouple?.(data.coupleId);
                    }
                  }}
                  style={{
                    background: 'rgba(180,60,60,0.08)',
                    border: '1px solid rgba(180,60,60,0.25)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#b03c3c',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '36px',
                  }}
                >
                  🗑️ Supprimer le couple
                </button>
              )}
            </div>

            {/* Children list */}
            {data.children && data.children.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(60,46,28,0.08)' }}>
                <div style={{ fontSize: '11px', color: '#8a7560', marginBottom: '4px' }}>
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
                      color: '#3d2e1c',
                    }}
                  >
                    <span>👶 {child.firstName} {child.lastName ?? ''}</span>
                    {data.onRemoveChild && (
                      <button
                        onClick={(e) => { e.stopPropagation(); data.onRemoveChild?.(child.id); }}
                        title="Détacher cet enfant"
                        style={{
                          background: 'rgba(180,60,60,0.1)',
                          border: 'none',
                          color: '#b03c3c',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '3px 6px',
                          minHeight: '24px',
                        }}
                      >
                        ✕ Détacher
                      </button>
                    )}
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
