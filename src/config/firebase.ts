import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Debug: Log the config (remove in production)
console.log("Firebase Config:", {
  apiKey: firebaseConfig.apiKey ? "exists" : "missing",
  authDomain: firebaseConfig.authDomain ? "exists" : "missing",
  projectId: firebaseConfig.projectId ? "exists" : "missing",
});

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn(
      "Multiple tabs open, persistence can only be enabled in one tab at a time."
    );
  } else if (err.code === "unimplemented") {
    console.warn("The current browser does not support offline persistence.");
  }
});

export const analytics = getAnalytics(app);

// Export a function to check online status
export const isOnline = (): boolean => {
  return window.navigator.onLine;
};

// Add online/offline listeners with reconnection logic
let reconnectTimeout: NodeJS.Timeout;

const handleOnline = () => {
  console.log("App is online");
  clearTimeout(reconnectTimeout);
  // Trigger any necessary reconnection logic here
  window.dispatchEvent(new CustomEvent("firebase-reconnected"));
};

const handleOffline = () => {
  console.log("App is offline");
  // Set a reconnection attempt after a delay
  reconnectTimeout = setTimeout(() => {
    if (!isOnline()) {
      console.log("Still offline, will retry when connection is restored");
    }
  }, 5000);
};

window.addEventListener("online", handleOnline);
window.addEventListener("offline", handleOffline);

// Clean up function for the app
export const cleanup = () => {
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  clearTimeout(reconnectTimeout);
};
