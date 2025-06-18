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

    const prompt = `You are a helpful assistant that helps find words in ${language}. 
    When given a search term, return a JSON array of potential matching words.
    Each result should have a confidence score between 0 and 1.
    
    Find words similar to "${searchTerm}" in ${language}.
    
    Return the response in this exact JSON format:
    [
      {
        "word": "example word",
        "confidence": 0.8
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
