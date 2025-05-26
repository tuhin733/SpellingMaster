import { UserSettings } from "../types";

// Keys for localStorage
const SETTINGS_KEY = "spelling-master-settings";

// Default settings
export const defaultSettings: UserSettings = {
  fontSize: "medium",
  theme: "light",
  enableSound: true,
  studySessionSettings: {
    wordsPerSession: 20,
    timeLimit: 0, // 0 means no time limit
  },
};

/**
 * Load settings from localStorage
 */
export const loadSettings = (): UserSettings => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);

    if (!storedSettings) {
      return { ...defaultSettings };
    }

    const parsedSettings = JSON.parse(storedSettings);

    // Ensure we have all required properties with correct types
    const settings: UserSettings = {
      ...defaultSettings,
    };

    // Copy over non-boolean settings
    if (parsedSettings.fontSize) settings.fontSize = parsedSettings.fontSize;
    if (parsedSettings.theme) settings.theme = parsedSettings.theme;

    // Initialize studySessionSettings with defaults if it doesn't exist
    settings.studySessionSettings = {
      wordsPerSession: 20,
      timeLimit: 0,
    };

    // Handle study session settings if they exist
    if (parsedSettings.studySessionSettings) {
      // Handle wordsPerSession - ensure it's a number between 5 and 100
      if (
        typeof parsedSettings.studySessionSettings.wordsPerSession === "number"
      ) {
        const wordsPerSession =
          parsedSettings.studySessionSettings.wordsPerSession;
        settings.studySessionSettings.wordsPerSession = Math.min(
          Math.max(5, wordsPerSession),
          100
        );
      }

      // Handle timeLimit - ensure it's a non-negative number
      if (typeof parsedSettings.studySessionSettings.timeLimit === "number") {
        const timeLimit = parsedSettings.studySessionSettings.timeLimit;
        settings.studySessionSettings.timeLimit = Math.max(0, timeLimit);
      }
    }

    // Special handling for enableSound - be extremely explicit
    if (parsedSettings.hasOwnProperty("enableSound")) {
      // Check for strict boolean false first
      if (parsedSettings.enableSound === false) {
        settings.enableSound = false;
      }
      // Then check for strict boolean true
      else if (parsedSettings.enableSound === true) {
        settings.enableSound = true;
      }
      // Handle string values that might have been stored
      else if (typeof parsedSettings.enableSound === "string") {
        const strValue = parsedSettings.enableSound.toLowerCase();
        settings.enableSound = !(
          strValue === "false" ||
          strValue === "0" ||
          strValue === ""
        );
      } else {
        // For any other type, use a safe default
        console.warn(
          "LOCAL-STORAGE - enableSound had unexpected value:",
          parsedSettings.enableSound
        );
        settings.enableSound = true;
      }
    }

    return settings;
  } catch (error) {
    console.error("LOCAL-STORAGE - Error loading settings:", error);
    return { ...defaultSettings };
  }
};

/**
 * Save settings to localStorage
 */
export const saveSettings = (settings: UserSettings): void => {
  try {
    // Create a clean copy for storage
    const settingsToSave: UserSettings = {
      ...defaultSettings, // Start with defaults
      ...settings, // Override with provided settings
    };

    // Special handling for enableSound to ensure it's a proper boolean
    if (settings.hasOwnProperty("enableSound")) {
      // Force to strict boolean value
      settingsToSave.enableSound =
        settings.enableSound === false ? false : true;
    }

    // Make sure studySessionSettings is properly preserved even if not passed in settings
    if (!settings.studySessionSettings && settings !== defaultSettings) {
      try {
        const currentSettings = loadSettings();
        if (currentSettings.studySessionSettings) {
          settingsToSave.studySessionSettings = {
            ...defaultSettings.studySessionSettings,
            ...currentSettings.studySessionSettings,
          };
        }
      } catch (e) {
        console.error("Error loading existing study session settings:", e);
      }
    }

    // Explicitly ensure studySessionSettings values are within valid ranges
    if (settingsToSave.studySessionSettings) {
      settingsToSave.studySessionSettings.wordsPerSession = Math.min(
        Math.max(5, settingsToSave.studySessionSettings.wordsPerSession),
        100
      );
      settingsToSave.studySessionSettings.timeLimit = Math.max(
        0,
        settingsToSave.studySessionSettings.timeLimit
      );
    }

    // Save first to ensure data persistence
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
  } catch (error) {
    console.error("LOCAL-STORAGE - Error saving settings:", error);
  }
};

/**
 * Update specific settings
 */
export const updateSettings = (
  newSettings: Partial<UserSettings>
): UserSettings => {
  const currentSettings = loadSettings();

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

  saveSettings(updatedSettings);
  return updatedSettings;
};
