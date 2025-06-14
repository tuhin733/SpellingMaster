import React, { useState, useEffect } from "react";
import Tooltip from "./Tooltip";

interface CircleProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  tooltipContent?: string;
}

export const CircleProgress: React.FC<CircleProgressProps> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  circleColor = "#f1f5f9",
  progressColor = "#3b82f6",
  showPercentage = true,
  animated = true,
  tooltipContent,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const animationDuration = 1000;
      const stepTime = 20;
      const steps = animationDuration / stepTime;
      const increment = progress / steps;
      let currentProgress = 0;

      const timer = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= progress) {
          clearInterval(timer);
          setDisplayProgress(progress);
        } else {
          setDisplayProgress(Math.floor(currentProgress));
        }
      }, stepTime);

      return () => clearInterval(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset =
    circumference - (displayProgress / 100) * circumference;
  const center = size / 2;

  // Calculate text size proportionally to circle size
  const fontSize = Math.max(Math.floor(size / 4), 10); // Minimum 10px font size
  const textPadding = Math.max(Math.floor(size / 20), 4); // Minimum 4px padding

  // Define gradient colors based on progress
  const gradientId = `progressGradient-${size}`;
  const bgGradientId = `bgGradient-${size}`;
  const getGradientColors = () => {
    if (displayProgress === 100) {
      return {
        start: "#0284c7", // sky-600
        middle: "#0ea5e9", // sky-500
        end: "#38bdf8", // sky-400
      };
    }
    return {
      start: "#2563eb", // blue-600
      middle: "#3b82f6", // blue-500
      end: "#60a5fa", // blue-400
    };
  };
  const gradientColors = getGradientColors();

  const progressComponent = (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        style={{
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
        }}
        shapeRendering="geometricPrecision"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor={gradientColors.start}
              stopOpacity="1"
            />
            <stop
              offset="50%"
              stopColor={gradientColors.middle}
              stopOpacity="1"
            />
            <stop
              offset="100%"
              stopColor={gradientColors.end}
              stopOpacity="1"
            />
          </linearGradient>
          <linearGradient
            id={bgGradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="1" />
            <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          className="transition-all duration-300"
          stroke={`url(#${bgGradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={center}
          cy={center}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{
            paintOrder: "stroke",
          }}
        />

        {/* Progress circle with gradient */}
        <circle
          className="transition-all duration-300"
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          r={radius}
          cx={center}
          cy={center}
          vectorEffect="non-scaling-stroke"
          style={{
            paintOrder: "stroke",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.05))",
          }}
        />
      </svg>

      {/* Percentage text in center */}
      {showPercentage && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ padding: textPadding }}
        >
          <span
            className={`font-medium tracking-tight ${
              displayProgress === 100
                ? "text-sky-600 dark:text-sky-400"
                : "text-gray-900 dark:text-gray-100"
            }`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1,
              textRendering: "geometricPrecision",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}
          >
            {displayProgress}%
          </span>
        </div>
      )}
    </div>
  );

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="top">
        {progressComponent}
      </Tooltip>
    );
  }

  return progressComponent;
};

export default CircleProgress;
