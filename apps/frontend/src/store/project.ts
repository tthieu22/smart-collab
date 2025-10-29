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

  setCurrentProject: (project: Project) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;

  addMember: (projectId: string, member: ProjectMember) => void;
  removeMember: (projectId: string, userId: string) => void;
  updateMemberRole: (projectId: string, userId: string, role: string) => void;

  updateBoard: (projectId: string, board: Board) => void;
  deleteBoard: (projectId: string, boardId: string) => void;

  addColumn: (projectId: string, column: Column) => void;
  updateColumn: (projectId: string, column: Column) => void;
  removeColumn: (projectId: string, columnId: string) => void;
  moveColumn: (projectId: string, columnId: string, newIndex: number) => void;

  addCard: (projectId: string, card: Card) => void;
  updateCard: (projectId: string, card: Card) => void;
  removeCard: (projectId: string, cardId: string) => void;
  moveCard: (
    projectId: string,
    cardId: string,
    newColumnId: string,
    newIndex: number
  ) => void;
  copyCard: (projectId: string, card: Card) => void;

  updateCardView: (projectId: string, view: CardView) => void;
  removeCardView: (projectId: string, viewId: string) => void;

  addCardLabel: (projectId: string, label: CardLabel) => void;
  removeCardLabel: (projectId: string, labelId: string) => void;

  clearProjectStore: () => void;
}

export const projectStore = create<ProjectState>((set, get) => {
  const updateProjectState = (
    projectId: string,
    updater: (p: Project) => Project
  ) => {
    set((state) => {
      const allProjects = state.allProjects.map((p) =>
        p.id === projectId ? updater({ ...p }) : p
      );

      const currentProject =
        state.currentProject?.id === projectId
          ? updater({ ...state.currentProject })
          : state.currentProject;

      return { allProjects, currentProject };
    });
  };

  return {
    currentProject: null,
    allProjects: [],

    setCurrentProject: (project) => set({ currentProject: project }),
    addProject: (project) =>
      set((state) => {
        const exists = state.allProjects.some((p) => p.id === project.id);
        return {
          allProjects: exists
            ? state.allProjects.map((p) =>
                p.id === project.id ? project : p
              )
            : [...state.allProjects, project],
        };
      }),
    updateProject: (project) => updateProjectState(project.id, () => project),
    deleteProject: (projectId) =>
      set((state) => ({
        allProjects: state.allProjects.filter((p) => p.id !== projectId),
        currentProject:
          state.currentProject?.id === projectId
            ? null
            : state.currentProject,
      })),

    addMember: (projectId, member) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        members: [...(p.members ?? []), member],
      })),
    removeMember: (projectId, userId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        members: (p.members ?? []).filter((m) => m.userId !== userId),
      })),
    updateMemberRole: (projectId, userId, role) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        members: (p.members ?? []).map((m) =>
          m.userId === userId ? { ...m, role } : m
        ),
      })),

    updateBoard: (projectId, board) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        boards: [
          ...(p.boards ?? []).filter((b) => b.id !== board.id),
          board,
        ],
      })),
    deleteBoard: (projectId, boardId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        boards: (p.boards ?? []).filter((b) => b.id !== boardId),
      })),

    addColumn: (projectId, column) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        columns: [...(p.columns ?? []), column],
      })),
    updateColumn: (projectId, column) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        columns: (p.columns ?? []).map((c) =>
          c.id === column.id ? column : c
        ),
      })),
    removeColumn: (projectId, columnId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        columns: (p.columns ?? []).filter((c) => c.id !== columnId),
      })),
    moveColumn: (projectId, columnId, newIndex) =>
      updateProjectState(projectId, (p) => {
        const cols = [...(p.columns ?? [])];
        const idx = cols.findIndex((c) => c.id === columnId);
        if (idx === -1) return p;
        const [moved] = cols.splice(idx, 1);
        cols.splice(newIndex, 0, moved);
        return { ...p, columns: cols };
      }),

    addCard: (projectId, card) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: [...(p.cards ?? []), card],
      })),
    updateCard: (projectId, card) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: (p.cards ?? []).map((c) =>
          c.id === card.id ? card : c
        ),
      })),
    removeCard: (projectId, cardId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: (p.cards ?? []).filter((c) => c.id !== cardId),
      })),
    moveCard: (projectId, cardId, newColumnId, newIndex) =>
      updateProjectState(projectId, (p) => {
        const cards = [...(p.cards ?? [])];
        const idx = cards.findIndex((c) => c.id === cardId);
        if (idx === -1) return p;
        const [moved] = cards.splice(idx, 1);
        moved.columnId = newColumnId;
        cards.splice(newIndex, 0, moved);
        return { ...p, cards };
      }),
    copyCard: (projectId, card) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: [...(p.cards ?? []), card],
      })),

    updateCardView: (projectId, view) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: (p.cards ?? []).map((c) =>
          c.id === view.cardId
            ? {
                ...c,
                views: [
                  ...(c.views ?? []).filter((v) => v.id !== view.id),
                  view,
                ],
              }
            : c
        ),
      })),
    removeCardView: (projectId, viewId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: (p.cards ?? []).map((c) => ({
          ...c,
          views: (c.views ?? []).filter((v) => v.id !== viewId),
        })),
      })),

    addCardLabel: (projectId, label) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: (p.cards ?? []).map((c) =>
          c.id === label.cardId
            ? { ...c, labels: [...(c.labels ?? []), label] }
            : c
        ),
      })),
    removeCardLabel: (projectId, labelId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        cards: (p.cards ?? []).map((c) => ({
          ...c,
          labels: (c.labels ?? []).filter((l) => l.id !== labelId),
        })),
      })),

    clearProjectStore: () => set({ currentProject: null, allProjects: [] }),
  };
});
