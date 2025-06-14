import { useState, useCallback } from "react";
import { useApp } from "../contexts/AppContext";

/**
 * A hook that provides loading state management for components
 * @param initialState - Initial loading state (default: false)
 * @returns An object with loading state and functions to control it
 */
export function useLoading(initialState = false) {
  const [isComponentLoading, setIsComponentLoading] = useState(initialState);
  const { setIsLoading } = useApp();

  /**
   * Starts loading state (component level)
   */
  const startLoading = useCallback(() => {
    setIsComponentLoading(true);
  }, []);

  /**
   * Ends loading state (component level)
   */
  const endLoading = useCallback(() => {
    setIsComponentLoading(false);
  }, []);

  /**
   * Starts global loading state
   */
  const startGlobalLoading = useCallback(() => {
    setIsLoading(true);
  }, [setIsLoading]);

  /**
   * Ends global loading state
   */
  const endGlobalLoading = useCallback(() => {
    setIsLoading(false);
  }, [setIsLoading]);

  /**
   * Wraps an async function with loading state management
   * @param fn - The async function to wrap
   * @param options - Options for handling loading state
   * @returns A wrapped function that manages loading state
   */
  const withLoading = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      options: {
        global?: boolean;
        errorHandler?: (error: any) => void;
      } = {}
    ) => {
      return async (...args: T): Promise<R> => {
        try {
          if (options.global) {
            startGlobalLoading();
          } else {
            startLoading();
          }

          return await fn(...args);
        } catch (error) {
          if (options.errorHandler) {
            options.errorHandler(error);
          } else {
            console.error("Error in withLoading:", error);
            throw error;
          }
          throw error;
        } finally {
          if (options.global) {
            endGlobalLoading();
          } else {
            endLoading();
          }
        }
      };
    },
    [startLoading, endLoading, startGlobalLoading, endGlobalLoading]
  );

  return {
    isLoading: isComponentLoading,
    startLoading,
    endLoading,
    startGlobalLoading,
    endGlobalLoading,
    withLoading,
  };
}
