import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  XCircle,
  Search,
  Globe,
  ChevronDown,
  Check,
  Sparkles,
  Plus,
  List,
  AlertCircle,
  Save,
  History,
  Clock,
} from "lucide-react";
import { searchWithAI } from "../utils/aiSearch";
import * as db from "../utils/indexedDb";
import { Wordlist } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../contexts/AppContext";
import styles from "../styles/loader.module.css";
import { useScrollLock } from "../hooks/useScrollLock";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  languages: { id: string; name: string }[];
  wordLists: { [key: string]: string[] };
}

interface AISearchResult {
  word: string;
  confidence: number;
}

interface SearchHistoryItem {
  id: string;
  term: string;
  language: string;
  timestamp: number;
}

type Tab = "search" | "selected";
type SaveMode = "create" | "append";

const LANGUAGE_OPTIONS = [
  { code: "en-US", name: "English" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "es-ES", name: "Spanish" },
  { code: "pt-BR", name: "Portuguese" },
  { code: "hi-IN", name: "Hindi" },
  { code: "ar-SA", name: "Arabic" },
  { code: "ru-RU", name: "Russian" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "tr-TR", name: "Turkish" },
  { code: "ta-IN", name: "Tamil" },
  { code: "vi-VN", name: "Vietnamese" },
  { code: "ur-PK", name: "Urdu" },
  { code: "bn-IN", name: "Bengali" },
];

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  languages,
  wordLists,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(
    languages[0]?.id || ""
  );
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [aiResults, setAiResults] = useState<AISearchResult[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [newWordlistName, setNewWordlistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createProgress, setCreateProgress] = useState(0);
  const [saveMode, setSaveMode] = useState<SaveMode>("create");
  const [selectedWordlist, setSelectedWordlist] = useState<string>("");
  const [isWordlistOpen, setIsWordlistOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const wordlistRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const { refreshWordlists, wordlists } = useApp();

  useScrollLock(isOpen);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const loadSearchHistory = useCallback(async () => {
    try {
      const history = await db.getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  const runSearch = useCallback(
    (term: string, language: string) => {
      const words = wordLists[language] || [];
      const results = words.filter((word) =>
        word.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);

      // If no results found in wordlist, try AI search
      if (results.length === 0) {
        setIsSearching(true);
        setSearchError(null);
        const selectedLang =
          languages.find((lang) => lang.id === language)?.name || language;

        searchWithAI(term, selectedLang)
          .then((results) => {
            setAiResults(results);
            setIsSearching(false);
          })
          .catch((error) => {
            console.error("AI search failed:", error);
            setSearchError("AI search is currently unavailable");
            setIsSearching(false);
          });
      } else {
        setAiResults([]);
      }
    },
    [languages, wordLists]
  );

  const saveSearchToHistory = useCallback(
    async (term: string, language: string) => {
      if (!term.trim()) return;
      try {
        await db.addSearchHistory(term.trim(), language);
        await loadSearchHistory();
      } catch (error) {
        console.error("Failed to save search history:", error);
      }
    },
    [loadSearchHistory]
  );

  useEffect(() => {
    const historySaveTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        saveSearchToHistory(searchTerm, selectedLanguage);
      }
    }, 5000);

    return () => clearTimeout(historySaveTimer);
  }, [searchTerm, selectedLanguage, saveSearchToHistory]);

  useEffect(() => {
    if (isOpen) {
      loadSearchHistory();
    }
  }, [isOpen, loadSearchHistory]);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedLanguage(languages[0]?.id || "");
      setSearchResults([]);
      setAiResults([]);
      setSearchError(null);
      setSelectedWords([]);
      setNewWordlistName("");
      setCreateError(null);
      setCreateProgress(0);
      setSaveMode("create");
      setSelectedWordlist("");
      setIsHistoryOpen(false);
    }
  }, [isOpen, languages]);

  // Simulate progress during creation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isCreating && createProgress < 90) {
      progressInterval = setInterval(() => {
        setCreateProgress((prev) => Math.min(prev + 10, 90));
      }, 300);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isCreating, createProgress]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        runSearch(searchTerm, selectedLanguage);
      } else {
        setSearchResults([]);
        setAiResults([]);
      }
    }, 300); // Debounce search to avoid too many requests

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedLanguage, runSearch]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close wordlist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wordlistRef.current &&
        !wordlistRef.current.contains(event.target as Node)
      ) {
        setIsWordlistOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(event.target as Node)
      ) {
        setIsHistoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const highlightMatch = (word: string) => {
    if (!searchTerm) return word;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return word.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-medium"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleWordSelect = (word: string) => {
    if (!selectedWords.includes(word)) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleWordRemove = (word: string) => {
    setSelectedWords(selectedWords.filter((w) => w !== word));
  };

  const handleSaveWordlist = async () => {
    if (saveMode === "create") {
      if (!newWordlistName.trim()) {
        setCreateError("Please enter a name for your wordlist.");
        return;
      }
    } else {
      if (!selectedWordlist) {
        setCreateError("Please select a wordlist to append to.");
        return;
      }
    }

    if (selectedWords.length === 0) {
      setCreateError("Please select at least one word.");
      return;
    }

    if (!selectedLanguage) {
      setCreateError("Please select a language.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      setCreateProgress(10);

      const selectedLang = languages.find(
        (lang) => lang.id === selectedLanguage
      );
      if (!selectedLang) {
        throw new Error("Selected language not found.");
      }

      if (saveMode === "create") {
        // Create new wordlist
        const langOption = LANGUAGE_OPTIONS.find(
          (opt) => opt.name === selectedLang.name
        );
        const languageCode = langOption ? langOption.code : selectedLang.id;
        const wordlist: Wordlist = {
          id: crypto.randomUUID(),
          title: newWordlistName.trim(),
          name: newWordlistName.trim(),
          language: selectedLang.name,
          languageCode,
          words: selectedWords,
          description: `Custom wordlist created from search results`,
          source: "user",
          timestamp: Date.now(),
          isCustom: true,
        };

        await db.saveWordlist(wordlist);
      } else {
        // Append to existing wordlist
        const existingWordlist = wordlists.find(
          (w) => w.id === selectedWordlist
        );
        if (!existingWordlist) {
          throw new Error("Selected wordlist not found.");
        }

        // Filter out duplicates
        const newWords = selectedWords.filter(
          (word) =>
            !existingWordlist.words.some((w) =>
              typeof w === "string" ? w === word : w.word === word
            )
        );
        if (newWords.length === 0) {
          throw new Error("All selected words already exist in the wordlist.");
        }

        // Convert all words to Word objects for consistency
        const updatedWordlist: Wordlist = {
          ...existingWordlist,
          words: [
            ...existingWordlist.words.map((w) =>
              typeof w === "string" ? { word: w } : w
            ),
            ...newWords.map((word) => ({ word })),
          ],
        };

        await db.saveWordlist(updatedWordlist);
      }

      setCreateProgress(90);

      // Complete the progress bar
      setCreateProgress(100);

      // Wait for success animation to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh wordlists in the app
      await refreshWordlists();

      // Reset form and close modal
      setNewWordlistName("");
      setSelectedWords([]);
      setActiveTab("search");
      onClose();
    } catch (error: unknown) {
      console.error("Save wordlist error:", error);
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to save wordlist. Please try again."
      );
      setCreateProgress(0);
    } finally {
      setIsCreating(false);
    }
  };

  const handleHistoryItemClick = (historyItem: SearchHistoryItem) => {
    setSearchTerm(historyItem.term);
    setSelectedLanguage(historyItem.language);
    saveSearchToHistory(historyItem.term, historyItem.language);
    setIsHistoryOpen(false);
  };

  const handleRemoveHistoryItem = async (
    id: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    try {
      await db.removeSearchHistory(id);
      await loadSearchHistory();
    } catch (error) {
      console.error("Failed to remove search history item:", error);
    }
  };

  const formatHistoryTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl transform transition-all duration-200 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        } flex flex-col`}
        style={{
          height: "600px",
          maxHeight: "80vh",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Global Search
            </h2>
            <span
              className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 rounded  text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 flex items-center gap-1"
              title="AI-powered search"
            >
              <Sparkles className="w-3.5 h-3.5 mr-0.5 text-blue-700 dark:text-blue-300" />
              AI Powered
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XCircle className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "search"
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Search className="w-4 h-4 inline-block mr-2" />
            Search
          </button>
          <button
            onClick={() => setActiveTab("selected")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "selected"
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <List className="w-4 h-4 inline-block mr-2" />
            Selected Words ({selectedWords.length})
          </button>
        </div>

        <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
          {activeTab === "search" ? (
            <>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search words..."
                    className="w-full pl-12 pr-12 py-3 text-sm bg-white text-gray-800 border-2 border-gray-200 rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:ring-blue-800"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {searchTerm ? (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Clear search"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Search history"
                      >
                        <History className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* History Dropdown */}
                  <AnimatePresence>
                    {isHistoryOpen && (
                      <motion.div
                        ref={historyRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 max-h-[300px] overflow-y-auto"
                      >
                        {searchHistory.length > 0 ? (
                          <div className="py-1">
                            {searchHistory.map((historyItem) => (
                              <div
                                key={historyItem.id}
                                onClick={() =>
                                  handleHistoryItemClick(historyItem)
                                }
                                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                      {historyItem.term}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                      <span>
                                        {languages.find(
                                          (lang) =>
                                            lang.id === historyItem.language
                                        )?.name || historyItem.language}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {formatHistoryTime(
                                          historyItem.timestamp
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) =>
                                    handleRemoveHistoryItem(historyItem.id, e)
                                  }
                                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Remove from history"
                                >
                                  <X className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No search history yet</p>
                            <p className="text-xs mt-1">
                              Your recent searches will appear here
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative" ref={languageRef}>
                  <button
                    type="button"
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                    className="w-48 px-4 py-3 text-sm bg-white text-gray-800 border-2 border-gray-200 rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:ring-blue-800 flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      {selectedLanguage ? (
                        <>
                          <span className="mr-2">
                            {
                              languages.find(
                                (lang) => lang.id === selectedLanguage
                              )?.name
                            }
                          </span>
                        </>
                      ) : (
                        <span className="text-secondary-500">
                          Select a language
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isLanguageOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isLanguageOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700 max-h-[200px] overflow-y-auto scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-track]:bg-gray-800/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                      <div className="py-1">
                        {languages.map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => {
                              setSelectedLanguage(lang.id);
                              setIsLanguageOpen(false);
                            }}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors flex items-center justify-between group text-secondary-700 dark:text-secondary-300"
                          >
                            <span>{lang.name}</span>
                            <span>
                              <svg
                                className={`w-3.5 h-3.5 transition-colors
                                  ${
                                    selectedLanguage === lang.id
                                      ? "text-blue-600 dark:text-blue-400 opacity-100"
                                      : "opacity-0 group-hover:opacity-100 group-hover:text-gray-400"
                                  }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <div className={`${styles.base} my-8`}>
                      {Array.from({ length: 15 }, (_, i) => (
                        <div
                          key={i + 1}
                          className={`${styles.circ} ${
                            styles[`circ-${i + 1}`]
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid gap-2">
                    {searchResults.map((word, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group flex items-center justify-between"
                        onClick={() => handleWordSelect(word)}
                      >
                        <div className="text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                          {highlightMatch(word)}
                        </div>
                        <button
                          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWordSelect(word);
                          }}
                        >
                          {selectedWords.includes(word) ? (
                            <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          ) : (
                            <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : aiResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        AI Suggestions
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {aiResults.map((result, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group flex items-center justify-between"
                          onClick={() => handleWordSelect(result.word)}
                        >
                          <div className="text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                            {highlightMatch(result.word)}
                          </div>
                          <button
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWordSelect(result.word);
                            }}
                          >
                            {selectedWords.includes(result.word) ? (
                              <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <XCircle className="w-12 h-12 mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-1">Search Error</h3>
                    <p className="text-sm">{searchError}</p>
                  </div>
                ) : searchTerm ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <Search className="w-12 h-12 mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-1">
                      No matches found
                    </h3>
                    <p className="text-sm">
                      Try different keywords or check another language
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <Globe className="w-12 h-12 mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-1 text-gray-500 dark:text-gray-400">
                      Start searching
                    </h3>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="mb-4 space-y-3">
                {/* Save mode selector */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSaveMode("create")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                      saveMode === "create"
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    Create New
                  </button>
                  <button
                    onClick={() => setSaveMode("append")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                      saveMode === "append"
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    Append to Existing
                  </button>
                </div>

                {/* Input field or wordlist selector with save button */}
                <div className="flex gap-2">
                  {saveMode === "create" ? (
                    <input
                      type="text"
                      value={newWordlistName}
                      onChange={(e) => setNewWordlistName(e.target.value)}
                      placeholder="Enter wordlist name..."
                      className="flex-1 px-4 py-2 text-sm bg-white text-gray-800 border-2 border-gray-200 rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:ring-blue-800"
                    />
                  ) : (
                    <div className="relative flex-1" ref={wordlistRef}>
                      <button
                        type="button"
                        onClick={() => setIsWordlistOpen(!isWordlistOpen)}
                        className="w-full px-4 py-2 text-sm bg-white text-gray-800 border-2 border-gray-200 rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:ring-blue-800 flex items-center justify-between"
                      >
                        <span>
                          {selectedWordlist
                            ? wordlists.find((w) => w.id === selectedWordlist)
                                ?.title
                            : "Select a wordlist"}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isWordlistOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isWordlistOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700 max-h-[200px] overflow-y-auto scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-track]:bg-gray-800/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                          <div className="py-1">
                            {wordlists
                              .filter((w) => w.isCustom)
                              .map((wordlist) => (
                                <button
                                  key={wordlist.id}
                                  onClick={() => {
                                    setSelectedWordlist(wordlist.id);
                                    setIsWordlistOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-sm text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors flex items-center justify-between group text-secondary-700 dark:text-secondary-300`}
                                >
                                  <span>{wordlist.title}</span>
                                  <span>
                                    <svg
                                      className={`w-3.5 h-3.5 transition-colors
                                        ${
                                          selectedWordlist === wordlist.id
                                            ? "text-blue-600 dark:text-blue-400 opacity-100"
                                            : "opacity-0 group-hover:opacity-100 group-hover:text-gray-400"
                                        }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleSaveWordlist}
                    disabled={
                      (saveMode === "create" && !newWordlistName.trim()) ||
                      (saveMode === "append" && !selectedWordlist) ||
                      selectedWords.length === 0 ||
                      isCreating
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600 flex items-center gap-2 whitespace-nowrap"
                  >
                    {isCreating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saveMode === "create" ? (
                      <Plus className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saveMode === "create" ? "Create" : "Append"}
                  </button>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {createError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 bg-red-50 rounded-lg flex items-start dark:bg-red-900/20 overflow-hidden border border-red-100 dark:border-red-800/30 mb-4"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 dark:text-red-400" />
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {createError}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {selectedWords.length > 0 ? (
                  <div className="grid gap-2">
                    {selectedWords.map((word, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-gray-700 dark:text-gray-200">
                          {word}
                        </span>
                        <button
                          onClick={() => handleWordRemove(word)}
                          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <List className="w-12 h-12 mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-1">
                      No words selected
                    </h3>
                    <p className="text-sm">
                      Search and select words to create a new wordlist
                    </p>
                  </div>
                )}
              </div>

              {/* Creation progress circle */}
              <AnimatePresence>
                {isCreating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-4 left-4 flex items-center space-x-2"
                  >
                    <div className="relative w-5 h-5">
                      <svg className="w-5 h-5 transform -rotate-90">
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          strokeWidth="3"
                          className="stroke-secondary-200 dark:stroke-secondary-600"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          strokeWidth="3"
                          strokeDasharray={`${
                            (createProgress / 100) * 50.24
                          } 50.24`}
                          className="stroke-primary-500 dark:stroke-primary-400 transition-all duration-300"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                      {createProgress}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
