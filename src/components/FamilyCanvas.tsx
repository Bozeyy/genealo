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
import { GitFork, Users, Lock, Unlock, RectangleHorizontal, RectangleVertical, Heart, Wand2, Menu, X, Baby, Sprout, Loader2 } from 'lucide-react';
import InstallPwaButton from './InstallPwaButton';

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
  const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated);
  const [cardLayout, setCardLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set vertical mode by default on mobile devices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setCardLayout('vertical');
      const { nodes: newNodes, edges: newEdges } = buildFamilyGraph(people, rawCouples, 'vertical');
      setNodes(newNodes);
      setEdges(newEdges);
      setTimeout(() => { fitView({ padding: 0.3, duration: 600 }); }, 100);
    }
  }, []);

  const handleToggleLayout = () => {
    const nextLayout = cardLayout === 'horizontal' ? 'vertical' : 'horizontal';
    setCardLayout(nextLayout);
    const { nodes: newNodes, edges: newEdges } = buildFamilyGraph(people, rawCouples, nextLayout);
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => { fitView({ padding: 0.3, duration: 600 }); }, 50);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const handleAutoOrganize = async () => {
    setOrganizeLoading(true);
    try {
      const { nodes: newNodes, edges: newEdges } = buildFamilyGraph(people, rawCouples, cardLayout);
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
          cardLayout,
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
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-color)', position: 'fixed', top: 0, left: 0 }}>
      {/* Taskbar Header */}
      <div className="app-header">
        <div className="header-brand">
          <GitFork size={18} color="var(--accent-color)" /> Genealo
        </div>

        <div className="header-actions">
          {/* People List */}
          <button
            onClick={() => setShowPeopleList(true)}
            className="header-btn"
            title="Liste des membres"
          >
            <Users size={15} /> <span style={{ fontWeight: '700' }}>{people.length}</span>
          </button>

          {/* Card Layout format toggle (Horizontal / Vertical) */}
          <button
            onClick={handleToggleLayout}
            className="header-btn"
            title="Format des cartes (Horizontale / Verticale)"
          >
            {cardLayout === 'vertical' ? <RectangleVertical size={15} /> : <RectangleHorizontal size={15} />}
            <span className="desktop-only" style={{ marginLeft: '4px' }}>
              {cardLayout === 'vertical' ? 'Vertical' : 'Horizontal'}
            </span>
          </button>

          {/* Desktop specific buttons */}
          {isAuthenticated && (
            <>
              <button
                onClick={() => handleStartCreateCouple()}
                className="header-btn desktop-only"
                style={{ background: 'rgba(192, 120, 90, 0.1)', borderColor: 'rgba(192, 120, 90, 0.25)', color: '#a06848' }}
              >
                <Heart size={15} /> Former un couple
              </button>
              <button
                onClick={handleAutoOrganize}
                disabled={organizeLoading}
                className="header-btn desktop-only"
              >
                {organizeLoading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} Auto-organiser
              </button>
            </>
          )}

          {/* PWA Install Button */}
          <InstallPwaButton />

          {/* Lock / Unlock */}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="header-btn header-btn-danger" title="Verrouiller l'édition">
              <Lock size={15} /> <span className="desktop-only">Verrouiller</span>
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="header-btn header-btn-success" title="Déverrouiller l'édition">
              <Unlock size={15} /> <span className="desktop-only">Déverrouiller</span>
            </button>
          )}

          {/* Mobile hamburger menu for logged in actions */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="header-btn mobile-only"
              title="Menu"
            >
              <Menu size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 15,
            background: 'rgba(40,51,24,0.25)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '55px',
              right: '0.5rem',
              background: 'rgba(254,253,249,0.97)',
              border: '1px solid rgba(40,51,24,0.12)',
              borderRadius: '14px',
              padding: '0.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 8px 28px rgba(40,51,24,0.15)',
              minWidth: '220px',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <button
              onClick={() => { handleStartCreateCouple(); }}
              className="header-btn"
              style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(192, 120, 90, 0.1)', color: '#a06848', padding: '0.6rem 0.8rem' }}
            >
              <Heart size={15} /> Former un couple
            </button>
            <button
              onClick={handleAutoOrganize}
              disabled={organizeLoading}
              className="header-btn"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.6rem 0.8rem' }}
            >
              {organizeLoading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} Auto-organiser par génération
            </button>
          </div>
        </div>
      )}

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
          color="rgba(40,51,24,0.08)"
        />
        <Controls />
        <MiniMap
          nodeColor={n => (n.type === 'union' ? '#5c2456' : '#556b2f')}
          maskColor="rgba(247,246,240,0.7)"
        />
      </ReactFlow>

      {/* Empty state */}
      {people.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Sprout size={56} color="var(--accent-color)" strokeWidth={1.5} />
          </div>
          <h2 style={{ color: '#3d2e1c', fontWeight: '700', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Votre arbre est vide
          </h2>
          <p style={{ color: '#8a7560' }}>Cliquez sur le + en bas à droite pour ajouter votre première personne</p>
        </div>
      )}

      {/* Floating Action Button (+) */}
      <AddPersonButton
        isAuthenticated={isAuthenticated}
        onRequireAuth={() => setShowAuthModal(true)}
      />

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
            <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Baby size={20} color="var(--accent-color)" /> Ajouter un enfant
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rattacher une personne existante à ce couple</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input type="text" placeholder="Rechercher par nom..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ marginBottom: '8px' }} />
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
            <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Baby size={20} color="var(--accent-color)" /> Ajouter un enfant
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Pour : <strong style={{ color: 'var(--accent-color)' }}>{parent?.firstName} {parent?.lastName}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input type="text" placeholder="Rechercher l'enfant par nom..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ marginBottom: '8px' }} />
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
