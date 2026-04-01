import OpenAI from "openai";

export interface AIClient {
  client: OpenAI;
  model: string;
}

let _cached: AIClient | null = null;

export function getAIClient(): AIClient {
  if (_cached) return _cached;

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (groqKey) {
    _cached = {
      client: new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: "llama-3.3-70b-versatile",
    };
    return _cached;
  }

  if (openaiKey) {
    _cached = {
      client: new OpenAI({
        apiKey: openaiKey,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      }),
      model: "gpt-4o",
    };
    return _cached;
  }

  throw new Error(
    "No AI API key found. Please set GROQ_API_KEY (free at console.groq.com) or OPENAI_API_KEY."
  );
}

export function getOpenAI(): OpenAI {
  return getAIClient().client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  },
});
