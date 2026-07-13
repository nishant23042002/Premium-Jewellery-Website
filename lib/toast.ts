import { toast as sonnerToast } from "sonner";

/**
 * Thin wrapper around sonner so every call site uses consistent copy/timing
 * instead of importing `sonner` directly everywhere (Phase 1 "Toast system").
 */
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),
  info: (message: string, description?: string) =>
    sonnerToast(message, { description }),
  promise: sonnerToast.promise,
};
