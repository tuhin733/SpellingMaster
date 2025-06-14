import React from "react";
import {
  CheckCircle,
  Lock,
  Circle,
  AlertTriangle,
  X,
  Info,
} from "lucide-react";
import { getFeedbackMessage } from "../utils/validation";
import AnimatedEmoji from "./AnimatedEmoji";
import Tooltip from "./Tooltip";

// Status indicators
export const LevelStatusIndicator: React.FC<{
  isLocked: boolean;
  isCompleted: boolean;
  hasIncorrectWords: boolean;
}> = ({ isLocked, isCompleted, hasIncorrectWords }) => {
  const getTooltipContent = () => {
    if (isLocked) return "Level is locked";
    if (isCompleted) return "Level completed";
    if (hasIncorrectWords) return "Level has incorrect words";
    return "Level in progress";
  };

  if (isLocked) {
    return (
      <Tooltip content={getTooltipContent()} position="top">
        <div className="p-0.5 sm:p-1 rounded-full bg-secondary-100 dark:bg-secondary-700">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-500 dark:text-secondary-400" />
        </div>
      </Tooltip>
    );
  } else if (isCompleted) {
    return (
      <Tooltip content={getTooltipContent()} position="top">
        <div className="p-0.5 sm:p-1 rounded-full bg-success-50 dark:bg-success-600/30">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success-500 dark:text-success-500" />
        </div>
      </Tooltip>
    );
  } else if (hasIncorrectWords) {
    return (
      <Tooltip content={getTooltipContent()} position="top">
        <div className="p-0.5 sm:p-1 rounded-full bg-warning-50 dark:bg-warning-600/30">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning-500 dark:text-warning-500" />
        </div>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip content={getTooltipContent()} position="top">
        <div className="p-0.5 sm:p-1 rounded-full bg-primary-50 dark:bg-primary-900/30">
          <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 dark:text-primary-400" />
        </div>
      </Tooltip>
    );
  }
};

// Progress bar component
export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  color?: "primary" | "success" | "warning" | "error";
}> = ({ progress, className = "", color = "primary" }) => {
  const colorMap = {
    primary: "bg-primary-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    error: "bg-error-500",
  };

  const bgColor = colorMap[color];
  const cappedProgress = Math.min(Math.max(0, progress), 100);

  return (
    <div className="w-full bg-secondary-100 rounded-full dark:bg-secondary-700">
      <div
        className={`${bgColor} h-2.5 rounded-full transition-all duration-300`}
        style={{ width: `${cappedProgress}%` }}
      />
    </div>
  );
};

export const AlertMessage: React.FC<{
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  icon?: React.ReactNode;
  className?: string;
  size?: "small" | "medium" | "large";
  onClose?: () => void;
}> = ({
  type,
  title,
  message,
  icon,
  className = "",
  size = "medium",
  onClose,
}) => {
  const typeStyles = {
    info: {
      bg: "bg-primary-50 dark:bg-primary-900/20",
      border: "border-primary-100 dark:border-primary-800",
      text: "text-primary-800 dark:text-primary-200",
      icon: (
        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 dark:text-primary-400" />
      ),
    },
    success: {
      bg: "bg-success-50 dark:bg-success-900/20",
      border: "border-success-100 dark:border-success-800",
      text: "text-success-600 dark:text-success-200",
      icon: (
        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success-500 dark:text-success-400" />
      ),
    },
    warning: {
      bg: "bg-warning-50 dark:bg-warning-900/20",
      border: "border-warning-100 dark:border-warning-800",
      text: "text-warning-600 dark:text-warning-200",
      icon: (
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning-500 dark:text-warning-400" />
      ),
    },
    error: {
      bg: "bg-error-50 dark:bg-error-900/20",
      border: "border-error-100 dark:border-error-800",
      text: "text-error-600 dark:text-error-200",
      icon: (
        <X className="w-4 h-4 sm:w-5 sm:h-5 text-error-500 dark:text-error-400" />
      ),
    },
  };

  const sizeStyles = {
    small: {
      padding: "p-2 sm:p-3",
      titleText: "text-xs font-medium",
      messageText: "text-xs",
      iconSize: "w-3.5 h-3.5 sm:w-4 sm:h-4",
      spacing: "ml-2",
      closeButton: "w-3 h-3 sm:w-3.5 sm:h-3.5",
    },
    medium: {
      padding: "p-3 sm:p-4",
      titleText: "text-xs sm:text-sm font-medium",
      messageText: "text-xs sm:text-sm",
      iconSize: "w-4 h-4 sm:w-5 sm:h-5",
      spacing: "ml-2 sm:ml-3",
      closeButton: "w-3.5 h-3.5 sm:w-4 sm:h-4",
    },
    large: {
      padding: "p-4 sm:p-5",
      titleText: "text-sm sm:text-base font-medium",
      messageText: "text-sm sm:text-base",
      iconSize: "w-5 h-5 sm:w-6 sm:h-6",
      spacing: "ml-3 sm:ml-4",
      closeButton: "w-4 h-4 sm:w-5 sm:h-5",
    },
  };

  const styles = typeStyles[type];
  const currentSize = sizeStyles[size];

  return (
    <div
      className={`${currentSize.padding} rounded-lg border ${styles.bg} ${styles.border} ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {icon
            ? React.cloneElement(icon as React.ReactElement, {
                className: `${currentSize.iconSize} ${
                  (icon as React.ReactElement).props.className
                }`,
              })
            : styles.icon}
        </div>
        <div className={`${currentSize.spacing} flex-grow`}>
          <h3 className={`${currentSize.titleText} ${styles.text}`}>{title}</h3>
          <div
            className={`mt-0.5 sm:mt-1 ${currentSize.messageText} ${styles.text}`}
          >
            {message}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ml-2 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${styles.text}`}
            aria-label="Close alert"
          >
            <X className={currentSize.closeButton} />
          </button>
        )}
      </div>
    </div>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}> = ({ children, className = "", animate = false }) => (
  <div className={`card ${animate ? "animate-fade-in" : ""} ${className}`}>
    {children}
  </div>
);

export const ResultFeedback: React.FC<{
  percentage: number;
  correctCount?: number;
  totalCount?: number;
  isLevelComplete?: boolean;
  className?: string;
}> = ({
  percentage,
  correctCount,
  totalCount,
  isLevelComplete = false,
  className = "",
}) => {
  const getMessage = () => {
    if (isLevelComplete) {
      return "Congratulations! You've completed this level.";
    }
    const feedbackObject = getFeedbackMessage(percentage, isLevelComplete);
    return feedbackObject.message;
  };

  const getDetailedFeedback = () => {
    if (percentage === 100) {
      return "Amazing! You've mastered these words perfectly!";
    } else if (percentage >= 90) {
      return "Excellent work! You're nearly perfect!";
    } else if (percentage >= 80) {
      return "Great job! Keep up the good work!";
    } else if (percentage >= 70) {
      return "Good progress! A bit more practice will help.";
    } else if (percentage >= 60) {
      return "You're doing well, but more practice is needed.";
    } else if (percentage >= 50) {
      return "You're halfway there. Keep practicing!";
    } else if (percentage >= 30) {
      return "Let's focus on improving your spelling.";
    } else {
      return "Don't worry! Practice makes perfect.";
    }
  };

  const getEmojiType = () => {
    if (percentage === 100) return "grinning"; // 😀 Grinning face
    if (percentage >= 90) return "partying"; // 🥳 Partying face
    if (percentage >= 80) return "star_struck"; // 🤩 Star-struck face
    if (percentage >= 70) return "smiling_face_with_hearts"; // 🥰 Smiling face with hearts
    if (percentage >= 60) return "grinning_with_sweat"; // 😅 Grinning face with sweat
    if (percentage >= 50) return "smile"; // 🙂 Slightly smiling face
    if (percentage >= 40) return "thinking"; // 🤔 Thinking face
    if (percentage >= 30) return "face_with_raised_eyebrow"; // 🤨 Face with raised eyebrow
    if (percentage >= 20) return "face_with_monocle"; // 🧐 Face with monocle
    return "face_with_open_mouth"; // 😮 Face with open mouth (surprise/need more practice)
  };

  const getColor = () => {
    if (percentage >= 90) return "text-success-600 dark:text-success-400";
    if (percentage >= 75) return "text-primary-600 dark:text-primary-400";
    if (percentage >= 50) return "text-warning-600 dark:text-warning-400";
    return "text-error-600 dark:text-error-400";
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <AnimatedEmoji
          emojiName={getEmojiType()}
          size="36px"
          className="sm:w-10 sm:h-10"
        />
        <h3 className={`text-2xl sm:text-3xl font-bold ${getColor()}`}>
          {Math.round(percentage)}%
        </h3>
      </div>
      {correctCount !== undefined && totalCount !== undefined && (
        <p className="text-xs sm:text-sm text-secondary-600 mb-2 dark:text-secondary-300">
          {correctCount} of {totalCount} correct
        </p>
      )}
      <p className="mt-1 text-sm sm:text-base font-medium text-secondary-700 dark:text-secondary-200">
        {getMessage()}
      </p>
      <p className="mt-0.5 text-xs sm:text-sm text-secondary-500 dark:text-secondary-400">
        {getDetailedFeedback()}
      </p>
    </div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "error" | "secondary" | "teal";
  className?: string;
  tooltip?: string;
}> = ({ children, variant = "primary", className = "", tooltip }) => {
  const variantClasses = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    teal: "badge-teal",
    secondary:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200",
  };

  const badge = (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
};
