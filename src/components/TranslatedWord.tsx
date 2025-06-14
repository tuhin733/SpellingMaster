import React, { useEffect, useState } from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { Loader2 } from "lucide-react";

interface TranslatedWordProps {
  word: string;
}

export const TranslatedWord: React.FC<TranslatedWordProps> = ({ word }) => {
  const { translate, isTranslationEnabled, selectedLanguage } =
    useTranslation();
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getTranslation = async () => {
      if (isTranslationEnabled && word) {
        setIsLoading(true);
        try {
          const translation = await translate(word);
          setTranslatedText(translation);
        } finally {
          setIsLoading(false);
        }
      } else {
        setTranslatedText("");
      }
    };

    getTranslation();
  }, [word, isTranslationEnabled, selectedLanguage, translate]);

  if (!isTranslationEnabled) return null;

  return (
    <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-600 dark:text-gray-300">
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Translating...</span>
        </div>
      ) : translatedText ? (
        <span>{translatedText}</span>
      ) : null}
    </div>
  );
};
