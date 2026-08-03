export type LeadChannel = "kakao" | "website";

type GenerateLeadParameters = {
  readonly lead_channel: LeadChannel;
  readonly service_category: "outsourcing";
};

type GoogleAnalyticsFunction = (
  command: "event",
  eventName: "generate_lead",
  parameters: GenerateLeadParameters,
) => void;

declare global {
  interface Window {
    gtag?: GoogleAnalyticsFunction;
  }
}

export function trackOutsourcingLead(leadChannel: LeadChannel) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  window.gtag("event", "generate_lead", {
    lead_channel: leadChannel,
    service_category: "outsourcing",
  });
  return true;
}
