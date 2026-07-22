export type Role = "admin" | "deployer" | "viewer"

export function canDeploy(role: Role | undefined): boolean {
  return role === "admin" || role === "deployer"
}

export function isAdmin(role: Role | undefined): boolean {
  return role === "admin"
}
