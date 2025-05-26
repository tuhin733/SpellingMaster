import React, { useState, useEffect } from "react";
import Preloader from "./Preloader";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  minLoadingTime?: number;
}

/**
 * A component that shows a loading overlay when data is being fetched
 * Includes a minimum loading time to prevent flickering for quick operations
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading data...",
  children,
  minLoadingTime = 500,
}) => {
  const [showLoader, setShowLoader] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When loading starts
    if (isLoading) {
      const loaderTimer = setTimeout(() => {
        setShowLoader(true);
      }, 200); // Small delay before showing the loader to prevent flickering

      setTimer(loaderTimer);
    }
    // When loading ends
    else if (!isLoading && showLoader) {
      if (timer) {
        clearTimeout(timer);
      }

      // Ensure the loader shows for at least the minimum time
      setTimeout(() => {
        setShowLoader(false);
      }, minLoadingTime);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading, minLoadingTime, timer, showLoader]);

  return (
    <div className="relative">
      {showLoader && (
        <div className="absolute inset-0 z-10 bg-white bg-opacity-80 flex items-center justify-center">
          <Preloader fullscreen={false} message={message} />
        </div>
      )}
      <div className={showLoader ? "opacity-50" : ""}>{children}</div>
    </div>
  );
};

export default LoadingOverlay;
