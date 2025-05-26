import React, { useState, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search languages...",
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div
        className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 ${
          isFocused
            ? "text-blue-600 scale-110 transform-gpu"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <Search className="w-5 h-5 transition-transform duration-300" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full pl-12 pr-12 py-3 text-sm bg-white border-2 rounded-xl
          text-gray-800 placeholder-gray-400 transition-all duration-300 ease-in-out
          dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500
          ${
            isFocused
              ? "border-blue-500 shadow-lg shadow-blue-100/50 dark:shadow-blue-900/30 dark:border-blue-600"
              : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
          }
          focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
          hover:shadow-md`}
        aria-label={placeholder}
      />
      {searchTerm && (
        <button
          onClick={handleClear}
          className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-opacity duration-200
            ${searchTerm ? "opacity-100" : "opacity-0"}`}
          aria-label="Clear search"
        >
          <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
          </div>
        </button>
      )}

      {!searchTerm && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
          bg-gray-100 text-gray-500 px-2 py-1 rounded-md select-none
          dark:bg-gray-800 dark:text-gray-400 transition-all duration-300 opacity-75"
        >
          ESC
        </div>
      )}
    </div>
  );
};

export default SearchBar;
