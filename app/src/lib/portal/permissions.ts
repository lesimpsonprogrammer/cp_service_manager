export type ClientPortalRole = "client_user" | "client_administrator" | "client_tpa";

export type ClientPortalScreen = "dashboard" | "data" | "contracts" | "invoices" | "support";

const SCREEN_ACCESS: Record<ClientPortalRole, ClientPortalScreen[]> = {
  client_user: ["dashboard", "data", "support"],
  client_administrator: ["dashboard", "data", "contracts", "invoices", "support"],
  client_tpa: ["contracts", "invoices", "support"],
};

export const SCREEN_PATHS: Record<ClientPortalScreen, string> = {
  dashboard: "/client/dashboard",
  data: "/client/data",
  contracts: "/client/contracts",
  invoices: "/client/invoices",
  support: "/client/support",
};

export const CLIENT_PORTAL_ROLE_LABELS: Record<ClientPortalRole, string> = {
  client_user: "Client User",
  client_administrator: "Client Administrator",
  client_tpa: "Client TPA",
};

export function portalScreensForRole(role: ClientPortalRole): ClientPortalScreen[] {
  return SCREEN_ACCESS[role];
}

export function canAccessPortalScreen(role: ClientPortalRole, screen: ClientPortalScreen): boolean {
  return SCREEN_ACCESS[role].includes(screen);
}

export function firstAccessiblePortalPath(role: ClientPortalRole): string {
  const [screen] = portalScreensForRole(role);
  return SCREEN_PATHS[screen ?? "dashboard"];
}
