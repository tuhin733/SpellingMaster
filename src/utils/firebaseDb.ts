import { db } from "../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  runTransaction,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  UserProgress,
  UserSettings,
  LevelResult,
  UserStatistics,
} from "../types";
import { retryOperation } from "./operationQueue";
import { format, subDays } from "date-fns";

// Progress operations
export const getProgress = async (
  userId: string,
  language: string
): Promise<UserProgress | undefined> => {
  const progressRef = doc(db, "users", userId, "progress", language);
  const progressSnap = await getDoc(progressRef);
  return progressSnap.exists()
    ? (progressSnap.data() as UserProgress)
    : undefined;
};

export const getAllProgress = async (
  userId: string
): Promise<Record<string, UserProgress>> => {
  const progressRef = collection(db, "users", userId, "progress");
  const progressSnap = await getDocs(progressRef);

  return progressSnap.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data() as UserProgress;
    return acc;
  }, {} as Record<string, UserProgress>);
};

export const setProgress = async (
  userId: string,
  language: string,
  progress: UserProgress
): Promise<void> => {
  const progressRef = doc(db, "users", userId, "progress", language);
  try {
    // Validate progress data
    if (!progress || typeof progress !== "object") {
      throw new Error("Invalid progress data");
    }

    await setDoc(progressRef, {
      ...progress,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error setting progress for language ${language}:`, error);
    throw error;
  }
};

export const deleteProgress = async (
  userId: string,
  key: string
): Promise<void> => {
  try {
    const progressRef = doc(db, "users", userId, "progress", key);
    await deleteDoc(progressRef);
  } catch (error) {
    console.error("Error deleting progress:", error);
    throw error;
  }
};

export const clearAllProgress = async (userId: string): Promise<void> => {
  try {
    const progressRef = collection(db, "users", userId, "progress");
    const progressSnap = await getDocs(progressRef);

    const deletePromises = progressSnap.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error clearing all progress:", error);
    throw error;
  }
};

// Settings operations
export const getSettings = async (
  userId: string
): Promise<UserSettings | undefined> => {
  const settingsRef = doc(db, "users", userId, "settings", "user-settings");
  const settingsSnap = await getDoc(settingsRef);
  return settingsSnap.exists()
    ? (settingsSnap.data() as UserSettings)
    : undefined;
};

export const setSettings = async (
  userId: string,
  settings: UserSettings
): Promise<void> => {
  const settingsRef = doc(db, "users", userId, "settings", "user-settings");
  await setDoc(settingsRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  });
};

// Statistics operations
export const getStatistics = async (
  userId: string
): Promise<UserStatistics | undefined> => {
  const statsRef = doc(db, "users", userId, "statistics", "user-stats");
  const statsSnap = await getDoc(statsRef);
  return statsSnap.exists() ? (statsSnap.data() as UserStatistics) : undefined;
};

export const updateStatistics = async (
  userId: string,
  stats: Partial<UserStatistics>
): Promise<void> => {
  const statsRef = doc(db, "users", userId, "statistics", "user-stats");

  try {
    await runTransaction(db, async (transaction) => {
      const statsSnap = await transaction.get(statsRef);
      const now = Date.now();

      // Get current stats or initialize with default values
      const currentStats = statsSnap.exists()
        ? (statsSnap.data() as UserStatistics)
        : {
            totalWords: 0,
            correctWords: 0,
            incorrectWords: 0,
            accuracy: 0,
            streaks: {
              currentStreak: 0,
              bestStreak: 0,
              lastPracticeDate: 0,
            },
            languageStats: {},
            practiceHistory: {
              daily: {},
              weekly: {},
              monthly: {},
            },
            achievements: [],
            lastUpdated: now,
          };

      // Update base statistics
      const newStats = {
        ...currentStats,
        totalWords: (currentStats.totalWords || 0) + (stats.totalWords || 0),
        correctWords:
          (currentStats.correctWords || 0) + (stats.correctWords || 0),
        incorrectWords:
          (currentStats.incorrectWords || 0) + (stats.incorrectWords || 0),
        accuracy: stats.accuracy || currentStats.accuracy || 0,
        lastUpdated: now,
      };

      // Update language stats if provided
      if (stats.languageStats) {
        Object.entries(stats.languageStats).forEach(([lang, langStats]) => {
          if (!newStats.languageStats[lang]) {
            newStats.languageStats[lang] = {
              totalWords: 0,
              correctWords: 0,
              incorrectWords: 0,
              accuracy: 0,
              levels: {},
            };
          }

          const currentLangStats = newStats.languageStats[lang];
          currentLangStats.totalWords += langStats.totalWords || 0;
          currentLangStats.correctWords += langStats.correctWords || 0;
          currentLangStats.incorrectWords += langStats.incorrectWords || 0;
          currentLangStats.accuracy =
            Math.round(
              (currentLangStats.correctWords / currentLangStats.totalWords) *
                100
            ) || 0;

          // Merge level stats
          if (langStats.levels) {
            Object.entries(langStats.levels).forEach(
              ([levelStr, levelStats]) => {
                const level = parseInt(levelStr, 10);
                if (!currentLangStats.levels[level]) {
                  currentLangStats.levels[level] = levelStats;
                } else {
                  const currentLevelStats = currentLangStats.levels[level];
                  currentLevelStats.attempts += levelStats.attempts;
                  currentLevelStats.bestScore = Math.max(
                    currentLevelStats.bestScore,
                    levelStats.bestScore
                  );
                  currentLevelStats.averageScore = Math.round(
                    (currentLevelStats.averageScore *
                      (currentLevelStats.attempts - 1) +
                      levelStats.averageScore) /
                      currentLevelStats.attempts
                  );
                  currentLevelStats.lastAttemptDate =
                    levelStats.lastAttemptDate;
                }
              }
            );
          }
        });
      }

      // Update practice history if provided
      if (stats.practiceHistory) {
        // Merge daily stats
        Object.entries(stats.practiceHistory.daily || {}).forEach(
          ([date, dailyStats]) => {
            if (!newStats.practiceHistory.daily[date]) {
              newStats.practiceHistory.daily[date] = dailyStats;
            } else {
              const currentDailyStats = newStats.practiceHistory.daily[date];
              currentDailyStats.totalWords += dailyStats.totalWords;
              currentDailyStats.correctWords += dailyStats.correctWords;
              currentDailyStats.languages = Array.from(
                new Set([
                  ...currentDailyStats.languages,
                  ...dailyStats.languages,
                ])
              );
            }
          }
        );
      }

      // Update streaks
      const today = new Date().setHours(0, 0, 0, 0);
      const lastPractice = new Date(
        currentStats.streaks?.lastPracticeDate || 0
      ).setHours(0, 0, 0, 0);
      const isConsecutiveDay = today - lastPractice <= 86400000;

      if (isConsecutiveDay) {
        newStats.streaks.currentStreak =
          (currentStats.streaks?.currentStreak || 0) + 1;
        newStats.streaks.bestStreak = Math.max(
          newStats.streaks.currentStreak,
          currentStats.streaks?.bestStreak || 0
        );
      } else if (today > lastPractice) {
        newStats.streaks.currentStreak = 1;
      }
      newStats.streaks.lastPracticeDate = now;

      // Check and award achievements
      newStats.achievements = [
        ...currentStats.achievements,
        ...checkAchievements(newStats, currentStats),
      ];

      // Update within transaction
      transaction.set(statsRef, newStats);
    });
  } catch (error) {
    console.error("Error updating statistics:", error);
    throw error;
  }
};

// Helper function to get ISO week number
function getWeekNumber(date: number): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

// Helper function to check and return new achievements
function checkAchievements(
  newStats: UserStatistics,
  oldStats: UserStatistics
): UserStatistics["achievements"] {
  const newAchievements: UserStatistics["achievements"] = [];
  const now = Date.now();

  // Streak achievements
  if (
    newStats.streaks.currentStreak >= 7 &&
    oldStats.streaks.currentStreak < 7
  ) {
    newAchievements.push({
      id: "streak-7",
      type: "streak",
      title: "7-Day Streak",
      description: "Practice for 7 days in a row",
      earnedAt: now,
    });
  }

  // Accuracy achievements
  if (newStats.accuracy >= 90 && oldStats.accuracy < 90) {
    newAchievements.push({
      id: "accuracy-90",
      type: "accuracy",
      title: "Accuracy Master",
      description: "Achieve 90% overall accuracy",
      earnedAt: now,
    });
  }

  // Words achievements
  if (newStats.totalWords >= 1000 && oldStats.totalWords < 1000) {
    newAchievements.push({
      id: "words-1000",
      type: "words",
      title: "Word Explorer",
      description: "Practice 1,000 words",
      earnedAt: now,
    });
  }

  // Language achievements
  const languageCount = Object.keys(newStats.languageStats).length;
  const oldLanguageCount = Object.keys(oldStats.languageStats || {}).length;
  if (languageCount >= 3 && oldLanguageCount < 3) {
    newAchievements.push({
      id: "language-3",
      type: "language",
      title: "Polyglot",
      description: "Practice in 3 different languages",
      earnedAt: now,
    });
  }

  return newAchievements;
}

// Results operations
export const addResult = async (
  userId: string,
  result: LevelResult
): Promise<void> => {
  const resultsRef = collection(db, "users", userId, "results");
  await setDoc(doc(resultsRef), {
    ...result,
    createdAt: serverTimestamp(),
  });
};

export const getResults = async (
  userId: string,
  limit = 100
): Promise<LevelResult[]> => {
  const resultsRef = collection(db, "users", userId, "results");
  const resultsSnap = await getDocs(resultsRef);

  return resultsSnap.docs
    .map((doc) => doc.data() as LevelResult)
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);
};

export const clearResults = async (userId: string): Promise<void> => {
  try {
    const resultsRef = collection(db, "users", userId, "results");
    const resultsSnap = await getDocs(resultsRef);
    await deleteDocs(resultsSnap.docs);
  } catch (error) {
    console.error("Error clearing results:", error);
    throw error;
  }
};

export const clearAllData = async (userId: string): Promise<void> => {
  try {
    // Get all document references
    const [progressSnap, resultsSnap] = await Promise.all([
      getDocs(collection(db, "users", userId, "progress")),
      getDocs(collection(db, "users", userId, "results")),
    ]);

    // Delete all documents in batches
    await Promise.all([
      deleteDocs(progressSnap.docs),
      deleteDocs(resultsSnap.docs),
      // Delete single documents
      deleteDoc(doc(db, "users", userId, "settings", "user-settings")),
      deleteDoc(doc(db, "users", userId, "statistics", "user-stats")),
    ]);

    // Log success for debugging
    console.log(`Successfully cleared all data for user ${userId}`);
  } catch (error) {
    console.error("Error clearing all data:", error);
    throw error;
  }
};

// Delete all user data from Firebase
export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    // Delete settings and statistics (these are single documents)
    const batch = writeBatch(db);
    const settingsRef = doc(db, "users", userId, "settings", "user-settings");
    const statsRef = doc(db, "users", userId, "statistics", "user-stats");
    batch.delete(settingsRef);
    batch.delete(statsRef);
    await batch.commit();

    // Delete progress documents in batches
    const progressRef = collection(db, "users", userId, "progress");
    const progressSnap = await getDocs(progressRef);
    await deleteDocs(progressSnap.docs);

    // Delete results in batches
    const resultsRef = collection(db, "users", userId, "results");
    const resultsSnap = await getDocs(resultsRef);
    await deleteDocs(resultsSnap.docs);

    // Finally delete the main user document
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
};

// Helper function to delete documents in batches with retry logic
const deleteDocs = async (docs: QueryDocumentSnapshot[]): Promise<void> => {
  const batchSize = 450; // Keep under Firestore's 500 limit
  const totalBatches = Math.ceil(docs.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    await retryOperation(async () => {
      const batch = writeBatch(db);
      const start = i * batchSize;
      const end = Math.min(start + batchSize, docs.length);

      docs.slice(start, end).forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    });
  }
};

// Test data helper function
export const createTestData = async (userId: string) => {
  try {
    console.log("Creating test data for user:", userId);
    const now = new Date();
    const testData = {
      totalWords: 100,
      correctWords: 85,
      incorrectWords: 15,
      accuracy: 85,
      languageStats: {
        "en-US": {
          totalWords: 100,
          correctWords: 85,
          incorrectWords: 15,
          accuracy: 85,
          levels: {
            1: {
              attempts: 1,
              bestScore: 85,
              averageScore: 85,
              lastAttemptDate: Date.now(),
            },
          },
        },
      },
      practiceHistory: {
        daily: {
          [format(now, "yyyy-MM-dd")]: {
            totalWords: 20,
            correctWords: 18,
            languages: ["en-US"],
          },
          [format(subDays(now, 1), "yyyy-MM-dd")]: {
            totalWords: 30,
            correctWords: 24,
            languages: ["en-US"],
          },
          [format(subDays(now, 2), "yyyy-MM-dd")]: {
            totalWords: 25,
            correctWords: 22,
            languages: ["en-US"],
          },
          [format(subDays(now, 3), "yyyy-MM-dd")]: {
            totalWords: 25,
            correctWords: 21,
            languages: ["en-US"],
          },
        },
        weekly: {},
        monthly: {},
      },
      streaks: {
        currentStreak: 4,
        bestStreak: 4,
        lastPracticeDate: Date.now(),
      },
      achievements: [],
      lastUpdated: Date.now(),
    };

    console.log("Test data:", testData);
    const statsRef = doc(db, "users", userId, "statistics", "user-stats");
    await setDoc(statsRef, testData);
    console.log("Test data saved successfully");
  } catch (error) {
    console.error("Error creating test data:", error);
    throw error;
  }
};
