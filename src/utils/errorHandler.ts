/**
 * Error handling utilities for the app
 */

// Error types for the application
export enum ErrorType {
  VALIDATION = "validation",
  NETWORK = "network",
  DATABASE = "database",
  AUTH = "auth",
  UNKNOWN = "unknown",
}

// Interface for structured errors
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: number;
}

/**
 * Create a structured error object
 */
export const createError = (
  type: ErrorType,
  message: string,
  details?: string
): AppError => ({
  type,
  message,
  details,
  timestamp: Date.now(),
});

/**
 * Error logger function - can be expanded to send errors to a service
 */
export const logError = (error: AppError): void => {
  // In development, log to console
  console.error(
    `[${error.type.toUpperCase()}] ${error.message}`,
    error.details || ""
  );

  // In the future, this could send errors to a service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   // Send to error tracking service
  // }
};

/**
 * Get user-friendly error message based on error type
 */
export const getFriendlyErrorMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.VALIDATION:
      return error.message;
    case ErrorType.NETWORK:
      return "Network error. Please check your connection and try again.";
    case ErrorType.DATABASE:
      return "Unable to save your data. Please try again.";
    case ErrorType.AUTH:
      return "Authentication error. Please sign in again.";
    case ErrorType.UNKNOWN:
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

/**
 * Handle database errors
 */
export const handleDatabaseError = (error: unknown): AppError => {
  const message =
    error instanceof Error ? error.message : "Database operation failed";
  return createError(ErrorType.DATABASE, message);
};

/**
 * Handle network errors
 */
export const handleNetworkError = (error: unknown): AppError => {
  let message = "Network request failed";

  if (error instanceof Error) {
    if (error.message.includes("timeout")) {
      message = "Request timed out";
    } else if (error.message.includes("Network")) {
      message = "Network connection issue";
    } else {
      message = error.message;
    }
  }

  return createError(ErrorType.NETWORK, message);
};

/**
 * Enhanced tryCatch function with better TypeScript support and consistent error handling
 * This should be the standard way to handle errors throughout the application
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
  errorType: ErrorType = ErrorType.UNKNOWN,
  context: string = ""
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Operation failed";

    // Create a standardized error with context
    const errorContext = context ? `[${context}] ` : "";
    const error = createError(
      errorType,
      `${errorContext}${errorMessage}`,
      err instanceof Error ? err.stack : undefined
    );

    // Always log errors for tracking purposes
    logError(error);

    // Return structured error response
    return { data: null, error };
  }
};
