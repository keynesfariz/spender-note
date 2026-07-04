import { AIProvider } from './types';
import { GeminiProvider } from './gemini-provider';
import { GroqProvider } from './groq-provider';

export function getAIProvider(providerName: string): AIProvider {
  switch (providerName.toLowerCase()) {
    case 'groq':
      return new GroqProvider();
    case 'gemini':
    default:
      return new GeminiProvider();
  }
}
