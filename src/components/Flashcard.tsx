import React, { useState, useEffect, useRef } from "react";
import { Volume2, Check, X } from "lucide-react";
import { speakWord, isLanguageSupported } from "../utils/speechSynthesis";
import { validateWordInput, isCorrectSpelling } from "../utils/validation";
import { playSound } from "../utils/sound";
import { useApp } from "../contexts/AppContext";
import { TranslatedWord } from "./TranslatedWord";

interface FlashcardProps {
  word: string;
  language?: string;
  languageCode?: string;
  onResult: (correct: boolean) => void;
  autoSpeak?: boolean;
  wordNumber?: number;
  totalWords?: number;
  isComplete?: boolean;
  showInstructions?: boolean;
}

const Flashcard: React.FC<FlashcardProps> = ({
  word,
  language = "en-US",
  languageCode,
  onResult,
  autoSpeak = true,
  showInstructions = true,
}) => {
  const { settings } = useApp();
  const [isFlipped, setIsFlipped] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if speech synthesis is supported for this language
  useEffect(() => {
    const checkSpeechSupport = async () => {
      setIsCheckingSupport(true);
      try {
        const supported = await isLanguageSupported(language, languageCode);
        setIsSpeechSupported(supported);
      } catch (error) {
        setIsSpeechSupported(false);
      }
      setIsCheckingSupport(false);
    };

    checkSpeechSupport();
  }, [language, languageCode]);

  // Auto-speak the word when card is shown
  useEffect(() => {
    if (autoSpeak && isSpeechSupported && !isCheckingSupport) {
      handleSpeak();
    }
  }, [
    word,
    language,
    languageCode,
    autoSpeak,
    isSpeechSupported,
    isCheckingSupport,
  ]);

  // Reset state when word changes
  useEffect(() => {
    setIsFlipped(false);
    setUserInput("");
    setResult(null);
    setIsCardAnimating(false);
    setError(null);
  }, [word]);

  // Focus input when card is flipped
  useEffect(() => {
    if (isFlipped && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFlipped]);

  // Global keyboard listener for Shift + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !isFlipped &&
        (e.key === "Enter" || e.key === " " || e.code === "Space")
      ) {
        e.preventDefault();
        handleFlip();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFlipped]);

  const handleSpeak = async () => {
    if (!isSpeechSupported) return;

    setIsSpeaking(true);
    try {
      const success = await speakWord(word, language, languageCode);

      // If speech fails, don't keep the speaking animation going
      if (!success) {
        setIsSpeaking(false);
        return;
      }

      // Set a timeout to stop the speaking animation
      setTimeout(() => setIsSpeaking(false), 1500);
    } catch (error) {
      setIsSpeaking(false);
    }
  };

  const handleFlip = () => {
    if (!isFlipped && !isCardAnimating) {
      setIsCardAnimating(true);
      setTimeout(() => {
        setIsFlipped(true);
        setIsCardAnimating(false);
      }, 300);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateWordInput(userInput);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const correct = isCorrectSpelling(userInput, word);
    setResult(correct ? "correct" : "incorrect");

    // Play the appropriate sound effect based on the result
    playSound(correct ? "success" : "error", settings.enableSound);

    onResult(correct);
  };

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-0">
      <div
        className={`relative w-full h-60 sm:h-64 perspective-1000 transition-transform ${
          isCardAnimating ? "scale-95" : "scale-100"
        }`}
      >
        <div
          className={`w-full h-full preserve-3d transition-all duration-300 ease-in-out ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card */}
          {!isFlipped ? (
            <div
              onClick={handleFlip}
              tabIndex={0}
              role="button"
              aria-label="Flip card"
              className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-lg hover:border-blue-200 transition-all dark:bg-secondary-800 dark:border-secondary-700 dark:hover:border-blue-700"
            >
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2 dark:text-gray-100">
                  {word}
                </h3>
                <TranslatedWord word={word} />
                {!isCheckingSupport && isSpeechSupported ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak();
                    }}
                    className={`bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-3 sm:p-4 transition-all dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-300 ${
                      isSpeaking ? "animate-pulse" : ""
                    }`}
                    aria-label="Listen to word pronunciation"
                  >
                    <Volume2 className="w-6 h-6 sm:w-8 sm:h-8" />
                  </button>
                ) : null}
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 border border-gray-300 rounded text-[10px] sm:text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                    Enter
                  </kbd>
                  <span>or</span>
                  <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 border border-gray-300 rounded text-[10px] sm:text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                    Space
                  </kbd>
                  <span>to Flip</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col justify-between border border-gray-200 dark:bg-secondary-800 dark:border-secondary-700">
              {showInstructions && result === null && (
                <div className="text-center mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Type the word you heard
                  </h3>
                </div>
              )}
              {result === "correct" && (
                <div className="text-center mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-300">
                    Great job!
                  </h3>
                </div>
              )}
              {result === "incorrect" && (
                <div className="text-center mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-red-800 dark:text-red-300">
                    Try again next time!
                  </h3>
                </div>
              )}

              {result === null ? (
                <form onSubmit={handleSubmit} className="flex flex-col">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => {
                        setUserInput(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter spelling..."
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-center text-base sm:text-lg font-semibold border-t-0 border-x-0 border-b-2 ${
                        error
                          ? "border-red-500"
                          : "border-secondary-200 focus:border-primary-500 dark:border-secondary-600"
                      } outline-none dark:bg-secondary-700 dark:text-secondary-100 dark:placeholder-secondary-400 transition-all`}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 animate-pulse dark:text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="mt-3 sm:mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 sm:py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:ring-offset-secondary-800"
                  >
                    Check
                  </button>
                </form>
              ) : (
                <div className="text-center animate-fade-in">
                  {result === "correct" ? (
                    <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200 mb-2 sm:mb-4 dark:bg-green-900/20 dark:border-green-800/30">
                      <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/50">
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-green-800 mb-1 dark:text-green-300">
                        Correct!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Well done! You spelled it correctly.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200 mb-2 sm:mb-4 dark:bg-red-900/20 dark:border-red-800/30">
                      <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/50">
                          <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-red-800 mb-1 dark:text-red-300">
                        Incorrect
                      </h4>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          The correct spelling is:
                        </p>
                        <p className="text-black font-bold text-base sm:text-lg dark:text-white">
                          {word}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
