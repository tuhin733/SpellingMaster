import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: ToastType;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgClass: "bg-green-50 dark:bg-green-900/20",
    borderClass: "border-green-200 dark:border-green-800",
    textClass: "text-green-800 dark:text-green-200",
    iconClass: "text-green-500 dark:text-green-400",
    progressClass: "bg-green-500 dark:bg-green-400",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-red-50 dark:bg-red-900/20",
    borderClass: "border-red-200 dark:border-red-800",
    textClass: "text-red-800 dark:text-red-200",
    iconClass: "text-red-500 dark:text-red-400",
    progressClass: "bg-red-500 dark:bg-red-400",
  },
  info: {
    icon: Info,
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    borderClass: "border-blue-200 dark:border-blue-800",
    textClass: "text-blue-800 dark:text-blue-200",
    iconClass: "text-blue-500 dark:text-blue-400",
    progressClass: "bg-blue-500 dark:bg-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-yellow-50 dark:bg-yellow-900/20",
    borderClass: "border-yellow-200 dark:border-yellow-800",
    textClass: "text-yellow-800 dark:text-yellow-200",
    iconClass: "text-yellow-500 dark:text-yellow-400",
    progressClass: "bg-yellow-500 dark:bg-yellow-400",
  },
};

const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = 3000,
  type = "info",
}) => {
  const [animation, setAnimation] = useState<"enter" | "exit" | null>(null);
  const [progress, setProgress] = useState(100);
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let exitTimer: NodeJS.Timeout;

    if (isVisible) {
      setAnimation("enter");
      setProgress(100);

      // Start progress bar animation
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 * (1 - elapsed / duration));
        setProgress(remaining);

        if (remaining > 0) {
          progressTimer = setTimeout(updateProgress, 10);
        }
      };

      progressTimer = setTimeout(updateProgress, 10);

      // Set up exit animation
      exitTimer = setTimeout(() => {
        setAnimation("exit");
        setTimeout(onClose, 200);
      }, duration);
    }

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(exitTimer);
    };
  }, [isVisible, duration, onClose]);

  if (!isVisible && animation !== "exit") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`
          ${config.bgClass} ${config.borderClass} ${config.textClass}
          rounded-lg border shadow-lg backdrop-blur-sm
          min-w-[320px] max-w-[420px]
          transform transition-all duration-300 ease-out
          ${
            animation === "enter"
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-4 opacity-0 scale-95"
          }
        `}
        role="alert"
      >
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-100"
          style={{
            width: `${progress}%`,
            backgroundColor: `var(--${type}-500)`,
            opacity: 0.7,
          }}
        />

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${config.iconClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium flex-1 mt-0.5">{message}</p>
            <button
              onClick={() => setAnimation("exit")}
              className={`flex-shrink-0 -mr-1 p-1.5 rounded-lg opacity-70 hover:opacity-100 
                hover:${config.bgClass} transition-all duration-200`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
