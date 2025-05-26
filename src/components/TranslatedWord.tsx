import React, { useEffect, useState } from "react";
import { useTranslation } from "../contexts/TranslationContext";

interface TranslatedWordProps {
  word: string;
}

export const TranslatedWord: React.FC<TranslatedWordProps> = ({ word }) => {
  const { translate, isTranslationEnabled, selectedLanguage } =
    useTranslation();
  const [translatedText, setTranslatedText] = useState("");

  useEffect(() => {
    const getTranslation = async () => {
      if (isTranslationEnabled && word) {
        const translation = await translate(word);
        setTranslatedText(translation);
      } else {
        setTranslatedText("");
      }
    };

    getTranslation();
  }, [word, isTranslationEnabled, selectedLanguage, translate]);

  if (!isTranslationEnabled || !translatedText) return null;

  return (
    <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-600 dark:text-gray-300">
      <span>{translatedText}</span>
    </div>
  );
};
