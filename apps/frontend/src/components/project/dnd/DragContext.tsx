'use client';

import { DragContextType } from '@smart/types/project';
import React, { createContext, useContext } from 'react';

export const DragContext = createContext<DragContextType>({
  activeId: null,
  overId: null,
  activeItem: null,
  registerScrollContainer: () => undefined,
  registerBoardScrollContainer: () => undefined,
  overData: null,
  setOverData: () => undefined,
});

export const useDragContext = () => useContext(DragContext);
