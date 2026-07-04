
import { EmailParser, TransactionData } from '../types';

export const parser: EmailParser = {
  name: 'Jenius',
  senderEmails: ['jenius_noreply@smbci.com'],
  status: 'active',
  parse: (emailBody: string) => {
    const transactions: TransactionData[] = [];

    // Check if it's a d-Card transaction
    if (!emailBody.includes('transaction using d-Card')) {
      return [];
    }

    // Extract amount
    const amountMatch = emailBody.match(/Total:\s*IDR\s*([0-9,.]+)/i);
    if (!amountMatch) return [];

    // Amount could be 34,500.00 - remove commas and parse
    const amountStr = amountMatch[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);

    // Extract card number to get last 4 digits
    const cardMatch = emailBody.match(/Card number:\s*(?:\d+|\*)+(\d{4})/i);
    const last4 = cardMatch ? cardMatch[1] : 'unknown';

    // Extract merchant for remark
    const merchantMatch = emailBody.match(/Merchant:\s*(.*?)(?=\s*Transaction date & time:)/i);
    let remark = merchantMatch ? merchantMatch[1].trim() : '';
    // Clean any HTML tags that might be left in the remark (e.g. <br />)
    remark = remark.replace(/<[^>]*>?/gm, ' ').trim();

    // Extract date
    // Transaction date & time: 04 JUL 2026 17:42:23 WIB
    const dateMatch = emailBody.match(/Transaction date & time:\s*(\d{2}\s+[a-zA-Z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2})\s*(WIB)?/i);
    let dateObj = new Date();
    if (dateMatch) {
      // Create date from string like "04 JUL 2026 17:42:23 +0700"
      // WIB is UTC+7
      const dateStr = dateMatch[1];
      dateObj = new Date(`${dateStr} UTC+0700`);
    }

    transactions.push({
      amount: amount,
      type: 'expense',
      walletLabel: `Jenius - ${last4}`,
      walletSourceId: `jenius-${last4}`,
      walletType: 'credit',
      category: 'Uncategorized',
      date: dateObj.toISOString(),
      remark: remark,
    });

    return transactions;
  }
};
