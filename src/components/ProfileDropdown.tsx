import React, { useState, useRef, useEffect } from "react";
import { Settings, LogOut, Trash2, PieChart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import Tooltip from "./Tooltip";
import ConfirmDialog from "./ConfirmDialog";
import { useNavigate, useLocation, Link } from "react-router-dom";
import * as firebaseDb from "../utils/firebaseDb";
import { FirebaseError } from "firebase/app";
import * as db from "../utils/indexedDb";
import { deleteUser } from "firebase/auth";
import { retryOperation } from "../utils/operationQueue";

// Function to generate a color based on string input
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

// Function to get consistent colors for a user based on their email
const getUserColors = (email: string) => {
  const backgroundColor = stringToColor(email);
  return {
    bg: backgroundColor,
    text: "text-white",
  };
};

interface ProfileDropdownProps {
  className?: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  className = "",
}) => {
  const { currentUser, logout } = useAuth();
  const { openSettings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isStatsPage = location.pathname === "/statistics";

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [currentUser?.photoURL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

      // First, delete user data from Firestore
      await retryOperation(() => firebaseDb.deleteUserData(currentUser.uid));

      // Clear all local data
      await db.clearAllUserData();
      localStorage.clear();

      // Delete the user from Firebase Authentication
      try {
        await deleteUser(currentUser);
        navigate("/signin");
      } catch (error) {
        if (error instanceof FirebaseError) {
          if (error.code === "auth/requires-recent-login") {
            // Handle re-authentication requirement
            await logout();
            navigate("/signin", {
              state: {
                message: "Please sign in again to delete your account",
                deleteAccount: true,
              },
            });
            return;
          } else {
            // For other Firebase Auth errors, throw them to be caught by outer catch
            throw error;
          }
        }
        throw error; // Re-throw non-Firebase errors
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      // Show error to user
      setShowDeleteConfirm(false);
      // Revert Firestore deletion if Auth deletion failed
      // You might want to implement a recovery mechanism here
      throw new Error(
        "Failed to delete account completely. Please try again or contact support."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const renderAvatar = (size: "sm" | "lg") => {
    const dimensions = size === "sm" ? "w-8 h-8" : "w-10 h-10";
    const textSize = size === "sm" ? "text-base" : "text-lg";

    if (currentUser?.photoURL && !imageError) {
      return (
        <img
          src={currentUser.photoURL}
          alt="Profile"
          className={`${dimensions} rounded-full object-cover`}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      );
    }

    const colors = getUserColors(currentUser?.email || "");

    return (
      <div
        className={`${dimensions} rounded-full flex items-center justify-center`}
        style={{ backgroundColor: colors.bg }}
      >
        <span className={`${textSize} font-semibold ${colors.text}`}>
          {currentUser?.email?.[0].toUpperCase() || "U"}
        </span>
      </div>
    );
  };

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        <Tooltip content="Account" position="bottom">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 py-2 px-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 transition-all duration-200 focus:outline-none dark:text-primary-200"
          >
            {renderAvatar("sm")}
          </button>
        </Tooltip>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-gray-100 dark:border-secondary-700 overflow-hidden z-50">
            {/* Profile Section */}
            <div className="p-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl">
                {renderAvatar("lg")}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Signed in as
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              {!isStatsPage && (
                <Link
                  to="/statistics"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 rounded-lg transition-colors"
                >
                  <PieChart className="w-4 h-4" />
                  Statistics
                </Link>
              )}

              <button
                onClick={() => {
                  openSettings();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings <kbd className="text-[12px]">Alt+S</kbd>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-700/50 my-1"></div>

              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete account
              </button>
            </div>
          </div>
        )}
      </div>

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
    </>
  );
};

export default ProfileDropdown;
