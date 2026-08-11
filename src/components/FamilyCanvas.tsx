'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
  BackgroundVariant,
  NodeDragHandler,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import PersonNode, { PersonNodeData } from './PersonNode';
import UnionNode, { UnionNodeData } from './UnionNode';
import EditPersonModal from './EditPersonModal';
import CreateCoupleModal from './CreateCoupleModal';
import AddPersonButton from './AddPersonButton';
import PeopleListModal from './PeopleListModal';
import AuthModal from './AuthModal';
import { deletePerson, updatePersonPosition } from '@/actions/personActions';
import { deleteCouple, addChildToCouple, addChildToPerson, removeChildFromCouple, toggleCoupleSeparated } from '@/actions/coupleActions';
import { logout } from '@/actions/authActions';
import { buildFamilyGraph, RawCouple } from '@/lib/familyLayout';

const nodeTypes = {
  person: PersonNode,
  union: UnionNode,
};

type Props = {
  initialNodes: Node[];
  initialEdges: Edge[];
  people: PersonNodeData[];
  rawCouples: RawCouple[];
  isAuthenticated: boolean;
};

function FamilyCanvasInner({ initialNodes, initialEdges, people, rawCouples, isAuthenticated }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);
  useEffect(() => { setEdges(initialEdges); }, [initialEdges, setEdges]);

  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [createCouplePartner1Id, setCreateCouplePartner1Id] = useState<string | null>(null);
  const [showCreateCoupleModal, setShowCreateCoupleModal] = useState(false);
  const [addChildTargetCoupleId, setAddChildTargetCoupleId] = useState<string | null>(null);
  const [addChildTargetPersonId, setAddChildTargetPersonId] = useState<string | null>(null);
  const [showPeopleList, setShowPeopleList] = useState(false);
  const [organizeLoading, setOrganizeLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const handleAutoOrganize = async () => {
    setOrganizeLoading(true);
    try {
      const { nodes: newNodes, edges: newEdges } = buildFamilyGraph(people, rawCouples);
      setNodes(newNodes);
      setEdges(newEdges);
      for (const node of newNodes) {
        if (node.type === 'person') {
          updatePersonPosition(node.id, node.position.x, node.position.y);
        }
      }
      setTimeout(() => { fitView({ padding: 0.3, duration: 800 }); }, 100);
    } finally {
      setOrganizeLoading(false);
      setMobileMenuOpen(false);
    }
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onNodeDragStop: NodeDragHandler = useCallback((_, node) => {
    if (node.type === 'union') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updatePersonPosition(node.id, node.position.x, node.position.y);
    }, 600);
  }, []);

  const handleEdit = useCallback((id: string) => { setEditingPersonId(id); }, []);
  const handleDeletePerson = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette personne et tous ses liens ?')) return;
    await deletePerson(id);
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);
  const handleStartCreateCouple = useCallback((partner1Id?: string) => {
    setCreateCouplePartner1Id(partner1Id ?? null);
    setShowCreateCoupleModal(true);
    setMobileMenuOpen(false);
  }, []);
  const handleOpenAddChildPerson = useCallback((personId: string) => { setAddChildTargetPersonId(personId); }, []);
  const handleDetachParent = useCallback(async (childId: string) => { await removeChildFromCouple(childId); }, []);
  const handleDeleteCouple = useCallback(async (coupleId: string) => { await deleteCouple(coupleId); }, []);
  const handleToggleSeparated = useCallback(async (coupleId: string, isSeparated: boolean) => { await toggleCoupleSeparated(coupleId, isSeparated); }, []);
  const handleOpenAddChild = useCallback((coupleId: string) => { setAddChildTargetCoupleId(coupleId); }, []);
  const handleRemoveChildFromCouple = useCallback(async (childId: string) => { await removeChildFromCouple(childId); }, []);

  const nodesWithCallbacks = nodes.map(node => {
    if (node.type === 'person') {
      return {
        ...node,
        data: {
          ...node.data,
          onEdit: isAuthenticated ? handleEdit : undefined,
          onDelete: isAuthenticated ? handleDeletePerson : undefined,
          onCreateCouple: isAuthenticated ? handleStartCreateCouple : undefined,
          onAddChildPerson: isAuthenticated ? handleOpenAddChildPerson : undefined,
          onDetachParent: isAuthenticated ? handleDetachParent : undefined,
        },
      };
    }
    if (node.type === 'union') {
      return {
        ...node,
        data: {
          ...node.data,
          onAddChild: isAuthenticated ? handleOpenAddChild : undefined,
          onDeleteCouple: isAuthenticated ? handleDeleteCouple : undefined,
          onToggleSeparated: isAuthenticated ? handleToggleSeparated : undefined,
          onRemoveChild: isAuthenticated ? handleRemoveChildFromCouple : undefined,
        },
      };
    }
    return node;
  });

  const editingPerson = people.find(p => p.id === editingPersonId) ?? null;

  // Header button style helper
  const headerBtnStyle = (bg: string, border: string, color: string): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '8px',
    padding: '0.45rem 0.75rem',
    color,
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    minHeight: '36px',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#faf6f1', position: 'fixed', top: 0, left: 0 }}>
      {/* Header overlay */}
      <div style={{
        position: 'absolute',
        top: '0.75rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(255,252,248,0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(60,46,28,0.1)',
        borderRadius: '12px',
        padding: '0.4rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 20px rgba(60,46,28,0.08)',
        maxWidth: 'calc(100vw - 1rem)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#a07850', whiteSpace: 'nowrap' }}>
          🌳 Genealo
        </span>
        <span style={{ color: '#b5a48e', fontSize: '0.85rem' }}>|</span>

        {/* People list - always visible */}
        <button onClick={() => setShowPeopleList(true)} style={headerBtnStyle('rgba(160,120,80,0.08)', 'rgba(160,120,80,0.2)', '#8a6540')}>
          📋 <span className="header-btn-label">{people.length}</span>
        </button>

        {/* Lock/Unlock - always visible */}
        {isAuthenticated ? (
          <button onClick={handleLogout} style={headerBtnStyle('rgba(180,60,60,0.08)', 'rgba(180,60,60,0.2)', '#b03c3c')}>
            🔒
          </button>
        ) : (
          <button onClick={() => setShowAuthModal(true)} style={headerBtnStyle('rgba(122,155,109,0.1)', 'rgba(122,155,109,0.25)', '#5a8a48')}>
            🔓
          </button>
        )}

        {/* Desktop only buttons */}
        {isAuthenticated && (
          <>
            <button
              onClick={() => handleStartCreateCouple()}
              style={{
                ...headerBtnStyle('rgba(192,120,90,0.1)', 'rgba(192,120,90,0.25)', '#a06848'),
                display: 'none',
              }}
              className="header-desktop-btn"
            >
              💍 Former un couple
            </button>
            <button
              onClick={handleAutoOrganize}
              disabled={organizeLoading}
              style={{
                ...headerBtnStyle('rgba(160,120,80,0.1)', 'rgba(160,120,80,0.3)', '#8a6540'),
                cursor: organizeLoading ? 'wait' : 'pointer',
                display: 'none',
              }}
              className="header-desktop-btn"
            >
              {organizeLoading ? '⏳ Calcul...' : '🪄 Auto-organiser'}
            </button>

            {/* Mobile hamburger for extra actions */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              style={headerBtnStyle('rgba(160,120,80,0.08)', 'rgba(160,120,80,0.2)', '#8a6540')}
              className="header-mobile-menu-btn"
            >
              ☰
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 15,
            background: 'rgba(60,46,28,0.2)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '60px',
              right: '0.75rem',
              background: 'rgba(255,252,248,0.97)',
              border: '1px solid rgba(60,46,28,0.12)',
              borderRadius: '12px',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 8px 24px rgba(60,46,28,0.12)',
              minWidth: '200px',
            }}
          >
            <button
              onClick={() => { handleStartCreateCouple(); }}
              style={{
                ...headerBtnStyle('rgba(192,120,90,0.1)', 'rgba(192,120,90,0.25)', '#a06848'),
                width: '100%', justifyContent: 'flex-start',
              }}
            >
              💍 Former un couple
            </button>
            <button
              onClick={handleAutoOrganize}
              disabled={organizeLoading}
              style={{
                ...headerBtnStyle('rgba(160,120,80,0.1)', 'rgba(160,120,80,0.3)', '#8a6540'),
                width: '100%', justifyContent: 'flex-start',
                cursor: organizeLoading ? 'wait' : 'pointer',
              }}
            >
              {organizeLoading ? '⏳ Calcul...' : '🪄 Auto-organiser'}
            </button>
          </div>
        </div>
      )}

      {/* Responsive styles injected */}
      <style>{`
        .header-desktop-btn { display: none !important; }
        .header-mobile-menu-btn { display: flex !important; }
        @media (min-width: 768px) {
          .header-desktop-btn { display: flex !important; }
          .header-mobile-menu-btn { display: none !important; }
        }
        .header-btn-label {}
      `}</style>

      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodesDraggable={isAuthenticated}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.3, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(60,46,28,0.08)"
        />
        <Controls />
        <MiniMap
          nodeColor={n => (n.type === 'union' ? '#c0785a' : '#a07850')}
          maskColor="rgba(250,246,241,0.7)"
        />
      </ReactFlow>

      {/* Empty state */}
      {people.length === 0 && isAuthenticated && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌱</div>
          <h2 style={{ color: '#3d2e1c', fontWeight: '700', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Votre arbre est vide
          </h2>
          <p style={{ color: '#8a7560' }}>Cliquez sur le + en bas à droite pour ajouter votre première personne</p>
        </div>
      )}

      {/* FAB */}
      {isAuthenticated && <AddPersonButton />}

      {/* People List Modal */}
      {showPeopleList && (
        <PeopleListModal
          people={people}
          onClose={() => setShowPeopleList(false)}
          onEdit={isAuthenticated ? handleEdit : undefined}
          onDelete={isAuthenticated ? handleDeletePerson : undefined}
        />
      )}

      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          onClose={() => setEditingPersonId(null)}
        />
      )}

      {showCreateCoupleModal && (
        <CreateCoupleModal
          initialPartner1Id={createCouplePartner1Id}
          people={people}
          onClose={() => setShowCreateCoupleModal(false)}
        />
      )}

      {addChildTargetCoupleId && (
        <AddChildModal
          coupleId={addChildTargetCoupleId}
          people={people}
          onClose={() => setAddChildTargetCoupleId(null)}
        />
      )}

      {addChildTargetPersonId && (
        <AddChildToPersonModal
          parentPersonId={addChildTargetPersonId}
          people={people}
          onClose={() => setAddChildTargetPersonId(null)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

// Sub-component: Add Child to Couple Modal
function AddChildModal({ coupleId, people, onClose }: { coupleId: string; people: PersonNodeData[]; onClose: () => void }) {
  const [selectedChildId, setSelectedChildId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const availableChildren = people.filter(p => `${p.firstName} ${p.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    setLoading(true);
    try { await addChildToCouple(coupleId, selectedChildId); onClose(); } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} className="modal-overlay">
      <div onClick={e => e.stopPropagation()} className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>👶 Ajouter un enfant</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rattacher une personne existante à ce couple</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input type="text" placeholder="🔍 Rechercher par nom..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ marginBottom: '8px' }} />
            <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="input-field">
              <option value="">— Sélectionner l'enfant ({availableChildren.length}) —</option>
              {availableChildren.map(p => (<option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>))}
            </select>
          </div>
          <button type="submit" disabled={loading || !selectedChildId} className="btn-primary" style={{ opacity: (loading || !selectedChildId) ? 0.5 : 1, cursor: (loading || !selectedChildId) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Rattachement...' : 'Rattacher cet enfant'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Add Child directly to Person (Single Parent)
function AddChildToPersonModal({ parentPersonId, people, onClose }: { parentPersonId: string; people: PersonNodeData[]; onClose: () => void }) {
  const [selectedChildId, setSelectedChildId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const parent = people.find(p => p.id === parentPersonId);
  const availableChildren = people.filter(p => p.id !== parentPersonId && `${p.firstName} ${p.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    setLoading(true); setError('');
    try {
      const res = await addChildToPerson(parentPersonId, selectedChildId);
      if ('error' in res && res.error) { setError(res.error as string); } else { onClose(); }
    } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} className="modal-overlay">
      <div onClick={e => e.stopPropagation()} className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>👶 Ajouter un enfant</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Pour : <strong style={{ color: 'var(--accent-color)' }}>{parent?.firstName} {parent?.lastName}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input type="text" placeholder="🔍 Rechercher l'enfant par nom..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ marginBottom: '8px' }} />
            <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="input-field">
              <option value="">— Sélectionner l'enfant ({availableChildren.length}) —</option>
              {availableChildren.map(p => (<option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>))}
            </select>
          </div>
          {error && <p style={{ color: '#b03c3c', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading || !selectedChildId} className="btn-primary" style={{ opacity: (loading || !selectedChildId) ? 0.5 : 1, cursor: (loading || !selectedChildId) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Ajout...' : 'Ajouter comme enfant'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function FamilyCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <FamilyCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
