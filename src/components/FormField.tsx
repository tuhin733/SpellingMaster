import React, { useState, useEffect } from "react";
import { ValidationRule } from "../utils/formValidation";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "textarea";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rules?: ValidationRule[];
  error?: string;
  onValidate?: (isValid: boolean) => void;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  rules = [],
  error,
  onValidate,
  className = "",
  required = false,
  autoFocus = false,
}) => {
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Handle external error prop
  useEffect(() => {
    if (error) {
      setValidationError(error);
    }
  }, [error]);

  // Validate field
  const validate = (value: string): boolean => {
    if (rules.length === 0) return true;

    for (const rule of rules) {
      if (!rule.validate(value)) {
        setValidationError(rule.message);
        onValidate && onValidate(false);
        return false;
      }
    }

    setValidationError(null);
    onValidate && onValidate(true);
    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setIsDirty(true);
    onChange(newValue);

    if (touched) {
      validate(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validate(value);
  };

  const hasError = touched && validationError;

  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={id}
        className={`form-label ${
          required
            ? 'after:content-["*"] after:ml-0.5 after:text-error-500'
            : ""
        }`}
      >
        {label}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`form-input ${hasError ? "form-input-error" : ""}`}
          rows={4}
          required={required}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`form-input ${hasError ? "form-input-error" : ""}`}
          required={required}
          autoFocus={autoFocus}
        />
      )}

      {hasError && <p className="form-error">{validationError}</p>}
    </div>
  );
};

export default FormField;
