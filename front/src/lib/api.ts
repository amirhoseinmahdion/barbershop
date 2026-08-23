import { type AxiosRequestConfig, isAxiosError } from "axios";
import client from "./axios";

interface ErrorPayload { error?: { message?: string } }

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config: AxiosRequestConfig = {
    method: init.method as AxiosRequestConfig["method"],
    headers: init.headers as Record<string, string> | undefined,
    data: init.body ? (typeof init.body === "string" ? JSON.parse(init.body) : init.body) : undefined,
  };

  try {
    const res = await client.request<T>({ url: path, ...config });
    if (res.status === 204) return undefined as T;
    return res.data as T;
  } catch (err: unknown) {
    if (isAxiosError<ErrorPayload>(err) && err.response) {
      const payload = (err.response.data ?? {}) as ErrorPayload;
      throw new ApiRequestError(payload.error?.message ?? "درخواست انجام نشد.", err.response.status);
    }
    throw err;
  }
}
