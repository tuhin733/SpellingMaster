import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = 3000,
}) => {
  const [animation, setAnimation] = useState<"enter" | "exit" | null>(null);

  useEffect(() => {
    if (isVisible) {
      setAnimation("enter");
      const timer = setTimeout(() => {
        setAnimation("exit");
        // Allow exit animation to complete before calling onClose
        const exitTimer = setTimeout(() => {
          onClose();
        }, 200); // Match the duration of the exit animation

        return () => clearTimeout(exitTimer);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setAnimation(null);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible && animation !== "exit") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`rounded-lg border shadow-card p-4 bg-white border-secondary-200 text-secondary-800 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-100 min-w-[280px] max-w-[380px] transform transition-all duration-200 ease-out ${
          animation === "enter"
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
        role="alert"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium pr-2">{message}</p>
          <button
            onClick={() => setAnimation("exit")}
            className="flex-shrink-0 -mr-1 p-1 rounded-full hover:bg-secondary-100 focus-ring transition-colors dark:hover:bg-secondary-700"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
