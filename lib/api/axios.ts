import axios, { type AxiosInstance } from "axios";
import { clientEnv } from "@/config/env";

/**
 * Shared Axios instance for calls to our own /api routes and any future
 * third-party integrations (WhatsApp Business API, payment webhooks, etc.).
 * Server Actions remain the default for internal reads/writes (PRD §31) —
 * this client is for the deliberately small set of true API routes.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: clientEnv.NEXT_PUBLIC_SITE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ?? error.message ?? "Unexpected error";
    return Promise.reject(new Error(message));
  },
);
