import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { getApiUrl } from "./api-url";

const createClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const client = axios.create({
    baseURL: baseURL.replace(/\/$/, ""),
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
        return Promise.reject(new Error(error.response.data.error.message));
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const client = createClient();

export async function axiosRequest<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  const url = path.startsWith("http") ? path : getApiUrl(path);
  const res = await client.request<T>({ url, ...config });
  return res.data as T;
}

export default client;
