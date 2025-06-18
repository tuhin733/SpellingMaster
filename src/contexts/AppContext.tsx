import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Wordlist, UserProgress, UserSettings } from "../types/index";
import * as db from "../utils/indexedDb";
import { preloadSoundEffects } from "../utils/sound";
import * as localSettings from "../utils/localSettings";
import { useWordlists, useStatistics } from "../hooks";
import * as firebaseDb from "../utils/firebaseDb";
import { useAuth } from "./AuthContext";
import {
  addToQueue,
  processQueue,
  retryOperation,
} from "../utils/operationQueue";
import { isOnline } from "../config/firebase";

interface AppSettings {
  enableSound: boolean;
  enableAutoSpeak: boolean;
  enableHints: boolean;
  enableTimer: boolean;
  fontSize: "small" | "medium" | "large";
  theme: "light" | "dark" | "system";
  fontFamily: "inter" | "roboto" | "open-sans" | "poppins";
  studySessionSettings: {
    wordsPerSession: number;
    timeLimit: number;
  };
}

interface LoadingStates {
  settings: boolean;
  progress: boolean;
  statistics: boolean;
}

interface AppContextType {
  wordlists: Wordlist[];
  userProgress: Record<string, UserProgress>;
  settings: AppSettings;
  isLoading: boolean;
  loadingStates: LoadingStates;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setWordlists: React.Dispatch<React.SetStateAction<Wordlist[]>>;
  updateProgress: (
    language: string,
    level: number,
    results: any[]
  ) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  clearProgress: (language?: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshWordlists: () => Promise<void>;
}

const initialSettings: AppSettings = {
  enableSound: true,
  enableAutoSpeak: false,
  enableHints: false,
  enableTimer: false,
  fontSize: "medium",
  theme: "system",
  fontFamily: "inter",
  studySessionSettings: {
    wordsPerSession: 20,
    timeLimit: 0,
  },
};

const safeFetchJson = async (url: string): Promise<any> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Failed to load ${url}:`, error);
    return null;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wordlistsFromHook, wordlistsLoading] = useWordlists();
  const [wordlists, setWordlists] = useState<Wordlist[]>([]);
  const [userProgress, setUserProgress] = useState<
    Record<string, UserProgress>
  >({});
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const { currentUser, isInitialized: isAuthInitialized } = useAuth();
  const { updateStatistics } = useStatistics();
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    settings: false,
    progress: false,
    statistics: false,
  });

  // Single source of truth for loading state calculation
  const isAppLoading = useMemo(() => {
    return (
      isLoading ||
      wordlistsLoading ||
      (!dbInitialized && currentUser !== null) ||
      !isAuthInitialized
    );
  }, [
    isLoading,
    wordlistsLoading,
    dbInitialized,
    currentUser,
    isAuthInitialized,
  ]);

  // Memoize wordlists update to prevent unnecessary re-renders
  const updateWordlistsFromHook = useMemo(() => {
    if (!wordlistsLoading && wordlistsFromHook.length > 0) {
      return wordlistsFromHook;
    }
    return null;
  }, [wordlistsFromHook, wordlistsLoading]);

  // Update wordlists when they are loaded from the hook
  useEffect(() => {
    if (updateWordlistsFromHook) {
      setWordlists(updateWordlistsFromHook);
    }
  }, [updateWordlistsFromHook]);

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Don't load data until auth is initialized
      if (!isAuthInitialized) return;

      try {
        if (!isMounted) return;
        setIsLoading(true);

        // Initialize database first
        await db.initDB();
        if (!isMounted) return;
        setDbInitialized(true);

        // Always try to load from localStorage first for immediate display
        const localStorageSettings = localStorage.getItem("appSettings");
        if (localStorageSettings) {
          try {
            const parsedLocalSettings = JSON.parse(localStorageSettings);
            setSettings({
              ...initialSettings,
              ...parsedLocalSettings,
            });
          } catch (error) {
            console.error("Failed to parse settings from localStorage:", error);
          }
        }

        if (!currentUser) {
          setUserProgress({});
          setIsLoading(false);
          return;
        }

        // Then load from Firebase with retries if user is logged in
        try {
          const [firebaseProgress, firebaseSettings] = await Promise.all([
            retryOperation(() => firebaseDb.getAllProgress(currentUser.uid)),
            retryOperation(() => firebaseDb.getSettings(currentUser.uid)),
          ]);

          if (!isMounted) return;

          // Update states with loaded data
          if (firebaseProgress) {
            setUserProgress(firebaseProgress);
          }

          // If Firebase has settings, use those
          if (firebaseSettings) {
            const mergedSettings = {
              ...initialSettings,
              ...firebaseSettings,
            };
            setSettings(mergedSettings);
            // Update localStorage with the latest settings
            localStorage.setItem("appSettings", JSON.stringify(mergedSettings));
          } else if (localStorageSettings) {
            // If we have localStorage settings but no Firebase settings, sync to Firebase
            const parsedLocalSettings = JSON.parse(localStorageSettings);
            const settingsToSync = {
              ...initialSettings,
              ...parsedLocalSettings,
            };
            await retryOperation(() =>
              firebaseDb.setSettings(currentUser.uid, settingsToSync)
            );
          }
        } catch (error) {
          console.error("Failed to load data from Firebase:", error);
          // Keep using localStorage settings if Firebase fails
        }

        // Preload sound effects
        try {
          await preloadSoundEffects();
        } catch (error) {
          console.error("Failed to preload sound effects:", error);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        if (!isMounted) return;
        // Don't reset settings to initial if we already loaded from localStorage
        if (!settings || Object.keys(settings).length === 0) {
          setSettings(initialSettings);
        }
        setUserProgress({});
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentUser, isAuthInitialized]);

  // Persist user progress to Firebase
  useEffect(() => {
    if (currentUser && dbInitialized) {
      const saveProgress = async () => {
        try {
          await Promise.all(
            Object.entries(userProgress).map(([language, progress]) =>
              firebaseDb.setProgress(currentUser.uid, language, progress)
            )
          );
        } catch (error) {
          console.error("Failed to save progress to Firebase:", error);
          // Could implement retry logic here if needed
        }
      };

      saveProgress();
    }
  }, [userProgress, dbInitialized, currentUser]);

  // Persist settings to Firebase and localStorage
  useEffect(() => {
    const saveSettings = async () => {
      if (!settings || !dbInitialized) return;

      try {
        // Always save to localStorage for faster initial load
        localStorage.setItem("appSettings", JSON.stringify(settings));
        localStorage.setItem("theme", settings.theme);

        // If user is logged in and auth is initialized, save to Firebase
        if (currentUser && isAuthInitialized) {
          await retryOperation(() =>
            firebaseDb.setSettings(currentUser.uid, settings)
          );
        }
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    };

    saveSettings();
  }, [settings, dbInitialized, currentUser, isAuthInitialized]);

  // Process queued operations when coming online
  useEffect(() => {
    const handleOnline = () => {
      processQueue({
        settings: (userId, data) => firebaseDb.setSettings(userId, data),
        progress: (userId, data) =>
          firebaseDb.setProgress(userId, data.language, data),
        statistics: (userId, data) => updateStatistics(data),
        results: (userId, data) => firebaseDb.addResult(userId, data),
      });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [updateStatistics]);

  // Update loading state helper
  const setLoading = (type: keyof LoadingStates, isLoading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [type]: isLoading }));
  };

  const updateProgress = async (
    language: string,
    level: number,
    results: any[]
  ) => {
    if (!currentUser) return;

    setLoading("progress", true);
    try {
      const currentProgress = userProgress[language] || {
        language,
        completedLevels: [],
        currentLevel: 1,
        totalWords: 0,
        masteredWords: [],
      };

      // Calculate score
      const totalQuestions = results.length;
      const correctAnswers = results.filter((r) => r.correct).length;
      const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);

      // Create new progress object
      const newProgress = {
        ...currentProgress,
        completedLevels:
          scorePercent === 100
            ? [...currentProgress.completedLevels, level].filter(
                (v, i, a) => a.indexOf(v) === i
              )
            : currentProgress.completedLevels,
        currentLevel:
          scorePercent === 100
            ? Math.max(level + 1, currentProgress.currentLevel)
            : currentProgress.currentLevel,
        totalWords: new Set([
          ...currentProgress.masteredWords,
          ...results.filter((r) => r.correct).map((r) => r.word),
        ]).size,
        masteredWords: Array.from(
          new Set([
            ...currentProgress.masteredWords,
            ...results.filter((r) => r.correct).map((r) => r.word),
          ])
        ),
      };

      // Update progress in Firebase or queue if offline
      if (isOnline()) {
        await retryOperation(() =>
          firebaseDb.setProgress(currentUser.uid, language, newProgress)
        );
      } else {
        addToQueue({
          type: "progress",
          userId: currentUser.uid,
          data: newProgress,
        });
      }

      // Update statistics
      setLoading("statistics", true);
      const statsUpdate = {
        totalWords: totalQuestions,
        correctWords: correctAnswers,
        incorrectWords: totalQuestions - correctAnswers,
        accuracy: scorePercent,
      };

      await updateStatistics(statsUpdate);

      // Update local state
      setUserProgress((prev) => ({
        ...prev,
        [language]: newProgress,
      }));
    } catch (error) {
      console.error("Failed to update progress:", error);
      throw error;
    } finally {
      setLoading("progress", false);
      setLoading("statistics", false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!currentUser) return;

    setLoading("settings", true);
    try {
      // Deep merge studySessionSettings to prevent partial updates
      const mergedStudySettings = newSettings.studySessionSettings
        ? {
            ...settings.studySessionSettings,
            ...newSettings.studySessionSettings,
          }
        : settings.studySessionSettings;

      // Create complete settings object
      const updated = {
        ...settings,
        ...newSettings,
        studySessionSettings: mergedStudySettings,
      };

      // Validate timer settings consistency
      if (updated.hasOwnProperty("enableTimer")) {
        if (!updated.enableTimer) {
          updated.studySessionSettings.timeLimit = 0;
        } else if (
          updated.enableTimer &&
          updated.studySessionSettings.timeLimit === 0
        ) {
          updated.studySessionSettings.timeLimit = 30;
        }
      }

      // Batch save to ensure consistency
      const savePromises = [];

      // Save to Firebase or queue for offline
      if (isOnline()) {
        savePromises.push(
          retryOperation(() => firebaseDb.setSettings(currentUser.uid, updated))
        );
      } else {
        addToQueue({
          type: "settings",
          userId: currentUser.uid,
          data: updated,
        });
      }

      // Save to localStorage
      savePromises.push(
        Promise.resolve().then(() => {
          localStorage.setItem("appSettings", JSON.stringify(updated));
          if (updated.theme) {
            localStorage.setItem("theme", updated.theme);
          }
        })
      );

      // Wait for all saves to complete
      await Promise.all(savePromises);

      // Update state only after successful persistence
      setSettings(updated);
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    } finally {
      setLoading("settings", false);
    }
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
    // Clear all local storage items
    localStorage.removeItem("appSettings");
    localStorage.removeItem("theme");
    localStorage.removeItem("spelling-master-settings");
    setUserProgress({});
    setSettings(initialSettings);
  };

  // Add refreshWordlists method to reload wordlists
  const refreshWordlists = async () => {
    try {
      setIsLoading(true);

      // Force clear cached data
      await db.initDB();

      // Load user wordlists from IndexedDB
      const userWordlists = await db.getAllWordlists();

      // Combine with preloaded wordlists
      const allWordlists = [
        ...wordlistsFromHook.filter((w) => w.source === "preloaded"),
        ...userWordlists,
      ];

      setWordlists(allWordlists);
    } catch (error) {
      console.error("Failed to refresh wordlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    wordlists,
    userProgress,
    settings,
    isLoading: isAppLoading,
    loadingStates,
    setIsLoading,
    setWordlists,
    updateProgress,
    updateSettings,
    clearProgress,
    clearAllData,
    refreshWordlists,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
