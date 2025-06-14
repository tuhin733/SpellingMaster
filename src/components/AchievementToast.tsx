import React, { useState, useEffect } from "react";
import { Award } from "lucide-react";

interface AchievementToastProps {
  title: string;
  isVisible: boolean;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({
  title,
  isVisible,
  onClose,
}) => {
  const [animation, setAnimation] = useState<"enter" | "exit" | null>(null);

  useEffect(() => {
    if (isVisible) {
      setAnimation("enter");

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setAnimation("exit");

        // Allow exit animation to finish before calling onClose
        const exitTimer = setTimeout(() => {
          onClose();
        }, 500); // Animation duration

        return () => clearTimeout(exitTimer);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setAnimation(null);
    }
  }, [isVisible, onClose]);

  if (!isVisible && animation !== "exit") return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2 px-3 rounded-lg shadow-lg z-50 flex items-center gap-2 min-w-[240px] max-w-[90%] transition-all duration-500 ${
        animation === "enter"
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
    >
      <div className="flex-shrink-0 bg-white bg-opacity-20 p-1.5 rounded-full">
        <Award className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs uppercase font-semibold">Achievement Unlocked!</p>
        <p className="font-medium">{title}</p>
      </div>
    </div>
  );
};

export default AchievementToast;
