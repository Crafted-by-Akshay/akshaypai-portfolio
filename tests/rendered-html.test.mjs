import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete portfolio shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Akshay Pai — AI Engineer<\/title>/i);
  assert.match(html, /<h1[^>]*>Akshay Pai<\/h1>/i);
  assert.match(html, /id="projects"/);
  assert.match(html, /id="about"/);
  assert.match(html, /id="writing"/);
  assert.match(html, /id="contact"/);
  assert.match(html, /prefers-reduced-motion|index-[^"']+\.css/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps portfolio content and hero implementation editable", async () => {
  const [page, waterScene, content, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/HeroWaterScene.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function HeroVisual\(\)/);
  assert.match(page, /IntersectionObserver/);
  assert.match(page, /aria-controls="site-navigation"/);
  assert.match(content, /export const portfolio/);
  assert.match(content, /export const projects/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(waterScene, /new ShaderMaterial/);
  assert.match(waterScene, /uRippleOrigins\[7\]/);
  assert.match(waterScene, /onPointerMove/);
  assert.match(waterScene, /uHoverActive/);
  assert.match(waterScene, /persistent local shimmer/);
  assert.match(waterScene, /pointerDown \? 0\.52 : 0\.22/);
  assert.match(waterScene, /canopy/);
  assert.doesNotMatch(page, /className="orb"|className="leaf-field"/);
  assert.match(css, /Standard fluid desktop\/tablet layout/);
  assert.match(css, /@media \(min-width:\s*1180px\)/);
  assert.match(css, /@media \(min-width:\s*768px\) and \(max-width:\s*1179px\)/);
  assert.match(css, /background-size:\s*auto 100%/);
  assert.match(css, /background-position:\s*right center/);
  assert.match(css, /@media \(min-width:\s*1024px\) and \(min-height:\s*700px\)/);
  assert.match(css, /grid-template-rows:\s*52\.5dvh 29dvh 18\.5dvh/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
  assert.match(css, /background-size:\s*auto 48%/);
  assert.match(css, /#f5eee4 46%/);
  assert.doesNotMatch(page, /desktop-stage|stage-scale|visualViewport/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /"three"/);
});
