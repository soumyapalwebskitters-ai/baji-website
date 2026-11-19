"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import styles from "./CookieConsent.module.css";

const storageKey = "baji-market-cookie-consent-v1";
type Choice = "accepted" | "rejected";

export default function CookieConsent() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "accepted" || saved === "rejected") setChoice(saved);
    } catch {
      // If storage is unavailable, ask again on the next visit.
    }
    setReady(true);
  }, []);

  function choose(value: Choice) {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // The current visit still respects the user's choice.
    }
    setChoice(value);
  }

  if (!ready) return null;
  if (choice === "accepted") {
    return <Script id="consented-google-tracking" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){window.dataLayer.push(arguments);};
      window.gtag('js', new Date());
      window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      var tracker = document.createElement('script');
      tracker.async = true;
      tracker.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-P9KL25KP';
      document.head.appendChild(tracker);
    `}</Script>;
  }
  if (choice === "rejected") return null;

  return (
    <section className={styles.popup} role="region" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description">
      <span className={styles.label}>YOUR PRIVACY</span>
      <h2 id="cookie-consent-title">A little choice. Your cookies.</h2>
      <p id="cookie-consent-description">We use optional Google tracking cookies to understand how our website is used. Accept to enable them, or reject to continue without Google tracking.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.reject} onClick={() => choose("rejected")}>Reject</button>
        <button type="button" className={styles.accept} onClick={() => choose("accepted")}>Accept cookies</button>
      </div>
    </section>
  );
}
