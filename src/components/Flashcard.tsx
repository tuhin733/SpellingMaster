import React, { useState, useEffect, useRef } from "react";
import { Volume2, Check, X } from "lucide-react";
import { speakWord, isLanguageSupported } from "../utils/speechSynthesis";
import { validateWordInput, isCorrectSpelling } from "../utils/validation";
import { playSound } from "../utils/sound";
import { useApp } from "../contexts/AppContext";
import { TranslatedWord } from "./TranslatedWord";
import Tooltip from "./Tooltip";

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
  const [userInput, setUserInput] = useState<string[]>([]);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    setUserInput(Array(word.length).fill(""));
    setResult(null);
    setIsCardAnimating(false);
    setError(null);
    inputRefs.current = Array(word.length).fill(null);
  }, [word]);

  // Focus first input when card is flipped
  useEffect(() => {
    if (isFlipped && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
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

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single character

    const newInput = [...userInput];
    newInput[index] = value;
    setUserInput(newInput);
    setError(null);

    // Auto-focus next input if character entered
    if (value && index < word.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputWord = userInput.join("");
      const validation = validateWordInput(inputWord);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }
      const correct = isCorrectSpelling(inputWord, word);
      setResult(correct ? "correct" : "incorrect");
      playSound(correct ? "success" : "error", settings.enableSound);
      onResult(correct);
    } else if (e.key === "Backspace" && !userInput[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").slice(0, word.length);
    const newInput = Array(word.length).fill("");
    pastedText.split("").forEach((char, index) => {
      if (index < word.length) {
        newInput[index] = char;
      }
    });
    setUserInput(newInput);
    setError(null);
  };

  // Helper function to check if it's a mobile screen
  const isMobile = () => window.innerWidth < 640;

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
                  <Tooltip content="Press Enter key to flip the card" position="top">
                    <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 border border-gray-300 rounded text-[10px] sm:text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                      Enter
                    </kbd>
                  </Tooltip>
                  <span>or</span>
                  <Tooltip content="Press Space key to flip the card" position="top">
                    <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 border border-gray-300 rounded text-[10px] sm:text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                      Space
                    </kbd>
                  </Tooltip>
                  <span>to Flip</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col justify-between border border-gray-200 dark:bg-secondary-800 dark:border-secondary-700">
              {showInstructions && result === null && (
                <div className="text-center mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Enter the spelling
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
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex flex-col h-full justify-between"
                >
                  <div className="flex flex-col items-center justify-center flex-grow">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex gap-1.5 sm:gap-2 w-full justify-center">
                        {Array.from({ length: word.length }).map((_, index) => (
                          <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            maxLength={1}
                            value={userInput[index] || ""}
                            onChange={(e) =>
                              handleInputChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`h-10 sm:h-12 text-center text-lg sm:text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 ${
                              error
                                ? "border-red-500 dark:border-red-500"
                                : "border-secondary-200 dark:border-secondary-600"
                            } transition-all`}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            style={{
                              caretColor: "transparent", // Hide blinking cursor
                              width: `calc((100% - ${(word.length - 1) * (isMobile() ? 0.375 : 0.5)}rem) / ${word.length})` // Calculate width based on container, gaps, and number of inputs
                            }}
                          />
                        ))}
                      </div>
                      {!isCheckingSupport && isSpeechSupported ? (
                        <button
                          type="button"
                          onClick={handleSpeak}
                          disabled={!isSpeechSupported || isSpeaking}
                          className={`bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-2 sm:p-3 transition-all dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-300 ${
                            isSpeaking ? "animate-pulse" : ""
                          } ${
                            !isSpeechSupported
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          aria-label="Listen to word pronunciation"
                        >
                          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      ) : null}
                    </div>
                    {error && (
                      <p className="mt-3 text-center text-xs sm:text-sm text-red-600 animate-pulse dark:text-red-400">
                        {error}
                      </p>
                    )}
                  </div>
                  <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Press{" "}
                    <Tooltip content="Press Enter key to check your spelling" position="top">
                      <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] sm:text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                        Enter
                      </kbd>
                    </Tooltip>{" "}
                    to check spelling
                  </div>
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
