import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { useProgress } from "../contexts/ProgressContext";
import { useAuth } from "../contexts/AuthContext";
import ConfirmDialog from "./ConfirmDialog";
import Toast, { ToastType } from "./Toast";
import { UserSettings } from "../types/settings";
import {
  XCircle,
  RefreshCw,
  AlertTriangle,
  Settings2,
  FileText,
  Trash2,
  BookMarked,
  Palette,
  Info,
  Github,
  MessageSquare,
  Heart,
  Mail,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "../utils/sound";
import * as db from "../utils/indexedDb";
import * as firebaseDb from "../utils/firebaseDb";
import { isOnline } from "../config/firebase";
import { Wordlist } from "../types";
import Tooltip from "./Tooltip";
import { useScrollLock } from "../hooks/useScrollLock";
import {
  TabType,
  TabItem,
  ToastState,
  SettingLoadingState,
} from "../types/settings";
import AppearanceTab from "./settings/tabs/AppearanceTab";
import { StudyTab } from "./settings/tabs/StudyTab";
import DangerButton from "./settings/DangerButton";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tabs: TabItem[] = [
  {
    id: "appearance",
    label: "Appearance",
    icon: <Palette className="w-5 h-5" />,
  },
  {
    id: "study",
    label: "Study Settings",
    icon: <BookMarked className="w-5 h-5" />,
  },
  {
    id: "wordlists",
    label: "Wordlists",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "data",
    label: "Data Management",
    icon: <Settings2 className="w-5 h-5" />,
  },
  {
    id: "about",
    label: "About",
    icon: <Info className="w-5 h-5" />,
  },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    wordlists,
    setWordlists,
    refreshWordlists,
    loadingStates,
  } = useApp();
  const { clearProgress, clearAllData } = useProgress();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("appearance");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // md breakpoint

  const [isResetProgressOpen, setIsResetProgressOpen] = useState(false);
  const [isResetAllDataOpen, setIsResetAllDataOpen] = useState(false);
  const [isDeleteWordlistOpen, setIsDeleteWordlistOpen] = useState(false);
  const [isDeleteAllWordlistsOpen, setIsDeleteAllWordlistsOpen] =
    useState(false);
  const [selectedWordlistId, setSelectedWordlistId] = useState<string | null>(
    null
  );
  const [selectedWordlist, setSelectedWordlist] = useState<Wordlist | null>(
    null
  );
  const [toast, setToast] = useState<ToastState>({
    message: "",
    isVisible: false,
    type: "info",
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const ITEMS_PER_PAGE = 3;
  const [isResettingProgress, setIsResettingProgress] = useState(false);
  const [isResettingAllData, setIsResettingAllData] = useState(false);
  const [isDeletingWordlist, setIsDeletingWordlist] = useState(false);
  const [isDeletingAllWordlists, setIsDeletingAllWordlists] = useState(false);
  const [settingLoading, setSettingLoading] = useState<SettingLoadingState>({
    theme: false,
    fontSize: false,
    wordsPerSession: false,
    timeLimit: false,
    enableSound: false,
    enableHints: false,
    enableTimer: false,
    enableAutoSpeak: false,
    fontFamily: false,
  });

  // Filter to get only user custom wordlists
  const userWordlists = wordlists.filter(
    (wordlist) => wordlist.source === "user"
  );

  // Calculate visible wordlists
  const visibleWordlists = isExpanded
    ? userWordlists
    : userWordlists.slice(0, ITEMS_PER_PAGE);

  // Add FAQs data
  const faqs = [
    {
      question: "How do I create a custom word list?",
      answer:
        "To create a custom word list, go to the main menu and select 'Word Lists'. Click the '+' button to create a new list. You can then add words manually or import them from a file.",
    },
    {
      question: "Can I adjust the difficulty of practice sessions?",
      answer:
        "Yes! You can customize your study sessions in the Settings page. You can adjust the number of words per session and set time limits for answering each word.",
    },
    {
      question: "How does the progress tracking work?",
      answer:
        "The app tracks your performance across all practice sessions. It records your accuracy, speed, and commonly misspelled words. You can view your statistics in the Progress section.",
    },
    {
      question: "Can I use the app offline?",
      answer:
        "Yes, Spelling Master works offline! Your progress and custom word lists are stored locally on your device.",
    },
    {
      question: "How do I reset my progress?",
      answer:
        "You can reset your progress in the Settings page under 'Data Management'. You have the option to reset only your progress or all data including custom word lists.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, isVisible: true, type });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleSettingChange = async (key: string, value: any) => {
    if (!currentUser) {
      showToast("Please log in to save settings", "error");
      return;
    }

    // Set loading state for the specific setting
    setSettingLoading((prev) => ({ ...prev, [key]: true }));

    try {
      // Special handling for timer setting
      if (key === "enableTimer") {
        const updatedSettings = {
          enableTimer: value,
          studySessionSettings: {
            ...settings.studySessionSettings,
            timeLimit: value
              ? settings.studySessionSettings?.timeLimit || 30
              : 0,
          },
        };
        await updateSettings(updatedSettings);
      } else {
        await updateSettings({ [key]: value });
      }

      if (key === "enableSound" && value) playSound("success", true);
    } catch (error) {
      showToast("Failed to update setting", "error");
    } finally {
      // Clear loading state after update
      setSettingLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleStudySettingChange = async (key: string, value: any) => {
    if (!currentUser) {
      showToast("Please log in to save settings", "error");
      return;
    }

    setSettingLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const updatedSettings: Partial<UserSettings> = {
        studySessionSettings: {
          ...settings.studySessionSettings,
          [key]: value,
        },
      };

      // Only enable timer if time limit is being set to a non-zero value
      if (key === "timeLimit" && value > 0) {
        updatedSettings.enableTimer = true;
      }

      await updateSettings(updatedSettings);
    } catch (error) {
      showToast("Failed to update study settings", "error");
    } finally {
      setSettingLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteWordlist = async (wordlistId: string) => {
    try {
      setIsDeletingWordlist(true);
      await db.deleteWordlist(wordlistId);
      const userWordlists = await db.getAllWordlists();
      setWordlists((prev: Wordlist[]) => [
        ...prev.filter((w: Wordlist) => w.source === "preloaded"),
        ...userWordlists,
      ]);
      showToast("Wordlist deleted successfully", "success");
      setIsDeleteWordlistOpen(false);
      setSelectedWordlistId(null);
      setSelectedWordlist(null);
    } catch (error) {
      showToast("Failed to delete wordlist", "error");
    } finally {
      setIsDeletingWordlist(false);
    }
  };

  const handleDeleteAllWordlists = async () => {
    try {
      setIsDeletingAllWordlists(true);
      await db.clearAllWordlists();
      const userWordlists = await db.getAllWordlists();
      setWordlists((prev: Wordlist[]) => [
        ...prev.filter((w: Wordlist) => w.source === "preloaded"),
        ...userWordlists,
      ]);
      showToast("All wordlists have been deleted successfully", "success");
      setIsDeleteAllWordlistsOpen(false);
    } catch (error) {
      showToast("Failed to delete wordlists", "error");
    } finally {
      setIsDeletingAllWordlists(false);
    }
  };

  const handleResetProgress = async () => {
    if (!currentUser) {
      showToast("Please log in to reset progress", "error");
      return;
    }

    try {
      setIsResettingProgress(true);
      await firebaseDb.clearAllProgress(currentUser.uid);
      await clearProgress();
      showToast("Progress has been reset successfully", "success");
      setIsResetProgressOpen(false);
    } catch (error) {
      showToast("Failed to reset progress", "error");
    } finally {
      setIsResettingProgress(false);
    }
  };

  const handleResetAllData = async () => {
    if (!currentUser) {
      showToast("Please log in to reset data", "error");
      return;
    }

    // Check if online
    if (!isOnline()) {
      showToast(
        "You are currently offline. Please try again when you have an internet connection.",
        "error"
      );
      return;
    }

    try {
      setIsResettingAllData(true);
      // Clear Firebase data
      await firebaseDb.clearAllData(currentUser.uid);
      // Clear IndexedDB data
      await db.clearAllWordlists();
      await db.clearAllUserData();
      // Clear local storage
      localStorage.removeItem("appSettings");
      localStorage.removeItem("theme");
      localStorage.removeItem("spelling-master-settings");
      // Clear app state
      await clearAllData();
      const userWordlists = await db.getAllWordlists();
      setWordlists((prev: Wordlist[]) => [
        ...prev.filter((w: Wordlist) => w.source === "preloaded"),
        ...userWordlists,
      ]);
      showToast("All data has been reset successfully", "success");
      setIsResetAllDataOpen(false);

      // Add a small delay to ensure the toast message is visible
      setTimeout(() => {
        // Force reload the page to ensure clean state
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Reset all data error:", error);
      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("connection")
        ) {
          showToast(
            "Network error. Please check your connection and try again.",
            "error"
          );
        } else {
          showToast("Failed to reset data. Please try again.", "error");
        }
      } else {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
    } finally {
      setIsResettingAllData(false);
    }
  };

  const openDeleteConfirmation = (wordlist: Wordlist) => {
    setSelectedWordlistId(wordlist.id);
    setSelectedWordlist(wordlist);
    setIsDeleteWordlistOpen(true);
  };

  useScrollLock(isOpen);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: isMobile ? "100%" : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isMobile ? "100%" : 20 }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white dark:bg-secondary-800 shadow-2xl flex flex-col overflow-hidden ${
          isMobile
            ? "w-full h-[85vh] rounded-t-2xl mt-auto"
            : "w-full max-w-4xl h-[450px] rounded-2xl"
        }`}
      >
        {/* Mobile drag indicator */}
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
        )}

        <div className={`flex h-full ${isMobile ? "flex-col" : ""}`}>
          {/* Sidebar - Convert to top tabs on mobile */}
          <div
            className={`${
              isMobile
                ? "w-full overflow-x-auto flex-none border-b"
                : "w-56 bg-gray-50/80 dark:bg-secondary-900/80 backdrop-blur border-r"
            } border-gray-200/80 dark:border-gray-600/50`}
          >
            {!isMobile && (
              <div className="p-4 border-b border-gray-200/80 dark:border-gray-600/50">
                <div className="flex items-center space-x-2">
                  <Settings2 className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Settings
                  </h2>
                </div>
              </div>
            )}
            <nav className={`${isMobile ? "flex p-1" : "p-2 space-y-1"}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    isMobile
                      ? "flex-none px-4 py-2.5 mx-1 text-sm rounded-lg whitespace-nowrap"
                      : "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg"
                  } transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-secondary-800/50"
                  }`}
                >
                  {isMobile ? (
                    <span className="font-medium">{tab.label}</span>
                  ) : (
                    <>
                      {tab.icon}
                      <span className="font-medium">{tab.label}</span>
                    </>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col h-full modal-content relative overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h3>
              <Tooltip content="Close" position="bottom">
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </Tooltip>
            </div>

            <div className="overflow-y-auto flex-1 p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-track]:bg-gray-800/20 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {activeTab === "appearance" && (
                    <AppearanceTab
                      settings={settings}
                      settingLoading={settingLoading}
                      onSettingChange={handleSettingChange}
                    />
                  )}

                  {activeTab === "study" && (
                    <StudyTab
                      settings={settings}
                      settingLoading={settingLoading}
                      onSettingChange={handleSettingChange}
                      onStudySettingChange={handleStudySettingChange}
                    />
                  )}

                  {activeTab === "wordlists" && (
                    <div className="space-y-4">
                      {userWordlists.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                          <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-2">
                            No Custom Wordlists
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            You haven't created any custom wordlists yet. Create
                            your first wordlist to start practicing with your
                            own words.
                          </p>
                        </div>
                      ) : (
                        <>
                          {visibleWordlists.map((wordlist) => (
                            <div
                              key={wordlist.id}
                              className="p-4 bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-blue-500" />
                                  <div>
                                    <span className="text-gray-800 dark:text-gray-100 font-medium">
                                      {wordlist.title || wordlist.language}
                                    </span>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                      {wordlist.words.length} words
                                    </div>
                                  </div>
                                </div>
                                <Tooltip content="Delete" position="top">
                                  <button
                                    onClick={() =>
                                      openDeleteConfirmation(wordlist)
                                    }
                                    className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          ))}

                          {userWordlists.length > ITEMS_PER_PAGE && (
                            <button
                              onClick={() => setIsExpanded(!isExpanded)}
                              className="w-full py-2 px-4 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                              <span>
                                {isExpanded
                                  ? "Show Less"
                                  : `Show More (${
                                      userWordlists.length - ITEMS_PER_PAGE
                                    } more)`}
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "data" && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 p-4 mb-4">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                          Data Sync Status
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          {currentUser ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span>
                                Your data is being synced to the cloud
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <span>Sign in to enable cloud sync</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <DangerButton
                        icon={<RefreshCw className="w-5 h-5" />}
                        title="Reset Progress"
                        description="Clear all learning progress and statistics. Your custom wordlists will be preserved."
                        onClick={() => {
                          if (!currentUser) {
                            showToast(
                              "Please sign in to reset progress",
                              "error"
                            );
                            return;
                          }
                          setIsResetProgressOpen(true);
                        }}
                      />

                      <DangerButton
                        icon={<AlertTriangle className="w-5 h-5" />}
                        title="Reset All Data"
                        description="Remove all data including progress, statistics, settings, and custom wordlists. This action cannot be undone."
                        onClick={() => {
                          if (!currentUser) {
                            showToast("Please sign in to reset data", "error");
                            return;
                          }
                          setIsResetAllDataOpen(true);
                        }}
                        variant="danger"
                      />

                      {userWordlists.length > 0 && (
                        <DangerButton
                          icon={<Trash2 className="w-5 h-5" />}
                          title="Delete All Wordlists"
                          description="Remove all your custom wordlists. Built-in wordlists will not be affected."
                          onClick={() => {
                            if (!currentUser) {
                              showToast(
                                "Please sign in to delete wordlists",
                                "error"
                              );
                              return;
                            }
                            setIsDeleteAllWordlistsOpen(true);
                          }}
                          variant="danger"
                        />
                      )}
                    </div>
                  )}

                  {activeTab === "about" && (
                    <div className="space-y-6">
                      {/* App Info Section */}
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
                          <img
                            src="/spelling-master-icon.svg"
                            alt="Spelling Master Logo"
                            className="w-12 h-12"
                          />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          Spelling Master
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                          Version 0.1.0
                        </p>
                      </div>

                      {/* Description */}
                      <div className="bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 p-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-center">
                          Spelling Master is an interactive learning application
                          designed to help users improve their spelling skills
                          through engaging practice sessions and personalized
                          word lists.
                        </p>
                      </div>

                      {/* Features List */}
                      <div className="bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 p-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                          Key Features
                        </h2>
                        <ul className="space-y-3">
                          <li className="flex items-start">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                              <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Customizable study sessions with adjustable word
                              counts and time limits
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                              <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Create and manage custom word lists for targeted
                              practice
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                              <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Progress tracking and performance statistics
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                              <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Dark mode support for comfortable learning at any
                              time
                            </span>
                          </li>
                        </ul>
                      </div>

                      {/* Help & FAQ Section */}
                      <div className="bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 p-4">
                        <div className="flex items-start space-x-4 mb-6">
                          <div className="flex-shrink-0">
                            <HelpCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
                              Need Help?
                            </h2>
                            <p className="text-blue-600/80 dark:text-blue-300/80 mb-4">
                              Find answers to common questions below or reach
                              out to our support team.
                            </p>
                            <a
                              href="mailto:support@spelling-master.com"
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-800/40 dark:hover:bg-blue-800/60 rounded-lg transition-colors duration-200"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Contact Support
                            </a>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {faqs.map((faq, index) => (
                            <div
                              key={index}
                              className="border-b border-gray-200 dark:border-gray-600 last:border-0"
                            >
                              <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full py-4 flex items-center justify-between text-left focus:outline-none"
                              >
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                  {faq.question}
                                </span>
                                <ChevronDown
                                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                                    expandedFaqIndex === index
                                      ? "transform rotate-180"
                                      : ""
                                  }`}
                                />
                              </button>
                              <AnimatePresence>
                                {expandedFaqIndex === index && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <p className="pb-4 text-gray-600 dark:text-gray-300">
                                      {faq.answer}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Credits Section */}
                      <div className="bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 p-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-4">
                            <p className="text-gray-600 dark:text-gray-300">
                              Made with{" "}
                              <Heart className="w-4 h-4 inline text-red-500 mx-1" />{" "}
                              by the Spelling Master Team
                            </p>
                          </div>
                          <div className="flex items-center justify-center space-x-4">
                            <Tooltip content="Github" position="top">
                              <a
                                href="https://github.com/tuhin733/SpellingMaster"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                              >
                                <Github className="w-5 h-5" />
                              </a>
                            </Tooltip>
                            <Tooltip content="Documentation" position="top">
                              <a
                                href="https://github.com/tuhin733/SpellingMaster/blob/main/docs/getting-started.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                              >
                                <FileText className="w-5 h-5" />
                              </a>
                            </Tooltip>
                            <Tooltip content="Report Issues" position="top">
                              <a
                                href="https://github.com/tuhin733/SpellingMaster/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                              >
                                <AlertTriangle className="w-5 h-5" />
                              </a>
                            </Tooltip>
                            <Tooltip content="Discussions" position="top">
                              <a
                                href="https://github.com/tuhin733/SpellingMaster/discussions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                              >
                                <MessageSquare className="w-5 h-5" />
                              </a>
                            </Tooltip>
                          </div>
                          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            <a
                              href="https://github.com/tuhin733/SpellingMaster/blob/main/CONTRIBUTING.md"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Contribute to this project
                            </a>
                            {" • "}
                            <a
                              href="https://github.com/tuhin733/SpellingMaster/blob/main/LICENSE"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              License
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isResetProgressOpen}
        onClose={() => setIsResetProgressOpen(false)}
        onConfirm={handleResetProgress}
        title="Reset Progress"
        message="Are you sure you want to reset all your progress? This action cannot be undone."
        type="warning"
        isLoading={isResettingProgress}
      />

      <ConfirmDialog
        isOpen={isResetAllDataOpen}
        onClose={() => setIsResetAllDataOpen(false)}
        onConfirm={handleResetAllData}
        title="Reset All Data"
        message="Are you sure you want to reset all data? This will delete all your progress, settings, and custom wordlists. This action cannot be undone."
        type="danger"
        isLoading={isResettingAllData}
      />

      <ConfirmDialog
        isOpen={isDeleteWordlistOpen}
        onClose={() => setIsDeleteWordlistOpen(false)}
        onConfirm={async () => {
          if (!selectedWordlistId) return;
          await handleDeleteWordlist(selectedWordlistId);
        }}
        title="Delete Wordlist"
        message={`Are you sure you want to delete "${selectedWordlist?.title}"? This action cannot be undone.`}
        type="danger"
        isLoading={isDeletingWordlist}
      />

      <ConfirmDialog
        isOpen={isDeleteAllWordlistsOpen}
        onClose={() => setIsDeleteAllWordlistsOpen(false)}
        onConfirm={handleDeleteAllWordlists}
        title="Delete All Wordlists"
        message="Are you sure you want to delete all custom wordlists? This action cannot be undone."
        type="danger"
        isLoading={isDeletingAllWordlists}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={closeToast}
        type={toast.type}
      />
    </div>
  );
};

export default SettingsModal;
