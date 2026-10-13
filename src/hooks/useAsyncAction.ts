import { useCallback, useState } from "react";
import { getErrorMessage } from "@/lib/errors";

export type ActionResult<T> = { ok: true; value: T } | { ok: false };

/** Chạy action async, tự bắt lỗi và theo dõi action nào đang chạy. */
export function useAsyncAction() {
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(
      key: string,
      action: () => Promise<T>,
      fallbackError: string
    ): Promise<ActionResult<T>> => {
      setPending(key);
      try {
        const value = await action();
        return { ok: true, value };
      } catch (error: unknown) {
        alert(getErrorMessage(error, fallbackError));
        return { ok: false };
      } finally {
        setPending(null);
      }
    },
    []
  );

  return { pending, run };
}