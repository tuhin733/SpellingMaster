// Re-export all utility functions with a more consistent pattern
export * from "./indexedDb";
export * from "./localSettings";
export * from "./validation";
export * from "./errorHandler";
export * from "./formValidation";
export * from "./speechSynthesis";
export * from "./sound";
export * from "./translation";
export * from "./fileParser";

// Simple debounce utility
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
