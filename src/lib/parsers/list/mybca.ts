import { EmailParser, TransactionData } from '../types';

export const parser: EmailParser = {
  name: 'myBCA',
  senderEmails: ['halobca@bca.co.id', 'no-reply@bca.co.id'], // Can be adjusted as needed
  status: 'active',
  parse: (emailBody) => {
    const transactions: TransactionData[] = [];

    // Ensure status is successful
    const statusMatch = emailBody.match(/Status\s*:\s*(.+)/);
    if (!statusMatch || statusMatch[1].trim().toLowerCase() !== 'successful') {
      return [];
    }

    // Transaction Date: 26 Jun 2026 16:14:13
    const dateMatch = emailBody.match(/Transaction Date\s*:\s*(.+)/);
    let dateStr = new Date().toISOString();
    if (dateMatch) {
      const d = new Date(dateMatch[1].trim());
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString();
      }
    }

    // Source of Fund: 5260xxxx55
    const sourceOfFundMatch = emailBody.match(/Source of Fund\s*:\s*(.+)/);
    const walletSourceId = sourceOfFundMatch ? sourceOfFundMatch[1].trim() : 'mybca-unknown';

    // Transfer Amount: IDR 4,000.00
    const amountMatch = emailBody.match(/Transfer Amount\s*:\s*[A-Z]{3}\s*([0-9,.]+)/);
    let amount = 0;
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Remarks
    const remarksMatch = emailBody.match(/Remarks\s*:\s*(.+)/);
    let remark = '';
    if (remarksMatch) {
      remark = remarksMatch[1].trim();
      if (remark === '-') remark = '';
    }

    // Beneficiary Name
    const beneficiaryNameMatch = emailBody.match(/Beneficiary Name\s*:\s*(.+)/);
    if (beneficiaryNameMatch) {
      const beneficiary = beneficiaryNameMatch[1].trim();
      if (remark) {
        remark = `To ${beneficiary} - ${remark}`;
      } else {
        remark = `To ${beneficiary}`;
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
      remark: remark
    });

    return transactions;
  }
};
