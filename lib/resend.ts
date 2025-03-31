import { Resend } from 'resend';

// Check if Resend API key is defined
if (!process.env.RESEND_API_KEY) {
  throw new Error('Please add your Resend API key to .env.local');
}

// Initialize Resend with API key
export const resend = new Resend(process.env.RESEND_API_KEY);
