import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStatistics } from "../hooks";
import Header from "../components/Header";
import Spinner from "../components/Spinner";
import {
  LineChart,
  PieChart,
  Award,
  BookOpen,
  Target,
  Flame,
  Globe2,
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
  Scale,
  CoreScaleOptions,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import { UserStatistics } from "../types";
import { format, parseISO, subDays } from "date-fns";
import StatCard from "../components/StatCard";
import AchievementCard from "../components/AchievementCard";
import LanguageStats from "../components/LanguageStats";
import { Alert } from "../components/Alert";

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

// Default values for statistics
const defaultStats: UserStatistics = {
  totalWords: 0,
  correctWords: 0,
  incorrectWords: 0,
  accuracy: 0,
  streaks: {
    currentStreak: 0,
    bestStreak: 0,
    lastPracticeDate: 0,
  },
  languageStats: {},
  practiceHistory: {
    daily: {},
    weekly: {},
    monthly: {},
  },
  achievements: [],
  lastUpdated: Date.now(),
};

const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { statistics, isLoading, error } = useStatistics();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "all">(
    "week"
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "languages" | "achievements"
  >("overview");

  // Safely access statistics with defaults
  const stats: UserStatistics = {
    ...defaultStats,
    ...statistics,
    // Ensure nested objects have defaults
    streaks: { ...defaultStats.streaks, ...(statistics?.streaks || {}) },
    languageStats: {
      ...defaultStats.languageStats,
      ...(statistics?.languageStats || {}),
    },
    practiceHistory: {
      daily: {
        ...defaultStats.practiceHistory.daily,
        ...(statistics?.practiceHistory?.daily || {}),
      },
      weekly: {
        ...defaultStats.practiceHistory.weekly,
        ...(statistics?.practiceHistory?.weekly || {}),
      },
      monthly: {
        ...defaultStats.practiceHistory.monthly,
        ...(statistics?.practiceHistory?.monthly || {}),
      },
    },
    achievements: statistics?.achievements || defaultStats.achievements,
  };

  if (isLoading) {
    return (
      <>
        <Header
          title="Performance Statistics"
          showBack
          showSettings={false}
          className="fixed top-0 left-0 right-0 z-50"
        />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      </>
    );
  }

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  if (error) {
    return (
      <>
        <Header
          title="Performance Statistics"
          showBack
          showSettings={false}
          className="fixed top-0 left-0 right-0 z-50"
        />
        <div className="min-h-screen pt-16">
          <main className="container mx-auto px-4 py-8">
            <Alert
              type="error"
              title="Error Loading Statistics"
              message="There was a problem loading your statistics. Please try again later."
            />
          </main>
        </div>
      </>
    );
  }

  if (!statistics) {
    return (
      <>
        <Header
          title="Performance Statistics"
          showBack
          showSettings={false}
          className="fixed top-0 left-0 right-0 z-50"
        />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 pt-20">
          <div className="container mx-auto px-4 h-[calc(100vh-4rem)] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Award className="h-10 w-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                No Statistics Available
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Complete some spelling practice to see your performance
                statistics.
              </p>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow"
              >
                Start Practice
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </button>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Prepare data for charts
  const prepareDailyProgressData = () => {
    const now = new Date();
    const days = timePeriod === "week" ? 7 : timePeriod === "month" ? 30 : 90;
    const dates = Array.from({ length: days }, (_, i) => subDays(now, i))
      .reverse()
      .map((date) => format(date, "yyyy-MM-dd"));

    const data = dates.map((date) => {
      const dailyStats = stats.practiceHistory?.daily?.[date] || {
        totalWords: 0,
        correctWords: 0,
      };

      const accuracy =
        dailyStats.totalWords > 0
          ? Math.round((dailyStats.correctWords / dailyStats.totalWords) * 100)
          : null;

      return {
        date,
        accuracy,
      };
    });

    return {
      labels: data.map((d) => format(parseISO(d.date), "MMM d")),
      datasets: [
        {
          label: "Daily Accuracy (%)",
          data: data.map((d) => d.accuracy),
          borderColor: "rgba(59, 130, 246, 0.8)",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          spanGaps: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "rgba(59, 130, 246, 1)",
          pointBorderColor: "rgba(255, 255, 255, 1)",
          pointBorderWidth: 2,
        },
      ],
    };
  };

  const prepareLanguageDistributionData = () => {
    const data = Object.entries(stats.languageStats).map(([lang, stats]) => ({
      language: lang,
      words: stats.totalWords || 0,
    }));

    return {
      labels: data.map((d) => {
        const langCode = d.language;
        const langName =
          LANGUAGE_OPTIONS.find((l) => l.code === langCode)?.name || langCode;
        return langName;
      }),
      datasets: [
        {
          data: data.map((d) => d.words),
          backgroundColor: [
            "rgba(59, 130, 246, 0.6)", // blue
            "rgba(16, 185, 129, 0.6)", // green
            "rgba(245, 158, 11, 0.6)", // yellow
            "rgba(239, 68, 68, 0.6)", // red
            "rgba(139, 92, 246, 0.6)", // purple
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(139, 92, 246, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Base chart options
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgb(107, 114, 128)",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "rgb(17, 24, 39)",
        bodyColor: "rgb(55, 65, 81)",
        borderColor: "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
      },
    },
  };

  // Line chart options
  const lineChartOptions = {
    ...baseChartOptions,
    scales: {
      x: {
        type: "category" as const,
        grid: {
          color: "rgba(209, 213, 219, 0.2)",
        },
        ticks: {
          color: "rgb(107, 114, 128)",
        },
      },
      y: {
        type: "linear" as const,
        beginAtZero: true,
        suggestedMax: 100,
        grid: {
          color: "rgba(209, 213, 219, 0.2)",
        },
        ticks: {
          color: "rgb(107, 114, 128)",
          callback: function (
            this: Scale<CoreScaleOptions>,
            value: string | number
          ) {
            return typeof value === "number" ? value + "%" : value;
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: "rgba(59, 130, 246, 1)",
        borderColor: "rgba(255, 255, 255, 1)",
        borderWidth: 2,
      },
      line: {
        tension: 0.4,
      },
    },
  };

  // Pie chart options
  const pieChartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        ...baseChartOptions.plugins.legend,
        position: "right" as const,
      },
    },
  };

  return (
    <>
      <Header
        title="Performance Statistics"
        showBack
        showSettings={false}
        className="fixed top-0 left-0 right-0 z-50"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 pt-20">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Words"
              value={stats.totalWords}
              icon={
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              }
            />
            <StatCard
              title="Overall Accuracy"
              value={`${stats.accuracy}%`}
              icon={
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              }
            />
            <StatCard
              title="Current Streak"
              value={stats.streaks.currentStreak}
              subtitle={`Best: ${stats.streaks.bestStreak}`}
              icon={
                <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              }
            />
            <StatCard
              title="Languages"
              value={Object.keys(stats.languageStats).length}
              icon={
                <Globe2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              }
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 mb-6 sm:mb-8 shadow-sm sticky top-16 sm:top-20 z-40 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md ${
                activeTab === "overview"
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("languages")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md ${
                activeTab === "languages"
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Languages
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md ${
                activeTab === "achievements"
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Achievements
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Time Period Selector */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
                <div className="flex justify-end">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button
                      onClick={() => setTimePeriod("week")}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-l-lg ${
                        timePeriod === "week"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setTimePeriod("month")}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
                        timePeriod === "month"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setTimePeriod("all")}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-r-lg ${
                        timePeriod === "all"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      }`}
                    >
                      All Time
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    Progress Over Time
                  </h3>
                </div>
                <div className="h-48 sm:h-64">
                  <Line
                    data={prepareDailyProgressData()}
                    options={lineChartOptions}
                  />
                </div>
              </div>

              {/* Language Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  Language Distribution
                </h3>
                <div className="h-48 sm:h-64">
                  <Pie
                    data={prepareLanguageDistributionData()}
                    options={pieChartOptions}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "languages" && (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(stats.languageStats).map(([language, stats]) => (
                <LanguageStats
                  key={language}
                  language={language}
                  stats={stats}
                />
              ))}
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {(stats.achievements || []).map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
              {(stats.achievements || []).length === 0 && (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <Award className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No Achievements Yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    Keep practicing to earn achievements!
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default StatisticsPage;
