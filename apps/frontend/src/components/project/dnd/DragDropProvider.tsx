'use client';

import React from 'react';
import {
  DragDropContext,
  DropResult,
  DragStart,
  DragUpdate,
} from '@hello-pangea/dnd';
import { projectStore } from '@smart/store/project';

interface Props {
  children: React.ReactNode;
  onDragEnd?: (result: DropResult) => void;
  boardTypes?: Record<string, 'board' | 'inbox' | 'calendar'>; // id -> type
}

const isBoardType = (boardId: string, boardTypes?: Props['boardTypes']) =>
  boardTypes?.[boardId] === 'board';

const DragDropContextProvider: React.FC<Props> = ({
  children,
  onDragEnd,
  boardTypes,
}) => {
  const { moveColumn, moveCard } = projectStore();

  const handleDragStart = (start: DragStart) => {
    console.log('Drag start:', start.type, start.draggableId);
  };

  const handleDragUpdate = (update: DragUpdate) => {
    console.log('Drag update:', update.destination?.droppableId);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    switch (type) {
      case 'COLUMN':
        if (
          isBoardType(source.droppableId, boardTypes) &&
          isBoardType(destination.droppableId, boardTypes)
        ) {
          moveColumn(
            source.droppableId, // srcBoardId
            destination.droppableId, // destBoardId
            draggableId, // columnId
            destination.index // destIndex
          );
        }
        break;

      case 'CARD':
        moveCard(
          source.droppableId, // srcColumnId
          destination.droppableId, // destColumnId
          draggableId, // cardId
          destination.index // destIndex
        );
        break;

      case 'BOARD':
        // Nếu cần, xử lý moveBoard
        break;

      default:
        console.warn('Unknown draggable type:', type);
        break;
    }

    if (onDragEnd) onDragEnd(result);
  };

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DragDropContext>
  );
};

export default DragDropContextProvider;
