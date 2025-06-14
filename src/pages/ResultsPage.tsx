import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useProgress } from "../contexts/ProgressContext";
import { useApp } from "../contexts/AppContext";
import Header from "../components/Header";
import { FlashcardResult, LevelResult } from "../types/index";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Home,
  ArrowRight,
  List,
  AlertCircle,
} from "lucide-react";
import {
  SecondaryButton,
  SuccessButton,
  Card,
  ResultFeedback,
} from "../components/UIComponents";
import { motion } from "framer-motion";
import AnimatedEmoji from "../components/AnimatedEmoji";
import Confetti from "../components/Confetti";
import { AchievementToast } from "../components";

const ResultsPage: React.FC = () => {
  const { wordlistId, level } = useParams<{
    wordlistId: string;
    level: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addLevelResult, isLevelCompleted, getStreak } = useProgress();
  const { wordlists } = useApp();

  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [showAllWords, setShowAllWords] = useState(false);
  const [hasSavedResult, setHasSavedResult] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Streak display
  const [streak, setStreak] = useState<
    | {
        currentStreak: number;
        longestStreak: number;
        achievements: string[];
      }
    | undefined
  >();

  const wordlist = wordlists.find((w) => w.id === wordlistId);

  // Show streak info
  useEffect(() => {
    if (wordlist) {
      const streakData = getStreak(wordlist.id);
      setStreak(streakData);
    }
  }, [wordlist, getStreak]);

  useEffect(() => {
    if (!location.state?.results) {
      navigate(`/levels/${wordlistId}`);
    } else {
      setResults(location.state.results);
      setIsRetrying(location.state.isRetrying || false);
    }
  }, [location.state, wordlistId, navigate]);

  useEffect(() => {
    if (!hasSavedResult && wordlist && level && results.length > 0) {
      const levelNum = parseInt(level, 10);
      const percentage = Math.round(
        (results.filter((r) => r.correct).length / results.length) * 100
      );

      const saveResults = async () => {
        try {
          const levelResult: LevelResult = {
            language: wordlist.language,
            level: levelNum,
            score: results.filter((r) => r.correct).length,
            total: results.length,
            results: results,
            date: Date.now(),
          };

          // Save level result to Firebase
          await addLevelResult(levelResult);
          setHasSavedResult(true);

          // Show confetti if score is high
          if (percentage >= 90) {
            setShowConfetti(true);
          }

          // Get updated streak info
          const streakData = getStreak(wordlist.id);
          setStreak(streakData);
        } catch (error) {
          console.error("Error saving results:", error);
        }
      };

      saveResults();
    }
  }, [wordlist, level, results, addLevelResult, hasSavedResult, getStreak]);

  if (!wordlist || !level || results.length === 0) {
    return null;
  }

  const levelNum = parseInt(level, 10);
  const correctCount = results.filter((r) => r.correct).length;
  const percentage = Math.round((correctCount / results.length) * 100);
  const incorrectResults = results.filter((r) => !r.correct);
  const levelComplete = incorrectResults.length === 0;

  const handleRetry = () => {
    navigate(`/flashcards/${wordlistId}/${level}`);
  };

  const handleNextLevel = () => {
    const nextLevel = levelNum + 1;
    const totalWords = wordlist.words.length;
    const totalLevels = Math.ceil(totalWords / 20);

    if (nextLevel <= totalLevels) {
      navigate(`/flashcards/${wordlistId}/${nextLevel}`);
    } else {
      navigate(`/levels/${wordlistId}`);
    }
  };

  const handleHome = () => {
    navigate("/");
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col transition-colors dark:bg-gradient-to-b dark:from-secondary-900 dark:to-secondary-950">
      <Confetti
        show={showConfetti}
        duration={percentage === 100 ? 8000 : 6000}
      />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-3xl flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-3 sm:mb-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                {wordlist.name}
              </span>
            </div>

            {/* Enhanced Results Section with more compact styling */}
            <div className="py-2 sm:py-3">
              <ResultFeedback
                percentage={percentage}
                correctCount={correctCount}
                totalCount={results.length}
                isLevelComplete={levelComplete}
                className="mb-1 sm:mb-2"
              />

              {/* Optional: Add celebratory emoji for high scores (more compact) */}
              {percentage >= 90 && (
                <div className="flex justify-center gap-1 sm:gap-2 my-2">
                  <AnimatedEmoji emojiName="sparkles" size="32px" />
                  <AnimatedEmoji emojiName="trophy" size="36px" />
                  <AnimatedEmoji emojiName="sparkles" size="32px" />
                </div>
              )}
            </div>

            {/* Streak information with compact styling */}
            {streak && streak.currentStreak > 0 && (
              <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 dark:bg-gradient-to-r dark:from-orange-900/30 dark:to-amber-900/30 dark:border-orange-800/30">
                <div className="flex items-center">
                  <div className="flex items-center justify-center mr-2 sm:mr-3">
                    <AnimatedEmoji
                      emojiName="fire"
                      size="36px"
                      className="min-w-[36px]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <span className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400 mr-1">
                        {streak.currentStreak}
                      </span>
                      <span className="text-sm sm:text-base font-medium text-orange-600 dark:text-orange-400">
                        day streak!
                      </span>
                    </div>
                    {streak.achievements.length > 0 && (
                      <div className="flex items-center">
                        <AnimatedEmoji
                          emojiName="trophy"
                          size="18px"
                          className="mr-1"
                        />
                        <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-300">
                          {streak.achievements.length} achievement
                          {streak.achievements.length !== 1 ? "s" : ""} earned
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isRetrying && (
              <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-lg bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                {levelComplete ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      You've mastered all the words! Level complete.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      You still have {incorrectResults.length} word
                      {incorrectResults.length !== 1 ? "s" : ""} to master.
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
              <SuccessButton
                onClick={levelComplete ? handleNextLevel : handleRetry}
                icon={
                  levelComplete ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )
                }
                className="flex-1"
              >
                {levelComplete ? "Next Level" : "Retry Incorrect"}
              </SuccessButton>

              <SecondaryButton
                onClick={handleHome}
                icon={<Home className="w-4 h-4" />}
                className="flex-1"
              >
                Home
              </SecondaryButton>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-3 sm:mt-4 mb-1.5 sm:mb-2 flex items-center justify-between"
        >
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
            Results
          </h2>
          {results.length > 0 && (
            <button
              onClick={() => setShowAllWords(!showAllWords)}
              className="text-xs sm:text-sm flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              {showAllWords ? "Show Incorrect Only" : "Show All Words"}
            </button>
          )}
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-4 sm:mb-6 space-y-1.5 sm:space-y-2"
        >
          {(showAllWords ? results : incorrectResults).map((result, index) => (
            <motion.div key={result.word} variants={item}>
              <div
                className={`p-2.5 sm:p-3 rounded-lg border transition-colors ${
                  result.correct
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30"
                    : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                  <div className="flex items-center">
                    {result.correct ? (
                      <div className="flex items-center justify-center bg-green-100 dark:bg-green-800/30 rounded-full p-1 mr-2">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center bg-red-100 dark:bg-red-800/30 rounded-full p-1 mr-2">
                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                      </div>
                    )}
                    <span
                      className={`text-sm sm:text-base font-medium ${
                        result.correct
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {result.word}
                    </span>
                  </div>
                  {!result.correct && result.userInput && (
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-6 sm:ml-0">
                      You typed:{" "}
                      <span className="font-medium text-red-500 dark:text-red-300">
                        {result.userInput}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Perfect score display */}
          {!showAllWords && incorrectResults.length === 0 && (
            <motion.div variants={item}>
              <div className="p-4 sm:p-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-800/50">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 dark:text-green-400 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-0.5 sm:mb-1">
                  Perfect Score!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  You've correctly spelled all words in this level.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ResultsPage;
