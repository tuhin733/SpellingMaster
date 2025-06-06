import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Settings2,
  Settings,
  ArrowLeft,
  Menu,
  X,
  PieChart,
} from "lucide-react";
import { TranslationToggle } from "./TranslationToggle";
import { LanguageSelector } from "./LanguageSelector";
import Tooltip from "./Tooltip";
import SettingsModal from "./SettingsModal";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  showStats?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showSettings = true,
  showStats = true,
}) => {
  const location = useLocation();
  const isStatsPage = location.pathname === "/statistics";
  const isHomePage = location.pathname === "/";
  const isFlashcardPage = location.pathname.includes("/flashcards/");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${
        scrolled ? "pt-4 pb-2" : "pt-6 pb-4"
      }`}
    >
      <header
        className={`flex items-center justify-between transition-all duration-300 backdrop-blur-md ${
          scrolled
            ? "w-[92%] sm:w-[88%] md:w-[82%] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/90 dark:bg-secondary-900/90 dark:border dark:border-secondary-800/50 px-5 sm:px-7 py-3"
            : "w-full rounded-none bg-transparent dark:bg-transparent dark:border dark:border-transparent px-4 sm:px-6 py-3 sm:py-4"
        }`}
      >
        <div className="flex items-center gap-3">
          {showBack && (
            <Tooltip content="Go Back" position="bottom">
              <button
                onClick={() => window.history.back()}
                aria-label="Back"
                className="inline-flex p-2 rounded-full bg-primary-50 hover:bg-primary-100/90 shadow-sm hover:shadow-md active:bg-primary-200 text-primary-600 transition-all duration-300 transform hover:-translate-x-1 focus:outline-none focus:ring-2 focus:ring-primary-500/50 border-0 dark:bg-primary-800/30 dark:hover:bg-primary-700/40 dark:active:bg-primary-600/50 dark:text-primary-200"
              >
                <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </Tooltip>
          )}

          <Link to="/" className="flex items-center group">
            <Tooltip content="Go to Home" position="bottom">
              <div className="overflow-hidden rounded-lg mr-3 transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/spelling-master-icon.svg"
                  alt="Spelling Master Logo"
                  className={`transition-all duration-300 ${
                    scrolled
                      ? "w-7 h-7 sm:w-8 sm:h-8"
                      : "w-9 h-9 sm:w-10 sm:h-10"
                  }`}
                />
              </div>
            </Tooltip>
            <h1
              className={`font-bold text-secondary-900 transition-all duration-200 group-hover:text-primary-600 dark:text-secondary-100 dark:group-hover:text-primary-400 ${
                isHomePage
                  ? scrolled
                    ? "text-lg sm:text-xl"
                    : "text-xl sm:text-2xl"
                  : scrolled
                  ? "text-base sm:text-lg"
                  : "text-lg sm:text-xl"
              }`}
            >
              {title || "Spelling Master"}
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-3">
          {isFlashcardPage && (
            <div className="flex items-center gap-3">
              <TranslationToggle />
              <LanguageSelector />
            </div>
          )}
          {showStats && !isStatsPage && (
            <Tooltip content="Statistics" position="bottom">
              <Link
                to="/statistics"
                aria-label="Statistics"
                className="inline-flex p-2 rounded-full bg-primary-50 hover:bg-primary-100/90 shadow-sm hover:shadow-md active:bg-primary-200 text-primary-600 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-400/50 border-0 group dark:bg-primary-800/30 dark:hover:bg-primary-700/40 dark:active:bg-primary-600/50 dark:text-primary-200"
              >
                <PieChart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              </Link>
            </Tooltip>
          )}
          {showSettings && (
            <Tooltip content="Settings" position="bottom">
              <button
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
                className="inline-flex p-2 rounded-full bg-primary-50 hover:bg-primary-100/90 shadow-sm hover:shadow-md active:bg-primary-200 text-primary-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-400/50 border-0 group dark:bg-primary-800/30 dark:hover:bg-primary-700/40 dark:active:bg-primary-600/50 dark:text-primary-200"
              >
                <Settings className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Tooltip
            content={mobileMenuOpen ? "Close menu" : "Open menu"}
            position="bottom"
          >
            <button
              className="inline-flex p-3 sm:p-2.5 rounded-full text-secondary-600 transition-all duration-300 transform hover:scale-110 focus:outline-none  border-0 dark:text-secondary-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className={`absolute top-full left-0 right-0 ${
              scrolled
                ? "bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl border border-secondary-100 dark:border-secondary-800/50"
                : "bg-white dark:bg-secondary-900 shadow-lg"
            } py-4 px-5 z-10 animate-fadeIn md:hidden`}
          >
            {isFlashcardPage && (
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-300">
                    Translation
                  </span>
                  <TranslationToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-300">
                    Language
                  </span>
                  <LanguageSelector />
                </div>
              </div>
            )}
            {showStats && !isStatsPage && (
              <Tooltip content="View your learning statistics" position="right">
                <Link
                  to="/statistics"
                  className="flex items-center gap-3 py-4 px-3 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors focus:outline-none focus:ring-0 outline-none border-0 !outline-none !border-none no-outline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PieChart className="w-5 h-5 text-secondary-600 dark:text-secondary-300" />
                  <span className="text-secondary-900 dark:text-secondary-100">
                    Statistics
                  </span>
                </Link>
              </Tooltip>
            )}
            {showSettings && (
              <Tooltip
                content="Customize your learning experience"
                position="right"
              >
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 py-3 px-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors focus:outline-none focus:ring-0 border-0 !outline-none !border-none no-outline"
                >
                  <Settings2 className="w-5 h-5 text-secondary-600 dark:text-secondary-300" />
                  <span className="text-secondary-900 dark:text-secondary-100">
                    Settings
                  </span>
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Header;
