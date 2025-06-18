import React from 'react';
import { Switch } from '@headlessui/react';
import { SettingToggleProps } from '../../types/settings';

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  description,
  value,
  onChange,
  isLoading = false,
}) => {
  return (
    <div className="bg-white dark:bg-secondary-800/50 border-b border-gray-200/80 dark:border-gray-600">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2.5">
          <div className="text-blue-500">{icon}</div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-800 dark:text-gray-100">
              {title}
            </span>
            {description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
          ) : (
            <Switch
              checked={value}
              onChange={onChange}
              className={`${
                value ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              disabled={isLoading}
            >
              <span
                className={`${
                  value ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingToggle; 