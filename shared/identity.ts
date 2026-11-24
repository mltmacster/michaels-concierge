export type StoredRole = "user" | "admin";
export type IdentityRole = "customer" | "operator";
export type Permission =
  "identity:read:self" | "session:revoke:self" | "operator:access";

export function permissionsFor(role: StoredRole): Permission[] {
  if (role !== "user" && role !== "admin") return [];
  return role === "admin"
    ? ["identity:read:self", "session:revoke:self", "operator:access"]
    : ["identity:read:self", "session:revoke:self"];
}

export type PublicPrincipal = {
  id: number;
  name: string | null;
  email: string | null;
  role: StoredRole;
  identityRole: IdentityRole;
  permissions: Permission[];
};
