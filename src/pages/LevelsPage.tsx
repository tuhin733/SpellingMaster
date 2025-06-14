import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProgress } from "../contexts/ProgressContext";
import { useApp } from "../contexts/AppContext";
import Header from "../components/Header";
import LevelCard from "../components/LevelCard";
import { ArrowLeft } from "lucide-react";
import CircleProgress from "../components/CircleProgress";
import { StreakDisplay } from "../components";
import Spinner from "../components/Spinner";

const LevelsPage: React.FC = () => {
  const { wordlistId } = useParams<{ wordlistId: string }>();
  const navigate = useNavigate();
  const { userProgress } = useProgress();
  const { wordlists, settings } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Short delay to prevent flickering
        await new Promise((resolve) => setTimeout(resolve, 500));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  const wordlist = wordlists.find((w) => w.id === wordlistId);

  if (!wordlist) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col transition-colors dark:bg-secondary-900">
        <Header showBack title="Not Found" />
        <div className="flex-1 container mx-auto p-3 sm:p-4 max-w-3xl flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-3 sm:mb-4 dark:text-gray-300">
              Wordlist not found.
            </p>
            <button
              onClick={() => navigate("/")}
              className="flex items-center mx-auto text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { language, words } = wordlist;
  // Get progress from Firebase using wordlistId
  const progressKey = wordlist.id;
  const progress = userProgress[progressKey];

  const wordsPerLevel = settings.studySessionSettings.wordsPerSession;
  const totalLevels = Math.ceil(words.length / wordsPerLevel);
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  // Calculate progress
  const completed = progress?.completedLevels.length || 0;
  const percentage =
    totalLevels > 0 ? Math.round((completed / totalLevels) * 100) : 0;
  const masteredWords = progress?.masteredWords?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col transition-colors dark:bg-secondary-900">
      <Header showBack title={`${language} Levels`} />
      <main className="flex-1 container-content main-content">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 dark:text-gray-100">
                Select a Level
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm dark:text-gray-300">
                Each level contains {wordsPerLevel} words to practice.
              </p>

              {progress && (
                <div className="mt-2 sm:mt-3 bg-blue-50 p-2 sm:p-3 rounded-lg dark:bg-blue-900/30">
                  <p className="text-blue-700 text-xs sm:text-sm dark:text-blue-300">
                    <span className="font-medium">{completed}</span> of{" "}
                    <span className="font-medium">{totalLevels}</span> levels
                    completed ({masteredWords} words mastered)
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col items-center">
              <CircleProgress
                progress={percentage}
                size={60}
                strokeWidth={6}
                progressColor="#3b82f6"
                circleColor="#e2e8f0"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden">
            <StreakDisplay language={language} wordlistId={wordlist.id} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {levels.map((level) => {
            // Calculate actual word count for this level
            const startIndex = (level - 1) * wordsPerLevel;
            const endIndex = Math.min(startIndex + wordsPerLevel, words.length);
            const actualWordCount = endIndex - startIndex;

            return (
              <LevelCard
                key={level}
                language={language}
                wordlistId={wordlist.id}
                level={level}
                totalLevels={totalLevels}
                wordCount={actualWordCount}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default LevelsPage;
