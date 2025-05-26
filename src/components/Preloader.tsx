import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface PreloaderProps {
  fullscreen?: boolean;
  size?: "small" | "medium" | "large";
  message?: string;
  delay?: number;
}

const Preloader: React.FC<PreloaderProps> = ({
  fullscreen = true,
  size = "medium",
  message = "Loading...",
  delay = 0,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const spinnerSizes = {
    small: "w-5 h-5",
    medium: "w-7 h-7",
    large: "w-9 h-9",
  };

  const textSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  const containerClasses = fullscreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm dark:bg-secondary-900/95"
    : "flex flex-col items-center justify-center py-5";

  const animationClass = visible ? "animate-fade-in" : "opacity-0";

  return (
    <div className={`${containerClasses} ${animationClass}`}>
      <div className="flex flex-col items-center bg-white/80 px-6 py-5 rounded-lg shadow-sm border border-secondary-100 dark:bg-secondary-800/80 dark:border-secondary-700">
        <div className="relative">
          <div
            className={`${spinnerSizes[size]} text-primary-500 animate-spin`}
          >
            <Loader2 className="w-full h-full" />
          </div>
          <div className="absolute inset-0 bg-white/20 rounded-full blur-md dark:bg-secondary-700/20" />
        </div>

        {message && (
          <p
            className={`mt-3.5 text-secondary-700 font-medium ${textSizes[size]} dark:text-secondary-300`}
          >
            <span className="inline-block animate-pulse">{message}</span>
          </p>
        )}

        <div className="mt-3 flex space-x-1.5">
          <div
            className="w-2 h-2 rounded-full bg-primary-300 animate-bounce dark:bg-primary-600"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full bg-primary-400 animate-bounce dark:bg-primary-500"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full bg-primary-500 animate-bounce dark:bg-primary-400"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
