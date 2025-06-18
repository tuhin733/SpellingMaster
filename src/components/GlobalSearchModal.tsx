import React, { useState, useEffect, useRef } from "react";
import { X, XCircle, Search, Globe, ChevronDown, Check } from "lucide-react";
import SearchBar from "./SearchBar";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  languages: { id: string; name: string }[];
  wordLists: { [key: string]: string[] };
}

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
  const [isClosing, setIsClosing] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm) {
      const words = wordLists[selectedLanguage] || [];
      const results = words.filter((word) =>
        word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedLanguage, wordLists]);

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

        <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
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
                          languages.find((lang) => lang.id === selectedLanguage)
                            ?.name
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
            {searchResults.length > 0 ? (
              <div className="grid gap-2">
                {searchResults.map((word, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                      {highlightMatch(word)}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mb-3 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No matches found</h3>
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
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
