'use client';

import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import {
  Project,
  ProjectMember,
  Card,
  Column,
  CardView,
  CardLabel,
  Board,
} from '@smart/types/project';

interface ProjectState {
  currentProject: Project | null;
  allProjects: Project[];

  boards: Record<string, Board>;
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  labels: Record<string, CardLabel>;
  members: Record<string, ProjectMember>;
  views: Record<string, CardView>;

  boardColumns: Record<string, string[]>;
  columnCards: Record<string, string[]>;
  hasJoinedCurrentProject: boolean;

  setCurrentProject: (project: Project | null) => void;
  clearProjectStore: () => void;

  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: string) => void;

  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;

  addColumn: (boardId: string, column: Column) => void;
  updateColumn: (column: Column) => void;
  removeColumn: (boardId: string, columnId: string) => void;
  moveColumn: (
    srcBoardId: string,
    destBoardId: string,
    columnId: string,
    destIndex: number
  ) => void;

  addCard: (columnId: string, card: Card | Card[]) => void;
  updateCard: (card: Card) => void;
  removeCard: (columnId: string, cardId: string) => void;
  moveCard: (
    srcColumnId: string,
    destColumnId: string,
    cardId: string,
    destIndex: number
  ) => void;

  addLabel: (label: CardLabel) => void;
  updateLabel: (label: CardLabel) => void;
  removeLabel: (labelId: string) => void;

  addMember: (member: ProjectMember) => void;
  updateMember: (member: ProjectMember) => void;
  removeMember: (memberId: string) => void;

  addView: (view: CardView) => void;
  updateView: (view: CardView) => void;
  removeView: (viewId: string) => void;
  setHasJoinedCurrentProject: (value: boolean) => void;
}

export const projectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  hasJoinedCurrentProject: false,
  allProjects: [],
  boards: {},
  columns: {},
  cards: {},
  labels: {},
  members: {},
  views: {},
  boardColumns: {},
  columnCards: {},

  setCurrentProject: (project) => {
    if (project === null) {
      set({ currentProject: null });
      return;
    }
    const hasSnapshot =
      Boolean(project?.boards?.length) ||
      Boolean(project?.cards?.length) ||
      Boolean(project?.columns?.length);

    if (!hasSnapshot) {
      set((s) => ({
        currentProject: { ...s.currentProject, ...project } as Project,
      }));
      return;
    }

    const prev = get();

    const boards: Record<string, Board> = {};
    const columns: Record<string, Column> = {};
    const cards: Record<string, Card> = {};
    const boardColumns: Record<string, string[]> = {};
    const columnCards: Record<string, string[]> = {};
    const members: Record<string, ProjectMember> = {};
    const labels: Record<string, CardLabel> = {};
    const views: Record<string, CardView> = {};

    // Boards & boardColumns init
    project.boards?.forEach((b) => {
      boards[b.id] = b;
      boardColumns[b.id] = [];
    });

    // Columns + boardColumns mapping
    project.boards?.forEach((b) => {
      b.columns?.forEach((c) => {
        columns[c.id] = c;
        if (c.boardId) {
          boardColumns[c.boardId] = boardColumns[c.boardId] || [];
          if (!boardColumns[c.boardId].includes(c.id)) {
            boardColumns[c.boardId].push(c.id);
          }
        }
        columnCards[c.id] = columnCards[c.id] || [];
      });
    });

    // Cards + columnCards mapping
    project.cards?.forEach((card) => {
      cards[card.id] = card;
      if (card.columnId) {
        columnCards[card.columnId] = columnCards[card.columnId] || [];
        if (!columnCards[card.columnId].includes(card.id)) {
          columnCards[card.columnId].push(card.id);
        }
      }
    });

    // Members, labels, views
    project.members?.forEach((m) => (members[m.id] = m));
    project.labels?.forEach((l) => (labels[l.id] = l));
    project.views?.forEach((v) => (views[v.id] = v));

    // Sort columnIds in boards
    Object.keys(boards).forEach((boardId) => {
      const colIds = boardColumns[boardId] || [];
      boards[boardId] = {
        ...boards[boardId],
        columnIds: colIds.sort(
          (a, b) => (columns[a]?.position ?? 0) - (columns[b]?.position ?? 0)
        ),
      };
    });

    // Add cardIds to columns
    Object.keys(columns).forEach((columnId) => {
      columns[columnId] = {
        ...columns[columnId],
        cardIds: columnCards[columnId] || [],
      };
    });

    set({
      currentProject: project,
      boards,
      columns,
      cards,
      members,
      labels,
      views,
      boardColumns,
      columnCards,
    });
  },

  setHasJoinedCurrentProject: (value) => set({ hasJoinedCurrentProject: value }),

  clearProjectStore: () =>
    set({
      currentProject: null,
      allProjects: [],
      boards: {},
      columns: {},
      cards: {},
      labels: {},
      members: {},
      views: {},
      boardColumns: {},
      columnCards: {},
    }),

  addProject: (project) =>
    set((s) => ({ allProjects: [...s.allProjects, project] })),

  updateProject: (project) =>
    set((s) => ({
      allProjects: s.allProjects.map((p) => (p.id === project.id ? project : p)),
      currentProject:
        s.currentProject?.id === project.id ? project : s.currentProject,
    })),

  removeProject: (projectId) =>
    set((s) => ({
      allProjects: s.allProjects.filter((p) => p.id !== projectId),
      currentProject: s.currentProject?.id === projectId ? null : s.currentProject,
    })),

  addBoard: (board) =>
    set((s) => {
      const boards = { ...s.boards, [board.id]: board };
      const boardColumns = { ...s.boardColumns };
      if (!boardColumns[board.id]) boardColumns[board.id] = [];
      return { boards, boardColumns };
    }),

  updateBoard: (board) =>
    set((s) => ({ boards: { ...s.boards, [board.id]: board } })),

  removeBoard: (boardId) =>
    set((s) => {
      const boards = { ...s.boards };
      const boardColumns = { ...s.boardColumns };
      const columns = { ...s.columns };
      const cards = { ...s.cards };
      const columnCards = { ...s.columnCards };

      const colIds = boardColumns[boardId] || [];
      colIds.forEach((cid) => {
        (columnCards[cid] || []).forEach((cardId) => delete cards[cardId]);
        delete columns[cid];
        delete columnCards[cid];
      });

      delete boardColumns[boardId];
      delete boards[boardId];

      return { boards, boardColumns, columns, cards, columnCards };
    }),

  addColumn: (boardId, column) =>
    set((s) => {
      const boardColumns = { ...s.boardColumns };
      const columns = { ...s.columns, [column.id]: column };

      boardColumns[boardId] = boardColumns[boardId] || [];

      if (!boardColumns[boardId].includes(column.id)) {
        const position = column.position ?? boardColumns[boardId].length;
        boardColumns[boardId].splice(position, 0, column.id);
      }

      boardColumns[boardId].sort(
        (a, b) => (columns[a]?.position ?? 0) - (columns[b]?.position ?? 0)
      );

      const updatedBoards = {
        ...s.boards,
        [boardId]: {
          ...s.boards[boardId],
          columnIds: boardColumns[boardId],
        },
      };

      return {
        columns,
        boardColumns,
        boards: updatedBoards,
        columnCards: { ...s.columnCards, [column.id]: [] },
      };
    }),

  updateColumn: (column) =>
    set((s) => ({ columns: { ...s.columns, [column.id]: column } })),

  removeColumn: (boardId, columnId) =>
    set((s) => {
      const columns = { ...s.columns };
      const cards = { ...s.cards };
      const boardColumns = { ...s.boardColumns };
      const columnCards = { ...s.columnCards };

      delete columns[columnId];
      (columnCards[columnId] || []).forEach((cardId) => delete cards[cardId]);
      delete columnCards[columnId];
      boardColumns[boardId] = boardColumns[boardId].filter((id) => id !== columnId);

      return { columns, cards, boardColumns, columnCards };
    }),

  moveColumn: (srcBoardId, destBoardId, columnId, destIndex) =>
    set((s) => {
      console.log('sađasađasadsadsadsadá', srcBoardId, destBoardId, columnId, destIndex)
      const boardColumns = { ...s.boardColumns };
      const columns = { ...s.columns };

      if (srcBoardId === destBoardId) {
        const columnIds = [...(boardColumns[srcBoardId] || [])];
        const activeIndex = columnIds.indexOf(columnId);

        if (activeIndex === -1 || activeIndex === destIndex) {
          return s; // Không có gì để làm
        }

        const newColumnIds = arrayMove(columnIds, activeIndex, destIndex);
        boardColumns[srcBoardId] = newColumnIds;

        newColumnIds.forEach((colId, index) => {
          const col = columns[colId];
          if (col) {
            columns[colId] = { ...col, position: index };
          }
        });

        return { boardColumns, columns };
      }

      // Move giữa các board
      const src = [...(boardColumns[srcBoardId] || [])];
      const dest = [...(boardColumns[destBoardId] || [])];
      const srcIndex = src.indexOf(columnId);
      if (srcIndex === -1) return s;

      src.splice(srcIndex, 1);
      dest.splice(destIndex, 0, columnId);

      boardColumns[srcBoardId] = src;
      boardColumns[destBoardId] = dest;

      src.forEach((colId, index) => {
        const col = columns[colId];
        if (col) columns[colId] = { ...col, position: index };
      });

      dest.forEach((colId, index) => {
        const col = columns[colId];
        if (col) columns[colId] = { ...col, position: index, boardId: destBoardId };
      });

      return { boardColumns, columns };
    }),

  addCard: (columnId, cardOrCards) =>
    set((s) => {
      const columnCards = { ...s.columnCards };
      const cards = { ...s.cards };
      columnCards[columnId] = columnCards[columnId] || [];

      const cardsToAdd = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards];
      cardsToAdd.forEach((card) => {
        const position = card.position ?? columnCards[columnId].length;

        if (!columnCards[columnId].includes(card.id)) {
          columnCards[columnId].splice(position, 0, card.id);
        }
        cards[card.id] = { ...card, position };
      });

      columnCards[columnId].sort(
        (a, b) => (cards[a]?.position ?? 0) - (cards[b]?.position ?? 0)
      );

      columnCards[columnId].forEach((cid, idx) => {
        if (cards[cid]) {
          cards[cid] = { ...cards[cid], position: idx };
        }
      });

      return { cards, columnCards };
    }),

  updateCard: (updatedCard: any) =>
    set((s) => {
      const cards = { ...s.cards };
      const columnCards = { ...s.columnCards };

      const oldCard = cards[updatedCard.id];
      if (!oldCard) {
        console.warn(`[updateCard] Card id=${updatedCard.id} không tồn tại trong store`);
        return s;
      }

      // Ép kiểu để chắc chắn columnId là string hợp lệ
      const oldColumnId = oldCard.columnId ?? '';
      const newColumnId = updatedCard.columnId ?? oldColumnId;
      const oldPosition = oldCard.position ?? 0;
      const newPosition = updatedCard.position ?? oldPosition;

      console.log(`[updateCard] Updating card id=${updatedCard.id}`);
      console.log(`Old columnId: ${oldColumnId}, New columnId: ${newColumnId}`);
      console.log(`Old position: ${oldPosition}, New position: ${newPosition}`);

      cards[updatedCard.id] = {
        ...oldCard,
        ...updatedCard,
        columnId: newColumnId,
        position: newPosition,
      };

      if (oldColumnId !== newColumnId) {
        console.log(`[updateCard] Card moved from column ${oldColumnId} to ${newColumnId}`);

        if (oldColumnId && columnCards[oldColumnId]) {
          columnCards[oldColumnId] = columnCards[oldColumnId].filter(id => id !== updatedCard.id);
          console.log(`[updateCard] Removed card id=${updatedCard.id} from old columnCards[${oldColumnId}]`);

          columnCards[oldColumnId].forEach((cid: string, idx: number) => {
            if (cards[cid]) {
              cards[cid] = { ...cards[cid], position: idx };
              console.log(`[updateCard] Updated position of card id=${cid} in old column to ${idx}`);
            }
          });
        }

        if (newColumnId) {
          if (!columnCards[newColumnId]) {
            columnCards[newColumnId] = [];
            console.log(`[updateCard] Initialized columnCards[${newColumnId}]`);
          }

          if (!columnCards[newColumnId].includes(updatedCard.id)) {
            if (newPosition >= 0 && newPosition <= columnCards[newColumnId].length) {
              columnCards[newColumnId].splice(newPosition, 0, updatedCard.id);
              console.log(`[updateCard] Inserted card id=${updatedCard.id} at position ${newPosition} in new columnCards[${newColumnId}]`);
            } else {
              columnCards[newColumnId].push(updatedCard.id);
              console.log(`[updateCard] Appended card id=${updatedCard.id} at end of new columnCards[${newColumnId}]`);
            }
          }

          columnCards[newColumnId].forEach((cid: string, idx: number) => {
            if (cards[cid]) {
              cards[cid] = { ...cards[cid], position: idx, columnId: newColumnId };
              console.log(`[updateCard] Updated position of card id=${cid} in new column to ${idx}`);
            }
          });
        }
      } else if (oldPosition !== newPosition) {
        console.log(`[updateCard] Card position changed within column ${newColumnId}`);

        if (newColumnId && columnCards[newColumnId]) {
          const cardIds = [...columnCards[newColumnId]];
          const oldIndex = cardIds.indexOf(updatedCard.id);

          if (oldIndex !== -1) {
            cardIds.splice(oldIndex, 1);
            cardIds.splice(newPosition, 0, updatedCard.id);
            columnCards[newColumnId] = cardIds;
            console.log(`[updateCard] Moved card id=${updatedCard.id} to position ${newPosition} in columnCards[${newColumnId}]`);

            cardIds.forEach((cid: string, idx: number) => {
              if (cards[cid]) {
                cards[cid] = { ...cards[cid], position: idx };
                console.log(`[updateCard] Updated position of card id=${cid} in column to ${idx}`);
              }
            });
          }
        }
      } else {
        console.log(`[updateCard] Card updated without changing columnId or position`);
      }

      return { cards, columnCards };
    }),



  removeCard: (columnId, cardId) =>
    set((s) => {
      const cards = { ...s.cards };
      const columnCards = { ...s.columnCards };

      if (!cards[cardId]) {
        console.warn(`[removeCard] Card id=${cardId} không tồn tại trong store`);
        return s;
      }

      delete cards[cardId];

      if (columnCards[columnId]) {
        columnCards[columnId] = columnCards[columnId].filter((id) => id !== cardId);

        columnCards[columnId].forEach((cid, idx) => {
          if (cards[cid]) {
            cards[cid] = { ...cards[cid], position: idx };
          }
        });
      }

      return { cards, columnCards };
    }),

  moveCard: (srcColumnId, destColumnId, cardId, destIndex) =>
    set((s) => {
      const columnCards = { ...s.columnCards };
      const cards = { ...s.cards };

      if (!cards[cardId]) return s;

      const src = [...(columnCards[srcColumnId] || [])];
      const dest = srcColumnId === destColumnId ? src : [...(columnCards[destColumnId] || [])];

      const idx = src.indexOf(cardId);
      if (idx === -1) return s;

      if (srcColumnId === destColumnId) {
        if (idx !== destIndex) {
          src.splice(idx, 1);
          src.splice(destIndex, 0, cardId);
          columnCards[srcColumnId] = src;

          src.forEach((cid, i) => {
            if (cards[cid]) {
              cards[cid] = { ...cards[cid], position: i };
            }
          });

          return { columnCards, cards };
        }
        return s;
      } else {
        src.splice(idx, 1);

        if (destIndex >= 0 && destIndex <= dest.length) {
          dest.splice(destIndex, 0, cardId);
        } else {
          dest.push(cardId);
        }

        columnCards[srcColumnId] = src;
        columnCards[destColumnId] = dest;

        src.forEach((cid, i) => {
          if (cards[cid]) cards[cid] = { ...cards[cid], position: i };
        });

        dest.forEach((cid, i) => {
          if (cards[cid]) cards[cid] = { ...cards[cid], position: i, columnId: destColumnId };
        });

        cards[cardId] = { ...cards[cardId], columnId: destColumnId, position: destIndex };

        return { columnCards, cards };
      }
    }),

  addLabel: (label) =>
    set((s) => ({ labels: { ...s.labels, [label.id]: label } })),

  updateLabel: (label) =>
    set((s) => ({ labels: { ...s.labels, [label.id]: label } })),

  removeLabel: (labelId) =>
    set((s) => {
      const labels = { ...s.labels };
      delete labels[labelId];
      return { labels };
    }),

  addMember: (member) =>
    set((s) => ({ members: { ...s.members, [member.id]: member } })),

  updateMember: (member) =>
    set((s) => ({ members: { ...s.members, [member.id]: member } })),

  removeMember: (memberId) =>
    set((s) => {
      const members = { ...s.members };
      delete members[memberId];
      return { members };
    }),

  addView: (view) => set((s) => ({ views: { ...s.views, [view.id]: view } })),

  updateView: (view) =>
    set((s) => ({ views: { ...s.views, [view.id]: view } })),

  removeView: (viewId) =>
    set((s) => {
      const views = { ...s.views };
      delete views[viewId];
      return { views };
    }),
}));
