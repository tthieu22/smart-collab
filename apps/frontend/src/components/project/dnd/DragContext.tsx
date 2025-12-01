'use client';

import React, { createContext, useContext } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';

export interface DragContextType {
  activeId: UniqueIdentifier | null;
  overId: UniqueIdentifier | null;
  activeItem: any;
  registerScrollContainer?: (columnId: string, node: HTMLElement | null) => void;
  registerBoardScrollContainer?: (boardId: string, node: HTMLElement | null) => void;
  overData?: any;
  setOverData?: (data: any) => void;
}

export const DragContext = createContext<DragContextType>({
  activeId: null,
  overId: null,
  activeItem: null,
  registerScrollContainer: () => undefined,
  registerBoardScrollContainer: () => undefined,
  overData: null,// Cần khởi tạo mặc định cho setOverData
  setOverData: () => undefined,
});

export const useDragContext = () => useContext(DragContext);
