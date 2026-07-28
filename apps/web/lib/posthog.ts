"use client";

import type { CaptureResult, Properties } from "posthog-js";
import posthog from "posthog-js";

export const POSTHOG_DEFAULT_HOST = "https://eu.i.posthog.com";

export const POSTHOG_EVENTS = {
  contactFormStarted: "contact_form_started",
  contactFormSubmitted: "contact_form_submitted",
  ctaClicked: "cta_clicked",
} as const;

export type PostHogProductEvent =
  (typeof POSTHOG_EVENTS)[keyof typeof POSTHOG_EVENTS];

const URL_PROPERTY_KEYS = ["$current_url", "$referrer"] as const;

export function stripUrlQueryAndHash(url: string) {
  try {
    const sanitizedUrl = new URL(url);
    sanitizedUrl.hash = "";
    sanitizedUrl.search = "";
    return sanitizedUrl.toString();
  } catch {
    return url.split(/[?#]/, 1)[0] ?? url;
  }
}

export function sanitizePostHogEventUrls(event: CaptureResult | null) {
  if (!event) return null;

  const properties = { ...event.properties };

  for (const key of URL_PROPERTY_KEYS) {
    const value = properties[key];

    if (typeof value === "string") {
      properties[key] = stripUrlQueryAndHash(value);
    }
  }

  return { ...event, properties };
}

export function initializePostHog() {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!projectToken || posthog.__loaded) return false;

  posthog.init(projectToken, {
    advanced_disable_feature_flags: true,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? POSTHOG_DEFAULT_HOST,
    autocapture: true,
    before_send: sanitizePostHogEventUrls,
    capture_dead_clicks: true,
    capture_heatmaps: true,
    capture_pageleave: true,
    capture_pageview: "history_change",
    capture_performance: false,
    defaults: "2026-06-25",
    disable_session_recording: false,
    enable_recording_console_log: false,
    person_profiles: "never",
    respect_dnt: true,
    session_recording: {
      maskAllInputs: true,
      maskCapturedNetworkRequestFn(request) {
        if (request.name) {
          request.name = stripUrlQueryAndHash(request.name);
        }

        return request;
      },
      recordBody: false,
      recordHeaders: false,
    },
  });

  return true;
}

export function trackPostHogEvent(
  event: PostHogProductEvent,
  properties: Properties = {},
) {
  if (typeof window === "undefined" || !posthog.__loaded) return false;

  posthog.capture(event, properties);
  return true;
}
