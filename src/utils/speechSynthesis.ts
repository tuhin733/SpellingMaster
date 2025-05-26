import { createError, ErrorType, logError } from "./errorHandler";

const languageCodes: Record<string, string> = {
  english: "en-US",
  spanish: "es-ES",
  french: "fr-FR",
  german: "de-DE",
  portuguese: "pt-BR",
  russian: "ru-RU",
  japanese: "ja-JP",
  chinese: "zh-CN",
  korean: "ko-KR",
  arabic: "ar-SA",
  turkish: "tr-TR",
  hindi: "hi-IN",
  bengali: "bn-IN",
  tamil: "ta-IN",
  urdu: "ur-IN",
  vietnamese: "vi-VN",
  "en-us": "en-US",
  "es-es": "es-ES",
  "fr-fr": "fr-FR",
  "de-de": "de-DE",
  "pt-br": "pt-BR",
  "ru-ru": "ru-RU",
  "ja-jp": "ja-JP",
  "zh-cn": "zh-CN",
  "ko-kr": "ko-KR",
  "ar-sa": "ar-SA",
  "tr-tr": "tr-TR",
  "hi-in": "hi-IN",
  "bn-in": "bn-IN",
  "ta-in": "ta-IN",
  "ur-in": "ur-IN",
  "vi-vn": "vi-VN",
};

/**
 * Speech synthesis errors that can be handled specially
 */
enum SpeechSynthesisErrorType {
  NOT_SUPPORTED = "not_supported",
  NETWORK = "network",
  LANGUAGE_UNAVAILABLE = "language_unavailable",
  INTERRUPTED = "interrupted",
  CANCELED = "canceled",
  INVALID_ARGUMENT = "invalid_argument",
  NOT_ALLOWED = "not_allowed",
  UNKNOWN = "unknown",
}

/**
 * Maps SpeechSynthesis error event types to our application error types
 */
const mapSpeechErrorType = (errorType: string): SpeechSynthesisErrorType => {
  switch (errorType) {
    case "network":
      return SpeechSynthesisErrorType.NETWORK;
    case "lang-unavailable":
      return SpeechSynthesisErrorType.LANGUAGE_UNAVAILABLE;
    case "interrupted":
      return SpeechSynthesisErrorType.INTERRUPTED;
    case "canceled":
      return SpeechSynthesisErrorType.CANCELED;
    case "invalid-argument":
      return SpeechSynthesisErrorType.INVALID_ARGUMENT;
    case "not-allowed":
      return SpeechSynthesisErrorType.NOT_ALLOWED;
    default:
      return SpeechSynthesisErrorType.UNKNOWN;
  }
};

/**
 * Get a user-friendly error message for speech synthesis errors
 */
const getSpeechErrorMessage = (errorType: SpeechSynthesisErrorType): string => {
  switch (errorType) {
    case SpeechSynthesisErrorType.NOT_SUPPORTED:
      return "Speech synthesis is not supported in your browser";
    case SpeechSynthesisErrorType.NETWORK:
      return "Network error occurred during speech synthesis";
    case SpeechSynthesisErrorType.LANGUAGE_UNAVAILABLE:
      return "The requested language is not available";
    case SpeechSynthesisErrorType.INTERRUPTED:
      return "Speech was interrupted";
    case SpeechSynthesisErrorType.CANCELED:
      return "Speech was canceled";
    case SpeechSynthesisErrorType.INVALID_ARGUMENT:
      return "Invalid argument provided to speech synthesis";
    case SpeechSynthesisErrorType.NOT_ALLOWED:
      return "Speech synthesis not allowed";
    default:
      return "Unknown error during speech synthesis";
  }
};

/**
 * Speak a word using the browser's speech synthesis API
 * Returns true if successful, false if it failed
 */
export const speakWord = async (
  word: string,
  language?: string,
  languageCode?: string
): Promise<boolean> => {
  if (!window.speechSynthesis) {
    const error = createError(
      ErrorType.UNKNOWN,
      getSpeechErrorMessage(SpeechSynthesisErrorType.NOT_SUPPORTED)
    );
    logError(error);
    return false;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Wait for voices to be loaded
    await waitForVoices();

    const utterance = new SpeechSynthesisUtterance(word);

    // Set language based on the input
    if (languageCode) {
      // Use the provided language code directly
      utterance.lang = languageCode;
    } else if (language) {
      // Check if the input is already a language code (contains a hyphen)
      if (language.includes("-")) {
        utterance.lang = language;
      } else {
        // Otherwise, look it up in the languageCodes object
        const langCode = languageCodes[language.toLowerCase()] || "en-US";
        utterance.lang = langCode;
      }
    } else {
      utterance.lang = "en-US";
    }

    // Adjust the rate and pitch for better clarity
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Add error handling for speech synthesis
    utterance.onerror = (event) => {
      const speechErrorType = mapSpeechErrorType(event.error);
      const errorMessage = getSpeechErrorMessage(speechErrorType);

      const error = createError(
        ErrorType.UNKNOWN,
        errorMessage,
        `Speech synthesis error: ${event.error}`
      );

      logError(error);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN,
      "Error during speech synthesis",
      error instanceof Error ? error.message : String(error)
    );

    logError(appError);
    return false;
  }
};

/**
 * Check if speech synthesis is available in the current browser
 */
export const isSpeechSynthesisSupported = (): boolean => {
  return "speechSynthesis" in window;
};

/**
 * Wait for voices to be loaded
 * Returns a promise that resolves when voices are available
 */
export const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // If no voices are available yet, wait for the voiceschanged event
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
};

/**
 * Get available voices for speech synthesis
 * Returns array of available voices or empty array if not supported
 */
export const getAvailableVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }

  return await waitForVoices();
};

/**
 * Check if a specific language is supported for speech synthesis
 * @param language The language name to check
 * @param languageCode The language code to check
 * @returns True if the language is supported, false otherwise
 */
export const isLanguageSupported = async (
  language?: string,
  languageCode?: string
): Promise<boolean> => {
  if (!isSpeechSynthesisSupported()) {
    return false;
  }

  if (!language && !languageCode) {
    return false;
  }

  // Get available voices and wait for them to load
  const voices = await waitForVoices();

  // If language code is provided, check it directly
  if (languageCode) {
    const langPrefix = languageCode.split("-")[0].toLowerCase();
    return voices.some(
      (voice) =>
        voice.lang.toLowerCase() === languageCode.toLowerCase() ||
        voice.lang.toLowerCase().startsWith(langPrefix + "-")
    );
  }

  // If only language name is provided, look up the code
  if (language) {
    // Check if it's already a language code
    if (language.includes("-")) {
      const langPrefix = language.split("-")[0].toLowerCase();
      return voices.some(
        (voice) =>
          voice.lang.toLowerCase() === language.toLowerCase() ||
          voice.lang.toLowerCase().startsWith(langPrefix + "-")
      );
    }

    // Look up the language code
    const langCode = languageCodes[language.toLowerCase()];
    if (!langCode) return false;

    const langPrefix = langCode.split("-")[0].toLowerCase();
    return voices.some(
      (voice) =>
        voice.lang.toLowerCase() === langCode.toLowerCase() ||
        voice.lang.toLowerCase().startsWith(langPrefix + "-")
    );
  }

  return false;
};
