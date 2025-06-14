/**
 * Validation utilities to prevent duplication of validation logic
 */

/**
 * Validate text input for words
 * Ensures input is not empty, not too long, and only contains valid characters
 */
export const validateWordInput = (
  input: string
): { isValid: boolean; error: string | null } => {
  if (!input.trim()) {
    return { isValid: false, error: "Please enter a word" };
  }

  if (input.length > 50) {
    return { isValid: false, error: "Word is too long" };
  }

  // Allow only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(input)) {
    return {
      isValid: false,
      error: "Only letters, spaces, hyphens, and apostrophes are allowed",
    };
  }

  return { isValid: true, error: null };
};

/**
 * Compare user input with correct word
 * Returns true if the input matches the word (case-insensitive)
 */
export const isCorrectSpelling = (input: string, word: string): boolean => {
  return input.trim().toLowerCase() === word.toLowerCase();
};

/**
 * Calculate progress percentage based on correct and total items
 */
export const calculatePercentage = (
  correctCount: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((correctCount / total) * 100);
};

/**
 * Get feedback message based on percentage score
 */
export const getFeedbackMessage = (
  percentage: number,
  isLevelComplete: boolean = false
): { message: string; colorClass: string } => {
  if (percentage === 100) {
    return {
      message: isLevelComplete
        ? "Perfect! Level Complete!"
        : "Perfect! Keep going!",
      colorClass: "text-green-600",
    };
  } else if (percentage >= 80) {
    return {
      message: "Great progress!",
      colorClass: "text-blue-600",
    };
  } else if (percentage >= 60) {
    return {
      message: "Keep practicing!",
      colorClass: "text-yellow-600",
    };
  } else {
    return {
      message: "Needs improvement.",
      colorClass: "text-red-600",
    };
  }
};

/**
 * Safely parse JSON with error handling
 */
export const safeJsonParse = <T>(
  json: string,
  defaultValue: T
): { data: T; error: Error | null } => {
  try {
    const parsed = JSON.parse(json) as T;
    return { data: parsed, error: null };
  } catch (err) {
    return { data: defaultValue, error: err as Error };
  }
};

/**
 * Validate settings input
 */
export const validateSettings = (
  settings: any
): { isValid: boolean; error: string | null } => {
  if (!settings) {
    return { isValid: false, error: "Settings cannot be empty" };
  }

  if (
    typeof settings.darkMode !== "boolean" &&
    settings.darkMode !== undefined
  ) {
    return { isValid: false, error: "Dark mode setting must be a boolean" };
  }

  if (
    settings.fontSize !== undefined &&
    !["small", "medium", "large"].includes(settings.fontSize)
  ) {
    return {
      isValid: false,
      error: "Font size must be 'small', 'medium', or 'large'",
    };
  }

  return { isValid: true, error: null };
};

/**
 * Process API errors and return user-friendly messages
 */
export const handleApiError = (error: any): string => {
  if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
    return "Network error. Please check your internet connection.";
  }

  if (error instanceof Error) {
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
};

/**
 * Validate word list input
 */
export const validateWordList = (
  words: string[]
): { isValid: boolean; error: string | null } => {
  if (!Array.isArray(words)) {
    return { isValid: false, error: "Word list must be an array" };
  }

  if (words.length === 0) {
    return { isValid: false, error: "Word list cannot be empty" };
  }

  for (const word of words) {
    if (typeof word !== "string") {
      return {
        isValid: false,
        error: "All items in word list must be strings",
      };
    }

    const validation = validateWordInput(word);
    if (!validation.isValid) {
      return {
        isValid: false,
        error: `Invalid word "${word}": ${validation.error}`,
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Function to safely execute operations with proper error handling
 */
export const tryCatchWrapper = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = "Operation failed"
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const result = await operation();
    return { data: result, error: null };
  } catch (err) {
    console.error(`${errorMessage}:`, err);
    return {
      data: null,
      error: err instanceof Error ? err.message : errorMessage,
    };
  }
};
