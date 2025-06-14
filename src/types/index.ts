// Re-export all types from the subdirectories
export * from "./wordlists";
export * from "./progress";
export * from "./settings";

export interface UserStatistics {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  accuracy: number;
  streaks: {
    currentStreak: number;
    bestStreak: number;
    lastPracticeDate: number;
  };
  languageStats: {
    [language: string]: {
      totalWords: number;
      correctWords: number;
      incorrectWords: number;
      accuracy: number;
      levels: {
        [level: number]: {
          attempts: number;
          bestScore: number;
          averageScore: number;
          lastAttemptDate: number;
        };
      };
    };
  };
  practiceHistory: {
    daily: {
      [date: string]: {
        totalWords: number;
        correctWords: number;
        languages: string[];
      };
    };
    weekly: {
      [weekNumber: string]: {
        totalWords: number;
        correctWords: number;
        languages: string[];
      };
    };
    monthly: {
      [monthNumber: string]: {
        totalWords: number;
        correctWords: number;
        languages: string[];
      };
    };
  };
  achievements: Array<{
    id: string;
    type: "streak" | "accuracy" | "words" | "language";
    title: string;
    description: string;
    earnedAt: number;
    icon?: string;
  }>;
  lastUpdated: number;
}

export interface UserSettings {
  id?: string;
  enableSound: boolean;
  enableAutoSpeak: boolean;
  enableHints: boolean;
  enableTimer: boolean;
  fontSize: "small" | "medium" | "large";
  theme: "light" | "dark";
  studySessionSettings: {
    wordsPerSession: number;
    timeLimit: number;
  };
  updatedAt?: {
    toMillis: () => number;
  };
}

export interface UserProgress {
  language: string;
  completedLevels: number[];
  currentLevel: number;
  totalWords: number;
  masteredWords: string[];
  incorrectWords: Record<number, string[]>;
  streak?: {
    currentStreak: number;
    lastPracticeDate: number;
    longestStreak: number;
    achievements: string[];
  };
}
