const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  project_manager_i: "Project Manager I",
  project_manager_ii: "Project Manager II",
  project_manager_iii: "Project Manager III",
  project_consultant: "Project Consultant",
  member: "Member",
  viewer: "Viewer",
};

export function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
