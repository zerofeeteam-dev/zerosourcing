import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const searchInputPath = new URL("./search-input.tsx", import.meta.url);

test("search input uses the supplied icon path without changing its color", async () => {
  const searchInput = await readFile(searchInputPath, "utf8");

  assert.match(searchInput, /color: "#1b1f2a"/);
  assert.match(
    searchInput,
    /d="M16\.9284 17\.0416L20\.4016 20\.4016M11\.4016 7\.20156C13\.3898 7\.20156 15\.0016 8\.81334 15\.0016 10\.8016M19\.2816 11\.4416C19\.2816 15\.7715 15\.7715 19\.2816 11\.4416 19\.2816C7\.11165 19\.2816 3\.60156 15\.7715 3\.60156 11\.4416C3\.60156 7\.11165 7\.11165 3\.60156 11\.4416 3\.60156C15\.7715 3\.60156 19\.2816 7\.11165 19\.2816 11\.4416Z"/,
  );
  assert.match(searchInput, /stroke="currentColor"/);
});
