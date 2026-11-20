'use client';

export const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
declare global {
  interface Window {
    grecaptcha?: { ready: (callback: () => void) => void; execute: (key: string, options: { action: string }) => Promise<string> };
  }
}
export async function executeRecaptcha(action: 'place_order' | 'place_query' | 'customer_login_send' | 'customer_login_verify'): Promise<string> {
  const api = window.grecaptcha;
  if (!recaptchaSiteKey) throw new Error('reCAPTCHA is unavailable. Please try again later.');
  if (!api) throw new Error('reCAPTCHA could not load. Please reload the page and try again.');
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Security check timed out. Please try again.')), 15000);
    api.ready(() => {
      Promise.resolve().then(() => api.execute(recaptchaSiteKey, { action }))
        .then((token) => {
          if (!token) throw new Error('reCAPTCHA did not complete. Please try again.');
          resolve(token);
        })
        .catch(() => reject(new Error('Google could not start the security check in this browser. Please reload and try again.')))
        .finally(() => window.clearTimeout(timer));
    });
  });
}

