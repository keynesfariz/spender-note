import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    return [];
  }
}
