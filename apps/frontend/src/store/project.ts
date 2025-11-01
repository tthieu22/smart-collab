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

  addCard: (columnId: string, card: Card) => void;
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
      boards[b.id] = b;
      boardColumns[b.id] = [];

      b.columns?.forEach((c) => {
        columns[c.id] = c;
        if (!c.boardId) return;
        boardColumns[c.boardId] = boardColumns[c.boardId] || [];
        boardColumns[c.boardId].push(c.id);
        columnCards[c.id] = [];
      });
    });

    project.cards?.forEach((card) => {
      cards[card.id] = card;
      columnCards[card.columnId] = columnCards[card.columnId] || [];
      columnCards[card.columnId].push(card.id);
    });

    project.members?.forEach((m) => (members[m.id] = m));
    project.labels?.forEach((l) => (labels[l.id] = l));
    project.views?.forEach((v) => (views[v.id] = v));
    
    Object.keys(boards).forEach((boardId) => {
      boards[boardId] = {
        ...boards[boardId],
        columnIds: boardColumns[boardId] || [],
      };
    });

    // Gán cardIds cho mỗi column
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
      allProjects: s.allProjects.map((p) =>
        p.id === project.id ? project : p
      ),
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
    set((s) => ({
      boards: { ...s.boards, [board.id]: board },
      boardColumns: { ...s.boardColumns, [board.id]: [] },
    })),

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
      boardColumns[boardId] = boardColumns[boardId] || [];
      boardColumns[boardId].push(column.id);

      return {
        columns: { ...s.columns, [column.id]: column },
        boardColumns,
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
      boardColumns[boardId] = boardColumns[boardId].filter(
        (id) => id !== columnId
      );

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

  addCard: (columnId, card) =>
    set((s) => {
      const columnCards = { ...s.columnCards };
      columnCards[columnId] = columnCards[columnId] || [];
      columnCards[columnId].push(card.id);
      return { cards: { ...s.cards, [card.id]: card }, columnCards };
    }),

  updateCard: (card) =>
    set((s) => ({ cards: { ...s.cards, [card.id]: card } })),

  removeCard: (columnId, cardId) =>
    set((s) => {
      const cards = { ...s.cards };
      const columnCards = { ...s.columnCards };
      delete cards[cardId];
      columnCards[columnId] = (columnCards[columnId] || []).filter(
        (id) => id !== cardId
      );
      return { cards, columnCards };
    }),

  moveCard: (srcColumnId, destColumnId, cardId, destIndex) =>
    set((s) => {
      const columnCards = { ...s.columnCards };
      const cards = { ...s.cards };
      const card = cards[cardId];
      if (!card) return s;
      const src = [...(columnCards[srcColumnId] || [])];
      const dest = [...(columnCards[destColumnId] || [])];
      const idx = src.indexOf(cardId);
      if (idx !== -1) src.splice(idx, 1);
      dest.splice(destIndex, 0, cardId);
      columnCards[srcColumnId] = src;
      columnCards[destColumnId] = dest;
      card.columnId = destColumnId;
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
