import { Wordlist, Word } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Extract language info and description from comments in text/csv files
 */
const extractLanguageInfo = (
  content: string
): { language?: string; languageCode?: string; description?: string } => {
  const lines = content.split(/\r?\n/);
  const info: {
    language?: string;
    languageCode?: string;
    description?: string;
  } = {};

  for (const line of lines) {
    if (line.startsWith("#")) {
      const languageMatch = line.match(/Language:\s*(.+)/i);
      const codeMatch = line.match(/Language Code:\s*(.+)/i);
      const descriptionMatch = line.match(/Description:\s*(.+)/i);

      if (languageMatch) {
        info.language = languageMatch[1].trim();
      }
      if (codeMatch) {
        info.languageCode = codeMatch[1].trim();
      }
      if (descriptionMatch) {
        info.description = descriptionMatch[1].trim();
      }
    }
  }

  return info;
};

/**
 * Parse TXT file content (one word per line)
 */
export const parseTxtFile = (
  content: string,
  title: string,
  languageCode: string = "en-US"
): Wordlist => {
  // Extract language info and description from comments
  const {
    language,
    languageCode: fileLanguageCode,
    description,
  } = extractLanguageInfo(content);

  // Filter out empty lines and lines starting with #, then trim each word
  const words = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"))
    .map((line) => line.trim());

  return {
    id: `user-${uuidv4()}`,
    language: language || title,
    languageCode: fileLanguageCode || languageCode,
    name: title,
    title,
    description:
      description ||
      `Spell personalized ${
        language || title
      } words you've uploaded for practice`,
    words,
    source: "user",
    isCustom: true,
    timestamp: Date.now(),
  };
};

/**
 * Parse JSON file content
 */
export const parseJsonFile = (content: string, title: string): Wordlist => {
  try {
    const parsed = JSON.parse(content);

    // Validate the parsed content
    if (!Array.isArray(parsed.words)) {
      throw new Error("Invalid JSON format: 'words' array is required");
    }

    // Sanitize words by trimming
    const sanitizedWords = parsed.words.map(
      (item: string | { word: string; [key: string]: any }) => {
        // Handle words array that can be strings or objects with word property
        if (typeof item === "string") {
          return item.trim();
        } else if (item && typeof item === "object" && "word" in item) {
          return {
            ...item,
            word: item.word.trim(),
          };
        }
        return item;
      }
    );

    return {
      id: `user-${uuidv4()}`,
      language: parsed.language || title,
      languageCode: parsed.languageCode || "en-US",
      name: title,
      title,
      description:
        parsed.description ||
        `Spell personalized ${
          parsed.language || title
        } words you've uploaded for practice`,
      words: sanitizedWords,
      source: "user",
      isCustom: true,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
};

/**
 * Parse CSV file content (one word per line)
 */
export const parseCsvFile = (
  content: string,
  title: string,
  languageCode: string = "en-US"
): Wordlist => {
  // Extract language info and description from comments
  const {
    language,
    languageCode: fileLanguageCode,
    description,
  } = extractLanguageInfo(content);

  // Filter out empty lines and lines starting with #
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));

  // Trim each word to remove extra spaces
  const words = lines.map((line) => line.trim());

  return {
    id: `user-${uuidv4()}`,
    language: language || title,
    languageCode: fileLanguageCode || languageCode,
    name: title,
    title,
    description:
      description ||
      `Spell personalized ${
        language || title
      } words you've uploaded for practice`,
    words,
    source: "user",
    isCustom: true,
    timestamp: Date.now(),
  };
};

/**
 * Detect file type from content
 */
export const detectFileTypeFromContent = (
  content: string
): "txt" | "json" | "csv" | null => {
  content = content.trim();

  // Check if content is JSON
  try {
    JSON.parse(content);
    return "json";
  } catch (e) {
    // Not JSON
  }

  // Check if content is CSV (has commas in multiple lines)
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length > 0) {
    // If most lines contain commas, it's likely CSV
    const commaLines = lines.filter((line) => line.includes(","));
    if (commaLines.length > 0 && commaLines.length / lines.length >= 0.5) {
      return "csv";
    }
  }

  // Default to txt if it has content but doesn't match other formats
  if (content.length > 0) {
    return "txt";
  }

  return null;
};

/**
 * Parse file based on file extension and content
 */
export const parseFile = async (
  file: File,
  title: string,
  languageCode: string = "en-US"
): Promise<Wordlist> => {
  const content = await file.text();

  // First try to determine type from extension
  let fileType = file.name.split(".").pop()?.toLowerCase();

  // If extension is not one of the supported types or is missing,
  // try to detect the type from content
  if (!fileType || !["txt", "csv", "json"].includes(fileType)) {
    const detectedType = detectFileTypeFromContent(content);
    if (!detectedType) {
      throw new Error(
        "Could not determine file type. Please upload a .txt, .csv, or .json file."
      );
    }
    fileType = detectedType;
  }

  // Verify content matches the expected format
  if (fileType === "json") {
    try {
      JSON.parse(content);
    } catch (e) {
      // If file has .json extension but content isn't valid JSON, fall back to text
      console.warn(
        "File has .json extension but content is not valid JSON. Treating as text file."
      );
      fileType = "txt";
    }
  }

  // Parse the file based on its type
  let wordlist: Wordlist;
  switch (fileType) {
    case "txt":
      wordlist = parseTxtFile(content, title, languageCode);
      break;
    case "json":
      wordlist = parseJsonFile(content, title);
      break;
    case "csv":
      wordlist = parseCsvFile(content, title, languageCode);
      break;
    default:
      throw new Error(`Unsupported file format: ${fileType}`);
  }

  // Final validation of the parsed wordlist
  if (
    !wordlist.words ||
    !Array.isArray(wordlist.words) ||
    wordlist.words.length === 0
  ) {
    throw new Error(
      "The file does not contain any valid words. Please check the format."
    );
  }

  return wordlist;
};

/**
 * Download template file
 */
export const downloadTemplate = (format: "txt" | "json" | "csv"): void => {
  const templateUrl = `/Template/wordlist-template.${format}`;

  // Create a link and trigger download
  const a = document.createElement("a");
  a.href = templateUrl;
  a.download = `wordlist-template.${format}`;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
  }, 0);
};
