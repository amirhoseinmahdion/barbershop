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
  error?: { code?: string; message?: string };
}

const authErrorMessages: Record<string, string> = {
  ACCOUNT_CREATE_FAILED: "ساخت حساب کاربری انجام نشد.",
  EMAIL_ALREADY_EXISTS: "حسابی با این ایمیل از قبل وجود دارد.",
  INTERNAL_ERROR: "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.",
  INVALID_CREDENTIALS: "شماره تلفن یا رمز عبور اشتباه است.",
  INVALID_SESSION: "نشست کاربری نامعتبر است یا منقضی شده است.",
  PHONE_ALREADY_EXISTS: "حسابی با این شماره تلفن از قبل وجود دارد.",
  UNAUTHENTICATED: "برای ادامه باید وارد حساب کاربری شوید.",
  UNTRUSTED_ORIGIN: "ارسال درخواست از این مبدأ مجاز نیست.",
  VALIDATION_ERROR: "اطلاعات واردشده معتبر نیست.",
};

export function localizedAuthErrorMessage(payload: ErrorResponse): string {
  const code = payload.error?.code;
  if (code && authErrorMessages[code]) return authErrorMessages[code];

  const message = payload.error?.message;
  if (message && /[\u0600-\u06ff]/.test(message)) return message;

  return "درخواست انجام نشد. لطفاً دوباره تلاش کنید.";
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
    throw new ApiError(localizedAuthErrorMessage(payload), response.status);
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
    throw new ApiError(localizedAuthErrorMessage(payload), response.status);
  }
}
