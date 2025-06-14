export interface Word {
  word: string;
  definition?: string;
}

export interface Wordlist {
  id: string;
  language: string;
  languageCode: string;
  name: string;
  description?: string;
  words: string[] | Word[];
  source: "preloaded" | "user";
  timestamp?: number;
  isCustom?: boolean;
  title?: string;
}
