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

  /** Thiết lập & reset */
  setCurrentProject: (project: Project) => void;
  clearProjectStore: () => void;

  /** Project */
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;

  /** Board */
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  moveBoard: (sourceIndex: number, destinationIndex: number) => void;

  /** Column */
  addColumn: (boardId: string, title: string) => void;
  updateColumn: (column: Column) => void;
  removeColumn: (columnId: string) => void;
  moveColumn: (columnId: string, destBoardId: string, destIndex: number) => void;

  /** Card */
  addCard: (columnId: string, title: string) => void;
  updateCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  moveCard: (cardId: string, destColumnId: string, destIndex: number) => void;

  /** Label / Member / View */
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

  // ----------------------------
  // SETUP
  // ----------------------------
  setCurrentProject: (project) => {
    const boards: Record<string, Board> = {};
    const columns: Record<string, Column> = {};
    const cards: Record<string, Card> = {};
    const labels: Record<string, CardLabel> = {};
    const members: Record<string, ProjectMember> = {};
    const views: Record<string, CardView> = {};

    project.boards?.forEach((b) => boards[b.id] = b);
    project.columns?.forEach((c) => columns[c.id] = c);
    project.cards?.forEach((c) => cards[c.id] = c);
    project.members?.forEach((m) => members[m.id] = m);

    set({ currentProject: project, boards, columns, cards, labels, members, views });
  },

  clearProjectStore: () =>
    set({ currentProject: null, allProjects: [], boards: {}, columns: {}, cards: {}, labels: {}, members: {}, views: {} }),

  // ----------------------------
  // PROJECT CRUD
  // ----------------------------
  addProject: (project) => set((s) => ({ allProjects: [...s.allProjects, project] })),
  updateProject: (project) =>
    set((s) => ({
      allProjects: s.allProjects.map((p) => p.id === project.id ? project : p),
      currentProject: s.currentProject?.id === project.id ? project : s.currentProject,
    })),
  deleteProject: (projectId) =>
    set((s) => ({
      allProjects: s.allProjects.filter((p) => p.id !== projectId),
      currentProject: s.currentProject?.id === projectId ? null : s.currentProject,
    })),

  // ----------------------------
  // BOARD CRUD + DND
  // ----------------------------
  addBoard: (board) => set((s) => ({ boards: { ...s.boards, [board.id]: board } })),
  updateBoard: (board) => set((s) => ({ boards: { ...s.boards, [board.id]: board } })),
  removeBoard: (id) => set((s) => { const boards = { ...s.boards }; delete boards[id]; return { boards }; }),
  moveBoard: (sourceIndex, destinationIndex) => {
    const arr = Object.values(get().boards);
    const [removed] = arr.splice(sourceIndex, 1);
    arr.splice(destinationIndex, 0, removed);
    set({ boards: Object.fromEntries(arr.map((b) => [b.id, b])) });
  },

  // ----------------------------
  // COLUMN CRUD + DND
  // ----------------------------
  addColumn: (boardId, title) => {
    const id = crypto.randomUUID();
    const { boards, columns, currentProject } = get();
    const board = boards[boardId];
    if (!board || !currentProject) return;

    const newColumn: Column = {
      id,
      projectId: currentProject.id,
      title,
      position: board.columnIds.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: [],
      cardIds: [],
    };

    board.columnIds.push(id);
    set({ boards: { ...boards }, columns: { ...columns, [id]: newColumn } });
  },

  updateColumn: (column) => set((s) => ({ columns: { ...s.columns, [column.id]: column } })),
  removeColumn: (columnId) =>
    set((s) => {
      const columns = { ...s.columns };
      const cards = { ...s.cards };
      const boards = { ...s.boards };
      const col = columns[columnId];
      if (!col) return s;
      col.cardIds.forEach((cid) => delete cards[cid]);
      Object.values(boards).forEach((b) => { b.columnIds = b.columnIds.filter((id) => id !== columnId); });
      delete columns[columnId];
      return { columns, boards, cards };
    }),

  moveColumn: (columnId, destBoardId, destIndex) =>
    set((s) => {
      const boards = { ...s.boards };
      const columns = { ...s.columns };
      const col = columns[columnId];
      if (!col) return s;

      const srcBoard = Object.values(boards).find((b) => b.columnIds.includes(columnId));
      if (srcBoard) srcBoard.columnIds = srcBoard.columnIds.filter((id) => id !== columnId);

      const destBoard = boards[destBoardId];
      if (!destBoard) return s;
      destBoard.columnIds.splice(destIndex, 0, columnId);
      destBoard.columnIds.forEach((id, idx) => { if (columns[id]) columns[id].position = idx; });

      return { boards, columns };
    }),

  // ----------------------------
  // CARD CRUD + DND
  // ----------------------------
  addCard: (columnId, title) =>
    set((s) => {
      const id = crypto.randomUUID();
      const col = s.columns[columnId];
      if (!col || !s.currentProject) return s;

      const newCard: Card = {
        id,
        projectId: s.currentProject.id,
        columnId,
        title,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      col.cardIds.push(id);
      return { cards: { ...s.cards, [id]: newCard }, columns: { ...s.columns } };
    }),

  updateCard: (card) => set((s) => ({ cards: { ...s.cards, [card.id]: card } })),
  removeCard: (cardId) =>
    set((s) => {
      const cards = { ...s.cards };
      const columns = { ...s.columns };
      const card = cards[cardId];
      if (card) {
        const col = columns[card.columnId!];
        if (col) col.cardIds = col.cardIds.filter((id) => id !== cardId);
      }
      delete cards[cardId];
      return { cards, columns };
    }),
  moveCard: (cardId, destColumnId, destIndex) =>
    set((s) => {
      const cards = { ...s.cards };
      const columns = { ...s.columns };
      const card = cards[cardId];
      if (!card) return s;

      const srcCol = columns[card.columnId!];
      const destCol = columns[destColumnId];
      if (!destCol) return s;

      if (srcCol) srcCol.cardIds = srcCol.cardIds.filter((id) => id !== cardId);
      destCol.cardIds.splice(destIndex, 0, cardId);
      card.columnId = destColumnId;
      destCol.cardIds.forEach((id, idx) => { if (cards[id]) cards[id].position = idx; });

      return { cards, columns };
    }),

  // ----------------------------
  // LABEL / MEMBER / VIEW
  // ----------------------------
  addLabel: (label) => set((s) => ({ labels: { ...s.labels, [label.id]: label } })),
  updateLabel: (label) => set((s) => ({ labels: { ...s.labels, [label.id]: label } })),
  removeLabel: (id) => set((s) => { const labels = { ...s.labels }; delete labels[id]; return { labels }; }),

  addMember: (member) => set((s) => ({ members: { ...s.members, [member.id]: member } })),
  updateMember: (member) => set((s) => ({ members: { ...s.members, [member.id]: member } })),
  removeMember: (id) => set((s) => { const members = { ...s.members }; delete members[id]; return { members }; }),

  addView: (view) => set((s) => ({ views: { ...s.views, [view.id]: view } })),
  updateView: (view) => set((s) => ({ views: { ...s.views, [view.id]: view } })),
  removeView: (id) => set((s) => { const views = { ...s.views }; delete views[id]; return { views }; }),
}));
