import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'RacePass <noreply@racepass.io>';

export { resend, FROM_EMAIL };
