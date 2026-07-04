import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Groq } from 'groq-sdk';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

const transactionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "The transaction amount as a number" },
      type: { type: Type.STRING, enum: ["income", "expense"], description: "Whether money went in or out" },
      category: { type: Type.STRING, description: "Category like Groceries, Transfer, Utilities" },
      date: { type: Type.STRING, description: "ISO 8601 date string" },
      remark: { type: Type.STRING, description: "Merchant name or description" },
      accountLabel: { type: Type.STRING, description: "The bank account or card name mentioned" }
    },
    required: ["amount", "type", "category", "date", "accountLabel"]
  }
};

export async function extractTransactionsFromEmail(emailBody: string) {
  const provider = process.env.AI_PROVIDER || 'gemini';

  if (provider === 'groq') {
    const response = await groq.chat.completions.create({
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

    try {
      const content = response.choices[0]?.message?.content || '{"transactions":[]}';
      const parsed = JSON.parse(content);
      return parsed.transactions || [];
    } catch (e) {
      console.error('Failed to parse Groq response', e);
      return [];
    }
  }

  // Fallback to Gemini
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Extract all financial transactions from the following email. If there are none, return an empty array.\n\nEmail:\n${emailBody}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: transactionSchema,
    }
  });
  
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error('Failed to parse Gemini response', e);
    return [];
  }
}
