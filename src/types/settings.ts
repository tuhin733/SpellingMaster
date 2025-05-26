export interface UserSettings {
  fontSize: "small" | "medium" | "large";
  theme: "light" | "dark";
  enableSound: boolean;
  studySessionSettings: {
    wordsPerSession: number; // Number of words per study session
    timeLimit: number; // Time limit in seconds (0 means no limit)
  };
}
