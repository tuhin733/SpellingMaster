import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { useProgress } from "../contexts/ProgressContext";
import ConfirmDialog from "./ConfirmDialog";
import Toast, { ToastType } from "./Toast";
import {
  Text,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Settings2,
  Volume2,
  VolumeX,
  FileText,
  Trash2,
  BookMarked,
  Clock,
  BarChart,
  X,
  Palette,
  Bell,
  Check,
  Info,
  Github,
  Globe,
  Heart,
  Mail,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "../utils/sound";
import * as db from "../utils/db";
import { Wordlist } from "../types";
import ReactDOM from "react-dom";
import Tooltip from "./Tooltip";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "appearance" | "study" | "wordlists" | "data" | "about";

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
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
  const { settings, updateSettings, wordlists, refreshWordlists } = useApp();
  const { clearProgress, clearAllData } = useProgress();
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
  const [toast, setToast] = useState<{
    message: string;
    isVisible: boolean;
    type?: ToastType;
  }>({
    message: "",
    isVisible: false,
    type: "info",
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const ITEMS_PER_PAGE = 3;

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

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    if (key === "enableSound" && value) playSound("success", true);
  };

  const handleDeleteWordlist = async (wordlistId: string) => {
    try {
      await db.deleteUserWordlist(wordlistId);
      await refreshWordlists();
      showToast("Wordlist deleted successfully", "success");
      setIsDeleteWordlistOpen(false);
      setSelectedWordlistId(null);
      setSelectedWordlist(null);
    } catch (error) {
      showToast("Failed to delete wordlist", "error");
    }
  };

  const handleDeleteAllWordlists = async () => {
    try {
      for (const wordlist of userWordlists) {
        await db.deleteUserWordlist(wordlist.id);
      }
      await refreshWordlists();
      showToast("All wordlists have been deleted successfully", "success");
      setIsDeleteAllWordlistsOpen(false);
    } catch (error) {
      showToast("Failed to delete wordlists", "error");
    }
  };

  const openDeleteConfirmation = (wordlist: Wordlist) => {
    setSelectedWordlistId(wordlist.id);
    setSelectedWordlist(wordlist);
    setIsDeleteWordlistOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
      className="fixed inset-0 z-50 flex md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-4"
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
                    <div>
                      <SettingItem
                        icon={<Palette className="w-5 h-5 text-blue-500" />}
                        title="Theme"
                        value={settings.theme}
                        onChange={(value) =>
                          handleSettingChange("theme", value)
                        }
                        options={[
                          { value: "light", label: "Light" },
                          { value: "dark", label: "Dark" },
                        ]}
                      />
                      <SettingItem
                        icon={<Text className="w-5 h-5 text-blue-500" />}
                        title="Font Size"
                        value={settings.fontSize}
                        onChange={(value) =>
                          handleSettingChange("fontSize", value)
                        }
                        options={[
                          { value: "small", label: "Small" },
                          { value: "medium", label: "Medium" },
                          { value: "large", label: "Large" },
                        ]}
                      />
                      <SettingToggle
                        icon={
                          settings.enableSound ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )
                        }
                        title="Sound Effects"
                        value={settings.enableSound}
                        onChange={(value) =>
                          handleSettingChange("enableSound", value)
                        }
                      />
                      <SettingToggle
                        icon={<Bell className="w-5 h-5" />}
                        title="Auto-Speak Words"
                        value={settings.enableAutoSpeak}
                        onChange={(value) =>
                          handleSettingChange("enableAutoSpeak", value)
                        }
                      />
                    </div>
                  )}

                  {activeTab === "study" && (
                    <div>
                      <SettingItem
                        icon={<BookMarked className="w-5 h-5 text-blue-500" />}
                        title="Words Per Session"
                        value={
                          settings.studySessionSettings?.wordsPerSession || 20
                        }
                        onChange={(value) =>
                          handleSettingChange("studySessionSettings", {
                            ...settings.studySessionSettings,
                            wordsPerSession: value,
                          })
                        }
                        options={[
                          { value: 5, label: "5 words" },
                          { value: 20, label: "20 words" },
                          { value: 50, label: "50 words" },
                        ]}
                      />
                      <SettingItem
                        icon={<Clock className="w-5 h-5 text-blue-500" />}
                        title="Time Limit"
                        value={settings.studySessionSettings?.timeLimit || 0}
                        onChange={(value) =>
                          handleSettingChange("studySessionSettings", {
                            ...settings.studySessionSettings,
                            timeLimit: value,
                          })
                        }
                        options={[
                          { value: 0, label: "No Limit" },
                          { value: 15, label: "15s" },
                          { value: 30, label: "30s" },
                          { value: 60, label: "60s" },
                        ]}
                      />
                    </div>
                  )}

                  {activeTab === "wordlists" && (
                    <div className="space-y-4">
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
                                onClick={() => openDeleteConfirmation(wordlist)}
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
                    </div>
                  )}

                  {activeTab === "data" && (
                    <div className="space-y-4">
                      <DangerButton
                        icon={<RefreshCw className="w-5 h-5" />}
                        title="Reset Progress"
                        description="Clear all learning progress and statistics"
                        onClick={() => setIsResetProgressOpen(true)}
                      />
                      <DangerButton
                        icon={<AlertTriangle className="w-5 h-5" />}
                        title="Reset All Data"
                        description="Remove all data including progress and custom wordlists"
                        onClick={() => setIsResetAllDataOpen(true)}
                        variant="danger"
                      />
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
                            <a
                              href="https://github.com/tuhin733/SpellingMaster"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                            >
                              <Github className="w-5 h-5" />
                            </a>
                            <a
                              href="https://spelling-master.vercel.app"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                            >
                              <Globe className="w-5 h-5" />
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
        title="Reset Progress"
        message="Are you sure you want to reset your progress? This action cannot be undone."
        isOpen={isResetProgressOpen}
        onConfirm={() => {
          clearProgress();
          setIsResetProgressOpen(false);
          showToast("Progress has been reset successfully", "success");
        }}
        onCancel={() => setIsResetProgressOpen(false)}
      />

      <ConfirmDialog
        title="Reset All Data"
        message="Are you sure you want to reset all data? This will remove all progress and custom word lists."
        isOpen={isResetAllDataOpen}
        onConfirm={() => {
          clearAllData();
          setIsResetAllDataOpen(false);
          showToast("All data has been reset successfully", "success");
        }}
        onCancel={() => setIsResetAllDataOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteWordlistOpen}
        title="Remove Custom Wordlist"
        message={
          selectedWordlist
            ? `Are you sure you want to remove "${
                selectedWordlist.title || selectedWordlist.language
              }" with ${
                selectedWordlist.words.length
              } words? This action cannot be undone.`
            : "Are you sure you want to remove this wordlist? This action cannot be undone."
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={() =>
          selectedWordlistId && handleDeleteWordlist(selectedWordlistId)
        }
        onCancel={() => {
          setIsDeleteWordlistOpen(false);
          setSelectedWordlistId(null);
          setSelectedWordlist(null);
        }}
        confirmVariant="danger"
      />

      <ConfirmDialog
        isOpen={isDeleteAllWordlistsOpen}
        title="Delete All Wordlists"
        message={`Are you sure you want to delete all ${userWordlists.length} wordlists? This action cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAllWordlists}
        onCancel={() => setIsDeleteAllWordlistsOpen(false)}
        confirmVariant="danger"
      />

      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={closeToast}
        type={toast.type}
      />
    </div>
  );
};

interface DropdownPosition {
  top: number;
  left: number;
  transformOrigin?: string;
  translate?: string;
}

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  value: any;
  onChange: (value: any) => void;
  options: { value: any; label: string }[];
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  value,
  onChange,
  options,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    transformOrigin: "top",
    translate: "translate(0, 4px)",
  });

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const modalRect = buttonRef.current
        .closest(".modal-content")
        ?.getBoundingClientRect() || { top: 0, left: 0 };

      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 200; // approximate max height of dropdown

      // Calculate position relative to the modal
      const top = buttonRect.bottom - modalRect.top;
      const left = buttonRect.left - modalRect.left;

      setDropdownPosition({
        top,
        left,
        transformOrigin: "top",
        translate: "translate(0, 4px)",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
      const modalContent = buttonRef.current?.closest(".modal-content");
      if (modalContent) {
        modalContent.addEventListener("scroll", calculateDropdownPosition);
        return () =>
          modalContent.removeEventListener("scroll", calculateDropdownPosition);
      }
    }
  }, [isOpen]);

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-secondary-800/50 border-b border-gray-200/80 dark:border-gray-600">
      <div className="flex items-center gap-2.5">
        <div className="text-blue-500">{icon}</div>
        <span className="text-sm text-gray-800 dark:text-gray-100">
          {title}
        </span>
      </div>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm transition-all duration-200 rounded-lg 
             text-gray-700 hover:bg-gray-100 
            dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <span>{selectedOption.label}</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-1 w-full min-w-[120px] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden animate-in fade-in duration-200 z-50"
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-all duration-200 flex items-center justify-between ${
                    value === option.value
                      ? "text-gray-700 dark:text-gray-200"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  value,
  onChange,
}) => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-secondary-800/50 border-b border-gray-200/80 dark:border-gray-600">
    <div className="flex items-center gap-2.5">
      <div
        className={value ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}
      >
        {icon}
      </div>
      <span className="text-sm text-gray-800 dark:text-gray-100">{title}</span>
    </div>
    <div
      role="button"
      onClick={() => onChange(!value)}
      className={`w-9 h-5 rounded-full transition-all duration-200 ease-in-out relative cursor-pointer ${
        value ? "bg-blue-500 dark:bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all duration-200 ease-in-out shadow-sm ${
          value ? "translate-x-5" : "translate-x-[3px]"
        }`}
      />
    </div>
  </div>
);

interface DangerButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "warning" | "danger";
}

const DangerButton: React.FC<DangerButtonProps> = ({
  icon,
  title,
  description,
  onClick,
  variant = "warning",
}) => (
  <button
    onClick={onClick}
    className="w-full p-4 bg-white dark:bg-secondary-800/50 rounded-lg border border-gray-200/80 dark:border-gray-600/50 hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors text-left"
  >
    <div className="flex items-center gap-3">
      <div className={variant === "danger" ? "text-red-500" : "text-blue-500"}>
        {icon}
      </div>
      <div>
        <span className="text-gray-800 dark:text-gray-100 font-medium">
          {title}
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
    </div>
  </button>
);

export default SettingsModal;
