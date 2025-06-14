import React from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { LevelStatusIndicator } from "./UIComponents";
import { useApp } from "../contexts/AppContext";
import { useProgress } from "../contexts/ProgressContext";

interface LevelCardProps {
  wordlistId: string;
  language: string;
  level: number;
  totalLevels: number;
  wordCount: number;
}

const LevelCard: React.FC<LevelCardProps> = ({
  wordlistId,
  language,
  level,
  totalLevels,
  wordCount,
}) => {
  const navigate = useNavigate();
  const { settings } = useApp();
  const { userProgress, getIncorrectWords, isLevelCompleted } = useProgress();

  // Get words per session from settings
  const wordsPerSession = settings.studySessionSettings.wordsPerSession;

  // Get progress data from Firebase
  const progressKey = wordlistId;
  const progress = userProgress[progressKey];
  const isCompleted = isLevelCompleted(language, level, wordlistId);
  const incorrectWords = getIncorrectWords(language, level, wordlistId);
  const hasIncorrectWords = incorrectWords.length > 0;

  // Check if level is locked
  const prevLevel = level - 1;
  let isLocked = false;
  if (level === 1) {
    isLocked = false;
  } else if (!progress?.completedLevels?.includes(prevLevel)) {
    isLocked = true;
  }

  const handleClick = () => {
    if (!isLocked) {
      navigate(`/flashcards/${wordlistId}/${level}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all duration-200 group ${
        isLocked
          ? "bg-gray-100 border-gray-300 opacity-70 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:opacity-60"
          : isCompleted
          ? "bg-white border-green-300 cursor-pointer hover:shadow-md dark:bg-secondary-800 dark:border-green-800"
          : hasIncorrectWords
          ? "bg-white border-yellow-300 cursor-pointer hover:shadow-md dark:bg-secondary-800 dark:border-yellow-700"
          : "bg-white border-blue-300 cursor-pointer hover:shadow-md dark:bg-secondary-800 dark:border-blue-700"
      }`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
          Level {level}
        </h3>
        <LevelStatusIndicator
          isLocked={isLocked}
          isCompleted={isCompleted}
          hasIncorrectWords={hasIncorrectWords}
        />
      </div>

      <p className="text-xs sm:text-sm text-gray-600 mb-1 dark:text-gray-300">
        {wordCount < wordsPerSession ? wordCount : wordsPerSession} words
      </p>

      {isLocked && (
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          Complete previous level to unlock
        </p>
      )}

      {isCompleted && (
        <p className="text-[10px] sm:text-xs text-green-600 font-medium dark:text-green-400">
          Completed
        </p>
      )}

      {hasIncorrectWords && !isCompleted && (
        <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-yellow-600 font-medium dark:text-yellow-400">
          <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
          {incorrectWords.length} word{incorrectWords.length !== 1 ? "s" : ""}{" "}
          to practice
        </div>
      )}

      {!isLocked && !isCompleted && !hasIncorrectWords && (
        <p className="text-[10px] sm:text-xs text-blue-600 font-medium dark:text-blue-400">
          Ready to start
        </p>
      )}
    </div>
  );
};

export default LevelCard;
