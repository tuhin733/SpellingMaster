import React, { useState, useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  delay?: number;
  className?: string;
  maxWidth?: string | number;
  showArrow?: boolean;
  interactive?: boolean;
  trigger?: "hover" | "click" | "focus";
  offset?: number;
  containerClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
  maxWidth = "min(300px, 90vw)",
  showArrow = true,
  interactive = false,
  trigger = "hover",
  offset = 10,
  containerClassName = "",
}) => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  const calculatePosition = () => {
    if (!tooltipRef.current || !targetRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Update dimensions
    setDimensions({
      width: tooltipRect.width,
      height: tooltipRect.height,
    });

    let top = 0;
    let left = 0;

    // Calculate base position
    switch (position) {
      case "top":
        top = -tooltipRect.height - offset;
        left = (targetRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = targetRect.height + offset;
        left = (targetRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = (targetRect.height - tooltipRect.height) / 2;
        left = -tooltipRect.width - offset;
        break;
      case "right":
        top = (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.width + offset;
        break;
      case "top-left":
        top = -tooltipRect.height - offset;
        left = 0;
        break;
      case "top-right":
        top = -tooltipRect.height - offset;
        left = targetRect.width - tooltipRect.width;
        break;
      case "bottom-left":
        top = targetRect.height + offset;
        left = 0;
        break;
      case "bottom-right":
        top = targetRect.height + offset;
        left = targetRect.width - tooltipRect.width;
        break;
    }

    // Adjust position if tooltip would go off screen
    const tooltipRight = targetRect.left + left + tooltipRect.width;
    const tooltipBottom = targetRect.top + top + tooltipRect.height;

    if (tooltipRight > viewportWidth) {
      left = viewportWidth - targetRect.left - tooltipRect.width - 10;
    }
    if (tooltipBottom > viewportHeight) {
      top = viewportHeight - targetRect.top - tooltipRect.height - 10;
    }
    if (targetRect.left + left < 0) {
      left = -targetRect.left + 10;
    }
    if (targetRect.top + top < 0) {
      top = -targetRect.top + 10;
    }

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener("scroll", calculatePosition, true);
      window.addEventListener("resize", calculatePosition);
    }
    return () => {
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [isVisible, content, position]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: "translate-y-2 opacity-0",
    bottom: "-translate-y-2 opacity-0",
    left: "translate-x-2 opacity-0",
    right: "-translate-x-2 opacity-0",
    "top-left": "translate-y-2 translate-x-2 opacity-0",
    "top-right": "translate-y-2 -translate-x-2 opacity-0",
    "bottom-left": "-translate-y-2 translate-x-2 opacity-0",
    "bottom-right": "-translate-y-2 -translate-x-2 opacity-0",
  };

  const arrowClasses = {
    top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-[100%] border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-50 dark:border-t-slate-800",
    bottom:
      "top-0 left-1/2 -translate-x-1/2 -translate-y-[100%] border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-50 dark:border-b-slate-800",
    left: "right-0 top-1/2 -translate-y-1/2 translate-x-[100%] border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-slate-50 dark:border-l-slate-800",
    right:
      "left-0 top-1/2 -translate-y-1/2 -translate-x-[100%] border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-slate-50 dark:border-r-slate-800",
    "top-left":
      "bottom-0 right-0 translate-y-[100%] translate-x-[-100%] border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-50 dark:border-t-slate-800",
    "top-right":
      "bottom-0 left-0 translate-y-[100%] translate-x-[100%] border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-50 dark:border-t-slate-800",
    "bottom-left":
      "top-0 right-0 -translate-y-[100%] translate-x-[-100%] border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-50 dark:border-b-slate-800",
    "bottom-right":
      "top-0 left-0 -translate-y-[100%] translate-x-[100%] border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-50 dark:border-b-slate-800",
  };

  const handleMouseEnter = () => {
    if (trigger === "hover" && !interactive) {
      showTooltip();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover" && !interactive) {
      hideTooltip();
    }
  };

  const handleClick = () => {
    if (trigger === "click") {
      toggleTooltip();
    }
  };

  const handleFocus = () => {
    if (trigger === "focus") {
      showTooltip();
    }
  };

  const handleBlur = () => {
    if (trigger === "focus") {
      hideTooltip();
    }
  };

  // Return early for mobile devices
  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={targetRef}
      className={`relative inline-block ${containerClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      role="tooltip"
      aria-label={typeof content === "string" ? content : undefined}
    >
      {children}
      {content && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${
            interactive ? "" : "pointer-events-none"
          } ${!isVisible ? "invisible" : ""}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            minWidth: "max-content",
            maxWidth: maxWidth,
          }}
        >
          <div
            className={`
              relative px-2 py-1.5 text-xs font-normal 
              text-slate-700 dark:text-slate-200
              bg-slate-50 dark:bg-slate-800
              rounded-lg
              ${isVisible ? "opacity-100" : positionClasses[position]} 
              transition-all duration-200 ease-out
              shadow-lg backdrop-blur-sm
              border border-slate-200 dark:border-slate-700
              break-words
              z-[9999]
              ${className}
            `}
          >
            {content}
            {showArrow && (
              <div
                className={`absolute w-0 h-0 ${arrowClasses[position]}`}
              ></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
