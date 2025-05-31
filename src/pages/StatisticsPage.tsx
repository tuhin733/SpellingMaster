import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../contexts/ProgressContext";
import { useApp } from "../contexts/AppContext";
import Header from "../components/Header";
import {
  BarChart,
  LineChart,
  PieChart,
  CalendarDaysIcon,
  TrendingUp,
  Award,
  BookOpen,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { LevelResult } from "../types";
import { format, parseISO, subDays } from "date-fns";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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

const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { levelResults } = useProgress();
  const { wordlists, settings } = useApp();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "all">(
    "week"
  );
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);

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

  // Filter results by language and time period
  const filteredResults = React.useMemo(() => {
    let results = [...levelResults];

    // Filter by language
    if (selectedLanguage !== "all") {
      const selectedLangOption = LANGUAGE_OPTIONS.find(
        (lang) => lang.code === selectedLanguage
      );
      if (selectedLangOption) {
        results = results.filter(
          (result) =>
            result.language === selectedLanguage || // Match by language code
            result.language === selectedLangOption.code || // Match by language code
            result.language.toLowerCase() ===
              selectedLangOption.name.toLowerCase() || // Match by language name
            result.language.toLowerCase() ===
              selectedLangOption.code.split("-")[0].toLowerCase() // Match by short language code
        );
      }
    }

    // Filter by time period
    const now = new Date();
    if (timePeriod === "week") {
      const weekAgo = subDays(now, 7).getTime();
      results = results.filter((result) => result.date >= weekAgo);
    } else if (timePeriod === "month") {
      const monthAgo = subDays(now, 30).getTime();
      results = results.filter((result) => result.date >= monthAgo);
    }

    return results;
  }, [levelResults, selectedLanguage, timePeriod]);

  // Language options (based on available wordlists)
  const languageOptions = React.useMemo(() => {
    const languages = wordlists.map((list) => list.language);
    return ["all", ...new Set(languages)];
  }, [wordlists]);

  // Prepare data for charts
  const prepareDailyProgressData = () => {
    // Group results by day
    const resultsByDay: Record<string, LevelResult[]> = {};
    filteredResults.forEach((result) => {
      const date = new Date(result.date);
      const dateStr = format(date, "yyyy-MM-dd");
      if (!resultsByDay[dateStr]) {
        resultsByDay[dateStr] = [];
      }
      resultsByDay[dateStr].push(result);
    });

    // Sort by date
    const sortedDays = Object.keys(resultsByDay).sort();

    // Create datasets
    const labels = sortedDays.map((date) => format(parseISO(date), "MMM d"));
    const scores = sortedDays.map((day) => {
      const dayResults = resultsByDay[day];
      const totalScore = dayResults.reduce(
        (sum, result) => sum + result.score,
        0
      );
      const totalPossible = dayResults.reduce(
        (sum, result) => sum + result.total,
        0
      );
      return totalPossible > 0
        ? Math.round((totalScore / totalPossible) * 100)
        : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: "Daily Score (%)",
          data: scores,
          borderColor:
            settings.theme === "dark"
              ? "rgba(59, 130, 246, 0.8)"
              : "rgba(37, 99, 235, 1)",
          backgroundColor:
            settings.theme === "dark"
              ? "rgba(59, 130, 246, 0.2)"
              : "rgba(37, 99, 235, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const prepareWordsMasteredData = () => {
    // Group results by language
    const wordsByLanguage: Record<string, Set<string>> = {};

    filteredResults.forEach((result) => {
      if (!wordsByLanguage[result.language]) {
        wordsByLanguage[result.language] = new Set();
      }

      result.results.forEach((wordResult) => {
        if (wordResult.correct) {
          wordsByLanguage[result.language].add(wordResult.word);
        }
      });
    });

    const labels = Object.keys(wordsByLanguage);
    const data = labels.map((language) => wordsByLanguage[language].size);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareLevelPerformanceData = () => {
    if (selectedLanguage === "all") {
      // Don't show level performance for "all" languages
      return {
        labels: [],
        datasets: [
          {
            label: "Select a specific language to view level performance",
            data: [],
            backgroundColor: "rgba(0, 0, 0, 0)",
          },
        ],
      };
    }

    // Group results by level
    const resultsByLevel: Record<number, LevelResult[]> = {};
    filteredResults
      .filter((result) => result.language === selectedLanguage)
      .forEach((result) => {
        if (!resultsByLevel[result.level]) {
          resultsByLevel[result.level] = [];
        }
        resultsByLevel[result.level].push(result);
      });

    const levels = Object.keys(resultsByLevel)
      .map(Number)
      .sort((a, b) => a - b);

    // For each level, get the average score percentage
    const labels = levels.map((level) => `Level ${level}`);
    const data = levels.map((level) => {
      const levelResults = resultsByLevel[level];
      const totalScore = levelResults.reduce(
        (sum, result) => sum + result.score,
        0
      );
      const totalPossible = levelResults.reduce(
        (sum, result) => sum + result.total,
        0
      );
      return totalPossible > 0
        ? Math.round((totalScore / totalPossible) * 100)
        : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: "Level Performance (%)",
          data,
          backgroundColor:
            settings.theme === "dark"
              ? "rgba(16, 185, 129, 0.6)"
              : "rgba(5, 150, 105, 0.6)",
          borderColor:
            settings.theme === "dark"
              ? "rgba(16, 185, 129, 1)"
              : "rgba(5, 150, 105, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: settings.theme === "dark" ? "#f3f4f6" : "#374151",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor:
          settings.theme === "dark"
            ? "rgba(30, 41, 59, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        titleColor: settings.theme === "dark" ? "#f3f4f6" : "#111827",
        bodyColor: settings.theme === "dark" ? "#e5e7eb" : "#374151",
        borderColor:
          settings.theme === "dark"
            ? "rgba(71, 85, 105, 0.5)"
            : "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: settings.theme === "dark" ? "#d1d5db" : "#374151",
        },
        grid: {
          color:
            settings.theme === "dark"
              ? "rgba(75, 85, 99, 0.2)"
              : "rgba(209, 213, 219, 0.2)",
        },
      },
      y: {
        ticks: {
          color: settings.theme === "dark" ? "#d1d5db" : "#374151",
        },
        grid: {
          color:
            settings.theme === "dark"
              ? "rgba(75, 85, 99, 0.2)"
              : "rgba(209, 213, 219, 0.2)",
        },
      },
    },
  };

  // Calculate summary statistics
  const totalPracticed = filteredResults.length;

  const averageAccuracy =
    filteredResults.length > 0
      ? Math.round(
          filteredResults.reduce(
            (sum, result) => sum + (result.score / result.total) * 100,
            0
          ) / filteredResults.length
        )
      : 0;

  const uniqueWordsPracticed = new Set(
    filteredResults.flatMap((result) => result.results.map((r) => r.word))
  ).size;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Custom language selector component
  const LanguageSelector = () => {
    const selectedLang = LANGUAGE_OPTIONS.find(
      (lang) => lang.code === selectedLanguage
    );

    return (
      <div className="relative" ref={languageRef}>
        <button
          type="button"
          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
          className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-100 transition-all flex items-center justify-between"
        >
          <span className="flex items-center">
            {selectedLang ? (
              <>
                <span className="mr-2">{selectedLang.name}</span>
                <span className="text-xs text-secondary-500">
                  ({selectedLang.code})
                </span>
              </>
            ) : (
              <span className="text-secondary-500">Select a language</span>
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
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-secondary-200 dark:bg-secondary-800 dark:border-secondary-700 max-h-60 overflow-y-auto">
            <div className="py-1">
              <button
                onClick={() => {
                  setSelectedLanguage("all");
                  setIsLanguageOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors flex items-center justify-between ${
                  selectedLanguage === "all"
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                    : "text-secondary-700 dark:text-secondary-300"
                }`}
              >
                <span>All Languages</span>
                {selectedLanguage === "all" && (
                  <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    setIsLanguageOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors flex items-center justify-between ${
                    selectedLanguage === lang.code
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                      : "text-secondary-700 dark:text-secondary-300"
                  }`}
                >
                  <div className="flex items-center">
                    <span>{lang.name}</span>
                    <span className="text-xs text-secondary-500 ml-2">
                      {lang.code}
                    </span>
                  </div>
                  {selectedLanguage === lang.code && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col dark:from-secondary-900 dark:to-secondary-950">
      <Header showBack title="Performance Statistics" />
      <main className="flex-1 container mx-auto px-4 py-5 max-w-4xl main-content">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Filter controls */}
          <motion.div
            variants={item}
            className="bg-white rounded-xl p-5 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-64">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <LanguageSelector />
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Time Period
                </label>
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setTimePeriod("week")}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                      timePeriod === "week"
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-secondary-700 dark:text-white dark:border-secondary-600 dark:hover:bg-secondary-600"
                    }`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimePeriod("month")}
                    className={`px-4 py-2 text-sm font-medium border-t border-b ${
                      timePeriod === "month"
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-secondary-700 dark:text-white dark:border-secondary-600 dark:hover:bg-secondary-600"
                    }`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimePeriod("all")}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                      timePeriod === "all"
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-secondary-700 dark:text-white dark:border-secondary-600 dark:hover:bg-secondary-600"
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary stats */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700 flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-4">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sessions
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {totalPracticed}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700 flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 mr-4">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg. Accuracy
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {averageAccuracy}%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700 flex items-center">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-4">
                <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Words Practiced
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {uniqueWordsPracticed}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Daily Progress Chart */}
          <motion.div
            variants={item}
            className="bg-white rounded-xl p-5 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700"
          >
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-blue-500" />
                Daily Progress
              </h3>
            </div>
            <div className="h-64">
              {filteredResults.length > 0 ? (
                <Line
                  data={prepareDailyProgressData()}
                  options={commonOptions}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No data available for the selected filters
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Level Performance Chart */}
          <motion.div
            variants={item}
            className="bg-white rounded-xl p-5 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700"
          >
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <BarChart className="w-5 h-5 text-green-500" />
                Level Performance
              </h3>
            </div>
            <div className="h-64">
              {filteredResults.length > 0 && selectedLanguage !== "all" ? (
                <Bar
                  data={prepareLevelPerformanceData()}
                  options={commonOptions}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedLanguage === "all"
                      ? "Select a specific language to view level performance"
                      : "No data available for the selected filters"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Words Mastered Per Language Chart */}
          {selectedLanguage === "all" && filteredResults.length > 0 && (
            <motion.div
              variants={item}
              className="bg-white rounded-xl p-5 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700"
            >
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" />
                  Words Mastered Per Language
                </h3>
              </div>
              <div className="h-80">
                <Pie
                  data={prepareWordsMasteredData()}
                  options={{
                    ...commonOptions,
                    plugins: {
                      ...commonOptions.plugins,
                      legend: {
                        ...commonOptions.plugins.legend,
                        position: "right",
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          )}

          {filteredResults.length === 0 && (
            <motion.div
              variants={item}
              className="bg-white rounded-xl p-8 shadow-md border border-gray-100 dark:bg-secondary-800 dark:border-secondary-700 text-center"
            >
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                No Statistics Available
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Complete some spelling practice to see your performance
                statistics.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Practice
              </button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default StatisticsPage;
