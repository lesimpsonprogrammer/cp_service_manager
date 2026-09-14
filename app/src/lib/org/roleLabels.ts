const ORG_ROLE_LABELS: Record<string, string> = {
  owner: "GSDA",
};

export function orgRoleLabel(role: string): string {
  return ORG_ROLE_LABELS[role] ?? role;
}
