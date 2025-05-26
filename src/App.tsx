import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { ProgressProvider } from "./contexts/ProgressContext";
import { TranslationProvider } from "./contexts/TranslationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast from "./components/Toast";
import Preloader from "./components/Preloader";
import { AlertTriangle } from "lucide-react";

// Lazy-load pages for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const LevelsPage = lazy(() => import("./pages/LevelsPage"));
const FlashcardPage = lazy(() => import("./pages/FlashcardPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));

// Add global styles
import "./index.css";

const AppRoutes: React.FC = () => {
  const { isLoading, settings } = useApp();
  const [globalError, setGlobalError] = useState<{
    message: string;
    isVisible: boolean;
  }>({
    message: "",
    isVisible: false,
  });

  // Ensure body gets correct theme class
  useEffect(() => {
    const body = document.body;
    if (settings.theme === "dark") {
      body.classList.add("dark-theme");
    } else {
      body.classList.remove("dark-theme");
    }
  }, [settings.theme]);

  const showError = (message: string) => {
    setGlobalError({
      message,
      isVisible: true,
    });
  };

  const closeError = () => {
    setGlobalError((prev) => ({ ...prev, isVisible: false }));
  };

  // Note: Global error handler has been moved to main.tsx to avoid duplicate registration
  // Local error handling can still use the showError function

  if (isLoading) {
    return <Preloader message="Initializing application..." />;
  }

  return (
    <>
      <Router>
        <ErrorBoundary
          fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 mb-6">
                  The application encountered an error. Please try refreshing
                  the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          }
        >
          <Suspense fallback={<Preloader message="Loading page..." />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/levels/:wordlistId" element={<LevelsPage />} />
              <Route
                path="/flashcards/:wordlistId/:level"
                element={<FlashcardPage />}
              />
              <Route
                path="/results/:wordlistId/:level"
                element={<ResultsPage />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>

      {/* Global error toast */}
      <Toast
        message={globalError.message}
        isVisible={globalError.isVisible}
        onClose={closeError}
        duration={5000}
      />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ProgressProvider>
          <TranslationProvider>
            <AppRoutes />
          </TranslationProvider>
        </ProgressProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
