import styles from "../../styles/FeatureCards.module.css";
import {
  MousePointer2,
  Cloud,
  Award,
  ClipboardList,
  BarChart3,
  Languages,
} from "lucide-react";

interface AuthLeftSectionProps {
  title: string;
  subtitle: string;
}

export const AuthLeftSection = ({ title, subtitle }: AuthLeftSectionProps) => {
  return (
    <div className="hidden lg:block lg:w-1/2 bg-white dark:bg-gray-800 relative overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-secondary-900 dark:to-secondary-950" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.05]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      </div>

      <div className="h-full flex flex-col items-center justify-center text-gray-800 dark:text-white p-12 relative">
        <div className="max-w-lg w-full text-center">
          {/* App Header */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-2 mb-8">
              <img
                src="/spelling-master-icon.svg"
                alt="Spelling Master"
                className="w-12 h-12"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Spelling Master
              </h1>
            </div>
            <p className="text-xl mt-6 text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          </div>

          {/* Feature Cards with Modern Design */}
          <div className="relative h-[450px] overflow-hidden">
            <div className={`absolute w-full ${styles.animateScroll}`}>
              <div className="grid grid-cols-2 gap-6 px-4">
                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <MousePointer2 className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Interactive Learning
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Engaging exercises and quizzes
                  </p>
                </div>

                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <Cloud className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Cloud Sync
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Access from any device
                  </p>
                </div>

                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <Award className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Achievement System
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Earn badges as you learn
                  </p>
                </div>

                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <ClipboardList className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Personalized Learning
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Adaptive to your skill level
                  </p>
                </div>

                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Track Progress
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Monitor your improvement
                  </p>
                </div>

                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <Languages className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Multiple Languages
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Support for various languages
                  </p>
                </div>

                {/* Duplicate first row for seamless scrolling */}
                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <MousePointer2 className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Interactive Learning
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Engaging exercises and quizzes
                  </p>
                </div>

                <div className="backdrop-blur-[2px] bg-white/5 dark:bg-gray-700/5 rounded-xl p-6 shadow-sm border-[0.5px] border-blue-200/30 dark:border-blue-500/10 hover:bg-white/10 dark:hover:bg-gray-700/10 transition-all duration-300">
                  <div className="mb-4">
                    <Cloud className="w-8 h-8 text-blue-500/80 mx-auto" />
                  </div>
                  <p className="font-semibold text-gray-800/90 dark:text-white/90 mb-2 text-lg">
                    Cloud Sync
                  </p>
                  <p className="text-gray-700/80 dark:text-gray-300/80">
                    Access from any device
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Border with Gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-600 to-transparent" />
    </div>
  );
};
