"use client";

import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
const isProd = process.env.NODE_ENV === "production";
const enabledInDev = process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true";
const shouldInit = POSTHOG_KEY && (isProd || enabledInDev);

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!shouldInit) return;
    posthog.init(POSTHOG_KEY!, {
      api_host: POSTHOG_HOST,
      capture_pageview: true
    });
  }, []);

  if (!shouldInit) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

