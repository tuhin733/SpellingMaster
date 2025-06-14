import { useState, useEffect } from "react";
import * as db from "../utils/indexedDb";
import * as firebaseDb from "../utils/firebaseDb";
import { useAuth } from "../contexts/AuthContext";
import {
  Wordlist,
  UserProgress,
  UserSettings,
  LevelResult,
  UserStatistics,
} from "../types";
import { useLoading } from "./useLoading";
import { addToQueue, retryOperation } from "../utils/operationQueue";
import { isOnline } from "../config/firebase";

/**
 * Shared hook for loading data from IndexedDB
 */
export const useDbData = <T>(
  fetchData: () => Promise<T>,
  defaultValue: T
): [T, boolean] => {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchData();
        setData(result || defaultValue);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return [data, isLoading];
};

/**
 * Hook for managing wordlists (using IndexedDB)
 */
export const useWordlists = () => {
  const [wordlists, setWordlists] = useState<Wordlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWordlists = async () => {
      try {
        setIsLoading(true);

        // Load preloaded wordlists
        const wordlistFiles = [
          "/wordlists/english.json",
          "/wordlists/bengali.json",
          "/wordlists/spanish.json",
          "/wordlists/french.json",
          "/wordlists/german.json",
          "/wordlists/portuguese.json",
          "/wordlists/hindi.json",
          "/wordlists/arabic.json",
          "/wordlists/russian.json",
          "/wordlists/chinese.json",
          "/wordlists/japanese.json",
          "/wordlists/korean.json",
          "/wordlists/turkish.json",
          "/wordlists/tamil.json",
          "/wordlists/vietnamese.json",
          "/wordlists/urdu.json",
        ];

        // Load preloaded wordlists
        const preloadedWordlists = await Promise.all(
          wordlistFiles.map(async (file) => {
            try {
              const response = await fetch(file);
              if (!response.ok) {
                console.warn(`Failed to load ${file}: ${response.statusText}`);
                return null;
              }
              const wordlist = await response.json();
              if (wordlist) {
                wordlist.source = "preloaded";
              }
              return wordlist;
            } catch (error) {
              console.warn(`Failed to load ${file}:`, error);
              return null;
            }
          })
        );

        // Load user wordlists from IndexedDB
        const userWordlists = await db.getAllWordlists();

        // Combine preloaded and user wordlists, filter out nulls
        const allWordlists = [
          ...preloadedWordlists.filter(Boolean),
          ...userWordlists,
        ];

        // Ensure we have at least the essential wordlists
        if (allWordlists.length === 0) {
          console.warn("No wordlists loaded, using fallback data");
          // Add a basic English wordlist as fallback
          allWordlists.push({
            id: "english-basic",
            language: "English",
            languageCode: "en",
            name: "Basic English",
            words: [
              { word: "hello", definition: "A greeting" },
              { word: "world", definition: "The earth and all life upon it" },
            ],
            source: "preloaded" as const,
            timestamp: Date.now(),
          });
        }

        setWordlists(allWordlists);
      } catch (error) {
        console.error("Failed to load wordlists:", error);
        // Set a minimal fallback wordlist
        setWordlists([
          {
            id: "english-basic",
            language: "English",
            languageCode: "en",
            name: "Basic English",
            words: [
              { word: "hello", definition: "A greeting" },
              { word: "world", definition: "The earth and all life upon it" },
            ],
            source: "preloaded" as const,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWordlists();
  }, []);

  const saveWordlist = async (wordlist: Wordlist) => {
    await db.saveWordlist(wordlist);
    setWordlists(await db.getAllWordlists());
  };

  const deleteWordlist = async (id: string) => {
    await db.deleteWordlist(id);
    setWordlists(await db.getAllWordlists());
  };

  return [wordlists, isLoading] as const;
};

interface HookLoadingState {
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing progress data (using Firebase)
 */
export const useProgressData = () => {
  const { currentUser } = useAuth();
  const [progressData, setProgressData] = useState<
    Record<string, UserProgress>
  >({});
  const [state, setState] = useState<HookLoadingState>({
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const savedProgress = await retryOperation(() =>
          firebaseDb.getAllProgress(currentUser.uid)
        );
        setProgressData(savedProgress);
      } catch (error) {
        console.error("Failed to load progress:", error);
        setState((prev) => ({ ...prev, error: error as Error }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadProgress();
  }, [currentUser]);

  const updateProgress = async (language: string, progress: UserProgress) => {
    if (!currentUser) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      if (isOnline()) {
        await retryOperation(() =>
          firebaseDb.setProgress(currentUser.uid, language, progress)
        );
        const allProgress = await retryOperation(() =>
          firebaseDb.getAllProgress(currentUser.uid)
        );
        setProgressData(allProgress);
      } else {
        // Queue the operation for when we're back online
        addToQueue({
          type: "progress",
          userId: currentUser.uid,
          data: { language, progress },
        });
        // Update local state immediately for better UX
        setProgressData((prev) => ({
          ...prev,
          [language]: progress,
        }));
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return { progressData, updateProgress, ...state };
};

/**
 * Hook for managing user settings (using Firebase)
 */
export const useSettings = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings | undefined>();
  const [state, setState] = useState<HookLoadingState>({
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const savedSettings = await retryOperation(() =>
          firebaseDb.getSettings(currentUser.uid)
        );
        setSettings(savedSettings);
      } catch (error) {
        console.error("Failed to load settings:", error);
        setState((prev) => ({ ...prev, error: error as Error }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadSettings();
  }, [currentUser]);

  const updateSettings = async (newSettings: UserSettings) => {
    if (!currentUser) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      if (isOnline()) {
        await retryOperation(() =>
          firebaseDb.setSettings(currentUser.uid, newSettings)
        );
      } else {
        addToQueue({
          type: "settings",
          userId: currentUser.uid,
          data: newSettings,
        });
      }
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return { settings, updateSettings, ...state };
};

/**
 * Hook for managing user statistics (using Firebase)
 */
export const useStatistics = () => {
  const { currentUser } = useAuth();
  const [statistics, setStatistics] = useState<UserStatistics | undefined>();
  const [state, setState] = useState<HookLoadingState>({
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const loadStatistics = async () => {
      if (!currentUser) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const savedStats = await retryOperation(() =>
          firebaseDb.getStatistics(currentUser.uid)
        );
        setStatistics(savedStats);
      } catch (error) {
        console.error("Failed to load statistics:", error);
        setState((prev) => ({ ...prev, error: error as Error }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadStatistics();
  }, [currentUser]);

  const updateStatistics = async (stats: Partial<UserStatistics>) => {
    if (!currentUser) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      if (isOnline()) {
        await retryOperation(() =>
          firebaseDb.updateStatistics(currentUser.uid, stats)
        );
        const updatedStats = await retryOperation(() =>
          firebaseDb.getStatistics(currentUser.uid)
        );
        setStatistics(updatedStats);
      } else {
        addToQueue({
          type: "statistics",
          userId: currentUser.uid,
          data: stats,
        });
        // Update local state optimistically
        setStatistics((prev) =>
          prev
            ? {
                ...prev,
                ...stats,
              }
            : undefined
        );
      }
    } catch (error) {
      console.error("Failed to update statistics:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return { statistics, updateStatistics, ...state };
};

/**
 * Hook for managing level results (using Firebase)
 */
export const useResults = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<LevelResult[]>([]);
  const [state, setState] = useState<HookLoadingState>({
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const loadResults = async () => {
      if (!currentUser) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const savedResults = await retryOperation(() =>
          firebaseDb.getResults(currentUser.uid)
        );
        setResults(savedResults);
      } catch (error) {
        console.error("Failed to load results:", error);
        setState((prev) => ({ ...prev, error: error as Error }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadResults();
  }, [currentUser]);

  const addResult = async (result: LevelResult) => {
    if (!currentUser) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      if (isOnline()) {
        await retryOperation(() =>
          firebaseDb.addResult(currentUser.uid, result)
        );
        const updatedResults = await retryOperation(() =>
          firebaseDb.getResults(currentUser.uid)
        );
        setResults(updatedResults);
      } else {
        // Queue the operation and update local state optimistically
        addToQueue({
          type: "results",
          userId: currentUser.uid,
          data: result,
        });
        setResults((prev) => [...prev, result]);
      }
    } catch (error) {
      console.error("Failed to add result:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const clearResults = async () => {
    if (!currentUser) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await retryOperation(() => firebaseDb.clearResults(currentUser.uid));
      setResults([]);
    } catch (error) {
      console.error("Failed to clear results:", error);
      setState((prev) => ({ ...prev, error: error as Error }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return { results, addResult, clearResults, ...state };
};

/**
 * Helper function to safely fetch JSON data
 */
const safeFetchJson = async (url: string): Promise<any> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Failed to load ${url}:`, error);
    return null;
  }
};

// Re-export useLoading
export { useLoading };
