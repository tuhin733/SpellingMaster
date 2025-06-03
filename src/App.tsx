import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { ProgressProvider } from "./contexts/ProgressContext";
import { TranslationProvider } from "./contexts/TranslationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast, { ToastType } from "./components/Toast";
import { AlertTriangle } from "lucide-react";

// Lazy-load pages for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const LevelsPage = lazy(() => import("./pages/LevelsPage"));
const FlashcardPage = lazy(() => import("./pages/FlashcardPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));

// Add global styles
import "./index.css";

const AppRoutes: React.FC = () => {
  const { isLoading, settings } = useApp();
  const [globalError, setGlobalError] = useState<{
    message: string;
    isVisible: boolean;
    type: ToastType;
  }>({
    message: "",
    isVisible: false,
    type: "error",
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
      type: "error",
    });
  };

  const closeError = () => {
    setGlobalError((prev) => ({ ...prev, isVisible: false }));
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-secondary-900" />;
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
          <Suspense
            fallback={
              <div className="min-h-screen bg-gray-50 dark:bg-secondary-900" />
            }
          >
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
              <Route path="/statistics" element={<StatisticsPage />} />
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
        type={globalError.type}
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
