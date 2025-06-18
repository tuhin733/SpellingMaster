import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  XCircle,
  Upload,
  Download,
  FileText,
  AlertCircle,
  Check,
  FileType as FileTypeIcon,
} from "lucide-react";
import {
  parseFile,
  downloadTemplate,
  detectFileTypeFromContent,
} from "../utils/fileParser";
import { Wordlist } from "../types";
import * as db from "../utils/indexedDb";
import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "./Tooltip";
import { useScrollLock } from "../hooks/useScrollLock";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wordlist: Wordlist) => void;
}

type FileType = "txt" | "json" | "csv";

// Language options with their codes
const LANGUAGE_OPTIONS = [
  { code: "en-US", name: "English" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "es-ES", name: "Spanish" },
  { code: "pt-BR", name: "Portuguese" },
  { code: "hi-IN", name: "Hindi" },
  { code: "ar-SA", name: "Arabic" },
  { code: "ru-RU", name: "Russian" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "tr-TR", name: "Turkish" },
  { code: "ta-IN", name: "Tamil" },
  { code: "vi-VN", name: "Vietnamese" },
  { code: "ur-PK", name: "Urdu" },
  { code: "bn-IN", name: "Bengali" },
];

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(
    null
  );
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formatDetected, setFormatDetected] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // md breakpoint
  const languageRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useScrollLock(isOpen);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setSelectedLanguage("");
      setSelectedFileType(null);
      setFile(null);
      setError(null);
      setUploadProgress(0);
      setFormatDetected(false);
    }
  }, [isOpen]);

  // Simulate progress during upload
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isLoading && uploadProgress < 90) {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading, uploadProgress]);

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

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Validate file type and set file
  const validateAndSetFile = async (file: File) => {
    setError(null);
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["txt", "csv", "json"].includes(extension as string)) {
      // Try to detect type from content
      try {
        const content = await file.text();
        const detectedType = detectFileTypeFromContent(content);

        if (detectedType) {
          setSelectedFileType(detectedType);
          setFile(file);
          setFormatDetected(true);

          // Try to detect language from file content
          if (detectedType === "json") {
            try {
              const parsed = JSON.parse(content);
              if (parsed.language) {
                setSelectedLanguage(parsed.language);
              }
              if (parsed.description) {
                setTitle(parsed.description);
              }
            } catch (e) {
              // Invalid JSON, ignore
            }
          } else {
            // For txt and csv, try to detect language and description from comments
            const lines = content.split(/\r?\n/);
            let description = "";
            for (const line of lines) {
              if (line.startsWith("#")) {
                const languageMatch = line.match(/Language:\s*(.+)/i);
                const descriptionMatch = line.match(/Description:\s*(.+)/i);
                if (languageMatch) {
                  setSelectedLanguage(languageMatch[1].trim());
                }
                if (descriptionMatch) {
                  description = descriptionMatch[1].trim();
                }
              }
            }
            if (description) {
              setTitle(description); // Set the description as the title if found
            }
          }
          return;
        }
      } catch (e) {
        // Failed to read file or detect type
      }

      setError("Invalid file type. Please upload a .txt, .csv, or .json file.");
      return;
    }

    setSelectedFileType(extension as FileType);
    setFile(file);
    setFormatDetected(extension !== file.name.split(".").pop()?.toLowerCase());

    // Try to detect language from file content
    try {
      const content = await file.text();
      if (extension === "json") {
        const parsed = JSON.parse(content);
        if (parsed.language) {
          setSelectedLanguage(parsed.language);
        }
      } else {
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith("#")) {
            const languageMatch = line.match(/Language:\s*(.+)/i);
            if (languageMatch) {
              setSelectedLanguage(languageMatch[1].trim());
              break;
            }
          }
        }
      }
    } catch (e) {
      // Failed to read file or detect language, ignore
    }
  };

  // Handle upload button click
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title for your wordlist.");
      return;
    }

    if (!selectedLanguage) {
      setError("Please select a language for your wordlist.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress(10);

      // Get language code from selected language
      const languageCode =
        LANGUAGE_OPTIONS.find((lang) => lang.name === selectedLanguage)?.code ||
        "en-US";

      // Parse file
      const wordlist = await parseFile(file, title, languageCode);
      setUploadProgress(50);

      // Check if the wordlist has words
      if (!wordlist.words || wordlist.words.length === 0) {
        throw new Error(
          "No words found in the file. Please check the file format."
        );
      }

      // Save to IndexedDB
      await db.saveWordlist(wordlist);
      setUploadProgress(90);

      // Complete the progress bar
      setUploadProgress(100);

      // Wait for success animation to complete before proceeding
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Prepare data for parent component before closing modal
      const wordlistToReturn = { ...wordlist };

      // Set loading to false before closing to prevent animation conflicts
      setIsLoading(false);

      // Notify parent component
      onSuccess(wordlistToReturn);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload file. Please try again.");
      setUploadProgress(0);
      setIsLoading(false);
    }
  };

  // Handle template download
  const handleDownloadTemplate = (type: FileType) => {
    downloadTemplate(type);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen) return null;

  // Get the color class and icon for file type
  const getFileTypeInfo = (type: FileType | null) => {
    switch (type) {
      case "txt":
        return {
          icon: <FileText className="w-6 h-6" />,
          color: "text-blue-500 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          label: "Text file",
        };
      case "json":
        return {
          icon: <FileTypeIcon className="w-6 h-6" />,
          color: "text-purple-500 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          label: "JSON file",
        };
      case "csv":
        return {
          icon: <FileText className="w-6 h-6" />,
          color: "text-green-500 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          label: "CSV file",
        };
      default:
        return {
          icon: <FileText className="w-6 h-6" />,
          color: "text-gray-500 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          label: "Unknown format",
        };
    }
  };

  const fileTypeInfo = getFileTypeInfo(selectedFileType);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            initial={{
              opacity: 0,
              y: isMobile ? "100%" : "4%",
              scale: isMobile ? 1 : 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: isMobile ? "100%" : "4%",
              scale: isMobile ? 1 : 0.95,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            className={`relative w-full ${
              isMobile ? "max-h-[90vh] rounded-t-xl" : "max-w-xl rounded-xl m-4"
            } bg-white shadow-xl dark:bg-secondary-800`}
          >
            {/* Mobile drag indicator */}
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
                Upload Custom Wordlist
              </h2>
              <Tooltip content="Close">
                <button
                  onClick={onClose}
                  className="text-secondary-500 hover:text-secondary-600 dark:text-secondary-400 dark:hover:text-secondary-300 transition-colors"
                  aria-label="Close modal"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </Tooltip>
            </div>

            {/* Main content */}
            <div
              className={`space-y-4 p-4 ${
                isMobile ? "overflow-y-auto max-h-[calc(90vh-120px)]" : ""
              }`}
            >
              {/* Drag and drop zone */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 h-[180px] flex items-center justify-center ${
                  isDragging
                    ? "border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20"
                    : file
                    ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20"
                    : "border-secondary-200 hover:border-primary-400 hover:bg-secondary-50 dark:border-secondary-600 dark:hover:border-primary-500 dark:hover:bg-secondary-800/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt,.json,.csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="Upload file"
                />

                {file ? (
                  <div className="w-full">
                    <div className="flex items-center justify-center mb-2">
                      <div
                        className={`p-2.5 rounded-xl ${fileTypeInfo.bgColor} ${fileTypeInfo.color}`}
                      >
                        {fileTypeInfo.icon}
                      </div>
                    </div>
                    <p className="text-base font-medium text-green-700 dark:text-green-400 mb-1.5">
                      {file.name}
                    </p>
                    {selectedFileType && (
                      <div className="flex items-center justify-center mb-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                            formatDetected
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          }`}
                        >
                          {formatDetected ? (
                            <>
                              <Check className="w-4 h-4 mr-1.5" /> Format
                              auto-detected: {selectedFileType.toUpperCase()}
                            </>
                          ) : (
                            <>{fileTypeInfo.label}</>
                          )}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-secondary-400 dark:text-secondary-500" />
                    <p className="text-base font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                      Drop your file here, or click to browse
                    </p>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      Supported formats: .txt, .json, .csv
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Title and Language inputs in a single row */}
              <div
                className={`${
                  isMobile
                    ? "flex flex-col space-y-3"
                    : "grid grid-cols-2 gap-4"
                }`}
              >
                {/* Title input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Custom Wordlist"
                    className={`w-full px-3 ${
                      isMobile ? "py-3" : "py-2"
                    } text-sm border border-secondary-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-100 dark:focus:border-blue-400 dark:focus:ring-blue-800 transition-all outline-none`}
                    required
                  />
                </div>

                {/* Language selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Language
                  </label>
                  <div className="relative" ref={languageRef}>
                    <button
                      type="button"
                      onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                      className={`w-full ${
                        isMobile ? "py-3" : "py-2"
                      } px-3 text-sm border border-secondary-200 rounded-lg shadow-sm focus:outline-none dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-100 transition-all flex items-center justify-between`}
                    >
                      <span className="flex items-center">
                        {selectedLanguage ? (
                          <>
                            <span className="mr-2">{selectedLanguage}</span>
                            <span className="text-xs text-secondary-500">
                              (
                              {
                                LANGUAGE_OPTIONS.find(
                                  (lang) => lang.name === selectedLanguage
                                )?.code
                              }
                              )
                            </span>
                          </>
                        ) : (
                          <span className="text-secondary-500">
                            Select a language
                          </span>
                        )}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isLanguageOpen ? "rotate-180" : ""
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

                    {isLanguageOpen && (
                      <div
                        className={`absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700 ${
                          isMobile
                            ? "fixed inset-x-0 bottom-0 rounded-b-none max-h-[50vh]"
                            : "max-h-[200px]"
                        } overflow-y-auto scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-track]:bg-gray-800/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400/60 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500`}
                        style={
                          isMobile
                            ? { width: "100vw", left: "-16px" }
                            : {
                                maxHeight:
                                  "min(200px, calc(100vh - 100% - 1rem))",
                              }
                        }
                      >
                        {isMobile && (
                          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800">
                            <h3 className="text-base font-semibold">
                              Select Language
                            </h3>
                            <button
                              onClick={() => setIsLanguageOpen(false)}
                              className="p-1 text-secondary-500 hover:text-secondary-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        <div className="py-1">
                          {LANGUAGE_OPTIONS.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setSelectedLanguage(lang.name);
                                setIsLanguageOpen(false);
                              }}
                              className={`w-full px-4 ${
                                isMobile ? "py-4" : "py-2"
                              } text-sm text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors flex items-center justify-between ${
                                selectedLanguage === lang.name
                                  ? "text-secondary-700 dark:text-secondary-300"
                                  : "text-secondary-700 dark:text-secondary-300"
                              }`}
                            >
                              <div className="flex items-center">
                                <span>{lang.name}</span>
                              </div>
                              {selectedLanguage === lang.name && (
                                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Template download section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-3 bg-blue-50 rounded-xl border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30"
              >
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-500 mr-2.5 mt-0.5 dark:text-blue-400" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                      Download Template
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                      Download a template file to see the required format.
                    </p>
                    <div className="flex gap-2">
                      <Tooltip
                        content="Download plain text template"
                        position="top"
                      >
                        <button
                          onClick={() => handleDownloadTemplate("txt")}
                          className="inline-flex items-center text-sm font-medium bg-white text-blue-700 hover:bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/60 transition-all"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          TXT
                        </button>
                      </Tooltip>
                      <Tooltip content="Download JSON template" position="top">
                        <button
                          onClick={() => handleDownloadTemplate("json")}
                          className="inline-flex items-center text-sm font-medium bg-white text-purple-700 hover:bg-purple-50 rounded-lg px-3 py-1.5 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/60 transition-all"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          JSON
                        </button>
                      </Tooltip>
                      <Tooltip content="Download CSV template" position="top">
                        <button
                          onClick={() => handleDownloadTemplate("csv")}
                          className="inline-flex items-center text-sm font-medium bg-white text-green-700 hover:bg-green-50 rounded-lg px-3 py-1.5 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/60 transition-all"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          CSV
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 bg-red-50 rounded-lg flex items-start dark:bg-red-900/20 overflow-hidden border border-red-100 dark:border-red-800/30"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 dark:text-red-400" />
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload progress circle */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-4 left-4 flex items-center space-x-2"
                  >
                    <div className="relative w-5 h-5">
                      <svg className="w-5 h-5 transform -rotate-90">
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          strokeWidth="3"
                          className="stroke-secondary-200 dark:stroke-secondary-600"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          strokeWidth="3"
                          strokeDasharray={`${
                            (uploadProgress / 100) * 50.24
                          } 50.24`}
                          className="stroke-primary-500 dark:stroke-primary-400 transition-all duration-300"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                      {uploadProgress}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 mt-2">
                <Tooltip content="Cancel">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm hover:shadow transition-all"
                    aria-label="Cancel upload"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip
                  content={isLoading ? "Uploading..." : "Upload Wordlist"}
                >
                  <button
                    onClick={handleUpload}
                    disabled={
                      !file || !title.trim() || !selectedLanguage || isLoading
                    }
                    className={`p-2 rounded-full text-white transition-all flex items-center justify-center ${
                      !file || !title.trim() || !selectedLanguage || isLoading
                        ? "bg-primary-400 cursor-not-allowed dark:bg-primary-700"
                        : "bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 shadow-sm hover:shadow"
                    }`}
                    aria-label="Upload wordlist"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;
