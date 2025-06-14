import { db } from "../config/firebase";
import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export interface UserStatistics {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  accuracy: number;
}

export interface UserProgress {
  currentLevel: number;
  completedLevels: number[];
  masteredWords: string[];
  streak: {
    currentStreak: number;
    lastPracticeDate: number;
    longestStreak: number;
  };
}

export interface UserProfile {
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  lastSignInTime: Timestamp;
}

export interface UserData {
  email: string;
  createdAt: Timestamp;
  profile: UserProfile;
  updatedAt: Timestamp;
}

// Create a new user document in Firestore
export const createUserDocument = async (
  userId: string,
  email: string,
  additionalData?: {
    displayName?: string | null;
    photoURL?: string | null;
    provider?: string;
  }
) => {
  const userRef = doc(db, "users", userId);
  const now = Timestamp.now();

  // Check if user document already exists
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const userData = {
      email,
      createdAt: now,
      updatedAt: now,
      profile: {
        displayName: additionalData?.displayName || null,
        photoURL: additionalData?.photoURL || null,
        provider: additionalData?.provider || "password",
        lastSignInTime: now,
      },
    };

    try {
      await setDoc(userRef, userData);
      console.log("User document created successfully");
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  } else {
    // Update the existing user's profile data
    try {
      const currentData = userSnap.data();
      await updateDoc(userRef, {
        updatedAt: now,
        "profile.lastSignInTime": now,
        "profile.displayName":
          additionalData?.displayName || currentData.profile.displayName,
        "profile.photoURL":
          additionalData?.photoURL || currentData.profile.photoURL,
      });
      console.log("User document updated successfully");
    } catch (error) {
      console.error("Error updating user document:", error);
      throw error;
    }
  }
};

// Get user data
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};
