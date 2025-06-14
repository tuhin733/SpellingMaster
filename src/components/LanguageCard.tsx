import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wordlist } from "../types";
import { ChevronRight, Layers, Star, Flame } from "lucide-react";
import CircleProgress from "./CircleProgress";
import { useProgress } from "../contexts/ProgressContext";
import { Badge } from "./UIComponents";
import { StreakDisplay } from ".";
import { useApp } from "../contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";

interface LanguageCardProps {
  wordlist: Wordlist;
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

const LanguageCard: React.FC<LanguageCardProps> = ({ wordlist }) => {
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { userProgress, getStreak } = useProgress();
  const { settings } = useApp();
  const {
    id,
    language,
    languageCode,
    words,
    description,
    source,
    isCustom,
    title,
  } = wordlist;

  // Use title for custom wordlists, otherwise use language
  const displayName = isCustom ? title || language : language;

  // Generate a language code (first 2 letters)
  const displayCode = useMemo(() => {
    if (isCustom && title) {
      return title.substring(0, 1).toUpperCase();
    }
    return languageCode.substring(0, 2).toUpperCase();
  }, [languageCode, isCustom, title]);

  // Generate a consistent color based on language or title for custom wordlists
  const avatarColor = useMemo(() => {
    return stringToColor(displayName);
  }, [displayName]);

  const totalWords = words.length;

  // Calculate total levels based on words per session from settings
  const wordsPerSession = settings.studySessionSettings.wordsPerSession;
  const totalLevels = Math.ceil(totalWords / wordsPerSession);

  // Get progress from Firebase using wordlistId
  const progressKey = id;
  const progress = userProgress[progressKey] || { completedLevels: [] };
  const completed = progress.completedLevels.length;
  const percentage =
    totalLevels > 0 ? Math.round((completed / totalLevels) * 100) : 0;

  // Get streak information from Firebase
  const streak = getStreak(id);
  const currentStreak = streak?.currentStreak || 0;

  // Check if text is truncated
  useEffect(() => {
    const checkTruncation = () => {
      const element = titleRef.current;
      if (element) {
        setIsTextTruncated(element.scrollWidth > element.clientWidth);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [displayName]);

  const handleClick = () => {
    navigate(`/levels/${wordlist.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative overflow-visible"
    >
      <div
        onClick={handleClick}
        className="card relative group hover:border-primary-200 hover:translate-y-[-2px] cursor-pointer animate-scale-in p-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl"
        role="button"
        aria-label={`${displayName} wordlist with ${totalWords} words`}
      >
        <div
          className="absolute top-0 left-0 w-full h-12 sm:h-16 opacity-10 rounded-t-xl"
          style={{ backgroundColor: avatarColor }}
        />
        <div className="relative z-10 pt-3 sm:pt-4 px-4 sm:px-5 pb-3 sm:pb-4 flex flex-col h-full min-h-[160px] sm:min-h-[180px] overflow-visible">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="flex flex-col">
              <div className="inline-flex items-center mb-2 sm:mb-3">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-2.5 text-white font-medium text-xs sm:text-sm shadow-sm transition-transform group-hover:scale-105"
                  style={{ backgroundColor: avatarColor }}
                >
                  {displayCode}
                </div>

                <div className="relative">
                  <h3
                    ref={titleRef}
                    className="text-base sm:text-lg font-bold text-secondary-900 dark:text-secondary-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors truncate max-w-[140px] sm:max-w-[180px]"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    {displayName}
                  </h3>
                  <AnimatePresence>
                    {showTooltip && isTextTruncated && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="absolute left-0 top-full mt-2 z-50"
                        style={{
                          width: "max-content",
                          maxWidth: "min(300px, 90vw)",
                          transform: "translateX(-25%)",
                        }}
                      >
                        <div className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
                          <div className="absolute -top-2 left-[25%] w-4 h-4 bg-white dark:bg-secondary-800 border-t border-l border-secondary-200 dark:border-secondary-700 transform rotate-45 translate-x-2" />
                          <div className="relative px-3 py-2 text-sm break-words text-secondary-900 dark:text-secondary-100">
                            {displayName}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="inline-flex items-center ml-0.5 mt-0.5 sm:mt-1 flex-wrap gap-1 sm:gap-2">
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs"
                >
                  {totalWords.toLocaleString()}{" "}
                  {totalWords === 1 ? "word" : "words"}
                </Badge>
                {isCustom && (
                  <Badge
                    variant="teal"
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs"
                  >
                    Custom
                  </Badge>
                )}
                {percentage === 100 && (
                  <Badge
                    variant="success"
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs"
                  >
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 fill-current" />
                    Completed
                  </Badge>
                )}
                {currentStreak > 0 && (
                  <Badge
                    variant="warning"
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs"
                  >
                    <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-1 sm:p-1.5 rounded-full bg-secondary-50 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors dark:bg-secondary-800 dark:group-hover:bg-primary-900/50 dark:group-hover:text-primary-400 mt-1">
              <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-secondary-500 group-hover:text-primary-600 transition-colors dark:text-secondary-400 dark:group-hover:text-primary-400" />
            </div>
          </div>

          {description && (
            <p className="text-xs sm:text-sm text-secondary-600 mb-3 sm:mb-5 mt-1 sm:mt-2 line-clamp-2 dark:text-secondary-300">
              {description}
            </p>
          )}

          <div className="flex justify-between items-end mt-auto">
            <div className="flex items-center">
              <div className="p-1 sm:p-1.5 rounded-md bg-secondary-50 mr-2 sm:mr-2.5 dark:bg-secondary-800 group-hover:bg-secondary-100 dark:group-hover:bg-secondary-700 transition-colors">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-medium text-secondary-800 dark:text-secondary-200">
                  Levels
                </span>
                <span className="text-[10px] sm:text-xs text-secondary-500 dark:text-secondary-400">
                  {completed}/{totalLevels} completed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {currentStreak > 0 && (
                <StreakDisplay
                  language={language}
                  wordlistId={id}
                  compact={true}
                />
              )}
              <CircleProgress
                progress={percentage}
                tooltipContent={`${completed}/${totalLevels} completed`}
                size={40}
                strokeWidth={4}
                progressColor={percentage === 100 ? "#0ea5e9" : "#3b82f6"}
                circleColor="#e2e8f0"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LanguageCard;
