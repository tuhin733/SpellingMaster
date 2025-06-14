/**
 * Form validation utilities
 */
import { createError, ErrorType } from "./errorHandler";

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface FieldValidation {
  value: any;
  rules: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate required field
 */
export const required = (
  message = "This field is required"
): ValidationRule => ({
  validate: (value: any) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  message,
});

/**
 * Validate minimum length
 */
export const minLength = (min: number, message?: string): ValidationRule => ({
  validate: (value: any) => {
    if (!value) return false;
    if (typeof value === "string") return value.trim().length >= min;
    if (Array.isArray(value)) return value.length >= min;
    return false;
  },
  message: message || `Must be at least ${min} characters`,
});

/**
 * Validate maximum length
 */
export const maxLength = (max: number, message?: string): ValidationRule => ({
  validate: (value: any) => {
    if (!value) return true; // Empty values should be handled by 'required'
    if (typeof value === "string") return value.trim().length <= max;
    if (Array.isArray(value)) return value.length <= max;
    return false;
  },
  message: message || `Must be at most ${max} characters`,
});

/**
 * Validate email format
 */
export const email = (
  message = "Please enter a valid email"
): ValidationRule => ({
  validate: (value: any) => {
    if (!value) return true; // Empty values should be handled by 'required'
    if (typeof value !== "string") return false;

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  message,
});

/**
 * Validate pattern (regex)
 */
export const pattern = (regex: RegExp, message: string): ValidationRule => ({
  validate: (value: any) => {
    if (!value) return true; // Empty values should be handled by 'required'
    if (typeof value !== "string") return false;
    return regex.test(value);
  },
  message,
});

/**
 * Custom validation function
 */
export const custom = (
  validateFn: (value: any) => boolean,
  message: string
): ValidationRule => ({
  validate: validateFn,
  message,
});

/**
 * Validate form fields
 */
export const validateForm = (
  fields: Record<string, FieldValidation>
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, field] of Object.entries(fields)) {
    const { value, rules } = field;

    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors[fieldName] = rule.message;
        isValid = false;
        break; // Stop at first error for each field
      }
    }
  }

  return { isValid, errors };
};

/**
 * Log validation errors
 */
export const logValidationErrors = (
  formName: string,
  errors: Record<string, string>
): void => {
  if (Object.keys(errors).length > 0) {
    createError(
      ErrorType.VALIDATION,
      `Validation failed for ${formName}`,
      JSON.stringify(errors)
    );
  }
};
