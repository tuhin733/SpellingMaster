import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TranslationToggle } from "./TranslationToggle";
import { LanguageSelector } from "./LanguageSelector";
import Tooltip from "./Tooltip";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import ProfileDropdown from "./ProfileDropdown";
import ConfirmDialog from "./ConfirmDialog";
import { deleteUser } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import * as firebaseDb from "../utils/firebaseDb";
import * as db from "../utils/indexedDb";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  showStats?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showSettings = true,
  showStats = false,
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { openSettings } = useSettings();
  const isHomePage = location.pathname === "/";
  const isFlashcardPage = location.pathname.includes("/flashcards/");
  const [scrolled, setScrolled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      if (!currentUser) return;

      // Delete user from Firebase Authentication
      await deleteUser(currentUser);

      // Delete user data from Firestore
      await firebaseDb.deleteUserData(currentUser.uid);

      // Clear all local IndexedDB data
      await db.clearAllUserData();

      // Clear local storage
      localStorage.clear();

      // Navigate to sign in page
      navigate("/signin");
    } catch (error) {
      console.error("Error deleting account:", error);
      if (
        error instanceof FirebaseError &&
        error.code === "auth/requires-recent-login"
      ) {
        await logout();
        navigate("/signin");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[40] flex justify-center transition-all duration-300 ${
        scrolled ? "pt-1 pb-0.5 sm:pt-4 sm:pb-2" : ""
      } ${className}`}
    >
      <header
        className={`flex items-center justify-between w-full transition-all duration-300 ${
          scrolled
            ? "mx-1 sm:mx-2 sm:w-[88%] md:w-[82%] rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white dark:bg-secondary-900 dark:border dark:border-secondary-800/50 px-2 sm:px-7 py-1 sm:py-3"
            : "rounded-none bg-transparent dark:bg-transparent dark:border dark:border-transparent px-2 sm:px-6 py-1.5 sm:py-4"
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-3 h-full min-w-0 flex-shrink-1">
          {showBack && (
            <Tooltip content="Go Back" position="bottom">
              <button
                onClick={() => navigate(-1)}
                aria-label="Back"
                className={`inline-flex items-center justify-center transition-all duration-300 rounded-full bg-primary-50 hover:bg-primary-100/90 shadow-sm hover:shadow-md active:bg-primary-200 text-primary-600 transform hover:-translate-x-1 focus:outline-none focus:ring-2 focus:ring-primary-500/50 border-0 dark:bg-primary-800/30 dark:hover:bg-primary-700/40 dark:active:bg-primary-600/50 dark:text-primary-200 ${
                  scrolled ? "p-1 sm:p-1.5" : "p-1.5 sm:p-2"
                }`}
              >
                <ChevronLeft
                  className={`transition-all duration-300 ${
                    scrolled
                      ? "w-3.5 h-3.5 sm:w-5 sm:h-5"
                      : "w-4 h-4 sm:w-5 sm:h-5"
                  }`}
                />
              </button>
            </Tooltip>
          )}

          <Link to="/" className="flex items-center group min-w-0">
            <Tooltip content="Go to Home" position="bottom">
              <div className="overflow-hidden rounded-lg mr-1.5 sm:mr-3 transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
                <img
                  src="/spelling-master-icon.svg"
                  alt="Spelling Master Logo"
                  className={`transition-all duration-300 ${
                    scrolled
                      ? "w-9 h-9 sm:w-10 sm:h-10"
                      : "w-10 h-10 sm:w-12 sm:h-12"
                  }`}
                />
              </div>
            </Tooltip>
            <h1
              className={`font-bold text-secondary-900 transition-all duration-200 dark:text-secondary-100 truncate ${
                isHomePage
                  ? scrolled
                    ? "text-[10px] sm:text-base"
                    : "text-[13px] sm:text-lg"
                  : scrolled
                  ? "text-[9px] sm:text-sm"
                  : "text-[12px] sm:text-base"
              }`}
            >
              {title || "Spelling Master"}
            </h1>
          </Link>
        </div>

        {/* Right side icons */}
        <div
          className={`flex items-center gap-1.5 sm:gap-3 h-full flex-shrink-0 transition-all duration-300 ${
            scrolled ? "scale-[0.85] sm:scale-90" : "scale-90 sm:scale-100"
          }`}
        >
          {isFlashcardPage && (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <TranslationToggle />
              <LanguageSelector />
            </div>
          )}
          {currentUser && <ProfileDropdown />}
        </div>

        {/* Confirm Delete Account Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
          confirmText="Delete Account"
          type="danger"
          isLoading={isDeleting}
        />
      </header>
    </div>
  );
};

export default Header;
