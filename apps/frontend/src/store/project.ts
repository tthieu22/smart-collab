"use client";
import { create } from "zustand";
import { Project, Member, Task } from "@smart/types/project";

interface ProjectState {
  currentProject: Project | null;
  allProjects: Project[];

  // Project
  setCurrentProject: (project: Project) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;

  // Member
  addMember: (projectId: string, member: Member) => void;
  removeMember: (projectId: string, userId: string) => void;
  updateMemberRole: (projectId: string, userId: string, role: string) => void;

  // Task
  addTask: (projectId: string, task: Task) => void;
  updateTask: (projectId: string, task: Task) => void;
  removeTask: (projectId: string, taskId: string) => void;

  // Reset
  clearProjectStore: () => void;
}

export const projectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  allProjects: [],

  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) =>
    set((state) => ({ allProjects: [...state.allProjects, project] })),
  updateProject: (project) =>
    set((state) => ({
      allProjects: state.allProjects.map((p) => (p.id === project.id ? project : p)),
      currentProject:
        state.currentProject?.id === project.id ? project : state.currentProject,
    })),
  deleteProject: (projectId) =>
    set((state) => ({
      allProjects: state.allProjects.filter((p) => p.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
    })),

  // Member
  addMember: (projectId, member) =>
    set((state) => {
      const updatedAll = state.allProjects.map((p) =>
        p.id === projectId
          ? { ...p, members: [...p.members.filter((m) => m.userId !== member.userId), member] }
          : p
      );
      const updatedCurrent =
        state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              members: [
                ...state.currentProject.members.filter((m) => m.userId !== member.userId),
                member,
              ],
            }
          : state.currentProject;
      return { allProjects: updatedAll, currentProject: updatedCurrent };
    }),
  removeMember: (projectId, userId) =>
    set((state) => {
      const updatedAll = state.allProjects.map((p) =>
        p.id === projectId ? { ...p, members: p.members.filter((m) => m.userId !== userId) } : p
      );
      const updatedCurrent =
        state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              members: state.currentProject.members.filter((m) => m.userId !== userId),
            }
          : state.currentProject;
      return { allProjects: updatedAll, currentProject: updatedCurrent };
    }),
  updateMemberRole: (projectId, userId, role) =>
    set((state) => {
      const updatedAll = state.allProjects.map((p) =>
        p.id === projectId
          ? { ...p, members: p.members.map((m) => (m.userId === userId ? { ...m, role } : m)) }
          : p
      );
      const updatedCurrent =
        state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              members: state.currentProject.members.map((m) =>
                m.userId === userId ? { ...m, role } : m
              ),
            }
          : state.currentProject;
      return { allProjects: updatedAll, currentProject: updatedCurrent };
    }),

  // Task
  addTask: (projectId, task) =>
    set((state) => {
      const updatedAll = state.allProjects.map((p) =>
        p.id === projectId ? { ...p, tasks: [...p.tasks.filter((t) => t.id !== task.id), task] } : p
      );
      const updatedCurrent =
        state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              tasks: [...state.currentProject.tasks.filter((t) => t.id !== task.id), task],
            }
          : state.currentProject;
      return { allProjects: updatedAll, currentProject: updatedCurrent };
    }),
  updateTask: (projectId, task) =>
    set((state) => {
      const updatedAll = state.allProjects.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.map((t) => (t.id === task.id ? task : t)) } : p
      );
      const updatedCurrent =
        state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              tasks: state.currentProject.tasks.map((t) => (t.id === task.id ? task : t)),
            }
          : state.currentProject;
      return { allProjects: updatedAll, currentProject: updatedCurrent };
    }),
  removeTask: (projectId, taskId) =>
    set((state) => {
      const updatedAll = state.allProjects.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      );
      const updatedCurrent =
        state.currentProject?.id === projectId
          ? { ...state.currentProject, tasks: state.currentProject.tasks.filter((t) => t.id !== taskId) }
          : state.currentProject;
      return { allProjects: updatedAll, currentProject: updatedCurrent };
    }),

  clearProjectStore: () => set({ currentProject: null, allProjects: [] }),
}));
