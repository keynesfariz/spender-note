import { Groq } from 'groq-sdk';
import { AIProvider, TransactionData } from './types';

export class GroqProvider implements AIProvider {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }

  async extractTransactions(emailBody: string): Promise<TransactionData[]> {
    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a financial data extraction assistant. Extract all financial transactions from the provided email. 
You MUST return a JSON object with a single key "transactions" containing an array of objects. 
Each object must have: 
- amount (number)
- type (string, exactly "income" or "expense")
- category (string, e.g., "Groceries", "Transfer", "Utilities")
- date (string, ISO 8601 format)
- remark (string, merchant name or description)
- accountLabel (string, the bank account or card name mentioned)

If there are no transactions, return { "transactions": [] }.
Output ONLY valid JSON.`
          },
          {
            role: 'user',
            content: `Email:\n${emailBody}`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{"transactions":[]}';
      const parsed = JSON.parse(content);
      return (parsed.transactions || []) as TransactionData[];
    } catch (error) {
      console.error('Failed to parse Groq response', error);
      return [];
    }
  }
}
