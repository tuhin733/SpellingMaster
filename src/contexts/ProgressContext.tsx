// src/contexts/ProgressContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { UserProgress, LevelResult, FlashcardResult } from "../types/index";
import * as firebaseDb from "../utils/firebaseDb";
import { useAuth } from "./AuthContext"; // Import the auth context
import { useStatistics } from "../hooks"; // Import the statistics context
import { format } from "date-fns";

interface ProgressContextType {
  userProgress: Record<string, UserProgress>;
  levelResults: LevelResult[];
  updateProgress: (
    language: string,
    level: number,
    results: FlashcardResult[],
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
        lastPracticeDate: number;
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
  const { currentUser } = useAuth();
  const { statistics, updateStatistics } = useStatistics();

  // Load initial progress data
  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser) {
        setUserProgress({});
        setLevelResults([]);
        return;
      }

      try {
        const savedProgress = await firebaseDb.getAllProgress(currentUser.uid);
        setUserProgress(savedProgress);
      } catch (error) {
        console.error("Error loading progress:", error);
      }
    };

    loadProgress();
  }, [currentUser]);

  const updateProgress = async (
    language: string,
    level: number,
    results: FlashcardResult[],
    wordlistId?: string
  ) => {
    if (!currentUser) return;

    const progressKey = wordlistId || language;
    const currentProgress = userProgress[progressKey] || {
      language: progressKey,
      completedLevels: [],
      currentLevel: 1,
      totalWords: 0,
      masteredWords: [],
      incorrectWords: {},
      streak: {
        currentStreak: 0,
        lastPracticeDate: 0,
        longestStreak: 0,
        achievements: [],
      },
    };

    // Calculate score and update statistics
    const totalQuestions = results.length;
    const correctAnswers = results.filter((r) => r.correct).length;
    const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);

    // Update statistics using the hook
    await updateStatistics({
      totalWords: totalQuestions,
      correctWords: correctAnswers,
      incorrectWords: totalQuestions - correctAnswers,
      accuracy: scorePercent,
      languageStats: {
        [language]: {
          totalWords: totalQuestions,
          correctWords: correctAnswers,
          incorrectWords: totalQuestions - correctAnswers,
          accuracy: scorePercent,
          levels: {
            [level]: {
              attempts: 1,
              bestScore: scorePercent,
              averageScore: scorePercent,
              lastAttemptDate: Date.now(),
            },
          },
        },
      },
      practiceHistory: {
        daily: {
          [format(new Date(), "yyyy-MM-dd")]: {
            totalWords: totalQuestions,
            correctWords: correctAnswers,
            languages: [language],
          },
        },
        weekly: {},
        monthly: {},
      },
    });

    // Update progress state
    setUserProgress((prev) => {
      const currentIncorrectWords = currentProgress.incorrectWords || {};
      const incorrectWords = results
        .filter((r) => !r.correct)
        .map((r) => r.word);

      const updatedMasteredWords = new Set(currentProgress.masteredWords);
      results.forEach((result) => {
        if (result.correct) {
          updatedMasteredWords.add(result.word);
        }
      });

      let completedLevels = [...currentProgress.completedLevels];
      // Only mark level as completed if score is 100%
      if (scorePercent === 100 && !completedLevels.includes(level)) {
        completedLevels.push(level);
      }

      // Only advance to next level if current level is 100% complete
      const currentLevel =
        scorePercent === 100
          ? Math.max(level + 1, currentProgress.currentLevel)
          : currentProgress.currentLevel;

      const updatedIncorrectWords = {
        ...currentIncorrectWords,
        [level]: incorrectWords,
      };

      const newProgress = {
        ...prev,
        [progressKey]: {
          ...currentProgress,
          completedLevels,
          currentLevel,
          masteredWords: Array.from(updatedMasteredWords),
          incorrectWords: updatedIncorrectWords,
        },
      };

      // Save to Firebase
      firebaseDb.setProgress(
        currentUser.uid,
        progressKey,
        newProgress[progressKey]
      );

      return newProgress;
    });

    // Update streak
    await updateStreak(language);
  };

  const updateStreak = async (language: string) => {
    if (!currentUser) return;

    setUserProgress((prev) => {
      const key = language;
      const currentProgress = prev[key];
      if (!currentProgress) return prev;

      const todayStart = new Date().setHours(0, 0, 0, 0);
      const lastPractice = currentProgress.streak?.lastPracticeDate || 0;
      const lastPracticeDate = new Date(lastPractice).setHours(0, 0, 0, 0);
      const daysSinceLastPractice = Math.floor(
        (todayStart - lastPracticeDate) / (1000 * 60 * 60 * 24)
      );

      let currentStreak = currentProgress.streak?.currentStreak || 0;
      let longestStreak = currentProgress.streak?.longestStreak || 0;
      let achievements = currentProgress.streak?.achievements || [];

      if (daysSinceLastPractice === 0) {
        // Already practiced today, no streak update needed
        return prev;
      } else if (daysSinceLastPractice === 1) {
        // Consecutive day, increment streak
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          if (longestStreak >= 7 && !achievements.includes("week-streak")) {
            achievements.push("week-streak");
          }
          if (longestStreak >= 30 && !achievements.includes("month-streak")) {
            achievements.push("month-streak");
          }
        }
      } else {
        // Streak broken
        currentStreak = 1;
      }

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

      // Save to Firebase
      firebaseDb.setProgress(currentUser.uid, key, updatedProgress);

      return {
        ...prev,
        [key]: updatedProgress,
      };
    });
  };

  const getStreak = (wordlistId: string) => {
    const progress = userProgress[wordlistId];
    if (!progress?.streak) return undefined;
    return {
      ...progress.streak,
      achievements: progress.streak.achievements || [],
    };
  };

  const addLevelResult = async (result: LevelResult) => {
    if (!currentUser) return;
    await firebaseDb.addResult(currentUser.uid, result);
    setLevelResults((prev) => [result, ...prev]);
  };

  const clearProgress = async (language?: string) => {
    if (!currentUser) return;

    if (language) {
      await firebaseDb.deleteProgress(currentUser.uid, language);
      setUserProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[language];
        return newProgress;
      });
    } else {
      await firebaseDb.clearAllProgress(currentUser.uid);
      setUserProgress({});
    }
  };

  const clearAllData = async () => {
    if (!currentUser) return;
    await firebaseDb.clearAllData(currentUser.uid);
    setUserProgress({});
    setLevelResults([]);
  };

  const getIncorrectWords = (
    language: string,
    level: number,
    wordlistId: string
  ) => {
    const key = wordlistId || language;
    const progress = userProgress[key];
    if (!progress || !progress.incorrectWords) return [];
    return progress.incorrectWords[level] || [];
  };

  const isLevelCompleted = (
    language: string,
    level: number,
    wordlistId: string
  ) => {
    const key = wordlistId || language;
    const progress = userProgress[key];
    return progress ? progress.completedLevels.includes(level) : false;
  };

  const value = useMemo(
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
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
};

export default ProgressContext;
