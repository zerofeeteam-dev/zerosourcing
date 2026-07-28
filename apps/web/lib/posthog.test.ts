import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = vi.hoisted(() => ({
  __loaded: false,
  capture: vi.fn(),
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthogMock }));

import {
  initializePostHog,
  POSTHOG_EVENTS,
  sanitizePostHogEventUrls,
  stripUrlQueryAndHash,
  trackPostHogEvent,
} from "./posthog";

beforeEach(() => {
  posthogMock.__loaded = false;
  posthogMock.capture.mockReset();
  posthogMock.init.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("PostHog analytics", () => {
  it("stays disabled when no project token is configured", () => {
    expect(initializePostHog()).toBe(false);
    expect(posthogMock.init).not.toHaveBeenCalled();
  });

  it("initializes privacy-conscious behavior analytics", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");

    expect(initializePostHog()).toBe(true);
    expect(posthogMock.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://eu.i.posthog.com",
        autocapture: true,
        capture_dead_clicks: true,
        capture_heatmaps: true,
        capture_pageleave: true,
        capture_pageview: "history_change",
        capture_performance: false,
        person_profiles: "never",
        respect_dnt: true,
        session_recording: expect.objectContaining({
          maskAllInputs: true,
          recordBody: false,
          recordHeaders: false,
        }),
      }),
    );
  });

  it("removes query strings and fragments before URLs are sent", () => {
    expect(
      stripUrlQueryAndHash(
        "https://zerosourcing.kr/contact?email=test@example.com#form",
      ),
    ).toBe("https://zerosourcing.kr/contact");

    const event = sanitizePostHogEventUrls({
      event: "$pageview",
      properties: {
        $current_url: "https://zerosourcing.kr/blog?preview=secret#content",
        $referrer: "https://search.example.com/?q=zerosourcing",
      },
      uuid: "event-id",
    });

    expect(event?.properties).toMatchObject({
      $current_url: "https://zerosourcing.kr/blog",
      $referrer: "https://search.example.com/",
    });
  });

  it("captures only after the browser SDK is ready", () => {
    vi.stubGlobal("window", {});

    expect(trackPostHogEvent(POSTHOG_EVENTS.contactFormStarted)).toBe(false);

    posthogMock.__loaded = true;
    expect(
      trackPostHogEvent(POSTHOG_EVENTS.ctaClicked, {
        cta_action: "outsource",
      }),
    ).toBe(true);
    expect(posthogMock.capture).toHaveBeenCalledWith("cta_clicked", {
      cta_action: "outsource",
    });
  });
});
