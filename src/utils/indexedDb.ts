import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Wordlist } from "../types";
import { tryCatch, ErrorType } from "./errorHandler";

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
}

const DB_NAME = "SpellingMaster";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SpellingMasterDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<SpellingMasterDB>> => {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<SpellingMasterDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Delete old stores if they exist
        Array.from(db.objectStoreNames)
          .filter((name) => name !== "userWordlists")
          .forEach((storeName) => db.deleteObjectStore(storeName));

        // Create object stores if they don't exist
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
