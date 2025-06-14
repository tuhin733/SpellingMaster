import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { useProgress } from "../contexts/ProgressContext";
import Header from "../components/Header";
import Flashcard from "../components/Flashcard";
import { useLoading } from "../hooks/useLoading";
import { FlashcardResult } from "../types";
import { AlertTriangle, Headphones } from "lucide-react";
import { AlertMessage, ProgressBar, Card } from "../components/UIComponents";
import { AchievementToast } from "../components";
import Spinner from "../components/Spinner";

const FlashcardPage: React.FC = () => {
  const { wordlistId, level } = useParams<{
    wordlistId: string;
    level: string;
  }>();
  const navigate = useNavigate();
  const { wordlists, settings } = useApp();
  const {
    userProgress,
    getIncorrectWords,
    isLevelCompleted,
    updateProgress,
    updateStreak,
    getStreak,
  } = useProgress();
  const { isLoading, startLoading, endLoading } = useLoading(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [levelWords, setLevelWords] = useState<string[]>([]);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementBadge, setAchievementBadge] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showRetryAlert, setShowRetryAlert] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track previous achievements to detect new ones
  const [previousAchievements, setPreviousAchievements] = useState<string[]>(
    []
  );

  // Define handleResult before it's used in useEffect
  const handleResult = useCallback(
    (correct: boolean) => {
      // Clear timer if active
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setResults((prevResults) => {
        const newResults = [...prevResults];
        newResults[currentIndex] = {
          ...newResults[currentIndex],
          correct,
          userInput: correct ? levelWords[currentIndex] : "",
        };
        return newResults;
      });

      setTimeout(() => {
        if (currentIndex < levelWords.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setIsComplete(true);
        }
      }, 1500);
    },
    [currentIndex, levelWords]
  );

  const wordlist = wordlists.find((w) => w.id === wordlistId);
  const levelNum = level ? parseInt(level, 10) : 0;

  // Get the user's study session settings with fallback values
  const wordsPerSession = settings.studySessionSettings?.wordsPerSession || 20;
  const timeLimit = settings.studySessionSettings?.timeLimit || 0;

  useEffect(() => {
    if (wordlist) {
      // Store the current achievements when component loads
      const streak = getStreak(wordlist.id || wordlist.language);
      if (streak) {
        setPreviousAchievements(streak.achievements || []);
      }
    }
  }, [wordlist, getStreak]);

  useEffect(() => {
    if (!wordlist || !level) {
      navigate("/");
    }
  }, [wordlist, level, navigate]);

  // Setup timer if timeLimit is set
  useEffect(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Don't start timer automatically - it will be started when card is flipped
    setTimeRemaining(timeLimit);

    // Always provide cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, timeLimit]);

  const startTimer = () => {
    if (timeLimit > 0 && !timerRef.current) {
      setTimeRemaining(timeLimit);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Time's up, mark as incorrect
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleResult(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    const loadWords = async () => {
      startLoading();
      try {
        if (wordlist && level) {
          const levelNum = parseInt(level, 10);
          const startIndex = (levelNum - 1) * 20;
          const endIndex = Math.min(startIndex + 20, wordlist.words.length);

          // Get all words for this level
          const fullLevelWords = wordlist.words
            .slice(startIndex, endIndex)
            .map((w) => (typeof w === "string" ? w : w.word));

          // Get previously incorrect words using wordlistId
          const incorrectWords = getIncorrectWords(
            wordlist.language,
            levelNum,
            wordlist.id
          );

          // Determine if this is a first attempt or retry
          const isFirstAttempt = incorrectWords.length === 0;
          setIsRetrying(!isFirstAttempt);

          // If first time or no incorrect words, use all words; else only incorrect words
          let wordsToUse =
            isFirstAttempt || incorrectWords.length === 0
              ? fullLevelWords
              : incorrectWords;

          // Apply the wordsPerSession setting to limit the number of words
          if (wordsToUse.length > wordsPerSession) {
            // Shuffle the array first to get random words if we're limiting
            const shuffled = [...wordsToUse].sort(() => Math.random() - 0.5);
            wordsToUse = shuffled.slice(0, wordsPerSession);
          }

          setLevelWords(wordsToUse);
        }
      } finally {
        // Short delay to prevent flickering
        setTimeout(() => {
          endLoading();
        }, 500);
      }
    };

    loadWords();
  }, [
    wordlist,
    level,
    getIncorrectWords,
    userProgress,
    startLoading,
    endLoading,
    wordsPerSession,
  ]);

  useEffect(() => {
    if (levelWords.length > 0 && results.length === 0) {
      setResults(levelWords.map((word) => ({ word, correct: false })));
    }
  }, [levelWords]);

  useEffect(() => {
    if (!level || !wordlistId || !wordlist) return;

    if (isComplete) {
      const scorePercent = Math.round(
        (results.filter((r) => r.correct).length / results.length) * 100
      );

      // Update streak data
      const handleResultsAndStreak = async () => {
        try {
          // Update progress with wordlistId
          await updateProgress(
            wordlist.language,
            levelNum,
            results,
            wordlistId
          );

          // Update streak for the wordlist
          await updateStreak(wordlistId);

          // Check for new achievements
          const updatedStreak = getStreak(wordlistId);

          // Compare with previous achievements to find new ones
          if (updatedStreak && updatedStreak.achievements) {
            const newAchievements = updatedStreak.achievements.filter(
              (badge) => !previousAchievements.includes(badge)
            );

            // If there's a new achievement, show it
            if (newAchievements.length > 0) {
              setAchievementBadge(newAchievements[0]);
              setShowAchievement(true);
            }
          }

          // Navigate to results page
          navigate(`/results/${wordlistId}/${levelNum}`, {
            state: { results, isRetrying },
          });
        } catch (error) {
          console.error("Error updating progress and streak:", error);
        }
      };

      handleResultsAndStreak();
    }
  }, [
    isComplete,
    results,
    level,
    wordlistId,
    navigate,
    updateProgress,
    wordlist,
    isRetrying,
    levelNum,
    updateStreak,
    getStreak,
    previousAchievements,
  ]);

  // Keyboard navigation for developers/testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + left/right arrow to navigate
      if (e.altKey) {
        if (e.key === "ArrowLeft" && currentIndex > 0) {
          e.preventDefault();
          setCurrentIndex(currentIndex - 1);
        } else if (
          e.key === "ArrowRight" &&
          currentIndex < levelWords.length - 1
        ) {
          e.preventDefault();
          setCurrentIndex(currentIndex + 1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, levelWords.length]);

  // When component unmounts, ensure timer is cleaned up
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!wordlist || !level) {
    return null;
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (levelWords.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-secondary-900">
        <Header
          showBack
          title={`Level ${level} - ${wordlist?.language || ""}`}
          showSettings={false}
          showStats={false}
        />
        <div className="flex-1" />
      </div>
    );
  }

  const progress = Math.round(
    ((currentIndex + (results[currentIndex]?.correct ? 1 : 0)) /
      levelWords.length) *
      100
  );

  const correctCount = results.filter((r) => r.correct).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col transition-colors dark:from-secondary-900 dark:to-secondary-950">
      <Header
        showBack
        title={`Level ${level} - ${wordlist?.language || "Loading..."}`}
        showSettings={false}
        showStats={false}
      />

      {/* Achievement Toast for streaks and badges */}
      {showAchievement && (
        <AchievementToast
          title={achievementBadge}
          isVisible={showAchievement}
          onClose={() => setShowAchievement(false)}
        />
      )}

      <main className="flex-1 container-content flex flex-col main-content">
        <Card className="mb-4 sm:mb-6 animate-fade-in dark:bg-secondary-800">
          {isRetrying && showRetryAlert && (
            <AlertMessage
              type="warning"
              title="Review Session"
              message="Focus on mastering the words you missed before. Complete this session correctly to advance to the next level!"
              icon={
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              }
              className="mb-4 animate-fade-in"
              size="small"
              onClose={() => setShowRetryAlert(false)}
            />
          )}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
              <span className="text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-400">
                Listen carefully and spell each word
              </span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-secondary-700 dark:text-secondary-300">
              {correctCount}/{levelWords.length} correct
            </div>
          </div>

          <div className="mb-4">
            <ProgressBar progress={progress} />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 font-medium rounded-full h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-[10px] sm:text-xs mr-1.5 sm:mr-2">
                {currentIndex + 1}
              </span>
              <span>of {levelWords.length} words</span>
            </div>

            <div className="flex gap-1">
              <div
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  currentIndex > 0
                    ? "bg-primary-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-500"></div>
              <div
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  currentIndex < levelWords.length - 1
                    ? "bg-primary-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            </div>
          </div>
        </Card>

        <div className="flex-1 flex items-center justify-center">
          <Flashcard
            word={levelWords[currentIndex]}
            language={wordlist.language}
            languageCode={wordlist.languageCode}
            onResult={handleResult}
            key={`${levelWords[currentIndex]}-${currentIndex}`}
            wordNumber={currentIndex + 1}
            totalWords={levelWords.length}
            isComplete={results[currentIndex]?.correct || false}
            timeRemaining={timeRemaining}
            onStartTimer={startTimer}
          />
        </div>
      </main>
    </div>
  );
};

export default FlashcardPage;
