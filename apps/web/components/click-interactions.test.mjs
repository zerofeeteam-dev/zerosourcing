import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const businessTypesPath = new URL("./BusinessTypesSection.tsx", import.meta.url);
const ctaEventsPath = new URL("./cta-events.ts", import.meta.url);
const headerPath = new URL("./Header.tsx", import.meta.url);
const serviceCardPath = new URL("./ServiceCard.tsx", import.meta.url);

test("Header desktop Service trigger opens the dropdown without navigating", async () => {
  const header = await readFile(headerPath, "utf8");

  assert.match(
    header,
    /if \(!isServiceItem\) \{[\s\S]*?<Link[\s\S]*?href=\{item\.href\}/,
  );
  assert.match(
    header,
    /<button[\s\S]*?className=\{isActive \? styles\.activeNavLink : styles\.navLink\}[\s\S]*?type="button"[\s\S]*?name="chevron-down"[\s\S]*?<\/button>/,
  );
  assert.doesNotMatch(header, /<button[^>]*\bhref=/);
  assert.match(
    header,
    /<div className=\{styles\.mobileMenuGroup\} key=\{item\.label\}>\s*<Link[\s\S]*?href=\{item\.href\}[\s\S]*?onClick=\{closeMobileMenu\}[\s\S]*?>\s*\{item\.label\}\s*<\/Link>\s*\{item\.label === "Service"/,
  );
  assert.doesNotMatch(header, /aria-haspopup/);
});

test("ServiceCard actions emit typed CTA events for all four cards", async () => {
  const [businessTypes, ctaEvents, serviceCard] = await Promise.all([
    readFile(businessTypesPath, "utf8"),
    readFile(ctaEventsPath, "utf8"),
    readFile(serviceCardPath, "utf8"),
  ]);

  assert.match(serviceCard, /^"use client";/);
  assert.match(
    serviceCard,
    /export type ServiceCardData = \{[\s\S]*?action: CtaAction;[\s\S]*?description: readonly string\[\];[\s\S]*?iconName\?: IconName;/,
  );
  assert.match(serviceCard, /action: CtaAction;/);
  assert.match(serviceCard, /import Link from "next\/link";/);
  assert.match(
    serviceCard,
    /<Link[\s\S]*?href=\{getCtaHref\(action\)\}[\s\S]*?onClick=\{\(\) => emitCtaEvent\(action\)\}/,
  );
  assert.match(serviceCard, /<span className=\{styles\.action\}>/);
  assert.doesNotMatch(serviceCard, /<button/);
  assert.doesNotMatch(serviceCard, /role="link"|tabIndex|handleCardKeyDown/);
  assert.match(
    ctaEvents,
    /export function getCtaHref\(action: CtaAction\) \{\s*return ctaHrefs\[action\];/,
  );
  assert.match(
    ctaEvents,
    /export function emitCtaEvent\(action: CtaAction\)[\s\S]*?window\.dispatchEvent/,
  );
  assert.match(
    businessTypes,
    /const services = \[[\s\S]*?\] as const satisfies readonly ServiceCardData\[\];/,
  );
  assert.doesNotMatch(
    businessTypes,
    /(?:action|iconName): "[^"]+" as const/,
  );

  for (const action of [
    "service-mvp",
    "service-app",
    "service-company-homepage",
    "quick",
  ]) {
    assert.match(businessTypes, new RegExp(`action: "${action}"`));
  }

  for (const [action, href] of [
    ["service-mvp", "/service/mvp"],
    ["service-app", "/service/app"],
    ["service-company-homepage", "/service/company-homepage"],
    ["quick", "/contact"],
  ]) {
    assert.match(ctaEvents, new RegExp(`"?${action}"?: "${href}"`));
  }
});
