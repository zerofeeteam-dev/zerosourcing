import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataPath = new URL("./organization-json-ld.json", import.meta.url);

test("organization JSON-LD is valid and matches public company facts", async () => {
  const jsonLd = JSON.parse(await readFile(dataPath, "utf8"));

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.equal(jsonLd["@type"], "Organization");
  assert.equal(jsonLd["@id"], "https://zerosourcing.kr/#organization");
  assert.equal(jsonLd.name, "제로소싱");
  assert.equal(jsonLd.legalName, "제로피");
  assert.deepEqual(jsonLd.alternateName, ["zeroSourcing", "제로소싱"]);
  assert.equal(jsonLd.url, "https://zerosourcing.kr");
  assert.equal(jsonLd.image, "https://zerosourcing.kr/og.png");
  assert.equal(jsonLd.logo, undefined);
  assert.equal(jsonLd.email, "contact@zerofee.kr");
  assert.equal(jsonLd.contactPoint.email, jsonLd.email);
  assert.equal(
    jsonLd.address.streetAddress,
    "덕양구 동축로70, A동 9층 901호(동산동, 현대프리미어캠퍼스)",
  );
  assert.equal(jsonLd.address.addressLocality, "고양시");
  assert.equal(jsonLd.address.addressRegion, "경기도");
  assert.equal(jsonLd.address.addressCountry, "KR");
  assert.equal(jsonLd.founder.name, "이동규");
  assert.equal(jsonLd.sameAs, undefined);

  const offers = jsonLd.hasOfferCatalog.itemListElement;
  assert.equal(offers.length, 5);
  assert.deepEqual(
    offers.map(({ itemOffered }) => itemOffered.name),
    [
      "MVP 개발",
      "하이브리드 앱 개발",
      "기업 홈페이지 제작",
      "인터넷 강의 홈페이지 제작",
      "온라인 쇼핑몰 제작",
    ],
  );
  assert.deepEqual(
    offers.slice(0, 3).map(({ itemOffered }) => itemOffered.url),
    [
      "https://zerosourcing.kr/service/mvp",
      "https://zerosourcing.kr/service/app",
      "https://zerosourcing.kr/service/company-homepage",
    ],
  );
  assert.equal(offers[3].itemOffered.url, undefined);
  assert.equal(offers[3].itemOffered.description, undefined);
  assert.equal(offers[4].itemOffered.url, undefined);
  assert.equal(offers[4].itemOffered.description, undefined);

  assert.doesNotMatch(JSON.stringify(jsonLd), /zerosourcing\.com/);
});
