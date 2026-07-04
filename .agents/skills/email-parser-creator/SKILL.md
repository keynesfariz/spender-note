---
name: email-parser-creator
description: Generates custom email parsers for BudgetManager based on email templates provided by the user. Use when the user asks to add support for a new bank or a new email notification parser.
---

# Email Parser Creator Skill

When the user asks you to create a new parser for an email notification (e.g., from a new bank), follow these instructions to generate and register it correctly in the system.

## 1. Prerequisites
You need the following from the user:
- An **example email template** (the raw text of the email).
- What information to extract:
  - **amount**: The transaction amount.
  - **type**: Whether it is an 'income' or 'expense' (e.g., transfer out, payment, received).
  - **walletLabel**: The label for the wallet (e.g., "Bank A - 1234").
  - **walletSourceId**: A unique ID for the wallet based on the bank and account (e.g., "bank-a-1234"). This ensures wallets aren't duplicated.
  - **walletType**: (Optional) 'debit' or 'credit'. Defaults to 'debit'.
  - **category**: The category of the transaction.
  - **date**: The date of the transaction (in ISO string format).
  - **remark**: Any extra details or memo.
- **senderEmails**: The email address(es) that send this notification.

## 2. Implementation Rules
- Create a new file in `src/lib/parsers/list/`. Name it appropriately (e.g., `bank-a.ts`).
- The parser must export an object implementing the `EmailParser` interface (defined in `src/lib/parsers/types.ts`).
- Set `status: 'active'`. The system will automatically pick up this parser using its filename as the ID.
- Ensure the `parse` method accurately extracts data using Regex or string manipulation. Handle parsing errors gracefully (return an empty array if it doesn't match).

## 3. Template
Use the following template for new parsers:

```typescript
import { EmailParser } from '../types';

export const parser: EmailParser = {
  name: '[Bank Name]',
  senderEmails: ['[sender-email@bank.com]'],
  status: 'active',
  parse: (emailBody) => {
    const transactions = [];
    
    // Implement parsing logic here...
    // Example:
    // const amountMatch = emailBody.match(/Amount: \$([0-9,.]+)/);
    // if (!amountMatch) return [];

    transactions.push({
      amount: 100, // Extracted amount
      type: 'expense', // 'income' or 'expense'
      walletLabel: 'Bank Name - 1234',
      walletSourceId: 'bank-name-1234', // Crucial: make this unique per account
      walletType: 'debit', // 'debit' or 'credit'
      category: 'Uncategorized',
      date: new Date().toISOString(), // Use extracted date
      remark: 'Extracted memo',
    });

    return transactions;
  }
};
```
