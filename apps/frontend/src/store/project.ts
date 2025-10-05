"use client";

import { create } from "zustand";
import { Project, ProjectMember, Task } from "@smart/types/project";

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

  // Task
  addTask: (projectId: string, task: Task) => void;
  updateTask: (projectId: string, task: Task) => void;
  removeTask: (projectId: string, taskId: string) => void;

  // Reset
  clearProjectStore: () => void;
}

export const projectStore = create<ProjectState>((set, get) => {
  // ---------------- Helper ----------------
  const updateProjectState = (
    projectId: string,
    updater: (p: Project) => Project
  ) => {
    set((state) => {
      const allProjects = (state.allProjects || []).map((p) =>
        p?.id === projectId ? updater({ ...p, members: p.members ?? [], tasks: p.tasks ?? [] }) : p
      );

      const currentProject =
        state.currentProject?.id === projectId
          ? updater({ ...state.currentProject, members: state.currentProject.members ?? [], tasks: state.currentProject.tasks ?? [] })
          : state.currentProject;

      return { allProjects, currentProject };
    });
  };

  // ---------------- Store ----------------
  return {
    currentProject: null,
    allProjects: [],

    // -------- Project --------
    setCurrentProject: (project) => {
      console.log("🟢 setCurrentProject:", project?.id);
      set({ currentProject: project });
    },

    addProject: (project) => {
      if (!project?.id) return;
      console.log("➕ addProject:", project.id);
      set((state) => {
        const exists = (state.allProjects || []).some((p) => p?.id === project.id);
        return {
          allProjects: exists
            ? state.allProjects.map((p) => (p?.id === project.id ? project : p))
            : [...(state.allProjects || []), project],
        };
      });
    },

    updateProject: (project) => {
      console.log("🔄 updateProject:", project.id);
      set((state) => ({
        allProjects: (state.allProjects || []).map((p) => (p?.id === project.id ? project : p)),
        currentProject: state.currentProject?.id === project.id ? project : state.currentProject,
      }));
    },

    deleteProject: (projectId) => {
      console.log("❌ deleteProject:", projectId);
      set((state) => ({
        allProjects: (state.allProjects || []).filter((p) => p?.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      }));
    },

    // -------- Member --------
    addMember: (projectId, member) => {
      console.log("➕ addMember:", member.userId, "to", projectId);
      updateProjectState(projectId, (p) => ({
        ...p,
        members: [...(p.members ?? []), member],
      }));
    },

    removeMember: (projectId, userId) => {
      console.log("❌ removeMember:", userId, "from", projectId);
      updateProjectState(projectId, (p) => ({
        ...p,
        members: (p.members ?? []).filter((m) => m.userId !== userId),
      }));
    },

    updateMemberRole: (projectId, userId, role) => {
      console.log("🔄 updateMemberRole:", userId, "role->", role, "in", projectId);
      updateProjectState(projectId, (p) => ({
        ...p,
        members: (p.members ?? []).map((m) => (m.userId === userId ? { ...m, role } : m)),
      }));
    },

    // -------- Task --------
    addTask: (projectId, task) => {
      console.log("➕ addTask:", task.id, "to", projectId);
      updateProjectState(projectId, (p) => ({
        ...p,
        tasks: [...(p.tasks ?? []), task],
      }));
    },

    updateTask: (projectId, task) => {
      console.log("🔄 updateTask:", task.id, "in", projectId);
      updateProjectState(projectId, (p) => ({
        ...p,
        tasks: (p.tasks ?? []).map((t) => (t.id === task.id ? task : t)),
      }));
    },

    removeTask: (projectId, taskId) => {
      console.log("❌ removeTask:", taskId, "from", projectId);
      updateProjectState(projectId, (p) => ({
        ...p,
        tasks: (p.tasks ?? []).filter((t) => t.id !== taskId),
      }));
    },

    // -------- Reset --------
    clearProjectStore: () => {
      console.log("🧹 clearProjectStore");
      set({ currentProject: null, allProjects: [] });
    },
  };
});
