"use client";

import { create } from "zustand";
import {
  Project,
  ProjectMember,
  Card,
  Column,
  CardView,
  CardLabel,
  Board,
} from "@smart/types/project";

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

  setCurrentProject: (project: Project) => void;
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
}

export const projectStore = create<ProjectState>((set, get) => ({
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

  setCurrentProject: (project) => {
    const boards: Record<string, Board> = {};
    const columns: Record<string, Column> = {};
    const cards: Record<string, Card> = {};
    const boardColumns: Record<string, string[]> = {};
    const columnCards: Record<string, string[]> = {};
    const members: Record<string, ProjectMember> = {};
    const labels: Record<string, CardLabel> = {};
    const views: Record<string, CardView> = {};

    project.boards?.forEach((b) => {
      boards[b.id] = b;
      boardColumns[b.id] = [];
    });

    project.boards?.forEach((b) => {
      b.columns?.forEach((c) => {
        columns[c.id] = c;
        if (!c.boardId) return;
        boardColumns[c.boardId] = boardColumns[c.boardId] || [];
        // Chỉ push nếu chưa tồn tại id column trong boardColumns
        if (!boardColumns[c.boardId].includes(c.id)) {
          boardColumns[c.boardId].push(c.id);
        }
        columnCards[c.id] = [];
      });
    });

    project.cards?.forEach((card) => {
      cards[card.id] = card;
      columnCards[card.columnId] = columnCards[card.columnId] || [];
      // Chỉ push nếu chưa tồn tại id card trong columnCards
      if (!columnCards[card.columnId].includes(card.id)) {
        columnCards[card.columnId].push(card.id);
      }
    });

    project.members?.forEach((m) => (members[m.id] = m));
    project.labels?.forEach((l) => (labels[l.id] = l));
    project.views?.forEach((v) => (views[v.id] = v));

    Object.keys(boards).forEach((boardId) => {
      const colIds = boardColumns[boardId];
      boards[boardId] = {
        ...boards[boardId],
        columnIds: colIds.sort(
          (a, b) => (columns[a]?.position ?? 0) - (columns[b]?.position ?? 0)
        ),
      };
    });

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
      currentProject:
        s.currentProject?.id === projectId ? null : s.currentProject,
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
      const boardColumns = { ...s.boardColumns };
      const src = [...(boardColumns[srcBoardId] || [])];
      const dest = [...(boardColumns[destBoardId] || [])];
      const idx = src.indexOf(columnId);
      if (idx !== -1) src.splice(idx, 1);
      dest.splice(destIndex, 0, columnId);
      boardColumns[srcBoardId] = src;
      boardColumns[destBoardId] = dest;
      return { boardColumns };
    }),

  addCard: (columnId, cardOrCards) =>
  set((s) => {
    console.log("🟩 [addCard] columnId:", columnId);
    console.log("🟩 [addCard] input:", cardOrCards);

    const columnCards = { ...s.columnCards };
    const cards = { ...s.cards };
    columnCards[columnId] = columnCards[columnId] || [];

    const cardsToAdd = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards];
    console.log("🟩 [addCard] cardsToAdd:", cardsToAdd);

    cardsToAdd.forEach((card) => {
      const position = card.position ?? columnCards[columnId].length;
      console.log(`🟩 [addCard] Processing card: ${card.id}, position: ${position}`);

      if (!columnCards[columnId].includes(card.id)) {
        columnCards[columnId].splice(position, 0, card.id);
        console.log(`🟩 [addCard] Added cardId to column:`, columnCards[columnId]);
      } else {
        console.log(`⚠️ [addCard] Card ${card.id} already exists in column`);
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

    console.log("✅ [addCard] Final columnCards:", columnCards[columnId]);
    console.log("✅ [addCard] Final cards:", cards);

    return { cards, columnCards };
  }),


  updateCard: (card) =>
    set((s) => {
      const cards = { ...s.cards };
      if (!cards[card.id]) {
        console.warn(`[updateCard] Card id=${card.id} không tồn tại trong store`);
        return s;
      }

      cards[card.id] = { ...cards[card.id], ...card };

      return { cards };
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

      if (!cards[cardId]) {
        console.warn(`[moveCard] Card id=${cardId} không tồn tại trong store`);
        return s;
      }

      const src = [...(columnCards[srcColumnId] || [])];
      const dest = [...(columnCards[destColumnId] || [])];

      const idx = src.indexOf(cardId);
      if (idx !== -1) src.splice(idx, 1);

      dest.splice(destIndex, 0, cardId);

      columnCards[srcColumnId] = src;
      columnCards[destColumnId] = dest;

      cards[cardId] = {
        ...cards[cardId],
        columnId: destColumnId,
        position: destIndex,
      };

      columnCards[srcColumnId].forEach((cid, idx) => {
        if (cards[cid]) cards[cid] = { ...cards[cid], position: idx };
      });
      columnCards[destColumnId].forEach((cid, idx) => {
        if (cards[cid]) cards[cid] = { ...cards[cid], position: idx };
      });

      return { columnCards, cards };
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

  addView: (view) =>
    set((s) => ({ views: { ...s.views, [view.id]: view } })),

  updateView: (view) =>
    set((s) => ({ views: { ...s.views, [view.id]: view } })),

  removeView: (viewId) =>
    set((s) => {
      const views = { ...s.views };
      delete views[viewId];
      return { views };
    }),
}));
