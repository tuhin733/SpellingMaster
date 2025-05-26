// src/contexts/ProgressContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { UserProgress, LevelResult, FlashcardResult } from "../types/index";
import * as db from "../utils/db";

interface ProgressContextType {
  userProgress: Record<string, UserProgress>;
  levelResults: LevelResult[];
  updateProgress: (
    language: string,
    level: number,
    results: FlashcardResult[],
    scorePercent?: number,
    wordlistId?: string
  ) => void;
  addLevelResult: (result: LevelResult) => void;
  clearProgress: (language?: string) => void;
  clearAllData: () => void;
  getIncorrectWords: (
    language: string,
    level: number,
    wordlistId: string
  ) => string[];
  isLevelCompleted: (
    language: string,
    level: number,
    wordlistId: string
  ) => boolean;
  updateStreak: (language: string) => Promise<void>;
  getStreak: (wordlistId: string) =>
    | {
        currentStreak: number;
        longestStreak: number;
        achievements: string[];
      }
    | undefined;
}

// Define the streak achievements
const STREAK_ACHIEVEMENTS = [
  { days: 1, badge: "First Day" },
  { days: 3, badge: "Three-Day Streak" },
  { days: 7, badge: "Weekly Warrior" },
  { days: 14, badge: "Fortnight Master" },
  { days: 30, badge: "Monthly Maestro" },
  { days: 60, badge: "Dedication Champion" },
  { days: 100, badge: "Centurion" },
];

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userProgress, setUserProgress] = useState<
    Record<string, UserProgress>
  >({});
  const [levelResults, setLevelResults] = useState<LevelResult[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const savedProgress = await db.getAllProgress();
      const savedResults = await db.getResults();
      setUserProgress(savedProgress);
      setLevelResults(savedResults);
    };

    loadData();
  }, []);

  const updateProgress = async (
    language: string,
    level: number,
    results: FlashcardResult[],
    scorePercent?: number,
    wordlistId?: string
  ) => {
    setUserProgress((prev) => {
      // Create a unique key for the progress using wordlistId if available
      const progressKey = wordlistId || language;

      const currentProgress = prev[progressKey] || {
        language,
        wordlistId, // Store the wordlistId
        completedLevels: [],
        currentLevel: 1,
        totalWords: 0,
        masteredWords: [],
        levelScores: {},
        incorrectWords: {},
      };

      // Extract correct and incorrect words
      const correctWords = results.filter((r) => r.correct).map((r) => r.word);
      const incorrectWords = results
        .filter((r) => !r.correct)
        .map((r) => r.word);

      // Update completion status - only complete if all words are correct
      let completedLevels = [...currentProgress.completedLevels];
      if (incorrectWords.length === 0 && !completedLevels.includes(level)) {
        completedLevels.push(level);
        completedLevels.sort((a, b) => a - b);
      } else if (incorrectWords.length > 0 && completedLevels.includes(level)) {
        // Remove level from completed if there are incorrect words
        completedLevels = completedLevels.filter((l) => l !== level);
      }

      // Calculate currentLevel as the next level after the highest completed level
      const currentLevel =
        completedLevels.length > 0 ? Math.max(...completedLevels) + 1 : 1;

      const updatedMasteredWords = [
        ...new Set([...currentProgress.masteredWords, ...correctWords]),
      ];

      const levelScores = { ...currentProgress.levelScores };
      if (scorePercent !== undefined) {
        levelScores[level] = scorePercent;
      }

      // Handle incorrectWords initialization if not present in the existing progress
      const currentIncorrectWords = currentProgress.incorrectWords || {};

      // Update incorrect words for this level
      const updatedIncorrectWords = {
        ...currentIncorrectWords,
        [level]: incorrectWords,
      };

      // Keep existing streak data if available
      const streak = currentProgress.streak || {
        currentStreak: 0,
        lastPracticeDate: 0,
        longestStreak: 0,
        achievements: [],
      };

      const newProgress = {
        ...prev,
        [progressKey]: {
          ...currentProgress,
          completedLevels,
          currentLevel,
          totalWords: updatedMasteredWords.length,
          masteredWords: updatedMasteredWords,
          levelScores,
          incorrectWords: updatedIncorrectWords,
          streak,
        },
      };

      db.setProgress(progressKey, newProgress[progressKey]);

      return newProgress;
    });

    // Update the streak whenever progress is updated
    await updateStreak(language);
  };

  const updateStreak = async (key: string) => {
    setUserProgress((prev) => {
      const currentProgress = prev[key];
      if (!currentProgress) return prev;

      // Get current timestamp (start of day)
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();

      // Initialize streak if not present
      const streak = currentProgress.streak || {
        currentStreak: 0,
        lastPracticeDate: 0,
        longestStreak: 0,
        achievements: [],
      };

      // Get last practice date (start of day)
      const lastPractice = streak.lastPracticeDate;
      const lastPracticeDate = lastPractice ? new Date(lastPractice) : null;
      const lastPracticeDay = lastPracticeDate
        ? new Date(
            lastPracticeDate.getFullYear(),
            lastPracticeDate.getMonth(),
            lastPracticeDate.getDate()
          ).getTime()
        : 0;

      // Calculate streak
      let currentStreak = streak.currentStreak;
      let achievements = streak.achievements || [];

      if (lastPracticeDay === 0) {
        // First time practice
        currentStreak = 1;
      } else if (todayStart === lastPracticeDay) {
        // Already practiced today, no streak change
      } else if (todayStart - lastPracticeDay === 86400000) {
        // Consecutive day (86400000 = 24 hours in milliseconds)
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }

      // Update longest streak if current is higher
      const longestStreak = Math.max(currentStreak, streak.longestStreak || 0);

      // Check for new achievements
      STREAK_ACHIEVEMENTS.forEach(({ days, badge }) => {
        if (currentStreak >= days && !achievements.includes(badge)) {
          achievements.push(badge);
        }
      });

      // Update streak data
      const updatedStreak = {
        currentStreak,
        lastPracticeDate: todayStart,
        longestStreak,
        achievements,
      };

      const updatedProgress = {
        ...currentProgress,
        streak: updatedStreak,
      };

      // Save to database
      db.setProgress(key, updatedProgress);

      // Return updated state
      return {
        ...prev,
        [key]: updatedProgress,
      };
    });
  };

  const getStreak = (wordlistId: string) => {
    const progress = userProgress[wordlistId];
    if (!progress || !progress.streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
      };
    }

    return {
      currentStreak: progress.streak.currentStreak,
      longestStreak: progress.streak.longestStreak,
      achievements: progress.streak.achievements || [],
    };
  };

  const addLevelResult = async (result: LevelResult) => {
    await db.addResult(result);
    const updatedResults = await db.getResults();
    setLevelResults(updatedResults);
  };

  const clearProgress = async (language?: string) => {
    if (language) {
      await db.deleteProgress(language);
      setUserProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[language];
        return newProgress;
      });
    } else {
      await db.clearAllProgress();
      await db.clearResults();
      setUserProgress({});
      setLevelResults([]);
    }
  };

  const clearAllData = async () => {
    await db.clearAllData();
    setUserProgress({});
    setLevelResults([]);
  };

  // Get incorrect words for a specific level and language
  const getIncorrectWords = (
    language: string,
    level: number,
    wordlistId: string
  ) => {
    return userProgress[wordlistId]?.incorrectWords[level] || [];
  };

  // Check if a level is completed
  const isLevelCompleted = (
    language: string,
    level: number,
    wordlistId: string
  ) => {
    return userProgress[wordlistId]?.completedLevels.includes(level) || false;
  };

  const contextValue = useMemo(
    () => ({
      userProgress,
      levelResults,
      updateProgress,
      addLevelResult,
      clearProgress,
      clearAllData,
      getIncorrectWords,
      isLevelCompleted,
      updateStreak,
      getStreak,
    }),
    [userProgress, levelResults]
  );

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
};
