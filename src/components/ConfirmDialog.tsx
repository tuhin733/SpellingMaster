import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../hooks/useScrollLock";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false,
}) => {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
          button:
            "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed",
          border: "border-red-100 dark:border-red-900/30",
        };
      case "warning":
        return {
          icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
          button:
            "bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed",
          border: "border-amber-100 dark:border-amber-900/30",
        };
      default:
        return {
          icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
          button:
            "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed",
          border: "border-blue-100 dark:border-blue-900/30",
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Only close if not in loading state (controlled by parent)
      if (!isLoading) {
        onClose();
      }
    } catch (error) {
      console.error("Error in confirmation action:", error);
      // Don't close on error - let the parent component handle the error state
    }
  };

  const dialog = (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-secondary-800 p-6 text-left shadow-xl transition-all w-full max-w-md sm:my-8">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${styles.icon}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <h3
                className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-2"
                id="modal-title"
              >
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex justify-center rounded-lg border border-gray-200 dark:border-secondary-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`inline-flex justify-center items-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles.button}`}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use React Portal to mount the dialog at the document body level
  return createPortal(dialog, document.body);
};

export default ConfirmDialog;
