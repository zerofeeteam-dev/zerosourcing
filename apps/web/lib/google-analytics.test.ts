import { afterEach, describe, expect, it, vi } from "vitest";

import { trackOutsourcingLead } from "./google-analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Google Analytics", () => {
  it.each(["kakao", "website"] as const)(
    "tracks a %s outsourcing lead",
    (leadChannel) => {
      const gtag = vi.fn();
      vi.stubGlobal("window", { gtag });

      expect(trackOutsourcingLead(leadChannel)).toBe(true);
      expect(gtag).toHaveBeenCalledWith("event", "generate_lead", {
        lead_channel: leadChannel,
        service_category: "outsourcing",
      });
    },
  );

  it("does nothing when the browser or gtag is unavailable", () => {
    expect(trackOutsourcingLead("kakao")).toBe(false);

    vi.stubGlobal("window", {});
    expect(trackOutsourcingLead("website")).toBe(false);
  });
});
