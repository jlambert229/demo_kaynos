import { DEFAULT_USER, SCHOOL } from "./demo-data.mts";

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function authenticate(_req: Request) {
  return {
    userId: DEFAULT_USER.id,
    schoolId: SCHOOL.id,
    role: DEFAULT_USER.role as "admin" | "instructor" | "student",
  };
}

export function authenticateAny(_req: Request) {
  return authenticate(_req);
}

export function requireRole(_auth: any, ..._roles: string[]) {
  // Demo: always allowed
}

export function authCookie(token: string): string {
  return `kaynos_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
}

export function clearAuthCookie(): string {
  return `kaynos_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
