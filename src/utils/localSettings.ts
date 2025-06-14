import { UserSettings } from "../types";
import * as firebaseDb from "./firebaseDb";
import { isOnline } from "../config/firebase";

// Keys for localStorage
const SETTINGS_KEY = "spelling-master-settings";

// Default settings
export const defaultSettings: UserSettings = {
  fontSize: "medium",
  theme: "light",
  enableSound: true,
  enableAutoSpeak: false,
  enableHints: false,
  enableTimer: false,
  studySessionSettings: {
    wordsPerSession: 20,
    timeLimit: 0, // 0 means no time limit
  },
};

/**
 * Load settings from storage (Firebase if authenticated, localStorage as fallback)
 */
export const loadSettings = async (userId?: string): Promise<UserSettings> => {
  try {
    let settings = defaultSettings;
    let needsSync = false;

    // Try to load from localStorage first
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        settings = {
          ...defaultSettings,
          ...parsedSettings,
        };
      } catch (error) {
        console.error("Failed to parse settings from localStorage:", error);
      }
    }

    // If user is authenticated and online, sync with Firebase
    if (userId && isOnline()) {
      try {
        const firebaseSettings = await firebaseDb.getSettings(userId);
        if (firebaseSettings) {
          // Compare timestamps to determine which settings are newer
          const localTimestamp =
            typeof settings.updatedAt === "object" &&
            settings.updatedAt?.toMillis
              ? settings.updatedAt.toMillis()
              : 0;
          const firebaseTimestamp =
            typeof firebaseSettings.updatedAt === "object" &&
            firebaseSettings.updatedAt?.toMillis
              ? firebaseSettings.updatedAt.toMillis()
              : 0;

          if (firebaseTimestamp > localTimestamp) {
            // Firebase has newer settings
            settings = {
              ...defaultSettings,
              ...firebaseSettings,
            };
            // Update localStorage with Firebase settings
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
          } else if (localTimestamp > firebaseTimestamp) {
            // Local settings are newer, need to sync to Firebase
            needsSync = true;
          }
        } else if (Object.keys(settings).length > 0) {
          // No Firebase settings but we have local settings
          needsSync = true;
        }

        // Sync local settings to Firebase if needed
        if (needsSync) {
          await firebaseDb.setSettings(userId, settings);
        }
      } catch (error) {
        console.error("Failed to sync settings with Firebase:", error);
      }
    }

    return settings;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return defaultSettings;
  }
};

// Add a function to sync settings when coming back online
export const syncSettingsOnReconnect = async (
  userId: string
): Promise<void> => {
  if (!userId || !isOnline()) return;

  try {
    const settings = await loadSettings(userId);
    await firebaseDb.setSettings(userId, settings);
  } catch (error) {
    console.error("Failed to sync settings on reconnect:", error);
  }
};

/**
 * Save settings to storage (Firebase if authenticated, localStorage as fallback)
 */
export const saveSettings = async (
  newSettings: Partial<UserSettings>,
  userId?: string
): Promise<void> => {
  try {
    // Create a clean copy for storage with all required properties
    const settingsToSave = {
      // Required boolean properties with proper defaults
      enableSound: defaultSettings.enableSound,
      enableAutoSpeak: defaultSettings.enableAutoSpeak,
      enableHints: defaultSettings.enableHints,
      enableTimer: defaultSettings.enableTimer,
      fontSize: defaultSettings.fontSize,
      theme: defaultSettings.theme,
      studySessionSettings: {
        ...defaultSettings.studySessionSettings,
      },
    } as const;

    // Update with new settings if they are valid
    const updatedSettings: UserSettings = {
      enableSound:
        typeof newSettings.enableSound === "boolean"
          ? newSettings.enableSound
          : settingsToSave.enableSound,
      enableAutoSpeak:
        typeof newSettings.enableAutoSpeak === "boolean"
          ? newSettings.enableAutoSpeak
          : settingsToSave.enableAutoSpeak,
      enableHints:
        typeof newSettings.enableHints === "boolean"
          ? newSettings.enableHints
          : settingsToSave.enableHints,
      enableTimer:
        typeof newSettings.enableTimer === "boolean"
          ? newSettings.enableTimer
          : settingsToSave.enableTimer,
      fontSize:
        newSettings.fontSize &&
        ["small", "medium", "large"].includes(newSettings.fontSize)
          ? (newSettings.fontSize as "small" | "medium" | "large")
          : settingsToSave.fontSize,
      theme:
        newSettings.theme && ["light", "dark"].includes(newSettings.theme)
          ? (newSettings.theme as "light" | "dark")
          : settingsToSave.theme,
      studySessionSettings: {
        wordsPerSession:
          typeof newSettings.studySessionSettings?.wordsPerSession === "number"
            ? Math.min(
                Math.max(5, newSettings.studySessionSettings.wordsPerSession),
                100
              )
            : settingsToSave.studySessionSettings.wordsPerSession,
        timeLimit:
          typeof newSettings.studySessionSettings?.timeLimit === "number"
            ? Math.max(0, newSettings.studySessionSettings.timeLimit)
            : settingsToSave.studySessionSettings.timeLimit,
      },
    };

    // If user is authenticated, save to Firebase
    if (userId) {
      try {
        await firebaseDb.setSettings(userId, updatedSettings);
      } catch (error) {
        console.error("Failed to save settings to Firebase:", error);
        // Fall back to localStorage if Firebase fails
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      }
    } else {
      // Save to localStorage if user is not authenticated
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    }
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

/**
 * Clear settings from storage
 */
export const clearSettings = async (userId?: string): Promise<void> => {
  try {
    if (userId) {
      try {
        await firebaseDb.clearAllData(userId);
      } catch (error) {
        console.error("Failed to clear settings from Firebase:", error);
      }
    }
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("Failed to clear settings:", error);
  }
};

/**
 * Update specific settings
 */
export const updateSettings = async (
  newSettings: Partial<UserSettings>
): Promise<UserSettings> => {
  const currentSettings = await loadSettings();

  // Special handling for enableSound
  let enableSound = currentSettings.enableSound;

  if (newSettings.hasOwnProperty("enableSound")) {
    // Force strict boolean values
    enableSound = newSettings.enableSound === false ? false : true;
  }

  const updatedSettings: UserSettings = {
    ...currentSettings,
    ...newSettings,
    enableSound,
  };

  await saveSettings(updatedSettings);
  return updatedSettings;
};
