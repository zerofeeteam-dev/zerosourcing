import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./MetaPixel.tsx", import.meta.url);
const contactPath = new URL("../app/contact/page.tsx", import.meta.url);
const layoutPath = new URL("../app/layout.tsx", import.meta.url);

test("the root layout tracks initial and client-side page views", async () => {
  const [component, layout] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(layoutPath, "utf8"),
  ]);

  assert.match(component, /^"use client";/);
  assert.match(component, /from "next\/script"/);
  assert.match(component, /usePathname\(\)/);
  assert.match(component, /strategy="afterInteractive"/);
  assert.match(component, /previousPathname\.current === pathname/);
  assert.match(component, /trackMetaPageView\(\)/);
  assert.match(
    layout,
    /<Suspense fallback=\{null\}>\s*<MetaPixel \/>\s*<\/Suspense>/,
  );
});

test("a Lead is tracked only after the contact endpoint succeeds", async () => {
  const contact = await readFile(contactPath, "utf8");
  const failedResponseCheck = contact.indexOf("if (!response.ok)");
  const leadTracking = contact.indexOf("trackMetaLead()");
  const successState = contact.indexOf('setSubmitStatus("success")');

  assert.ok(failedResponseCheck >= 0);
  assert.ok(leadTracking > failedResponseCheck);
  assert.ok(successState > leadTracking);
});
