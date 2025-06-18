import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import SearchBar from "./SearchBar";
import { searchWithAI } from "../utils/aiSearch";
import * as db from "../utils/indexedDb";
import { Wordlist } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../contexts/AppContext";

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

type Tab = "search" | "selected";
type SaveMode = "create" | "append";

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
  const languageRef = useRef<HTMLDivElement>(null);
  const wordlistRef = useRef<HTMLDivElement>(null);
  const { refreshWordlists, wordlists } = useApp();

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
    if (searchTerm) {
      const words = wordLists[selectedLanguage] || [];
      const results = words.filter((word) =>
        word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);

      // If no results found in wordlist, try AI search
      if (results.length === 0) {
        setIsSearching(true);
        setSearchError(null);
        const selectedLang =
          languages.find((lang) => lang.id === selectedLanguage)?.name ||
          selectedLanguage;

        searchWithAI(searchTerm, selectedLang)
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
    } else {
      setSearchResults([]);
      setAiResults([]);
    }
  }, [searchTerm, selectedLanguage, wordLists, languages]);

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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

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
        const wordlist: Wordlist = {
          id: crypto.randomUUID(),
          title: newWordlistName.trim(),
          name: newWordlistName.trim(),
          language: selectedLang.name,
          languageCode: selectedLang.id,
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
    } catch (error: any) {
      console.error("Save wordlist error:", error);
      setCreateError(
        error.message || "Failed to save wordlist. Please try again."
      );
      setCreateProgress(0);
    } finally {
      setIsCreating(false);
    }
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
            <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Global Search
            </h2>
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
                <div className="flex-1">
                  <SearchBar
                    onSearch={setSearchTerm}
                    placeholder="Search words..."
                    className="w-full"
                  />
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
                            className="w-full px-4 py-2 text-sm text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors flex items-center justify-between text-secondary-700 dark:text-secondary-300"
                          >
                            <span>{lang.name}</span>
                            {selectedLanguage === lang.id && (
                              <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            )}
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mb-3" />
                    <h3 className="text-lg font-medium mb-1">
                      Searching with AI...
                    </h3>
                    <p className="text-sm">This may take a few seconds</p>
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
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors flex items-center justify-between text-secondary-700 dark:text-secondary-300"
                                >
                                  <span>{wordlist.title}</span>
                                  {selectedWordlist === wordlist.id && (
                                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  )}
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
