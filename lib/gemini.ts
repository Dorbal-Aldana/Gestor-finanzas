import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export function getGeminiClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada");
  }
  return new GoogleGenerativeAI(apiKey);
}

