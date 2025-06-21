import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface AISearchResult {
  word: string;
  confidence: number;
}

export const searchWithAI = async (
  searchTerm: string,
  language: string
): Promise<AISearchResult[]> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    // Initialize the Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a fuzzy word finder assistant. Your task is to suggest full words based on partial input or misspellings in ${language}.

    The user may input:
    - Only the beginning of the word (e.g., "psy" for "psychology")
    - An approximate spelling (e.g., "helo" for "hello")

    Given the input: "${searchTerm}", return a JSON array of 5 to 10 possible complete words the user might be looking for.

    Each result must include:
    - "word": the suggested full word
    - "confidence": a number from 0 to 1 showing how confident you are

    Output format:
    [
      {
        "word": "example word",
        "confidence": 0.95
      }
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    try {
      // Find the JSON array in the response
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const results = JSON.parse(jsonMatch[0]);
      return results.map((result: any) => ({
        word: result.word,
        confidence: result.confidence || 0.5,
      }));
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return [];
    }
  } catch (error) {
    console.error("AI search error:", error);
    throw new Error("Failed to perform AI search");
  }
};
