"use client";

import { create } from "zustand";
import { Project, ProjectMember, Card, Column, CardView, CardLabel, Board } from "@smart/types/project";

interface ProjectState {
  currentProject: Project | null;
  allProjects: Project[];

  // Project
  setCurrentProject: (project: Project) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;

  // Member
  addMember: (projectId: string, member: ProjectMember) => void;
  removeMember: (projectId: string, userId: string) => void;
  updateMemberRole: (projectId: string, userId: string, role: string) => void;

  // Board
  updateBoard: (projectId: string, board: Board) => void;
  deleteBoard: (projectId: string, boardId: string) => void;

  // Column
  addColumn: (projectId: string, column: Column) => void;
  updateColumn: (projectId: string, column: Column) => void;
  removeColumn: (projectId: string, columnId: string) => void;
  moveColumn: (projectId: string, columnId: string, newIndex: number) => void;

  // Card
  addCard: (projectId: string, card: Card) => void;
  updateCard: (projectId: string, card: Card) => void;
  removeCard: (projectId: string, cardId: string) => void;
  moveCard: (projectId: string, cardId: string, newColumnId: string, newIndex: number) => void;
  copyCard: (projectId: string, card: Card) => void;

  // CardView
  updateCardView: (projectId: string, view: CardView) => void;
  removeCardView: (projectId: string, viewId: string) => void;

  // CardLabel
  addCardLabel: (projectId: string, label: CardLabel) => void;
  removeCardLabel: (projectId: string, labelId: string) => void;

  // Reset
  clearProjectStore: () => void;
}

export const projectStore = create<ProjectState>((set, get) => {
  const updateProjectState = (projectId: string, updater: (p: Project) => Project) => {
    set((state) => {
      const allProjects = state.allProjects.map((p) =>
        p.id === projectId
          ? updater({ ...p, members: p.members ?? [], cards: p.cards ?? [], columns: p.columns ?? [], boards: (p as any).boards ?? [] })
          : p
      );

      const currentProject =
        state.currentProject?.id === projectId
          ? updater({ ...state.currentProject, members: state.currentProject.members ?? [], cards: state.currentProject.cards ?? [], columns: state.currentProject.columns ?? [], boards: (state.currentProject as any).boards ?? [] })
          : state.currentProject;

      return { allProjects, currentProject };
    });
  };

  return {
    currentProject: null,
    allProjects: [],

    // Project
    setCurrentProject: (project) => set({ currentProject: project }),
    addProject: (project) => {
      set((state) => {
        const exists = state.allProjects.some((p) => p.id === project.id);
        return { allProjects: exists ? state.allProjects.map((p) => (p.id === project.id ? project : p)) : [...state.allProjects, project] };
      });
    },
    updateProject: (project) => updateProjectState(project.id, () => project),
    deleteProject: (projectId) => {
      set((state) => ({
        allProjects: state.allProjects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      }));
    },

    // Member
    addMember: (projectId, member) => updateProjectState(projectId, (p) => ({ ...p, members: [...(p.members ?? []), member] })),
    removeMember: (projectId, userId) => updateProjectState(projectId, (p) => ({ ...p, members: (p.members ?? []).filter((m) => m.userId !== userId) })),
    updateMemberRole: (projectId, userId, role) => updateProjectState(projectId, (p) => ({ ...p, members: (p.members ?? []).map((m) => (m.userId === userId ? { ...m, role } : m)) })),

    // Board
    updateBoard: (projectId, board) => updateProjectState(projectId, (p) => ({ ...p, boards: [...(p.boards ?? []).filter(b => b.id !== board.id), board] })),
    deleteBoard: (projectId, boardId) => updateProjectState(projectId, (p) => ({ ...p, boards: (p.boards ?? []).filter(b => b.id !== boardId) })),

    // Column
    addColumn: (projectId, column) => updateProjectState(projectId, (p) => ({ ...p, columns: [...(p.columns ?? []), column] })),
    updateColumn: (projectId, column) => updateProjectState(projectId, (p) => ({ ...p, columns: (p.columns ?? []).map((c) => (c.id === column.id ? column : c)) })),
    removeColumn: (projectId, columnId) => updateProjectState(projectId, (p) => ({ ...p, columns: (p.columns ?? []).filter((c) => c.id !== columnId) })),
    moveColumn: (projectId, columnId, newIndex) => updateProjectState(projectId, (p) => {
      const cols = [...(p.columns ?? [])];
      const idx = cols.findIndex(c => c.id === columnId);
      if (idx === -1) return p;
      const [moved] = cols.splice(idx, 1);
      cols.splice(newIndex, 0, moved);
      return { ...p, columns: cols };
    }),

    // Card
    addCard: (projectId, card) => updateProjectState(projectId, (p) => ({ ...p, cards: [...(p.cards ?? []), card] })),
    updateCard: (projectId, card) => updateProjectState(projectId, (p) => ({ ...p, cards: (p.cards ?? []).map((t) => t.id === card.id ? card : t) })),
    removeCard: (projectId, cardId) => updateProjectState(projectId, (p) => ({ ...p, cards: (p.cards ?? []).filter((t) => t.id !== cardId) })),
    moveCard: (projectId, cardId, newColumnId, newIndex) => updateProjectState(projectId, (p) => {
      const cards = [...(p.cards ?? [])];
      const idx = cards.findIndex(c => c.id === cardId);
      if (idx === -1) return p;
      const [moved] = cards.splice(idx, 1);
      moved.columnId = newColumnId;
      cards.splice(newIndex, 0, moved);
      return { ...p, cards };
    }),
    copyCard: (projectId, card) => updateProjectState(projectId, (p) => ({ ...p, cards: [...(p.cards ?? []), card] })),

    // CardView
    updateCardView: (projectId, view) => updateProjectState(projectId, (p) => ({
      ...p,
      cards: (p.cards ?? []).map(c => c.id === view.cardId ? { ...c, views: [...(c.views ?? []).filter(v => v.id !== view.id), view] } : c)
    })),
    removeCardView: (projectId, viewId) => updateProjectState(projectId, (p) => ({
      ...p,
      cards: (p.cards ?? []).map(c => ({ ...c, views: (c.views ?? []).filter(v => v.id !== viewId) }))
    })),

    // CardLabel
    addCardLabel: (projectId, label) => updateProjectState(projectId, (p) => ({
      ...p,
      cards: (p.cards ?? []).map(c => c.id === label.cardId ? { ...c, labels: [...(c.labels ?? []), label] } : c)
    })),
    removeCardLabel: (projectId, labelId) => updateProjectState(projectId, (p) => ({
      ...p,
      cards: (p.cards ?? []).map(c => ({ ...c, labels: (c.labels ?? []).filter(l => l.id !== labelId) }))
    })),

    // Reset
    clearProjectStore: () => set({ currentProject: null, allProjects: [] }),
  };
});
