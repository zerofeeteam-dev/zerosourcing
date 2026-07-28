import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serviceExpectations = [
  {
    file: "./service/mvp/page.tsx",
    id: "mvp-service-json-ld",
    name: "MVP 개발",
    path: "/service/mvp",
    serviceType: "MVP 개발",
  },
  {
    file: "./service/app/page.tsx",
    id: "app-service-json-ld",
    name: "하이브리드 앱 개발",
    path: "/service/app",
    serviceType: "앱 개발",
  },
  {
    file: "./service/company-homepage/page.tsx",
    id: "company-homepage-service-json-ld",
    name: "기업 홈페이지 제작",
    path: "/service/company-homepage",
    serviceType: "기업 홈페이지 제작",
  },
];

test("each routed service renders its own Service JSON-LD", async () => {
  for (const expectation of serviceExpectations) {
    const page = await readFile(
      new URL(expectation.file, import.meta.url),
      "utf8",
    );

    assert.match(page, /import \{ JsonLd \} from/);
    assert.match(page, /import \{ createServiceJsonLd \} from/);
    assert.match(page, /createServiceJsonLd\(\{/);
    assert.ok(page.includes(`name: ${JSON.stringify(expectation.name)}`));
    assert.ok(page.includes(`path: ${JSON.stringify(expectation.path)}`));
    assert.ok(
      page.includes(`serviceType: ${JSON.stringify(expectation.serviceType)}`),
    );
    assert.ok(page.includes(`id=${JSON.stringify(expectation.id)}`));
  }
});
