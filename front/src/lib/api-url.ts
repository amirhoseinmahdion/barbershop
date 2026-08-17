const DEFAULT_API_URL = "http://localhost:4000/api/v1";

export function getApiUrl(path = ""): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

