import React from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { Languages } from "lucide-react";
import Tooltip from "./Tooltip";

export const TranslationToggle: React.FC = () => {
  const { isTranslationEnabled, toggleTranslation } = useTranslation();

  return (
    <Tooltip
      content={
        isTranslationEnabled ? "Disable translation" : "Enable translation"
      }
      position="bottom"
    >
      <button
        onClick={toggleTranslation}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors ${
          isTranslationEnabled
            ? "bg-primary-500 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        }`}
      >
        <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm font-medium hidden xs:inline">
          {isTranslationEnabled ? "Translation On" : "Translation Off"}
        </span>
        <span className="text-xs font-medium xs:hidden">
          {isTranslationEnabled ? "On" : "Off"}
        </span>
      </button>
    </Tooltip>
  );
};
