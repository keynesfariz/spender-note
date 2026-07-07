import { GeminiProvider } from './gemini-provider';
import { GroqProvider } from './groq-provider';
import { AIProvider } from './types';

export function getAIProvider(providerName: string): AIProvider {
  switch (providerName.toLowerCase()) {
    case 'groq':
      if (!process.env.GROQ_API_KEY) {
        throw new Error(
          'AI parser mode is disabled because GROQ_API_KEY is not set. Please set the key properly.',
        );
      }
      return new GroqProvider();
    case 'gemini':
    default:
      if (!process.env.GEMINI_API_KEY) {
        throw new Error(
          'AI parser mode is disabled because GEMINI_API_KEY is not set. Please set the key properly.',
        );
      }
      return new GeminiProvider();
  }
}
