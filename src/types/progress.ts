export interface UserProgress {
  language: string;
  wordlistId: string;
  completedLevels: number[];
  currentLevel: number;
  masteredWords: string[];
  incorrectWords: {
    [levelId: number]: string[];
  };
  streak: {
    currentStreak: number;
    lastPracticeDate: number;
    longestStreak: number;
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
