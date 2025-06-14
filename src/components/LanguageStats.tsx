import React from "react";
import { motion } from "framer-motion";
import { Globe2, Target, BookOpen, Award } from "lucide-react";
import { UserStatistics } from "../types";

interface LanguageStatsProps {
  language: string;
  stats: UserStatistics["languageStats"][string];
  className?: string;
}

const LanguageStats: React.FC<LanguageStatsProps> = ({
  language,
  stats,
  className = "",
}) => {
  const getLanguageName = (code: string) => {
    const languageMap: { [key: string]: string } = {
      "en-US": "English",
      "fr-FR": "French",
      "de-DE": "German",
      "es-ES": "Spanish",
      "pt-BR": "Portuguese",
      "hi-IN": "Hindi",
      "ar-SA": "Arabic",
      "ru-RU": "Russian",
      "zh-CN": "Chinese",
      "ja-JP": "Japanese",
      "ko-KR": "Korean",
      "tr-TR": "Turkish",
      "ta-IN": "Tamil",
      "vi-VN": "Vietnamese",
      "ur-PK": "Urdu",
      "bn-IN": "Bengali",
    };
    return languageMap[code] || code;
  };

  const getLevelProgress = () => {
    if (!stats.levels) return [];
    return Object.entries(stats.levels)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, levelStats]) => ({
        level: Number(level),
        ...levelStats,
      }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getLanguageName(language)}
          </h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {stats.totalWords} words practiced
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Accuracy
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.accuracy}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Words
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.correctWords} / {stats.totalWords}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Levels
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {Object.keys(stats.levels || {}).length}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Level Progress
        </h4>
        {getLevelProgress().map((level) => (
          <div
            key={level.level}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Level {level.level}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {level.attempts} attempts
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Best Score
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {level.bestScore}%
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Average Score
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {level.averageScore}%
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Last Attempt
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(level.lastAttemptDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default LanguageStats;
