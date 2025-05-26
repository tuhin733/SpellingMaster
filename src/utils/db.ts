import { openDB, DBSchema, IDBPDatabase } from "idb";
import { UserProgress, UserSettings, LevelResult, Wordlist } from "../types";
import { tryCatch, ErrorType, handleDatabaseError } from "./errorHandler";

// A level is completed when all words are answered correctly
// This is purely informational now as the app uses the completedLevels array for level completion status
export const UNLOCK_THRESHOLD = 100;

interface SpellingMasterDB extends DBSchema {
  progress: {
    key: string;
    value: UserProgress;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  results: {
    key: number;
    value: LevelResult;
    indexes: { "by-date": number };
  };
  userWordlists: {
    key: string;
    value: Wordlist;
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "spelling-master-db";
const DB_VERSION = 3; // Increased version for better data handling

let db: IDBPDatabase<SpellingMasterDB> | null = null;

/**
 * Ensures a value is a proper boolean
 */
const ensureBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (
    value === "false" ||
    value === 0 ||
    value === "0" ||
    value === "" ||
    value === null ||
    value === undefined
  )
    return false;
  return true;
};

export const initDB = async () => {
  if (db) return db;

  try {
    db = await openDB<SpellingMasterDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress");
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
        if (!db.objectStoreNames.contains("results")) {
          const store = db.createObjectStore("results", {
            keyPath: "date",
            autoIncrement: true,
          });
          store.createIndex("by-date", "date");
        }

        // Add new userWordlists store in version 2
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains("userWordlists")) {
            const store = db.createObjectStore("userWordlists", {
              keyPath: "id",
            });
            store.createIndex("by-timestamp", "timestamp");
          }
        }

        // Fix boolean values in version 3
        if (oldVersion < 3) {
          // Fix settings if they exist
          const fixSettings = async () => {
            try {
              const transaction = db.transaction("settings", "readwrite");
              const store = transaction.objectStore("settings");
              const settings = await store.get("user-settings");

              if (settings) {
                settings.enableSound = ensureBoolean(settings.enableSound);
                store.put(settings, "user-settings");
              }
            } catch (error) {
              console.warn("Migration of settings failed:", error);
              // Continue anyway, as this is just a fix attempt
            }
          };

          // Schedule this to run but don't block the upgrade process
          setTimeout(fixSettings, 0);
        }
      },
      terminated() {
        console.warn("Database connection was terminated unexpectedly");
        db = null;
      },
    });

    return db;
  } catch (error) {
    const dbError = handleDatabaseError(error);
    console.error("Failed to initialize database:", dbError);
    throw new Error(`Database initialization failed: ${dbError.message}`);
  }
};

// Progress operations
export const getProgress = async (
  key: string
): Promise<UserProgress | undefined> => {
  const result = await tryCatch(async () => {
    const db = await initDB();
    const progress = await db.get("progress", key);
    if (progress === null) return undefined;
    return progress;
  }, ErrorType.DATABASE);

  return result.data ?? undefined;
};

export const getAllProgress = async (): Promise<
  Record<string, UserProgress>
> => {
  const result = await tryCatch(async () => {
    const db = await initDB();
    const allProgress = await db.getAll("progress");

    // Convert array to object using the wordlistId or language as key
    return allProgress.reduce((acc, progress) => {
      const key = progress.wordlistId || progress.language;
      acc[key] = progress;
      return acc;
    }, {} as Record<string, UserProgress>);
  }, ErrorType.DATABASE);

  return result.data || {};
};

export const setProgress = async (
  key: string,
  progress: UserProgress
): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    await db.put("progress", progress, key);
  }, ErrorType.DATABASE);
};

export const deleteProgress = async (key: string): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    await db.delete("progress", key);
  }, ErrorType.DATABASE);
};

export const clearAllProgress = async (): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    return await db.clear("progress");
  }, ErrorType.DATABASE);
};

// Settings operations
export const getSettings = async (): Promise<UserSettings | undefined> => {
  const result = await tryCatch(async () => {
    const db = await initDB();
    const settings = await db.get("settings", "user-settings");

    if (settings) {
      // Ensure enableSound is a proper boolean
      settings.enableSound = ensureBoolean(settings.enableSound);
    }

    return settings;
  }, ErrorType.DATABASE);

  return result.data ?? undefined;
};

export const setSettings = async (settings: UserSettings): Promise<void> => {
  // Create a clean copy of settings with proper boolean values
  const settingsToStore = {
    ...settings,
    enableSound: ensureBoolean(settings.enableSound),
  };

  await tryCatch(async () => {
    const db = await initDB();
    await db.put("settings", settingsToStore, "user-settings");
  }, ErrorType.DATABASE);
};

export const clearSettings = async (): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    return await db.clear("settings");
  }, ErrorType.DATABASE);
};

// Results operations
export const addResult = async (result: LevelResult): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    return await db.add("results", result);
  }, ErrorType.DATABASE);
};

export const getResults = async (limit = 100): Promise<LevelResult[]> => {
  const result = await tryCatch(async () => {
    const db = await initDB();
    const results = await db.getAllFromIndex("results", "by-date", null, limit);
    return results.reverse();
  }, ErrorType.DATABASE);

  return result.data || [];
};

export const clearResults = async (): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    return await db.clear("results");
  }, ErrorType.DATABASE);
};

// User Wordlists Functions
export const getUserWordlists = async (): Promise<Wordlist[]> => {
  const result = await tryCatch(async () => {
    const db = await initDB();
    const wordlists = await db.getAll("userWordlists");
    return wordlists;
  }, ErrorType.DATABASE);

  return result.data || [];
};

export const addUserWordlist = async (wordlist: Wordlist): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    await db.put("userWordlists", wordlist);
  }, ErrorType.DATABASE);
};

export const getUserWordlist = async (
  id: string
): Promise<Wordlist | undefined> => {
  const result = await tryCatch(async () => {
    const db = await initDB();
    return await db.get("userWordlists", id);
  }, ErrorType.DATABASE);

  // result.data can be Wordlist or null, convert null to undefined
  return result.data ?? undefined;
};

export const deleteUserWordlist = async (id: string): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    return await db.delete("userWordlists", id);
  }, ErrorType.DATABASE);
};

export const clearUserWordlists = async (): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    return await db.clear("userWordlists");
  }, ErrorType.DATABASE);
};

// Update clearAllData to include userWordlists
export const clearAllData = async (): Promise<void> => {
  await tryCatch(async () => {
    const db = await initDB();
    await Promise.all([
      db.clear("progress"),
      db.clear("settings"),
      db.clear("results"),
      db.clear("userWordlists"),
    ]);
  }, ErrorType.DATABASE);
};

// Update resetDatabase function
export const resetDatabase = async (): Promise<void> => {
  try {
    // Close any open connection
    if (db) {
      db.close();
      db = null;
    }

    // Delete the entire database
    await deleteDB(DB_NAME);

    // Recreate the database
    db = await initDB();
  } catch (error) {
    console.error("Failed to reset database:", error);
  }
};

// Helper function to delete IndexedDB
async function deleteDB(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`Could not delete database "${name}"`, request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn(`Database "${name}" deletion was blocked`);
      // This event is triggered if the database is still open in another tab
    };
  });
}
