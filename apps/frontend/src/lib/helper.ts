import type { Member, Project, ProjectBE, ProjectMember } from "@smart/types/project";

/**
 * Chuyển ProjectMember từ backend sang Member frontend
 */
export function mapProjectMemberToMember(pm: ProjectMember): Member {
  return {
    userId: pm.userId,
    role: pm.role,
    name: `${pm.user.firstName ?? ""} ${pm.user.lastName ?? ""}`.trim(),
    avatar: pm.user.avatar,
  };
}

/**
 * Chuyển Project từ backend (BE) sang frontend (FE)
 */
export function mapProjectBEtoFE(projectBE: ProjectBE): Project {
  return {
    id: projectBE.id,
    name: projectBE.name,
    description: projectBE.description,
    members: projectBE.members.map(mapProjectMemberToMember),
    tasks: projectBE.tasks ?? [],
  };
}
