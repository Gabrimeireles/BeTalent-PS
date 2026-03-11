export const ROLES = ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] as const

export type UserRole = (typeof ROLES)[number]

const ROLES_SET = new Set<string>(ROLES)

export function normalizeRole(role: string | null | undefined): UserRole {
  const normalizedRole = role?.trim().toUpperCase()

  if (normalizedRole && ROLES_SET.has(normalizedRole)) {
    return normalizedRole as UserRole
  }

  return 'USER'
}

export function isAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'ADMIN'
}

export function canManageUsers(role: string | null | undefined): boolean {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER'
}

export function canManageProducts(role: string | null | undefined): boolean {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER' || normalizedRole === 'FINANCE'
}

export function canRefund(role: string | null | undefined): boolean {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === 'ADMIN' || normalizedRole === 'FINANCE'
}
