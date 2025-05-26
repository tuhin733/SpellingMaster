import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  translateText,
  Language,
  SUPPORTED_LANGUAGES,
} from "../utils/translation";

interface TranslationContextType {
  isTranslationEnabled: boolean;
  toggleTranslation: () => void;
  selectedLanguage: Language;
  setSelectedLanguage: (lang: Language) => void;
  translate: (text: string) => Promise<string>;
  supportedLanguages: Language[];
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    SUPPORTED_LANGUAGES[0]
  );

  const toggleTranslation = () => {
    setIsTranslationEnabled((prev) => !prev);
  };

  const translate = async (text: string): Promise<string> => {
    if (!isTranslationEnabled) return "";
    try {
      return await translateText(text, "en", selectedLanguage.code);
    } catch (error) {
      console.error("Translation failed:", error);
      return "";
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        isTranslationEnabled,
        toggleTranslation,
        selectedLanguage,
        setSelectedLanguage,
        translate,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
