import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY environment variable (or legacy GOOGLE_GEMINI_API_KEY). " +
      "Get your key from https://aistudio.google.com/apikey and add it to .env"
    );
  }

  client = new GoogleGenAI({ apiKey });
  return client;
};
