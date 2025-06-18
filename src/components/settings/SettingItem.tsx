import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SettingItemProps } from '../../types/settings';

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  value,
  onChange,
  options,
  isLoading = false,
  hideIcon = false,
  inline = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (inline) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isOpen
              ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
          }`}
          disabled={isLoading}
        >
          <span>{options.find((option) => option.value === value)?.label}</span>
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {isOpen && (
          <div className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-lg bg-white dark:bg-secondary-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-sm text-left transition-colors ${
                    option.value === value
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
                  }`}
                  disabled={isLoading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-secondary-800/50 border-b border-gray-200/80 dark:border-gray-600">
      <div className="flex items-center justify-between p-4">
        {!hideIcon && (
          <div className="flex items-center gap-2.5">
            <div className="text-blue-500">{icon}</div>
            <span className="text-sm text-gray-800 dark:text-gray-100">
              {title}
            </span>
          </div>
        )}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isOpen
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
            }`}
            disabled={isLoading}
          >
            <span>
              {options.find((option) => option.value === value)?.label}
            </span>
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
            ) : (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
          {isOpen && (
            <div className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-lg bg-white dark:bg-secondary-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-sm text-left transition-colors ${
                      option.value === value
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
                    }`}
                    disabled={isLoading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingItem; 