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
} from "lucide-react";
import SearchBar from "./SearchBar";
import { searchWithAI } from "../utils/aiSearch";

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
  const languageRef = useRef<HTMLDivElement>(null);

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

  const handleCreateWordlist = () => {
    if (!newWordlistName.trim()) {
      // Show error or handle empty name
      return;
    }

    // Here you would typically call a function to save the wordlist
    // For now, we'll just log it
    console.log("Creating wordlist:", {
      name: newWordlistName,
      language: selectedLanguage,
      words: selectedWords,
    });

    // Reset the form
    setNewWordlistName("");
    setSelectedWords([]);
    setActiveTab("search");
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
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newWordlistName}
                  onChange={(e) => setNewWordlistName(e.target.value)}
                  placeholder="Enter wordlist name..."
                  className="flex-1 px-4 py-2 text-sm bg-white text-gray-800 border-2 border-gray-200 rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:ring-blue-800"
                />
                <button
                  onClick={handleCreateWordlist}
                  disabled={
                    !newWordlistName.trim() || selectedWords.length === 0
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-600 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Create Wordlist
                </button>
              </div>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
