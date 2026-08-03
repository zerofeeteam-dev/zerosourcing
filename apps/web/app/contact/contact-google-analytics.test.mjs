import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contactPath = new URL("./page.tsx", import.meta.url);

test("a website lead is tracked only after the contact endpoint succeeds", async () => {
  const contact = await readFile(contactPath, "utf8");
  const failedResponseCheck = contact.indexOf("if (!response.ok)");
  const leadTracking = contact.indexOf('trackOutsourcingLead("website")');
  const successState = contact.indexOf('setSubmitStatus("success")');

  assert.ok(failedResponseCheck >= 0);
  assert.ok(leadTracking > failedResponseCheck);
  assert.ok(successState > leadTracking);
});
