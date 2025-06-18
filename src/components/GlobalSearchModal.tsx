import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import SearchBar from './SearchBar';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]?.id || '');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const words = wordLists[selectedLanguage] || [];
      const results = words.filter(word => 
        word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedLanguage, wordLists]);

  const highlightMatch = (word: string) => {
    if (!searchTerm) return word;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return word.split(regex).map((part, i) => 
      regex.test(part) ? 
        <span key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</span> : 
        part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Global Search</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <SearchBar
                onSearch={setSearchTerm}
                placeholder="Search words..."
                className="w-full"
              />
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="grid gap-2">
                {searchResults.map((word, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {highlightMatch(word)}
                  </div>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No matches found
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal; 