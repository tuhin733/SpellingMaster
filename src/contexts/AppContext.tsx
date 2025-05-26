import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Wordlist, UserProgress, UserSettings } from "../types/index";
import * as db from "../utils/db";
import { preloadSoundEffects } from "../utils/sound";
import * as localSettings from "../utils/localSettings";
import { useWordlists } from "../hooks";

interface AppContextType {
  wordlists: Wordlist[];
  userProgress: Record<string, UserProgress>;
  settings: UserSettings;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  updateProgress: (
    language: string,
    level: number,
    masteredWords: string[],
    scorePercent?: number
  ) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => void;
  clearProgress: (language?: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshWordlists: () => Promise<void>;
}

// Use default settings from the localSettings utility
const initialSettings = localSettings.defaultSettings;

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
  // Load settings using the new utility
  const [settings, setSettings] = useState<UserSettings>(
    localSettings.loadSettings()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);

  // Single source of truth for loading state calculation
  const isAppLoading = useMemo(() => {
    return (
      isLoading || wordlistsLoading || !dbInitialized || wordlists.length === 0
    );
  }, [isLoading, wordlistsLoading, dbInitialized, wordlists.length]);

  // Update wordlists when they are loaded from the hook
  useEffect(() => {
    if (!wordlistsLoading && wordlistsFromHook.length > 0) {
      setWordlists(wordlistsFromHook);
    }
  }, [wordlistsFromHook, wordlistsLoading]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Initialize database and migrate data from localStorage
        await db.initDB();
        setDbInitialized(true);

        // Load data from IndexedDB (only progress data)
        const savedProgress = await db.getAllProgress();
        setUserProgress(savedProgress);

        // Preload sound effects
        preloadSoundEffects();
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        // Signal that the database loading is complete
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Persist user progress to IndexedDB
  useEffect(() => {
    if (dbInitialized) {
      Object.entries(userProgress).forEach(([language, progress]) => {
        db.setProgress(language, progress).catch((error) => {
          console.error(`Failed to save progress for ${language}:`, error);
        });
      });
    }
  }, [userProgress, dbInitialized]);

  // Persist settings to localStorage when they change
  useEffect(() => {
    localSettings.saveSettings(settings);

    // Handle font size
    const root = document.documentElement;
    root.classList.remove("text-sm", "text-base", "text-lg");
    root.classList.add(
      settings.fontSize === "small"
        ? "text-sm"
        : settings.fontSize === "medium"
        ? "text-base"
        : "text-lg"
    );

    // Handle theme with a smoother transition
    if (settings.theme === "dark") {
      // First set dark mode class
      root.classList.add("dark");
      // Then store in localStorage to avoid synchronous reflows
      setTimeout(() => {
        localStorage.setItem("theme", "dark");
      }, 0);
    } else {
      // First remove dark mode class
      root.classList.remove("dark");
      // Then store in localStorage to avoid synchronous reflows
      setTimeout(() => {
        localStorage.setItem("theme", "light");
      }, 0);
    }
  }, [settings]);

  const updateProgress = async (
    language: string,
    level: number,
    masteredWords: string[],
    scorePercent?: number
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        setUserProgress((prev) => {
          const currentProgress = prev[language] || {
            language,
            completedLevels: [],
            currentLevel: 1,
            totalWords: 0,
            masteredWords: [],
            levelScores: {},
            incorrectWords: {},
          };

          const completedLevels = Array.from(
            new Set([...currentProgress.completedLevels, level])
          ).sort((a, b) => a - b);

          const currentLevel =
            completedLevels.length > 0 ? Math.max(...completedLevels) + 1 : 1;

          const updatedMasteredWords = Array.from(
            new Set([...currentProgress.masteredWords, ...masteredWords])
          );

          // Add or update levelScores
          const levelScores = { ...currentProgress.levelScores };
          if (scorePercent !== undefined) {
            levelScores[level] = scorePercent;
          }

          // Ensure incorrectWords is initialized
          const incorrectWords = currentProgress.incorrectWords || {};

          const newProgress = {
            ...prev,
            [language]: {
              ...currentProgress,
              completedLevels,
              currentLevel,
              totalWords: updatedMasteredWords.length,
              masteredWords: updatedMasteredWords,
              levelScores,
              incorrectWords,
            },
          };

          return newProgress;
        });

        // Resolve after state update is scheduled
        // Use setTimeout to ensure this happens after the state update
        setTimeout(() => resolve(), 0);
      } catch (error) {
        console.error("Error updating progress:", error);
        reject(error);
      }
    });
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    // Handle sound setting explicitly to ensure proper boolean type
    let soundEnabled: boolean | undefined = undefined;

    if (newSettings.hasOwnProperty("enableSound")) {
      // Force strict boolean values - check for explicit false first
      if (newSettings.enableSound === false) {
        soundEnabled = false;
      } else {
        soundEnabled = true;
      }
    }

    setSettings((prev: UserSettings) => {
      // Safely copy settings without spreading the potentially problematic newSettings
      const updatedSettings: UserSettings = {
        fontSize: prev.fontSize,
        theme: prev.theme,
        enableSound: prev.enableSound,
        studySessionSettings: {
          ...(prev.studySessionSettings || {
            wordsPerSession: 20,
            timeLimit: 0,
          }),
        },
      };

      // Explicitly handle each field with type checking
      if (newSettings.fontSize) {
        // Ensure fontSize is one of the allowed values
        if (["small", "medium", "large"].includes(newSettings.fontSize)) {
          updatedSettings.fontSize = newSettings.fontSize;
        }
      }

      if (newSettings.theme) {
        // Ensure theme is one of the allowed values
        if (["light", "dark"].includes(newSettings.theme)) {
          updatedSettings.theme = newSettings.theme as "light" | "dark";
        }
      }

      // Override with our explicitly verified value if we have one
      if (soundEnabled !== undefined) {
        updatedSettings.enableSound = soundEnabled;
      }

      // Handle studySessionSettings if provided
      if (newSettings.studySessionSettings) {
        updatedSettings.studySessionSettings = {
          ...updatedSettings.studySessionSettings,
          ...newSettings.studySessionSettings,
        };

        // Validate wordsPerSession
        if (
          typeof updatedSettings.studySessionSettings.wordsPerSession ===
          "number"
        ) {
          updatedSettings.studySessionSettings.wordsPerSession = Math.min(
            Math.max(5, updatedSettings.studySessionSettings.wordsPerSession),
            100
          );
        }

        // Validate timeLimit
        if (
          typeof updatedSettings.studySessionSettings.timeLimit === "number"
        ) {
          updatedSettings.studySessionSettings.timeLimit = Math.max(
            0,
            updatedSettings.studySessionSettings.timeLimit
          );
        }
      }

      return updatedSettings;
    });
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
      setUserProgress({});
    }
  };

  const clearAllData = async () => {
    await db.resetDatabase();
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
      const userWordlists = await db.getUserWordlists();

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
    isLoading: isAppLoading, // Use the calculated loading state
    setIsLoading,
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
