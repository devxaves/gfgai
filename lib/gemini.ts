import { GoogleGenAI } from "@google/genai";

// The client automatically picks up the API key from process.env.GEMINI_API_KEY
// Assuming it is available in the Node environment
export const getGeminiClient = () => {
  return new GoogleGenAI({});
};
