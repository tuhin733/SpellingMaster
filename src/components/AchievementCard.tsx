import React from "react";
import { motion } from "framer-motion";
import { Award, Star, Target, BookOpen, Globe } from "lucide-react";
import { format } from "date-fns";
import { UserStatistics } from "../types";

interface AchievementCardProps {
  achievement: UserStatistics["achievements"][0];
  className?: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  className = "",
}) => {
  const getIcon = () => {
    switch (achievement.type) {
      case "streak":
        return <Star className="w-6 h-6 text-yellow-500" />;
      case "accuracy":
        return <Target className="w-6 h-6 text-green-500" />;
      case "words":
        return <BookOpen className="w-6 h-6 text-blue-500" />;
      case "language":
        return <Globe className="w-6 h-6 text-purple-500" />;
      default:
        return <Award className="w-6 h-6 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (achievement.type) {
      case "streak":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "accuracy":
        return "bg-green-50 dark:bg-green-900/20";
      case "words":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "language":
        return "bg-purple-50 dark:bg-purple-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp || isNaN(timestamp)) {
      return "Recently";
    }
    try {
      return format(timestamp, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Recently";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className} ${getBackgroundColor()} rounded-lg p-6 shadow-sm`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
          {getIcon()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {achievement.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {achievement.description}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Earned {formatDate(achievement.earnedAt)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementCard;
