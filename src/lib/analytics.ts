declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_GA4_MEASUREMENT_ID = "G-LHY2J56X46";
const GA4_MEASUREMENT_ID = (import.meta.env.VITE_GA4_MEASUREMENT_ID || DEFAULT_GA4_MEASUREMENT_ID).trim();
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function canTrackAnalytics(): boolean {
  if (typeof window === "undefined") return false;
  if (!GA4_MEASUREMENT_ID) return false;
  return !LOCAL_HOSTS.has(window.location.hostname);
}

export function trackPageView(path: string, title?: string): void {
  if (!canTrackAnalytics()) return;
  if (typeof window.gtag !== "function") return;

  window.gtag("config", GA4_MEASUREMENT_ID, {
    page_path: path,
    ...(title ? { page_title: title } : {}),
  });
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!canTrackAnalytics()) return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params || {});
}
