import React, { useState } from "react";
import { useProgress } from "../contexts/ProgressContext";
import { Award, ChevronDown, ChevronUp, Flame } from "lucide-react";

interface StreakDisplayProps {
  language: string;
  wordlistId?: string;
  compact?: boolean;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  language,
  wordlistId,
  compact = false,
}) => {
  const { getStreak } = useProgress();
  const [showAchievements, setShowAchievements] = useState(false);

  // Get streak data from Firebase using wordlistId
  const streakData = getStreak(wordlistId || language);
  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const achievements = streakData?.achievements || [];

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-1 text-orange-500 dark:text-orange-400">
        <Flame className="w-4 h-4" />
        <span className="font-medium">{currentStreak}</span>
      </div>
    );
  }

  return (
    <div className="card p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/20 border border-orange-100 dark:border-orange-800/30 rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-secondary-900 dark:text-secondary-100 flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" />
          Daily Streak
        </h3>

        {achievements.length > 0 && (
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="text-xs font-medium text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100 flex items-center gap-1"
          >
            Achievements
            {showAchievements ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      <div className="mt-3 flex justify-between overflow-x-auto">
        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {currentStreak}
          </span>
          <span className="text-xs text-secondary-600 dark:text-secondary-300">
            Current
          </span>
        </div>

        <div className="h-10 w-px bg-orange-200 dark:bg-orange-700/40"></div>

        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
            {longestStreak}
          </span>
          <span className="text-xs text-secondary-600 dark:text-secondary-300">
            Best
          </span>
        </div>

        <div className="h-10 w-px bg-orange-200 dark:bg-orange-700/40"></div>

        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
            {achievements.length}
          </span>
          <span className="text-xs text-secondary-600 dark:text-secondary-300">
            Badges
          </span>
        </div>
      </div>

      {showAchievements && achievements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700/40">
          <h4 className="text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-2 flex items-center gap-1">
            <Award className="w-3 h-3" />
            Your Achievements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((badge) => (
              <div
                key={badge}
                className="text-xs bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 py-1 px-2 rounded-full flex items-center justify-center"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;
