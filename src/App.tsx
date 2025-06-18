import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { ProgressProvider } from "./contexts/ProgressContext";
import { TranslationProvider } from "./contexts/TranslationContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast, { ToastType } from "./components/Toast";
import { AlertTriangle } from "lucide-react";
import Spinner from "./components/Spinner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { ForgotPassword } from "./components/ForgotPassword";
import SettingsModal from "./components/SettingsModal";
import { useSettings } from "./contexts/SettingsContext";

// Lazy-load pages for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const LevelsPage = lazy(() => import("./pages/LevelsPage"));
const FlashcardPage = lazy(() => import("./pages/FlashcardPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));

// Add global styles
import "./index.css";

const AppContent: React.FC = () => {
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

  const { isSettingsOpen, closeSettings } = useSettings();

  // Ensure body gets correct theme and font size classes
  useEffect(() => {
    const html = document.documentElement;

    // Theme classes
    if (settings.theme === "system") {
      // Check system preference
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    } else if (settings.theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    // Font size classes
    html.classList.remove(
      "text-size-small",
      "text-size-medium",
      "text-size-large"
    );
    html.classList.add(`text-size-${settings.fontSize}`);

    // Font family classes
    html.classList.remove(
      "font-inter",
      "font-inter-var",
      "font-roboto",
      "font-open-sans",
      "font-poppins"
    );

    // Apply the selected font family
    const fontFamily = settings.fontFamily || "inter";
    if (
      fontFamily === "inter" &&
      "fonts" in document &&
      document.fonts.check('12px "Inter var"')
    ) {
      html.classList.add("font-inter-var");
    } else {
      html.classList.add(`font-${fontFamily}`);
    }
  }, [settings.theme, settings.fontSize, settings.fontFamily]);

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
    return <Spinner />;
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
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route
                path="/signin"
                element={
                  <PublicRoute>
                    <SignIn />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/levels/:wordlistId"
                element={
                  <ProtectedRoute>
                    <LevelsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/flashcards/:wordlistId/:level"
                element={
                  <ProtectedRoute>
                    <FlashcardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results/:wordlistId/:level"
                element={
                  <ProtectedRoute>
                    <ResultsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/statistics"
                element={
                  <ProtectedRoute>
                    <StatisticsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
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

      {/* Global Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/signin", { replace: true });
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return <Spinner />;
  }

  return currentUser ? <>{children}</> : <Navigate to="/signin" replace />;
};

// Public Route component (for sign-in/sign-up pages)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, isInitialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      navigate("/", { replace: true });
    }
  }, [currentUser, loading, navigate]);

  // Only show full screen loader during initial auth state check
  if (!isInitialized) {
    return <Spinner />;
  }

  return !currentUser ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <ProgressProvider>
          <TranslationProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </TranslationProvider>
        </ProgressProvider>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
