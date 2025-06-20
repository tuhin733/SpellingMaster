import React, { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "../contexts/TranslationContext";
import Tooltip from "./Tooltip";

interface Language {
  code: string;
  name: string;
}

export const LanguageSelector: React.FC = () => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    supportedLanguages,
    isTranslationEnabled,
  } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isTranslationEnabled) return null;

  return (
    <div className="relative" ref={selectorRef}>
      <Tooltip content="Select target language" position="bottom">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="pl-7 sm:pl-9 pr-6 sm:pr-8 py-2.5 sm:py-2 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-700 
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:focus:ring-primary-500 dark:focus:border-primary-500
            hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center justify-between w-full"
        >
          <span className="flex items-center">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="mr-2">{selectedLanguage.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({selectedLanguage.code})
            </span>
          </span>
          <svg
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 max-h-60 overflow-y-auto scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-track]:bg-gray-800/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500">
          <div className="py-1">
            {supportedLanguages.map((lang: Language) => (
              <button
                onClick={() => {
                  setSelectedLanguage(lang);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group ${
                  selectedLanguage.code === lang.code
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
                key={lang.code}
              >
                <span className="flex items-center">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span>{lang.name}</span>
                </span>
                <span className="flex items-center">
                  <svg
                    className={`w-3.5 h-3.5 ml-2 transition-colors
                      ${
                        selectedLanguage.code === lang.code
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
        </div>
      )}
    </div>
  );
};
