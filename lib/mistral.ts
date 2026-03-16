import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;

export function getMistralClient() {
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY no está configurada en .env.local");
  }
  return new Mistral({ apiKey });
}
