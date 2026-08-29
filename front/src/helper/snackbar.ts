

import { toast } from "sonner";

type SnackbarStatus = "success" | "error";

export function snackbar(
  message: string,
  status: SnackbarStatus,
): string | number {
  if (status === "success") {
    return toast.success(message);
  }

  return toast.error(message);
}
