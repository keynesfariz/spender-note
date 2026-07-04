import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'app-errors.log');

export function logError(context: string, error: any) {
  const timestamp = new Date().toISOString();
  let errorMsg = '';
  
  if (error instanceof Error) {
    errorMsg = `${error.name}: ${error.message}\n${error.stack}`;
  } else if (typeof error === 'object') {
    errorMsg = JSON.stringify(error, null, 2);
  } else {
    errorMsg = String(error);
  }

  const logEntry = `[${timestamp}] ERROR in ${context}:\n${errorMsg}\n----------------------------------------\n`;
  
  // Also log to console just in case
  console.error(logEntry);

  try {
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
  } catch (e) {
    console.error('Failed to write to log file', e);
  }
}
