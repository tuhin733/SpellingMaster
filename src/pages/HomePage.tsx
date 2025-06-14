import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import Header from "../components/Header";
import SearchBar, { FilterOption } from "../components/SearchBar";
import LanguageCard from "../components/LanguageCard";
import { Book, Search, Sparkles } from "lucide-react";
import { UploadButton, UploadModal } from "../components";
import { Wordlist } from "../types";
import Spinner from "../components/Spinner";
import { useAuth } from "../contexts/AuthContext";

const HomePage: React.FC = () => {
  const { wordlists, isLoading, refreshWordlists } = useApp();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    // Set page as ready once we have either wordlists or confirmed we're not loading
    if (wordlists.length > 0 || !isLoading) {
      setPageReady(true);
    }
  }, [wordlists, isLoading]);

  const filterOptions: FilterOption[] = [
    { label: "All Languages", value: "all" },
    { label: "Recently Added", value: "recent" },
    { label: "Most Words", value: "most-words" },
    { label: "Least Words", value: "least-words" },
    { label: "Custom Wordlists", value: "custom" },
  ];

  const filteredWordlists = wordlists
    .filter((wordlist) => {
      if (selectedFilter === "custom" && wordlist.source !== "user") {
        return false;
      }
      return wordlist.language.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (selectedFilter) {
        case "recent":
          return (b.timestamp || 0) - (a.timestamp || 0);
        case "most-words":
          return b.words.length - a.words.length;
        case "least-words":
          return a.words.length - b.words.length;
        default:
          return 0;
      }
    });

  const handleUploadSuccess = async (wordlist: Wordlist) => {
    try {
      await refreshWordlists();
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Error refreshing wordlists:", error);
      setIsUploadModalOpen(false);
    }
  };

  if (!pageReady || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-secondary-900 dark:to-secondary-950">
        <Header title="Spelling Master" />
        <div className="flex items-center justify-center min-h-[60vh] pt-24 sm:pt-28">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col transition-colors duration-300 dark:from-secondary-900 dark:to-secondary-950">
      <Header title="Spelling Master" />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl pt-24 sm:pt-28">
        {/* Hero Section - More compact */}
        <div className="mb-5 sm:mb-7 text-center sm:text-left relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-50 to-blue-50 p-4 sm:p-5 shadow-sm border border-primary-100 dark:bg-gradient-to-r dark:from-primary-900/20 dark:to-blue-900/20 dark:border-primary-800/30">
          <div className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-2 sm:mb-2.5 dark:bg-primary-900/40 dark:text-primary-300">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
            <span>Master Your Language Skills</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-900 mb-2 sm:mb-2.5 tracking-tight dark:text-secondary-50">
            Welcome
            {currentUser?.displayName
              ? `, ${currentUser.displayName.split(" ")[0]}`
              : currentUser?.email
              ? `, ${currentUser.email.split("@")[0].replace(/[0-9]/g, "")}`
              : ""}
            !{" "}
            <span className="text-primary-600 relative dark:text-primary-400">
              Let's Practice
              <span className="absolute bottom-0 left-0 w-full h-1 bg-primary-300 opacity-50 rounded dark:bg-primary-500/50"></span>
            </span>
          </h1>
          <p className="text-secondary-600 text-sm sm:text-base max-w-2xl dark:text-secondary-300">
            Practice with flashcards, track progress, master spelling in
            multiple languages!
          </p>

          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Book className="w-24 h-24 sm:w-32 sm:h-32 text-primary-700 dark:text-primary-300" />
          </div>
        </div>

        {/* Search Bar with integrated filter */}
        <div className="mb-4 sm:mb-5">
          <SearchBar
            onSearch={setSearchTerm}
            onFilterChange={setSelectedFilter}
            filterOptions={filterOptions}
            selectedFilter={selectedFilter}
          />
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
            Languages{" "}
            <span className="min-w-[1.75rem] h-[1.75rem] inline-flex items-center justify-center rounded-full text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              {wordlists.length}
            </span>
          </h2>
          <UploadButton onClick={() => setIsUploadModalOpen(true)} />
        </div>

        {/* Wordlist Cards */}
        {filteredWordlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredWordlists.map((wordlist) => (
              <div key={wordlist.id}>
                <LanguageCard wordlist={wordlist} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-5 text-center mt-3 sm:mt-4  bg-secondary-50/50 dark:bg-secondary-800/50">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-secondary-100 text-secondary-500 mb-3 sm:mb-3.5 mx-auto dark:bg-secondary-700 dark:text-secondary-300">
              <Search className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-secondary-800 mb-1.5 sm:mb-2 dark:text-secondary-100">
              {searchTerm ? "No Match Found" : "No Languages Available"}
            </h3>
            <p className="text-secondary-600 text-xs sm:text-sm max-w-md mx-auto dark:text-secondary-300">
              {searchTerm
                ? "Try another search term or check back later for more languages."
                : "Check back later as we continue to add more languages to our collection."}
            </p>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default HomePage;
