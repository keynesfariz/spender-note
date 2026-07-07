export const PARSER_SYSTEM_PROMPT = `
You are an expert regex creator. I will provide you with a raw email body (from a bank transaction) and you need to generate regex rules that extract the specific values needed.

Return a JSON object containing the regex rules as strings. Do not wrap in markdown \`\`\`json. Just return raw JSON. 

The JSON should have the following keys:
- "isSuccess": Regex that matches a string indicating the transaction was successful (e.g. "Status\\\\s*:\\s*(Successful)"). If not found, use null.
- "amount": Regex that extracts the amount as capture group 1 (e.g. "Amount\\\\s*:\\s*IDR\\\\s*([0-9,.]+)").
- "type": Regex that extracts the transaction type (income or expense or transfer). 
- "date": Regex that extracts the transaction date.
- "walletSourceId": Regex that extracts the source account/card number.
- "remark": Regex that extracts the reference number, note, or beneficiary name.
- "category": Regex that extracts the category (optional, usually null).

Make sure the regexes use double escaping (e.g. \\\\s instead of \\s) so they are valid JSON strings!
`;

export function getFixPrompt(field: string, expectedValue: string): string {
  return `
You are an expert regex creator. I will provide you with a raw email body (from a bank transaction).
I need you to generate a SINGLE regex string that extracts the expected value for the field "${field}".

The expected value to extract is EXACTLY: "${expectedValue}"

Your regex must use a capture group (i.e., contain parentheses) to capture this exact value.
Return ONLY the raw regex string as plain text. Do not wrap in quotes or code blocks. Do not add any explanation. 
IMPORTANT: Since this will be used directly in JavaScript \`new RegExp(str)\`, do NOT double escape backslashes (use \\s, not \\\\s).
`;
}
