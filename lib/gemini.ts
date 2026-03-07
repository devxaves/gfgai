import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (client) return client;

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GOOGLE_GEMINI_API_KEY environment variable. " +
      "Get your key from https://aistudio.google.com/apikey and add it to .env"
    );
  }

  client = new GoogleGenAI({ apiKey });
  return client;
};
