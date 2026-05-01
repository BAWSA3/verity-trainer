'use client';

// Cloudflare Turnstile widget — invisible captcha that produces a token
// the server side-verifies via challenges.cloudflare.com/turnstile/v0/siteverify.
//
// No-ops gracefully when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset — useful for
// dev / preview environments. In prod, the env var is set and the server
// rejects /api/signup without a verified token.
//
// Loaded as a single global script (the CF api.js handles multiple widgets).
// We render an invisible managed challenge — most users never see anything.

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  /** Called with the verification token when the widget completes. */
  onVerify: (token: string) => void;
  /** Optional callback when the token expires (default: re-render). */
  onExpire?: () => void;
  /** Theme passed to Cloudflare. */
  theme?: 'light' | 'dark' | 'auto';
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: string;
          appearance?: 'always' | 'execute' | 'interaction-only';
          size?: 'normal' | 'compact' | 'invisible';
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      execute: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

let scriptLoadingPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile script failed to load'));
    document.head.appendChild(s);
  });
  return scriptLoadingPromise;
}

export default function TurnstileWidget({
  onVerify,
  onExpire,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // No-op when sitekey is unset — dev / preview / prototype.
    if (!sitekey || !containerRef.current) return;

    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme,
          // size:'invisible' auto-runs the challenge on render and fires the
          // callback when a token is ready. No execute() call needed; widget
          // is fully hidden + the user never sees a checkbox unless CF flags
          // them as suspicious (in which case it shows a brief interstitial).
          size: 'invisible',
          callback: (token: string) => onVerify(token),
          'expired-callback': () => {
            if (onExpire) onExpire();
          },
          'error-callback': () => {
            console.warn('[turnstile] widget error');
          },
        });
      })
      .catch((err) => {
        console.warn('[turnstile] script load failed:', err);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, theme, onVerify, onExpire]);

  // Render an empty container; CF inserts an iframe inside. Keeps DOM stable
  // even when sitekey is unset (no children = nothing visible).
  return <div ref={containerRef} aria-hidden style={{ minHeight: 0 }} />;
}

/**
 * True when Turnstile is configured for this build. UIs can use this to
 * decide whether to require a token before enabling submission.
 */
export const TURNSTILE_ENABLED =
  typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
