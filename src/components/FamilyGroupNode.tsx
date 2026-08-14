'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';

export type FamilyGroupNodeData = {
  coupleId: string;
  width: number;
  height: number;
  isVisible?: boolean;
};

function FamilyGroupNode({ data, selected }: NodeProps<FamilyGroupNodeData>) {
  const isVisible = data.isVisible || selected;
  if (!isVisible) return null;

  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        borderRadius: '16px',
        border: '2px dashed rgba(85, 107, 47, 0.45)',
        background: 'rgba(85, 107, 47, 0.05)',
        boxShadow: '0 0 16px rgba(85, 107, 47, 0.12)',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
      }}
    />
  );
}

export default memo(FamilyGroupNode);
