import { afterEach, describe, expect, it, vi } from "vitest";

import {
  META_PIXEL_BOOTSTRAP_SCRIPT,
  META_PIXEL_ID,
  trackMetaLead,
  trackMetaPageView,
} from "./meta-pixel";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Meta Pixel", () => {
  it("initializes the supplied pixel and records the first page view", () => {
    expect(META_PIXEL_ID).toBe("1730750948076034");
    expect(META_PIXEL_BOOTSTRAP_SCRIPT).toContain(
      "https://connect.facebook.net/en_US/fbevents.js",
    );
    expect(META_PIXEL_BOOTSTRAP_SCRIPT).toContain(
      "fbq('init', '1730750948076034')",
    );
    expect(META_PIXEL_BOOTSTRAP_SCRIPT).toContain("fbq('track', 'PageView')");
  });

  it("queues page views and leads through fbq when the pixel is ready", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq });

    expect(trackMetaPageView()).toBe(true);
    expect(trackMetaLead()).toBe(true);
    expect(fbq.mock.calls).toEqual([
      ["track", "PageView"],
      ["track", "Lead"],
    ]);
  });

  it("does nothing when the browser or pixel bootstrap is unavailable", () => {
    expect(trackMetaPageView()).toBe(false);

    vi.stubGlobal("window", {});
    expect(trackMetaLead()).toBe(false);
  });
});
