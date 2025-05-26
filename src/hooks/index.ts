import { useState, useEffect } from "react";
import * as db from "../utils/db";
import { Wordlist, UserProgress, UserSettings, LevelResult } from "../types";
import { useLoading } from "./useLoading";

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
 * Hook for loading wordlists
 */
export const useWordlists = (): [Wordlist[], boolean] => {
  const [wordlists, setWordlists] = useState<Wordlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWordlists = async () => {
      try {
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
        const loadedWordlists = await Promise.all(
          wordlistFiles.map(async (file) => {
            try {
              const wordlist = await safeFetchJson(file);
              if (wordlist) {
                // Ensure source property is set for preloaded wordlists
                wordlist.source = "preloaded";
              }
              return wordlist;
            } catch (error) {
              console.error(`Failed to load ${file}:`, error);
              return null;
            }
          })
        );

        // Load user wordlists from IndexedDB
        const userWordlists = await db.getUserWordlists();

        // Combine preloaded and user wordlists
        const allWordlists = [
          ...loadedWordlists.filter(Boolean),
          ...userWordlists,
        ];

        setWordlists(allWordlists);
      } catch (error) {
        console.error("Failed to load wordlists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWordlists();
  }, []);

  return [wordlists, isLoading];
};

/**
 * Hook for managing progress data
 */
export const useProgressData = (): [
  Record<string, UserProgress>,
  (
    language: string,
    level: number,
    results: any[],
    scorePercent?: number
  ) => void,
  () => void,
  (language?: string) => void
] => {
  const [progressData, setProgressData] = useState<
    Record<string, UserProgress>
  >({});

  // Load progress data from IndexedDB
  useEffect(() => {
    const loadProgress = async () => {
      const savedProgress = await db.getAllProgress();
      setProgressData(savedProgress);
    };

    loadProgress();
  }, []);

  // Persist state changes to IndexedDB
  useEffect(() => {
    Object.entries(progressData).forEach(([language, progress]) => {
      db.setProgress(language, progress);
    });
  }, [progressData]);

  const updateProgress = (
    language: string,
    level: number,
    results: any[],
    scorePercent?: number
  ) => {
    setProgressData((prev) => {
      // Implementation depends on what results contains
      // This is a simplified example
      const currentProgress = prev[language] || {
        language,
        completedLevels: [],
        currentLevel: 1,
        totalWords: 0,
        masteredWords: [],
        levelScores: {},
        incorrectWords: {},
      };

      // Extract correct words
      const correctWords = results.filter((r) => r.correct).map((r) => r.word);

      // Extract incorrect words
      const incorrectWords = results
        .filter((r) => !r.correct)
        .map((r) => r.word);

      // Update completion status
      let completedLevels = [...currentProgress.completedLevels];
      if (incorrectWords.length === 0 && !completedLevels.includes(level)) {
        completedLevels.push(level);
        completedLevels.sort((a, b) => a - b);
      } else if (incorrectWords.length > 0 && completedLevels.includes(level)) {
        completedLevels = completedLevels.filter((l) => l !== level);
      }

      const currentLevel = Math.max(...completedLevels, 0) + 1;

      // Update mastered words
      const updatedMasteredWords = Array.from(
        new Set([...currentProgress.masteredWords, ...correctWords])
      );

      // Update level scores
      const levelScores = { ...currentProgress.levelScores };
      if (scorePercent !== undefined) {
        levelScores[level] = scorePercent;
      }

      // Update incorrect words
      const currentIncorrectWords = currentProgress.incorrectWords || {};
      const updatedIncorrectWords = {
        ...currentIncorrectWords,
        [level]: incorrectWords,
      };

      return {
        ...prev,
        [language]: {
          ...currentProgress,
          completedLevels,
          currentLevel,
          totalWords: updatedMasteredWords.length,
          masteredWords: updatedMasteredWords,
          levelScores,
          incorrectWords: updatedIncorrectWords,
        },
      };
    });
  };

  const clearAllProgress = async () => {
    await db.clearAllProgress();
    setProgressData({});
  };

  const clearProgress = async (language?: string) => {
    if (language) {
      await db.deleteProgress(language);
      setProgressData((prev) => {
        const newProgress = { ...prev };
        delete newProgress[language];
        return newProgress;
      });
    } else {
      await db.clearAllProgress();
      setProgressData({});
    }
  };

  return [progressData, updateProgress, clearAllProgress, clearProgress];
};

/**
 * Hook for managing level results
 */
export const useLevelResults = (): [
  LevelResult[],
  (result: LevelResult) => void,
  () => void
] => {
  const [levelResults, setLevelResults] = useState<LevelResult[]>([]);

  useEffect(() => {
    const loadResults = async () => {
      const savedResults = await db.getResults();
      setLevelResults(savedResults);
    };

    loadResults();
  }, []);

  const addLevelResult = async (result: LevelResult) => {
    await db.addResult(result);
    const updatedResults = await db.getResults();
    setLevelResults(updatedResults);
  };

  const clearResults = async () => {
    await db.clearResults();
    setLevelResults([]);
  };

  return [levelResults, addLevelResult, clearResults];
};

/**
 * Hook for managing settings
 */
export const useSettings = (
  initialSettings: UserSettings
): [UserSettings, (settings: Partial<UserSettings>) => void] => {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await db.getSettings();
      setSettings({ ...initialSettings, ...savedSettings });
    };

    loadSettings();
  }, [initialSettings]);

  useEffect(() => {
    db.setSettings(settings);
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return [settings, updateSettings];
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
