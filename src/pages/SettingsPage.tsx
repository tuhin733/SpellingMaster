import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useProgress } from "../contexts/ProgressContext";
import Header from "../components/Header";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import {
  Text,
  RefreshCw,
  AlertTriangle,
  Sun,
  Moon,
  Settings2,
  Volume2,
  VolumeX,
  Info,
  HelpCircle,
  Database,
  ChevronRight,
  FileText,
  Trash2,
  BookMarked,
  Clock,
  BarChart,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "../utils/sound";
import * as db from "../utils/db";
import { Wordlist } from "../types";
import { Link } from "react-router-dom";
import Tooltip from "../components/Tooltip";

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, wordlists, refreshWordlists } = useApp();
  const { clearProgress, clearAllData } = useProgress();

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
  }>({
    message: "",
    isVisible: false,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const ITEMS_PER_PAGE = 3;

  // Filter to get only user custom wordlists
  const userWordlists = useMemo(
    () => wordlists.filter((wordlist) => wordlist.source === "user"),
    [wordlists]
  );

  // Calculate visible wordlists
  const visibleWordlists = useMemo(() => {
    if (isExpanded) return userWordlists;
    return userWordlists.slice(0, ITEMS_PER_PAGE);
  }, [userWordlists, isExpanded]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleFontSizeChange = useCallback(
    (size: "small" | "medium" | "large") => {
      updateSettings({ fontSize: size });
      showToast("Font size updated");
    },
    [updateSettings]
  );

  const handleThemeChange = useCallback(
    (theme: "light" | "dark") => {
      updateSettings({ theme });
      showToast(
        `${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied`
      );
    },
    [updateSettings]
  );

  const handleSoundChange = useCallback(
    (enableSound: boolean) => {
      const soundValue = enableSound === true;
      updateSettings({ enableSound: soundValue });
      if (soundValue) {
        playSound("success", true);
      }
      showToast(`Sound ${soundValue ? "enabled" : "disabled"}`);
    },
    [updateSettings]
  );

  const handleStudySessionChange = useCallback(
    (wordsPerSession: number) => {
      updateSettings({
        studySessionSettings: {
          wordsPerSession,
          timeLimit: settings.studySessionSettings?.timeLimit || 0,
        },
      });
    },
    [updateSettings, settings.studySessionSettings?.timeLimit]
  );

  const handleTimeLimitChange = useCallback(
    (timeLimit: number) => {
      updateSettings({
        studySessionSettings: {
          wordsPerSession: settings.studySessionSettings?.wordsPerSession || 20,
          timeLimit,
        },
      });
    },
    [updateSettings, settings.studySessionSettings?.wordsPerSession]
  );

  const handleDeleteWordlist = async (wordlistId: string) => {
    try {
      await db.deleteUserWordlist(wordlistId);
      await refreshWordlists();
      showToast("Wordlist removed successfully");
      setIsDeleteWordlistOpen(false);
      setSelectedWordlistId(null);
      setSelectedWordlist(null);
    } catch (error) {
      showToast("Failed to remove wordlist");
    }
  };

  const handleDeleteAllWordlists = async () => {
    try {
      // Delete each wordlist
      for (const wordlist of userWordlists) {
        await db.deleteUserWordlist(wordlist.id);
      }
      await refreshWordlists();
      showToast("All wordlists have been removed successfully");
      setIsDeleteAllWordlistsOpen(false);
    } catch (error) {
      showToast("Failed to remove wordlists");
    }
  };

  const openDeleteConfirmation = (wordlist: Wordlist) => {
    setSelectedWordlistId(wordlist.id);
    setSelectedWordlist(wordlist);
    setIsDeleteWordlistOpen(true);
  };

  const showToast = (
    message: string,
    _type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const SettingSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    accentColor?: string;
    defaultCollapsed?: boolean;
  }> = React.memo(({ title, icon, children, accentColor = "blue" }) => {
    // Memoize the content to prevent re-rendering when other settings change
    const sectionContent = React.useMemo(() => children, [children]);

    return (
      <div
        className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden dark:bg-secondary-800/80 dark:border-secondary-700/50 dark:text-secondary-100 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300 h-full flex flex-col`}
      >
        <div
          className={`bg-${accentColor}-50 dark:bg-${accentColor}-900/20 py-5 px-7 border-b border-${accentColor}-100 dark:border-${accentColor}-900/30`}
        >
          <div className="flex items-center">
            <div
              className={`mr-3 text-${accentColor}-500 dark:text-${accentColor}-400`}
            >
              {icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {title}
            </h2>
          </div>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="p-6 space-y-6">{sectionContent}</div>
        </div>
      </div>
    );
  });

  const OptionButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    tooltip?: string;
  }> = React.memo(({ label, icon, isActive, onClick, tooltip }) => (
    <Tooltip content={tooltip} position="top" trigger="hover">
      <button
        onClick={onClick}
        className={`${
          isActive
            ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 shadow-md"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-secondary-800 dark:text-gray-300 dark:border-secondary-700 dark:hover:bg-secondary-700/50"
        } p-4 rounded-lg flex items-center justify-center transition-all duration-200 border w-full text-base`}
        aria-pressed={isActive}
        role="button"
      >
        {icon}
        <span className="ml-2 font-medium">{label}</span>
      </button>
    </Tooltip>
  ));

  const InfoBanner: React.FC<{
    icon: React.ReactNode;
    children: React.ReactNode;
    variant?: "info" | "warning";
  }> = ({ icon, children, variant = "info" }) => {
    const variantStyles = {
      info: "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/40 dark:text-blue-300",
      warning:
        "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-300",
    };

    return (
      <div
        className={`${variantStyles[variant]} rounded-lg p-3 border shadow-sm`}
      >
        <div className="flex items-start">
          <div className="mr-2 flex-shrink-0 mt-0.5">{icon}</div>
          <div className="text-sm">{children}</div>
        </div>
      </div>
    );
  };

  const ActionButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "danger" | "warning";
    tooltip?: string;
  }> = ({ label, icon, onClick, variant = "default", tooltip }) => {
    const variantStyles = {
      default:
        "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-secondary-800 dark:border-secondary-700 dark:text-gray-300 dark:hover:bg-secondary-700",
      warning:
        "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-400 dark:hover:bg-amber-900/30",
      danger:
        "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/30",
    };

    return (
      <Tooltip content={tooltip} position="top" trigger="hover">
        <button
          onClick={onClick}
          className={`${variantStyles[variant]} w-full p-4 rounded-lg flex items-center justify-between border transition-all duration-200 shadow-sm hover:shadow-md`}
        >
          <div className="flex items-center">
            <div className="mr-3 flex-shrink-0">{icon}</div>
            <span className="font-medium text-base">{label}</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-60" />
        </button>
      </Tooltip>
    );
  };

  const ToggleSwitch: React.FC<{
    isOn: boolean;
    onToggle: () => void;
    onIcon: React.ReactNode;
    offIcon: React.ReactNode;
    activeColor?: string;
    inactiveColor?: string;
    label: string;
    description?: string;
    tooltip?: string;
  }> = ({ isOn, onToggle, onIcon, offIcon, label, description, tooltip }) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="relative w-12 h-6 rounded-full cursor-pointer"
        role="switch"
        aria-checked={isOn}
        aria-label={label}
      >
        {/* Track background */}
        <div
          className={`absolute inset-0 rounded-full shadow-inner transition-colors duration-300 ${
            isOn
              ? "bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-600 dark:to-blue-700"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        />

        {/* Thumb */}
        <motion.div
          initial={false}
          animate={{
            x: isOn ? 24 : 2,
          }}
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 30,
          }}
          className="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
        >
          <div
            className={`text-xs ${isOn ? "text-blue-500" : "text-gray-400"}`}
          >
            {isOn ? onIcon : offIcon}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col transition-colors duration-300 dark:from-secondary-900 dark:to-secondary-950">
      <Header showBack title="Settings" showSettings={false} />
      <main className="flex-1 container mx-auto p-5 max-w-6xl pb-12 main-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SettingSection
            title="Display Preferences"
            icon={<Settings2 className="w-5 h-5" />}
            accentColor="blue"
            defaultCollapsed={false}
          >
            <div className="space-y-4">
              <div className="border-b border-gray-100 dark:border-gray-700/30 pb-4">
                <ToggleSwitch
                  isOn={settings.theme === "dark"}
                  onToggle={() =>
                    handleThemeChange(
                      settings.theme === "dark" ? "light" : "dark"
                    )
                  }
                  onIcon={
                    <Moon className="w-3 h-3 text-blue-500 absolute top-1 left-1" />
                  }
                  offIcon={
                    <Sun className="w-3 h-3 text-amber-500 absolute top-1 left-1" />
                  }
                  label="Dark Mode"
                  description={
                    settings.theme === "dark"
                      ? "Easier on the eyes at night"
                      : "Better visibility in daylight"
                  }
                />
              </div>

              <div>
                {React.useMemo(
                  () => (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Font Size
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <OptionButton
                          label="Small"
                          icon={<Text className="w-4 h-4" />}
                          isActive={settings.fontSize === "small"}
                          onClick={() => handleFontSizeChange("small")}
                          tooltip="Small font size"
                        />
                        <OptionButton
                          label="Medium"
                          icon={<Text className="w-5 h-5" />}
                          isActive={settings.fontSize === "medium"}
                          onClick={() => handleFontSizeChange("medium")}
                          tooltip="Medium font size"
                        />
                        <OptionButton
                          label="Large"
                          icon={<Text className="w-6 h-6" />}
                          isActive={settings.fontSize === "large"}
                          onClick={() => handleFontSizeChange("large")}
                          tooltip="Large font size"
                        />
                      </div>
                    </>
                  ),
                  [settings.fontSize]
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700/30 pt-4">
                <ToggleSwitch
                  isOn={settings.enableSound === true}
                  onToggle={() =>
                    handleSoundChange(settings.enableSound === false)
                  }
                  onIcon={
                    <Volume2 className="w-3 h-3 text-blue-500 absolute top-1 left-1" />
                  }
                  offIcon={
                    <VolumeX className="w-3 h-3 text-gray-500 absolute top-1 left-1" />
                  }
                  label="Sound Effects"
                  description="Play sounds for correct/incorrect answers"
                  tooltip={
                    settings.enableSound
                      ? "Disable sound effects"
                      : "Enable sound effects"
                  }
                />
              </div>
            </div>
          </SettingSection>

          <SettingSection
            title="Study Session Settings"
            icon={<BookMarked className="w-5 h-5" />}
            accentColor="blue"
            defaultCollapsed={false}
          >
            <div className="space-y-4">
              {/* Words Per Session Setting */}
              <div className="border-b border-gray-100 dark:border-gray-700/30 pb-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Words Per Session
                    </label>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                      {settings.studySessionSettings?.wordsPerSession || 20}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Choose how many words to practice in each study session
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <OptionButton
                      label="5 Words"
                      icon={<Text className="w-4 h-4" />}
                      isActive={
                        (settings.studySessionSettings?.wordsPerSession ||
                          20) === 5
                      }
                      onClick={() => handleStudySessionChange(5)}
                      tooltip="5 words per session"
                    />
                    <OptionButton
                      label="20 Words"
                      icon={<Text className="w-5 h-5" />}
                      isActive={
                        (settings.studySessionSettings?.wordsPerSession ||
                          20) === 20
                      }
                      onClick={() => handleStudySessionChange(20)}
                      tooltip="20 words per session"
                    />
                    <OptionButton
                      label="50 Words"
                      icon={<Text className="w-6 h-6" />}
                      isActive={
                        (settings.studySessionSettings?.wordsPerSession ||
                          20) === 50
                      }
                      onClick={() => handleStudySessionChange(50)}
                      tooltip="50 words per session"
                    />
                  </div>
                </div>
              </div>

              {/* Time Limit Setting */}
              <div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Time Limit
                    </label>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                      {(settings.studySessionSettings?.timeLimit || 0) === 0
                        ? "No Limit"
                        : `${settings.studySessionSettings?.timeLimit}s`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Set a time limit for answering each word
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <OptionButton
                      label="None"
                      icon={<Clock className="w-4 h-4" />}
                      isActive={
                        (settings.studySessionSettings?.timeLimit || 0) === 0
                      }
                      onClick={() => handleTimeLimitChange(0)}
                      tooltip="No time limit"
                    />
                    <OptionButton
                      label="15s"
                      icon={<Clock className="w-4 h-4" />}
                      isActive={
                        (settings.studySessionSettings?.timeLimit || 0) === 15
                      }
                      onClick={() => handleTimeLimitChange(15)}
                      tooltip="15 seconds"
                    />
                    <OptionButton
                      label="30s"
                      icon={<Clock className="w-4 h-4" />}
                      isActive={
                        (settings.studySessionSettings?.timeLimit || 0) === 30
                      }
                      onClick={() => handleTimeLimitChange(30)}
                      tooltip="30 seconds"
                    />
                    <OptionButton
                      label="60s"
                      icon={<Clock className="w-4 h-4" />}
                      isActive={
                        (settings.studySessionSettings?.timeLimit || 0) === 60
                      }
                      onClick={() => handleTimeLimitChange(60)}
                      tooltip="60 seconds"
                    />
                  </div>
                </div>
              </div>
            </div>
          </SettingSection>

          {/* Custom Wordlists Management Section */}
          <AnimatePresence>
            {userWordlists.length > 0 && (
              <SettingSection
                title="Custom Wordlists"
                icon={<BookMarked className="w-5 h-5" />}
                accentColor="blue"
                defaultCollapsed={false}
              >
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/40">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Manage Your Wordlists
                          </h4>
                          <p className="text-sm text-blue-600/80 dark:text-blue-300/80">
                            Your custom wordlists are stored securely. Deleting
                            a wordlist will permanently remove it from your
                            device.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsDeleteAllWordlistsOpen(true)}
                        className="ml-4 flex-shrink-0 inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 border border-red-200 dark:border-red-800/40 hover:shadow-md"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {visibleWordlists.map((wordlist) => (
                      <div
                        key={wordlist.id}
                        className="group bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800/40"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {wordlist.title || wordlist.language}
                            </h3>
                            <div className="flex items-center mt-1 space-x-3">
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <BarChart className="w-4 h-4 mr-1.5 opacity-70" />
                                {wordlist.words.length} words
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => openDeleteConfirmation(wordlist)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                          aria-label={`Delete ${
                            wordlist.title || wordlist.language
                          } wordlist`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {userWordlists.length > ITEMS_PER_PAGE && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full py-3 px-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 border border-blue-200 dark:border-blue-800/40"
                    >
                      <span>
                        {isExpanded
                          ? "Show Less"
                          : `Show More (${
                              userWordlists.length - ITEMS_PER_PAGE
                            } more)`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </SettingSection>
            )}
          </AnimatePresence>

          <SettingSection
            title="Data Management"
            icon={<Database className="w-5 h-5" />}
            accentColor="blue"
            defaultCollapsed={false}
          >
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/40">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Manage Your Data
                    </h4>
                    <p className="text-sm text-blue-600/80 dark:text-blue-300/80">
                      All data is stored securely on your device. Please note
                      that resetting data cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setIsResetProgressOpen(true)}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-800/40 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800/60 transition-colors">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Reset Progress</h3>
                      <p className="text-sm text-amber-600/80 dark:text-amber-300/80 mt-0.5">
                        Clear all learning progress and statistics
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-500 dark:text-amber-400 opacity-60" />
                </button>

                <button
                  onClick={() => setIsResetAllDataOpen(true)}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-800/40 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/60 transition-colors">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Reset All Data</h3>
                      <p className="text-sm text-red-600/80 dark:text-red-300/80 mt-0.5">
                        Remove all data including progress and custom wordlists
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-500 dark:text-red-400 opacity-60" />
                </button>
              </div>
            </div>
          </SettingSection>

          {/* Footer Section */}
          <div className="col-span-1 md:col-span-2 mt-8">
            <div className="border-t border-gray-200 dark:border-gray-700/50 bg-white/90 dark:bg-secondary-800/90 backdrop-blur-lg py-6 px-7 rounded-xl shadow-md">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center mb-2">
                    <img
                      src="/spelling-master-icon.svg"
                      alt="Spelling Master Logo"
                      className="w-6 h-6 mr-2"
                    />
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Spelling Master
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    v0.1.0 — Improve your spelling skills
                  </p>
                </div>
                <div className="flex items-center space-x-6">
                  <Link
                    to="/help"
                    className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 flex items-center text-sm font-medium transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help Center
                  </Link>
                  <Link
                    to="/about"
                    className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 flex items-center text-sm font-medium transition-colors"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    About
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirm Dialog for Reset Progress */}
      <ConfirmDialog
        title="Reset Progress"
        message="Are you sure you want to reset your progress? This action cannot be undone."
        isOpen={isResetProgressOpen}
        onConfirm={() => {
          clearProgress();
          setIsResetProgressOpen(false);
          showToast("Progress has been reset successfully");
        }}
        onCancel={() => setIsResetProgressOpen(false)}
      />

      {/* Confirm Dialog for Reset All Data */}
      <ConfirmDialog
        title="Reset All Data"
        message="Are you sure you want to reset all data? This will remove all progress and custom word lists."
        isOpen={isResetAllDataOpen}
        onConfirm={() => {
          clearAllData();
          setIsResetAllDataOpen(false);
          showToast("All data has been reset successfully");
        }}
        onCancel={() => setIsResetAllDataOpen(false)}
      />

      {/* New confirm dialog for deleting wordlist */}
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

      {/* Confirm Dialog for Delete All Wordlists */}
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
      />
    </div>
  );
};

export default SettingsPage;
