import React, { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown } from "lucide-react";

export type FilterOption = {
  label: string;
  value: string;
};

interface FilterButtonProps {
  options: FilterOption[];
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  className?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  options,
  selectedFilter,
  onFilterChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption =
    options.find((opt) => opt.value === selectedFilter) || options[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm bg-white border-2 rounded-xl
          text-gray-800 transition-all duration-300 ease-in-out
          dark:bg-gray-900 dark:text-gray-100
          border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
          hover:shadow-md"
      >
        <Filter className="w-4 h-4" />
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onFilterChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group
                ${
                  selectedFilter === option.value
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
            >
              <span>{option.label}</span>
              <span>
                <svg
                  className={`w-4 h-4 transition-colors
                    ${
                      selectedFilter === option.value
                        ? "text-blue-600 dark:text-blue-400 opacity-100"
                        : "opacity-0 group-hover:opacity-100 group-hover:text-gray-400"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterButton;
