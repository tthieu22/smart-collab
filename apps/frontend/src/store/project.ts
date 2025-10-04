"use client";
import { create } from "zustand";
import { Project, Member, Task } from "@smart/types/project";
import type { ProjectBE, ProjectMember } from "@smart/types/project";

interface ProjectState {
  currentProject: Project | null;
  allProjects: Project[];

  // Project
  setCurrentProject: (project: Project) => void;
  addProject: (projectBE: ProjectBE) => void;
  updateProject: (projectBE: ProjectBE) => void;
  deleteProject: (projectId: string) => void;

  // Member
  addMember: (projectId: string, memberBE: ProjectMember) => void;
  removeMember: (projectId: string, userId: string) => void;
  updateMemberRole: (projectId: string, userId: string, role: string) => void;

  // Task
  addTask: (projectId: string, task: Task) => void;
  updateTask: (projectId: string, task: Task) => void;
  removeTask: (projectId: string, taskId: string) => void;

  // Reset
  clearProjectStore: () => void;
}

export const projectStore = create<ProjectState>((set, get) => {
  const mapProjectBEtoFE = (projectBE: ProjectBE): Project => ({
    id: projectBE.id,
    name: projectBE.name,
    description: projectBE.description,
    members: projectBE.members?.map((m: ProjectMember) => ({
      userId: m.userId,
      role: m.role,
      name: m.user?.firstName || m.user?.email,
      avatar: m.user?.avatar ?? undefined,
    })) || [],
    tasks: projectBE.tasks || [],
  });

  const updateProjectState = (projectId: string, updater: (p: Project) => Project) => {
    set((state) => {
      const allProjects = state.allProjects.map((p) =>
        p.id === projectId ? updater(p) : p
      );
      const currentProject =
        state.currentProject?.id === projectId
          ? updater(state.currentProject)
          : state.currentProject;
      return { allProjects, currentProject };
    });
  };

  return {
    currentProject: null,
    allProjects: [],

    setCurrentProject: (project) => set({ currentProject: project }),
    addProject: (projectBE) =>
      set((state) => ({ allProjects: [...state.allProjects, mapProjectBEtoFE(projectBE)] })),
    updateProject: (projectBE) =>
      set((state) => {
        const projectFE = mapProjectBEtoFE(projectBE);
        return {
          allProjects: state.allProjects.map((p) =>
            p.id === projectFE.id ? projectFE : p
          ),
          currentProject:
            state.currentProject?.id === projectFE.id ? projectFE : state.currentProject,
        };
      }),
    deleteProject: (projectId) =>
      set((state) => ({
        allProjects: state.allProjects.filter((p) => p.id !== projectId),
        currentProject:
          state.currentProject?.id === projectId ? null : state.currentProject,
      })),

    // Member
    addMember: (projectId, memberBE) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        members: [
          ...(p.members || []).filter((m) => m.userId !== memberBE.userId),
          {
            userId: memberBE.userId,
            role: memberBE.role,
            name: memberBE.user?.firstName || memberBE.user?.email,
            avatar: memberBE.user?.avatar ?? undefined,
          },
        ],
      })),
    removeMember: (projectId, userId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        members: (p.members || []).filter((m) => m.userId !== userId),
      })),
    updateMemberRole: (projectId, userId, role) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        members: (p.members || []).map((m) =>
          m.userId === userId ? { ...m, role } : m
        ),
      })),

    // Task
    addTask: (projectId, task) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        tasks: [...(p.tasks || []).filter((t) => t.id !== task.id), task],
      })),
    updateTask: (projectId, task) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        tasks: (p.tasks || []).map((t) => (t.id === task.id ? task : t)),
      })),
    removeTask: (projectId, taskId) =>
      updateProjectState(projectId, (p) => ({
        ...p,
        tasks: (p.tasks || []).filter((t) => t.id !== taskId),
      })),

    clearProjectStore: () => set({ currentProject: null, allProjects: [] }),
  };
});
