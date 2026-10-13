/** Lấy message từ lỗi bất kỳ (Error, string, hoặc object kiểu { message }). */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }
  return fallback;
}

/** Kiểm tra giá trị trả về có dạng { id: number } không. */
export function hasNumericId(value: unknown): value is { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number"
  );
}