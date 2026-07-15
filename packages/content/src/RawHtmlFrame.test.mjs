import assert from "node:assert/strict";
import test from "node:test";
import { buildRawHtmlSource } from "./raw-html-source.ts";

test("inserts one runtime after a normal HTML5 doctype", () => {
  const html =
    "<!doctype html><html><head><title>제목</title></head><body>본문</body></html>";
  const output = buildRawHtmlSource(
    html,
    "https://project.supabase.co/storage/content/blog/scope/",
  );

  assert.match(
    output,
    /^<!doctype html><base href="https:\/\/project\.supabase\.co\/storage\/content\/blog\/scope\/">\s*<script>/,
  );
  assert.equal(output.match(/\(\(\) => \{/g)?.length, 1);
  assert.ok(output.endsWith(html.slice("<!doctype html>".length)));
});

test("does not parse head or base strings inside comments and scripts", () => {
  const html =
    '<!-- <head><base href="comment/"> --><script>const sample = "<head><base href=script/>";</script><main>본문</main>';
  const output = buildRawHtmlSource(html, "https://assets.example/content/");

  assert.ok(
    output.startsWith('<base href="https://assets.example/content/"><script>'),
  );
  assert.ok(output.endsWith(html));
});

test("keeps a BOM and standards-mode prefix before the injected runtime", () => {
  const prefix = "\uFEFF  <!DOCTYPE HTML>";
  const html = `${prefix}\n<html><body>본문</body></html>`;
  const output = buildRawHtmlSource(html, "https://assets.example/content/");

  assert.ok(
    output.startsWith(
      `${prefix}<base href="https://assets.example/content/"><script>`,
    ),
  );
  assert.ok(output.endsWith(html.slice(prefix.length)));
});

test("places the managed base before an author-supplied base", () => {
  const managedBase = '<base href="https://assets.example/content/">';
  const authorBase = '<base href="https://author.example/">';
  const html = `<!doctype html><html><head>${authorBase}</head><body></body></html>`;
  const output = buildRawHtmlSource(html, "https://assets.example/content/");

  assert.ok(output.indexOf(managedBase) < output.indexOf(authorBase));
  assert.ok(output.endsWith(html.slice("<!doctype html>".length)));
});

test("prepends the runtime when the source has no doctype", () => {
  const html = "  <html><body>원본 공백 유지</body></html>";
  const output = buildRawHtmlSource(html);

  assert.match(output, /^<script>/);
  assert.ok(output.endsWith(html));
});

test("re-measures for late-loading assets and web fonts", () => {
  const output = buildRawHtmlSource('<img src="late.webp">');

  assert.match(output, /document\.addEventListener\("load", send, true\)/);
  assert.match(output, /document\.fonts\.ready\.then\(send\)/);
  assert.match(output, /new ResizeObserver\(send\)/);
  assert.match(output, /zerosourcing:raw-html-measure/);
  assert.match(output, /window\.addEventListener\("message", \(event\) =>/);
  assert.match(output, /zerosourcing-raw-html-viewport/);
  assert.match(output, /height: auto !important/);
  assert.match(output, /overflow-y: visible !important/);
  assert.match(output, /scrollingElement \? scrollingElement\.scrollHeight : 0/);
});
