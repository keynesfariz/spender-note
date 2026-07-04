import { EmailParser, TransactionData } from '../types';

export const parser: EmailParser = {
  name: 'BCA',
  senderEmails: ['bca@bca.co.id'], // Can be adjusted as needed
  enabled: true,
  parse: (emailBody) => {
    const transactions: TransactionData[] = [];

    // Ensure status is successful
    const statusMatch = emailBody.match(/Status\s*:\s*(Successful)/i);
    if (!statusMatch) {
      return [];
    }

    // Transaction Date: 26 Jun 2026 16:14:13
    const dateMatch = emailBody.match(
      /Transaction Date\s*:\s*(\d{2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2})/,
    );
    let dateStr = new Date().toISOString();
    if (dateMatch) {
      const d = new Date(dateMatch[1].trim());
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString();
      }
    }

    // Source of Fund
    let walletSourceId = 'mybca-unknown';
    const sourceOfFundMatch = emailBody.match(
      /Source of Fund\s*:\s*(.+?)(?=\s+Source Currency|\s+Customer PAN|\n|$)/,
    );
    if (sourceOfFundMatch) {
      walletSourceId = sourceOfFundMatch[1].trim().replace(/\s+/g, '');
    }

    // Amount: "Transfer Amount : IDR 4,000.00" or "Total Payment : IDR 41,000.00"
    let amount = 0;
    const amountMatch = emailBody.match(
      /(?:Transfer Amount|Total Payment)\s*:\s*[A-Za-z]{3}\s*([0-9,.]+)/,
    );
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Beneficiary Name / Payment to
    let beneficiary = '';
    const beneficiaryMatch = emailBody.match(
      /(?:Beneficiary Name|Payment to)\s*:\s*(.+?)(?=\s+Transfer Currency|\s+Merchant Location|\n|$)/,
    );
    if (beneficiaryMatch) {
      beneficiary = beneficiaryMatch[1].trim();
    }

    // Remarks
    let remark = '';
    const remarksMatch = emailBody.match(
      /Remarks\s*:\s*(.+?)(?=\s+Reference No\.|\n|$)/,
    );
    if (remarksMatch) {
      remark = remarksMatch[1].trim();
      if (remark === '-') remark = '';
    }

    if (beneficiary) {
      if (remark) {
        remark = `${beneficiary} - ${remark}`;
      } else {
        remark = `${beneficiary}`;
      }
    }

    transactions.push({
      amount: amount,
      type: 'expense', // Transfer out
      walletLabel: `myBCA - ${walletSourceId}`,
      walletSourceId: walletSourceId,
      walletType: 'debit',
      category: 'Uncategorized',
      date: dateStr,
      remark: remark,
    });

    return transactions;
  },
};
