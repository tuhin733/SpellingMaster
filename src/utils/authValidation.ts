import { ValidationRule } from "./formValidation";

// Password must be at least 6 characters long and can contain letters and numbers
const passwordRegex = /^[A-Za-z0-9]{6,}$/;

export const validatePassword = (
  password: string
): { isValid: boolean; error: string | null } => {
  if (!password) {
    return { isValid: false, error: "Please enter your password" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "Your password must be at least 6 characters long",
    };
  }

  if (!passwordRegex.test(password)) {
    return {
      isValid: false,
      error:
        "Your password can only contain letters and numbers, and must be at least 6 characters long",
    };
  }

  return { isValid: true, error: null };
};

export const validateEmail = (
  email: string
): { isValid: boolean; error: string | null } => {
  if (!email) {
    return { isValid: false, error: "Please enter your email address" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true, error: null };
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error: string | null } => {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: "The passwords you entered don't match. Please try again.",
    };
  }

  return { isValid: true, error: null };
};

export const authValidationRules = {
  email: [
    {
      validate: (value: string) => validateEmail(value).isValid,
      message: "Please enter a valid email address",
    },
  ] as ValidationRule[],

  password: [
    {
      validate: (value: string) => validatePassword(value).isValid,
      message:
        "Your password can only contain letters and numbers, and must be at least 6 characters long",
    },
  ] as ValidationRule[],
};
