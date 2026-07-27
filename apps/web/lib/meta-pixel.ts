export const META_PIXEL_ID = "1730750948076034";

export const META_PIXEL_BOOTSTRAP_SCRIPT = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
`;

export const META_PIXEL_NOSCRIPT_URL = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;

type MetaPixelEvent = "Lead" | "PageView";
type MetaPixelFunction = (command: "track", event: MetaPixelEvent) => void;

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
  }
}

function trackMetaPixelEvent(event: MetaPixelEvent) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }

  window.fbq("track", event);
  return true;
}

export function trackMetaPageView() {
  return trackMetaPixelEvent("PageView");
}

export function trackMetaLead() {
  return trackMetaPixelEvent("Lead");
}
