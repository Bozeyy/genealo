'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from 'reactflow';
import { Heart, HeartOff, Baby, Trash2, Unlink, X } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSep = Boolean(data.isSeparated);
  const hasActions = data.onAddChild || data.onDeleteCouple;

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!isMobile) setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => hasActions && !isMobile && setShowMenu(true)}
      onMouseLeave={() => !isMobile && setShowMenu(false)}
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
          if (hasActions) {
            setShowMenu(prev => !prev);
          }
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
          color: '#fff',
          transition: 'all 0.2s ease',
        }}
        title={isSep ? 'Couple séparé/divorcé (cliquez pour gérer)' : 'Couple uni (cliquez pour gérer)'}
      >
        {isSep ? <HeartOff size={14} /> : <Heart size={14} fill="white" />}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="union-top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="union-bottom" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="union-left" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="union-right" style={{ opacity: 0 }} />

      {/* Desktop Popup */}
      {showMenu && hasActions && !isMobile && (
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isSep ? <HeartOff size={13} /> : <Heart size={13} fill="currentColor" />}
                {isSep ? 'Union Séparée' : 'Union Familiale'}
              </span>
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
                  <Baby size={15} /> Ajouter un enfant au couple
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
                  {isSep ? (
                    <> <Heart size={15} fill="currentColor" /> Marquer comme uni(e)s </>
                  ) : (
                    <> <HeartOff size={15} /> Marquer comme séparé(e)s </>
                  )}
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
                  <Trash2 size={15} /> Supprimer le couple
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Baby size={13} color="#5a8a48" /> {child.firstName} {child.lastName ?? ''}
                    </span>
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Unlink size={11} /> Détacher
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Action Bottom Sheet via React Portal */}
      {showMenu && hasActions && isMobile && mounted && createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
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
              border: `1px solid ${isSep ? 'rgba(196,154,60,0.3)' : 'rgba(192,120,90,0.3)'}`,
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
            {/* Header / Title & Close button */}
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: isSep ? '#a88030' : '#a06040',
              marginBottom: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                {isSep ? <HeartOff size={16} /> : <Heart size={16} fill="currentColor" />}
                {isSep ? 'Union Séparée' : 'Union Familiale'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', background: isSep ? 'rgba(196,154,60,0.15)' : 'rgba(192,120,90,0.15)' }}>
                  {isSep ? 'Séparés' : 'Unis'}
                </span>
                <button
                  onClick={() => setShowMenu(false)}
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
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.onAddChild && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    data.onAddChild?.(data.coupleId);
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
                  <Baby size={18} /> Ajouter un enfant au couple
                </button>
              )}

              {data.onToggleSeparated && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    data.onToggleSeparated?.(data.coupleId, !isSep);
                  }}
                  style={{
                    background: isSep ? 'rgba(192,120,90,0.12)' : 'rgba(196,154,60,0.12)',
                    border: `1px solid ${isSep ? 'rgba(192,120,90,0.3)' : 'rgba(196,154,60,0.3)'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: isSep ? '#a06040' : '#a88030',
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
                  {isSep ? (
                    <> <Heart size={18} fill="currentColor" /> Marquer comme uni(e)s </>
                  ) : (
                    <> <HeartOff size={18} /> Marquer comme séparé(e)s </>
                  )}
                </button>
              )}

              {data.onDeleteCouple && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Dissoudre ce couple ? (Les enfants seront détachés, pas supprimés)')) {
                      setShowMenu(false);
                      data.onDeleteCouple?.(data.coupleId);
                    }
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
                  <Trash2 size={18} /> Supprimer le couple
                </button>
              )}
            </div>

            {/* Children list */}
            {data.children && data.children.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(60,46,28,0.1)' }}>
                <div style={{ fontSize: '12px', color: '#8a7560', marginBottom: '8px', fontWeight: '600' }}>
                  Enfants du couple ({data.children.length}) :
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.children.map(child => (
                    <div
                      key={child.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        padding: '8px 12px',
                        background: 'rgba(120,100,70,0.06)',
                        borderRadius: '8px',
                        color: '#3d2e1c',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                        <Baby size={16} color="#5a8a48" /> {child.firstName} {child.lastName ?? ''}
                      </span>
                      {data.onRemoveChild && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            data.onRemoveChild?.(child.id);
                          }}
                          title="Détacher cet enfant"
                          style={{
                            background: 'rgba(180,60,60,0.1)',
                            border: 'none',
                            color: '#b03c3c',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '6px 10px',
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '500',
                          }}
                        >
                          <Unlink size={13} /> Détacher
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default memo(UnionNode);
