import React, { useState, useEffect, useRef } from "react";
import { Volume2, Check, X, HelpCircle, Clock } from "lucide-react";
import { speakWord, isLanguageSupported } from "../utils/speechSynthesis";
import { validateWordInput, isCorrectSpelling } from "../utils/validation";
import { playSound } from "../utils/sound";
import { useApp } from "../contexts/AppContext";
import { TranslatedWord } from "./TranslatedWord";
import Tooltip from "./Tooltip";
import { useTypewriter } from "../hooks/useTypewriter";
import { useIsMobile } from "../hooks/useIsMobile";
import styles from "../styles/typewriter.module.css";

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
  timeRemaining?: number | null;
  onStartTimer?: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({
  word,
  language = "en-US",
  languageCode,
  onResult,
  autoSpeak: propAutoSpeak = true,
  showInstructions = true,
  timeRemaining,
  onStartTimer,
}) => {
  const { settings } = useApp();
  const autoSpeak = propAutoSpeak !== false ? settings.enableAutoSpeak : false;
  const [isFlipped, setIsFlipped] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholderText = useTypewriter("Start typing...");
  const isMobile = useIsMobile(640);
  const [isFocused, setIsFocused] = useState(false);

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
        // Start timer when card is flipped
        if (settings.enableTimer && timeRemaining != null) {
          onStartTimer?.();
        }
      }, 300);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const validation = validateWordInput(userInput);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }
      const correct = isCorrectSpelling(userInput, word);
      setResult(correct ? "correct" : "incorrect");
      playSound(correct ? "success" : "error", settings.enableSound);
      onResult(correct);
    }
  };

  const getHint = () => {
    const wordLength = word.length;
    const revealedLength = Math.ceil(wordLength / 3); // Reveal about 1/3 of the word
    const hint =
      word.substring(0, revealedLength) +
      "•".repeat(wordLength - revealedLength);
    return hint;
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
                    className={`bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-4 sm:p-4.5 transition-all dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-300 ${
                      isSpeaking ? "animate-pulse" : ""
                    }`}
                    aria-label="Listen to word pronunciation"
                  >
                    <Volume2 className="w-7 h-7 sm:w-8 sm:h-8" />
                  </button>
                ) : null}
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <Tooltip
                    content="Press Enter key to flip the card"
                    position="top"
                  >
                    <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 border border-gray-300 rounded text-[10px] sm:text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                      Enter
                    </kbd>
                  </Tooltip>
                  <span>or</span>
                  <Tooltip
                    content="Press Space key to flip the card"
                    position="top"
                  >
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
                  <h3 className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400">
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
                  role="form"
                  aria-label="Spelling check form"
                >
                  <div className="flex flex-col items-center justify-center flex-grow">
                    <div className="relative flex items-center gap-2 w-full max-w-sm">
                      <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholderText}
                        className={`${
                          styles.cursor
                        } w-full h-14 text-center caret-transparent text-lg sm:text-xl font-semibold bg-transparent outline-none border-none ${
                          error
                            ? "text-red-500 dark:text-red-400"
                            : "text-gray-800 dark:text-gray-100"
                        } transition-all duration-200 px-4`}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        aria-label="Spelling input"
                        aria-invalid={error ? "true" : "false"}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Tooltip
                          content={
                            isFocused ? "Ready to type" : "Click to focus"
                          }
                          position="top"
                        >
                          <div
                            className={`w-2 h-2 rounded-full transition-colors ${
                              isFocused
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          />
                        </Tooltip>
                      </div>
                      {!isCheckingSupport && isSpeechSupported ? (
                        <button
                          type="button"
                          onClick={handleSpeak}
                          disabled={!isSpeechSupported || isSpeaking}
                          className={`absolute right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            isSpeaking
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400"
                          } transition-colors duration-200 ${
                            !isSpeechSupported
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                          aria-label="Listen to word pronunciation"
                        >
                          <Volume2
                            className={`w-5 h-5 sm:w-6 sm:h-6 ${
                              isSpeaking ? "animate-pulse" : ""
                            }`}
                          />
                        </button>
                      ) : null}
                    </div>
                    {error && (
                      <p
                        className="mt-3 text-center text-sm text-red-600 dark:text-red-400 animate-pulse"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                  <div className="relative flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {/* Timer - Absolute positioned left */}
                    {timeRemaining !== null && settings.enableTimer && (
                      <div className="absolute left-0 flex items-center">
                        <Clock
                          className={`w-4 h-4 mr-1 ${
                            timeRemaining != null && timeRemaining <= 5
                              ? "text-red-500 animate-pulse"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            timeRemaining != null && timeRemaining <= 5
                              ? "text-red-500 animate-pulse"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {timeRemaining}s
                        </span>
                      </div>
                    )}
                    {/* Centered Enter instruction */}
                    <div className="text-center">
                      Press{" "}
                      <Tooltip
                        content="Press Enter key to check your spelling"
                        position="top"
                      >
                        <kbd className="mx-2 px-2 py-1 bg-gray-100 border border-gray-300 rounded font-sans font-medium text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                          Enter
                        </kbd>
                      </Tooltip>{" "}
                      to check spelling
                    </div>
                    {/* Hint Button - Absolute positioned right */}
                    {settings.enableHints && (
                      <div className="absolute right-0">
                        <Tooltip content={`Hint: ${getHint()}`} position="top">
                          <button
                            type="button"
                            className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                          >
                            <HelpCircle className="w-5 h-5" />
                          </button>
                        </Tooltip>
                      </div>
                    )}
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
