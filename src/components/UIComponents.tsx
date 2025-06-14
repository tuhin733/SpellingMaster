import React from "react";

export const TextBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`text-body ${className}`}>{children}</div>;
};

export const TextSmall: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`text-small ${className}`}>{children}</div>;
};

// Re-export components from Button and DisplayComponents
export {
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  OutlineButton,
} from "./Button";

export {
  LevelStatusIndicator,
  ProgressBar,
  AlertMessage,
  Card,
  ResultFeedback,
  Badge,
} from "./DisplayComponents";
