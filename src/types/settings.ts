export interface UserSettings {
  enableSound: boolean;
  enableAutoSpeak: boolean;
  fontSize: "small" | "medium" | "large";
  theme: "light" | "dark";
  studySessionSettings: {
    wordsPerSession: number; // Number of words per study session
    timeLimit: number; // Time limit in seconds (0 means no limit)
  };
}
