import React, { useEffect } from "react";
import Tooltip from "./Tooltip";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger" | "warning";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  isOpen,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent scrolling of the background when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmStyles = {
    primary:
      "bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700",
    danger: "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
    warning:
      "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div
        className="bg-white rounded-lg shadow-elevated p-4 sm:p-6 w-full max-w-sm dark:bg-secondary-800 dark:border dark:border-secondary-700 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="dialog-title"
          className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 dark:text-gray-100"
        >
          {title}
        </h2>
        <p
          id="dialog-message"
          className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 dark:text-gray-300"
        >
          {message}
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-gray-400 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 py-2 text-white rounded-lg transition-all duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none ${confirmStyles[confirmVariant]}`}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
