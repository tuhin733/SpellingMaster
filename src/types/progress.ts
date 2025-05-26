export interface UserProgress {
  language: string;
  wordlistId: string; // Added to uniquely identify the wordlist
  completedLevels: number[];
  currentLevel: number;
  totalWords: number;
  masteredWords: string[];
  levelScores?: Record<number, number>; // level -> percentage score
  incorrectWords: {
    [levelId: number]: string[];
  };
  streak?: {
    currentStreak: number;
    lastPracticeDate: number; // timestamp
    longestStreak: number;
    achievements?: string[]; // badges earned
  };
}

export interface FlashcardResult {
  word: string;
  correct: boolean;
  userInput?: string;
}

export interface LevelResult {
  language: string;
  level: number;
  score: number;
  total: number;
  results: FlashcardResult[];
  date: number;
}
