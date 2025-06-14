import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logError, createError, ErrorType } from "./utils/errorHandler";

// Early check for stored theme preference
try {
  // Try to get the theme from appSettings first
  const savedSettings = localStorage.getItem("appSettings");
  const parsedSettings = savedSettings ? JSON.parse(savedSettings) : null;
  const storedTheme = localStorage.getItem("theme");

  // Use theme from settings or direct theme storage
  if (parsedSettings?.theme === "dark" || storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (parsedSettings?.theme === "light" || storedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    // Only use system preference if no explicit theme is stored
    document.documentElement.classList.add("dark");
    // Store the system preference
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    // Store the system preference
    localStorage.setItem("theme", "light");
  }
} catch (err) {
  console.error("Error applying theme:", err);
}

// Set up global error handlers
const setupErrorHandlers = () => {
  // Handle uncaught exceptions
  window.addEventListener("error", (event) => {
    const error = createError(
      ErrorType.UNKNOWN,
      event.message || "An unknown error occurred",
      event.error ? event.error.stack || event.error.toString() : undefined
    );
    logError(error);
    event.preventDefault();
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = createError(
      ErrorType.UNKNOWN,
      event.reason?.message || "Unhandled promise rejection",
      event.reason ? event.reason.stack || event.reason.toString() : undefined
    );
    logError(error);
    event.preventDefault();
  });
};

// Initialize error handlers - once, before the app mounts
setupErrorHandlers();

// Initialize the application
const appRoot = document.getElementById("root")!;
createRoot(appRoot).render(
  <StrictMode>
    <App />
  </StrictMode>
);
