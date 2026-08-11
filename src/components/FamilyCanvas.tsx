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
import { deletePerson, updatePersonPosition } from '@/actions/personActions';
import { deleteCouple, addChildToCouple, addChildToPerson, removeChildFromCouple, toggleCoupleSeparated } from '@/actions/coupleActions';
import { buildFamilyGraph, RawCouple } from '@/lib/familyLayout';
import AuthModal from './AuthModal';
import { logout } from '@/actions/authActions';

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

  // Synchronize state when server revalidates
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [createCouplePartner1Id, setCreateCouplePartner1Id] = useState<string | null>(null);
  const [showCreateCoupleModal, setShowCreateCoupleModal] = useState(false);
  const [addChildTargetCoupleId, setAddChildTargetCoupleId] = useState<string | null>(null);
  const [addChildTargetPersonId, setAddChildTargetPersonId] = useState<string | null>(null);
  const [showPeopleList, setShowPeopleList] = useState(false);
  const [organizeLoading, setOrganizeLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

      // Save new positions for person nodes
      for (const node of newNodes) {
        if (node.type === 'person') {
          updatePersonPosition(node.id, node.position.x, node.position.y);
        }
      }

      setTimeout(() => {
        fitView({ padding: 0.3, duration: 800 });
      }, 100);
    } finally {
      setOrganizeLoading(false);
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

  const handleEdit = useCallback((id: string) => {
    setEditingPersonId(id);
  }, []);

  const handleDeletePerson = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette personne et tous ses liens ?')) return;
    await deletePerson(id);
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  const handleStartCreateCouple = useCallback((partner1Id?: string) => {
    setCreateCouplePartner1Id(partner1Id ?? null);
    setShowCreateCoupleModal(true);
  }, []);

  const handleOpenAddChildPerson = useCallback((personId: string) => {
    setAddChildTargetPersonId(personId);
  }, []);

  const handleDetachParent = useCallback(async (childId: string) => {
    await removeChildFromCouple(childId);
  }, []);

  const handleDeleteCouple = useCallback(async (coupleId: string) => {
    await deleteCouple(coupleId);
  }, []);

  const handleToggleSeparated = useCallback(async (coupleId: string, isSeparated: boolean) => {
    await toggleCoupleSeparated(coupleId, isSeparated);
  }, []);

  const handleOpenAddChild = useCallback((coupleId: string) => {
    setAddChildTargetCoupleId(coupleId);
  }, []);

  const handleRemoveChildFromCouple = useCallback(async (childId: string) => {
    await removeChildFromCouple(childId);
  }, []);

  // Inject callbacks into nodes
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

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0f1115', position: 'fixed', top: 0, left: 0 }}>
      {/* Header overlay */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(15,17,21,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '0.5rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontSize: '1.1rem', fontWeight: '700', background: 'linear-gradient(135deg, #a5b4fc, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🌳 Genealo
        </span>
        <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>|</span>

        {/* Button to open People List */}
        <button
          onClick={() => setShowPeopleList(true)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '0.4rem 0.8rem',
            color: '#f8f9fa',
            fontSize: '0.85rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          📋 Membres ({people.length})
        </button>

        {/* Lock/Unlock Button */}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '0.4rem 0.8rem',
              color: '#fca5a5',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🔒 Verrouiller
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '8px',
              padding: '0.4rem 0.8rem',
              color: '#6ee7b7',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🔓 Déverrouiller
          </button>
        )}

        {/* Button to create couple */}
        {isAuthenticated && (
        <button
          onClick={() => handleStartCreateCouple()}
          style={{
            background: 'rgba(167,139,250,0.15)',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: '8px',
            padding: '0.4rem 0.8rem',
            color: '#c084fc',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          💍 Former un couple
        </button>
        )}

        {/* Button for Auto Organize */}
        {isAuthenticated && (
        <button
          onClick={handleAutoOrganize}
          disabled={organizeLoading}
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
            border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: '8px',
            padding: '0.4rem 0.8rem',
            color: '#e9d5ff',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: organizeLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {organizeLoading ? '⏳ Calcul...' : '🪄 Auto-organiser par génération'}
        </button>
        )}
      </div>

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
          color="rgba(255,255,255,0.06)"
        />
        <Controls
          style={{
            background: 'rgba(20,22,28,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
          }}
        />
        <MiniMap
          nodeColor={n => (n.type === 'union' ? '#a78bfa' : '#6366f1')}
          maskColor="rgba(15,17,21,0.7)"
          style={{
            background: 'rgba(20,22,28,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
          }}
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
          <h2 style={{ color: '#f8f9fa', fontWeight: '700', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Votre arbre est vide
          </h2>
          <p style={{ color: '#a0aab2' }}>Cliquez sur le + en bas à droite pour ajouter votre première personne</p>
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

      {/* Edit person modal */}
      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          onClose={() => setEditingPersonId(null)}
        />
      )}

      {/* Create Couple modal */}
      {showCreateCoupleModal && (
        <CreateCoupleModal
          initialPartner1Id={createCouplePartner1Id}
          people={people}
          onClose={() => setShowCreateCoupleModal(false)}
        />
      )}

      {/* Add Child to Couple Modal */}
      {addChildTargetCoupleId && (
        <AddChildModal
          coupleId={addChildTargetCoupleId}
          people={people}
          onClose={() => setAddChildTargetCoupleId(null)}
        />
      )}

      {/* Add Child directly to Person Modal */}
      {addChildTargetPersonId && (
        <AddChildToPersonModal
          parentPersonId={addChildTargetPersonId}
          people={people}
          onClose={() => setAddChildTargetPersonId(null)}
        />
      )}

      {/* Auth Modal */}
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
    try {
      await addChildToCouple(coupleId, selectedChildId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.7rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#f8f9fa',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
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
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          margin: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>👶 Ajouter un enfant</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#a0aab2' }}>
              Rattacher une personne existante à ce couple
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aab2', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input
              type="text"
              placeholder="🔍 Rechercher par prénom ou nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, marginBottom: '8px' }}
            />
            <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} style={selectStyle}>
              <option value="">— Sélectionner l'enfant ({availableChildren.length}) —</option>
              {availableChildren.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedChildId}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: (loading || !selectedChildId) ? 'not-allowed' : 'pointer',
              opacity: (loading || !selectedChildId) ? 0.5 : 1,
              fontSize: '1rem',
            }}
          >
            {loading ? 'Rattachement...' : 'Rattacher cet enfant'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Add Child directly to Person (Single Parent support)
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
    setLoading(true);
    setError('');
    try {
      const res = await addChildToPerson(parentPersonId, selectedChildId);
      if ('error' in res && res.error) {
        setError(res.error as string);
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.7rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#f8f9fa',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
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
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          margin: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>👶 Ajouter un enfant</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#a0aab2' }}>
              Pour : <strong style={{ color: '#38bdf8' }}>{parent?.firstName} {parent?.lastName}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aab2', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input
              type="text"
              placeholder="🔍 Rechercher l'enfant par nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, marginBottom: '8px' }}
            />
            <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} style={selectStyle}>
              <option value="">— Sélectionner l'enfant ({availableChildren.length}) —</option>
              {availableChildren.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName ?? ''}</option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !selectedChildId}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: (loading || !selectedChildId) ? 'not-allowed' : 'pointer',
              opacity: (loading || !selectedChildId) ? 0.5 : 1,
              fontSize: '1rem',
            }}
          >
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
