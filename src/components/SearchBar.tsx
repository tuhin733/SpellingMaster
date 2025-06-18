import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Search, X, Filter, ChevronDown, Check, Globe } from "lucide-react";
import Tooltip from "./Tooltip";

export type FilterOption = {
  label: string;
  value: string;
};

interface DropdownPosition {
  top: number | "auto";
  left: number | "auto";
  bottom: number | "auto";
  isMobile: boolean;
}

interface SearchBarProps {
  onSearch: (term: string) => void;
  onFilterChange?: (value: string) => void;
  onGlobalSearch?: () => void;
  placeholder?: string;
  className?: string;
  filterOptions?: FilterOption[];
  selectedFilter?: string;
  showGlobalSearch?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterChange,
  onGlobalSearch,
  placeholder = "Search languages...",
  className = "",
  filterOptions = [],
  selectedFilter = "all",
  showGlobalSearch = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  const calculateDropdownPosition = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768; // md breakpoint

      if (isMobile) {
        // On mobile, position from the bottom of the viewport
        setDropdownPosition({
          top: "auto", // This will be ignored in favor of bottom positioning
          left: 0,
          bottom: 0,
          isMobile: true,
        });
      } else {
        // On desktop, position relative to the filter button
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX,
          bottom: "auto",
          isMobile: false,
        });
      }
    }
  };

  const toggleFilter = () => {
    if (!isFilterOpen) {
      calculateDropdownPosition();
    } else {
      setDropdownPosition(null);
    }
    setIsFilterOpen(!isFilterOpen);
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate position when filter opens or window resizes/scrolls
  useEffect(() => {
    if (isFilterOpen) {
      calculateDropdownPosition();
      window.addEventListener("resize", calculateDropdownPosition);
      window.addEventListener("scroll", calculateDropdownPosition, true);
    }

    return () => {
      window.removeEventListener("resize", calculateDropdownPosition);
      window.removeEventListener("scroll", calculateDropdownPosition, true);
    };
  }, [isFilterOpen]);

  const selectedOption =
    filterOptions.find((opt) => opt.value === selectedFilter) ||
    filterOptions[0];

  // Determine the right padding based on whether the filter button is present
  // Increased padding to accommodate clear button/ESC hint + filter button
  const inputPaddingRightClass =
    filterOptions.length > 0 ? "pr-[7.5rem]" : "pr-12";

  // Determine filter button styles based on whether a filter is applied
  const isFilterApplied = selectedFilter !== "all";
  const filterButtonClasses = `flex items-center justify-center p-1.5 text-sm transition-colors rounded-lg shadow-sm border
    ${
      isFilterApplied
        ? "bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300 border-primary-300 dark:border-primary-700"
        : "bg-gray-100 text-gray-600 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
    }
  `;

  const filterIconClasses = `w-4 h-4 ${
    isFilterApplied
      ? "text-primary-700 dark:text-primary-300"
      : "text-gray-600 dark:text-gray-400"
  }`;

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      {/* Search Icon */}
      <div
        className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 ${
          isFocused
            ? "text-blue-600 scale-110 transform-gpu"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <Search className="w-5 h-5 transition-transform duration-300" />
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full pl-12 py-3 text-sm bg-white border-2 rounded-xl
          text-gray-800 placeholder-gray-400 transition-all duration-300 ease-in-out
          dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500
          ${inputPaddingRightClass} 
          ${
            isFocused
              ? "border-blue-500 shadow-lg shadow-blue-100/50 dark:shadow-blue-900/30 dark:border-blue-600"
              : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
          }
          focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
          hover:shadow-md`}
        aria-label={placeholder}
      />

      {/* Right-side icons/hints container */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {/* Clear Button or ESC Hint */}
        {searchTerm ? (
          <button
            onClick={handleClear}
            className="flex items-center transition-opacity duration-200"
            aria-label="Clear search"
          >
            <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
            </div>
          </button>
        ) : filterOptions.length > 0 ? (
          <div
            className="text-xs font-medium
            bg-gray-100 text-gray-500 px-2 py-1 rounded-md select-none
            dark:bg-gray-800 dark:text-gray-400 transition-all duration-300 opacity-75"
          >
            ESC
          </div>
        ) : null}

        {/* Vertical Line and Buttons Container */}
        {(filterOptions.length > 0 || showGlobalSearch) && (
          <>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-3" />
            <div className="flex items-center gap-2">
              {showGlobalSearch && (
                <>
                  <Tooltip content="Global Search [ Ctrl+K ]" position="top">
                    <button
                      onClick={onGlobalSearch}
                      className="flex items-center justify-center p-1.5 text-sm transition-colors rounded-lg shadow-sm border
                        bg-gray-100 text-gray-600 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200 
                        border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                      aria-label="Global search"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  {filterOptions.length > 0 && (
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                  )}
                </>
              )}
              {filterOptions.length > 0 && (
                <Tooltip content="Filter" position="top">
                  <button
                    ref={filterButtonRef}
                    onClick={toggleFilter}
                    className={filterButtonClasses}
                  >
                    <Filter className={filterIconClasses} />
                  </button>
                </Tooltip>
              )}
            </div>
          </>
        )}
      </div>

      {/* Filter Dropdown Portal */}
      {isFilterOpen &&
        dropdownPosition &&
        ReactDOM.createPortal(
          <>
            {/* Backdrop for mobile */}
            {dropdownPosition.isMobile && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsFilterOpen(false)}
              />
            )}
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: dropdownPosition.isMobile
                  ? "auto"
                  : `${dropdownPosition.top}px`,
                left: dropdownPosition.isMobile
                  ? 0
                  : `${dropdownPosition.left}px`,
                bottom: dropdownPosition.isMobile ? 0 : "auto",
                right: dropdownPosition.isMobile ? 0 : "auto",
                zIndex: 50,
              }}
              className={`
              ${
                dropdownPosition.isMobile
                  ? "rounded-t-xl w-full transform transition-transform duration-200 ease-out"
                  : "rounded-xl w-[200px]"
              }
              bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden
            `}
            >
              {dropdownPosition.isMobile && (
                <div className="flex justify-center p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
              )}
              <div
                className={`py-1 ${
                  dropdownPosition.isMobile
                    ? "max-h-[50vh] overflow-y-auto"
                    : ""
                }`}
              >
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onFilterChange?.(option.value);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-all duration-200 flex items-center justify-between
                    ${
                      selectedFilter === option.value
                        ? "text-gray-700 dark:text-gray-200"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    }
                  `}
                  >
                    <span>{option.label}</span>
                    {selectedFilter === option.value && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default SearchBar;
