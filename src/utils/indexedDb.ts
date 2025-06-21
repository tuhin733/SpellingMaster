import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Wordlist } from "../types";
import { tryCatch, ErrorType } from "./errorHandler";

interface SearchHistoryItem {
  id: string;
  term: string;
  language: string;
  timestamp: number;
}

interface SpellingMasterDB extends DBSchema {
  userWordlists: {
    key: string;
    value: Wordlist;
    indexes: { "by-timestamp": number };
  };
  progress: {
    key: string;
    value: any;
    indexes: { "by-timestamp": number };
  };
  settings: {
    key: string;
    value: any;
    indexes: { "by-timestamp": number };
  };
  statistics: {
    key: string;
    value: any;
    indexes: { "by-timestamp": number };
  };
  searchHistory: {
    key: string;
    value: SearchHistoryItem;
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "SpellingMaster";
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<SpellingMasterDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<SpellingMasterDB>> => {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<SpellingMasterDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Handle version upgrades
        if (oldVersion < 1) {
          // Create initial stores
          if (!db.objectStoreNames.contains("userWordlists")) {
            const store = db.createObjectStore("userWordlists", {
              keyPath: "id",
            });
            store.createIndex("by-timestamp", "timestamp");
          }
          if (!db.objectStoreNames.contains("progress")) {
            db.createObjectStore("progress", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("statistics")) {
            db.createObjectStore("statistics", { keyPath: "id" });
          }
        }

        if (oldVersion < 2) {
          // Add searchHistory store in version 2
          if (!db.objectStoreNames.contains("searchHistory")) {
            const store = db.createObjectStore("searchHistory", {
              keyPath: "id",
            });
            store.createIndex("by-timestamp", "timestamp");
          }
        }
      },
    });
    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
};

// Wordlist operations
export const saveWordlist = async (wordlist: Wordlist): Promise<void> => {
  const db = await initDB();
  await db.put("userWordlists", wordlist);
};

export const getWordlist = async (
  id: string
): Promise<Wordlist | undefined> => {
  const db = await initDB();
  return db.get("userWordlists", id);
};

export const getAllWordlists = async (): Promise<Wordlist[]> => {
  const db = await initDB();
  return db.getAllFromIndex("userWordlists", "by-timestamp");
};

export const deleteWordlist = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete("userWordlists", id);
};

export const clearAllWordlists = async (): Promise<void> => {
  const db = await initDB();
  await db.clear("userWordlists");
};

export const clearAllUserData = async (): Promise<void> => {
  const db = await initDB();
  // Clear all object stores
  await db.clear("userWordlists");
  await db.clear("progress");
  await db.clear("settings");
  await db.clear("statistics");
  await db.clear("searchHistory");
};

// Search History operations
export const addSearchHistory = async (
  term: string,
  language: string
): Promise<void> => {
  const db = await initDB();
  const historyItem: SearchHistoryItem = {
    id: crypto.randomUUID(),
    term: term.trim(),
    language,
    timestamp: Date.now(),
  };

  // Check if this exact search already exists
  const existing = await db.getAllFromIndex("searchHistory", "by-timestamp");
  const existingItem = existing.find(
    (item) =>
      item.term === historyItem.term && item.language === historyItem.language
  );

  if (existingItem) {
    // Update timestamp of existing item
    await db.put("searchHistory", {
      ...existingItem,
      timestamp: Date.now(),
    });
  } else {
    // Add new item
    await db.put("searchHistory", historyItem);
  }

  // Keep only the 10 most recent searches
  const allHistory = await db.getAllFromIndex("searchHistory", "by-timestamp");
  if (allHistory.length > 10) {
    const toDelete = allHistory.slice(10);
    for (const item of toDelete) {
      await db.delete("searchHistory", item.id);
    }
  }
};

export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  const db = await initDB();
  const history = await db.getAllFromIndex("searchHistory", "by-timestamp");
  return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
};

export const removeSearchHistory = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete("searchHistory", id);
};

export const clearSearchHistory = async (): Promise<void> => {
  const db = await initDB();
  await db.clear("searchHistory");
};

// Helper function to delete IndexedDB
export async function deleteDB(name: string): Promise<void> {
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
    };
  });
}
