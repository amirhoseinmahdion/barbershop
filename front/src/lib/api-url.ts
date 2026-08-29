const DEFAULT_API_URL = "http://localhost:4000/api/v1";
const BROWSER_API_URL = "/api/v1";

export function getApiUrl(
  path = "",
  browser = typeof window !== "undefined",
): string {
  const baseUrl = browser
    ? BROWSER_API_URL
    : (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL);
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
