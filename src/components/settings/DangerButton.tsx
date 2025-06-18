import React from 'react';
import { DangerButtonProps } from '../../types/settings';

const DangerButton: React.FC<DangerButtonProps> = ({
  icon,
  title,
  description,
  onClick,
  variant = "warning",
}) => (
  <button
    onClick={onClick}
    className="w-full p-4 bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors text-left"
  >
    <div className="flex items-center gap-3">
      <div className={variant === "danger" ? "text-red-500" : "text-blue-500"}>
        {icon}
      </div>
      <div>
        <span className="text-gray-800 dark:text-gray-100 font-medium">
          {title}
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
    </div>
  </button>
);

export default DangerButton; 