import { getApiUrl } from "./api-url";

export type UserRole = "CUSTOMER" | "SALON_ADMIN" | "SUPER_ADMIN";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  role: UserRole;
}

interface AuthResponse {
  data: { user: AuthenticatedUser };
}

interface ErrorResponse {
  error?: { message?: string };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function destinationForRole(role: UserRole): string {
  if (role === "SALON_ADMIN") return "/admin";
  if (role === "SUPER_ADMIN") return "/platform";
  return "/account";
}

export async function authRequest(path: string, init: RequestInit = {}): Promise<AuthenticatedUser> {
  const response = await fetch(getApiUrl(`auth/${path}`), {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new ApiError(payload.error?.message ?? "درخواست انجام نشد.", response.status);
  }

  const payload = (await response.json()) as AuthResponse;
  return payload.data.user;
}

export async function restoreSession(): Promise<AuthenticatedUser> {
  try {
    return await authRequest("me");
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    return authRequest("refresh", { method: "POST" });
  }
}

export async function logoutSession(): Promise<void> {
  const response = await fetch(getApiUrl("auth/logout"), { method: "POST", credentials: "include" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new ApiError(payload.error?.message ?? "خروج از حساب انجام نشد.", response.status);
  }
}
