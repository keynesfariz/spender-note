import { GoogleGenAI, Type, Schema } from '@google/genai';

import { AIProvider, TransactionData } from './types';

const transactionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.NUMBER,
        description: 'The transaction amount as a number',
      },
      type: {
        type: Type.STRING,
        enum: ['income', 'expense'],
        description: 'Whether money went in or out',
      },
      category: {
        type: Type.STRING,
        description: 'Category like Groceries, Transfer, Utilities',
      },
      date: { type: Type.STRING, description: 'ISO 8601 date string' },
      remark: {
        type: Type.STRING,
        description: 'Merchant name or description',
      },
      accountLabel: {
        type: Type.STRING,
        description: 'The bank account or card name mentioned',
      },
    },
    required: ['amount', 'type', 'category', 'date', 'accountLabel'],
  },
};

import { PARSER_SYSTEM_PROMPT, getFixPrompt } from './prompts';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async extractTransactions(emailBody: string): Promise<TransactionData[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract all financial transactions from the following email. If there are none, return an empty array.\n\nEmail:\n${emailBody}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: transactionSchema,
        },
      });

      return JSON.parse(response.text || '[]') as TransactionData[];
    } catch (error) {
      console.error('Failed to parse Gemini response', error);
      return [];
    }
  }

  async generateParserRules(
    emailBody: string,
  ): Promise<import('./types').GeneratedRegexRules> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: PARSER_SYSTEM_PROMPT + '\n\nEmail:\n' + emailBody }],
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Failed to generate regex rules: empty response');
    }

    try {
      return JSON.parse(text) as import('./types').GeneratedRegexRules;
    } catch (err) {
      console.error('Failed to parse AI response:', text);
      throw err;
    }
  }

  async fixParserRule(
    emailBody: string,
    field: string,
    expectedValue: string,
  ): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                getFixPrompt(field, expectedValue) + '\n\nEmail:\n' + emailBody,
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
      },
    });

    if (!response.text) {
      throw new Error('Failed to fix regex rule');
    }

    return response.text.trim();
  }
}
