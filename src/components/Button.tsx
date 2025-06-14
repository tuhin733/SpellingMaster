import React from "react";
import Tooltip from "./Tooltip";

interface ButtonProps {
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  tooltipContent?: string;
  disabled?: boolean;
}

interface ButtonWrapperProps {
  children: React.ReactNode;
  tooltipContent?: string;
}

const ButtonWrapper: React.FC<ButtonWrapperProps> = ({
  children,
  tooltipContent,
}) => {
  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="top">
        {children}
      </Tooltip>
    );
  }
  return <>{children}</>;
};

export const PrimaryButton: React.FC<ButtonProps> = ({
  onClick,
  className = "",
  icon,
  children,
  tooltipContent,
  disabled = false,
}) => {
  return (
    <ButtonWrapper tooltipContent={tooltipContent}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 text-white rounded-lg transition-colors focus-ring disabled:opacity-60 disabled:pointer-events-none ${className}`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium">{children}</span>
      </button>
    </ButtonWrapper>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  onClick,
  className = "",
  icon,
  children,
  tooltipContent,
  disabled = false,
}) => {
  return (
    <ButtonWrapper tooltipContent={tooltipContent}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center px-4 py-2.5 bg-white border border-secondary-200 text-secondary-800 rounded-lg hover:bg-secondary-50 focus:bg-secondary-50 transition-colors focus-ring disabled:opacity-60 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-700 dark:focus:bg-secondary-700 ${className}`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium">{children}</span>
      </button>
    </ButtonWrapper>
  );
};

export const SuccessButton: React.FC<ButtonProps> = ({
  onClick,
  className = "",
  icon,
  children,
  tooltipContent,
  disabled = false,
}) => {
  return (
    <ButtonWrapper tooltipContent={tooltipContent}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center px-4 py-2.5 bg-success-500 hover:bg-success-600 focus:bg-success-600 text-white rounded-lg transition-colors focus-ring disabled:opacity-60 disabled:pointer-events-none ${className}`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium">{children}</span>
      </button>
    </ButtonWrapper>
  );
};

export const OutlineButton: React.FC<ButtonProps> = ({
  onClick,
  className = "",
  icon,
  children,
  tooltipContent,
  disabled = false,
}) => {
  return (
    <ButtonWrapper tooltipContent={tooltipContent}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center px-4 py-2.5 bg-transparent border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 focus:bg-primary-50 transition-colors focus-ring disabled:opacity-60 disabled:pointer-events-none dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/20 dark:focus:bg-primary-900/20 ${className}`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium">{children}</span>
      </button>
    </ButtonWrapper>
  );
};
