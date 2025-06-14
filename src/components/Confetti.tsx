import React, { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

export interface ConfettiProps {
  show: boolean;
  zIndex?: number;
  className?: string;
  onComplete?: () => void;
  duration?: number;
}

/**
 * A celebratory confetti component that appears when a user completes a level
 */
const Confetti: React.FC<ConfettiProps> = ({
  show,
  zIndex = 50,
  className = "",
  onComplete,
  duration = 3000, // Default 3 seconds
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    setIsVisible(show);

    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex }}
    >
      <ReactConfetti
        width={windowDimension.width}
        height={windowDimension.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.2}
      />
    </div>
  );
};

export default Confetti;
