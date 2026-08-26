import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";

import "./store.mts";
import handler from "../functions/game.mts";

/**
 * Two browsers, one live game, a real HTTP hop between them.
 *
 * The unit tests prove the engine and the function; this proves the wiring
 * in between — that the long-poll loop actually delivers a phase change to a
 * second device, which is the one thing no amount of in-process testing can
 * tell you.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, "../../apps/web/dist");
const PORT = 4180;
const BASE = `http://127.0.0.1:${PORT}`;

const CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".map": "application/json",
  ".svg": "image/svg+xml",
};

let server: Server;
let browser: Browser;

const built = existsSync(path.join(DIST, "index.html"));
const runnable = built && existsSync(CHROMIUM);

beforeAll(async () => {
  if (!runnable) return;

  server = createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? "/", BASE);

      if (url.pathname === "/.netlify/functions/game") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const response = await handler(
          new Request(BASE + url.pathname, {
            method: req.method ?? "POST",
            headers: { "content-type": "application/json" },
            body: req.method === "POST" ? Buffer.concat(chunks).toString() : undefined,
          }),
        );
        res.writeHead(response.status, { "content-type": "application/json" });
        res.end(await response.text());
        return;
      }

      // Static, with an SPA fallback, exactly like the netlify.toml redirect.
      const asset = path.join(DIST, url.pathname);
      const file = existsSync(asset) && !asset.endsWith("/") ? asset : path.join(DIST, "index.html");
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "text/plain" });
      res.end(await readFile(file));
    })().catch(() => {
      res.writeHead(500);
      res.end("{}");
    });
  });

  await new Promise<void>((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  browser = await chromium.launch({ executablePath: CHROMIUM });
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve) => server?.close(() => resolve()));
});

/** Each page gets its own context so they are genuinely separate players. */
async function newPlayer(): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  return context.newPage();
}

/** Answer whatever puzzle is on screen. Kinds vary run to run. */
async function answerAnything(page: Page): Promise<boolean> {
  const options = page.locator("button.option:not([disabled])");
  if (await options.count()) {
    await options.first().click();
    return true;
  }
  const buckets = page.locator("button.bucket:not([disabled])");
  if (await buckets.count()) {
    await buckets.first().click();
    return true;
  }
  const seq = page.locator("button.seq:not([disabled])");
  if (await seq.count()) {
    const n = await seq.count();
    for (let i = 0; i < n; i++) await seq.nth(i).click();
    await page.locator("button.button:has-text('Lock it in')").first().click();
    return true;
  }
  const tiles = page.locator("button.tile:not([disabled])");
  if ((await tiles.count()) >= 2) {
    const n = await tiles.count();
    for (let i = 0; i < n / 2; i++) {
      await tiles.nth(i).click();
      await tiles.nth(n / 2 + i).click();
    }
    await page.locator("button.button:has-text('Lock it in')").first().click();
    return true;
  }
  const input = page.locator("input.input--code:not([disabled])");
  if ((await input.count()) && (await page.locator(".letters").count())) {
    await input.fill("GUESS");
    await page.locator("button.button:has-text('Lock it in')").first().click();
    return true;
  }
  return false;
}

describe.runIf(runnable)("two devices, one live game", () => {
  it(
    "carries a hosted game through to a shared final score",
    async () => {
      const hostPage = await newPlayer();
      const guestPage = await newPlayer();

      const problems: string[] = [];
      for (const page of [hostPage, guestPage]) {
        page.on("pageerror", (error) => problems.push(String(error)));
      }

      /* ── the host opens a game ── */
      await hostPage.goto(BASE, { waitUntil: "networkidle" });
      await hostPage.waitForSelector("#name");
      await hostPage.fill("#name", "Ana");
      await hostPage.click("text=Host a game");
      await hostPage.waitForSelector("text=Topic", { timeout: 15_000 });

      // Trim it to one round of one question so the test is quick.
      for (let i = 0; i < 2; i++) await hostPage.click('button[aria-label="Fewer Rounds"]');
      for (let i = 0; i < 3; i++) {
        await hostPage.click('button[aria-label="Fewer Questions each round"]');
      }
      await hostPage.click("text=Open the lobby");

      await hostPage.waitForSelector(".code-display", { timeout: 15_000 });
      const code = (await hostPage.locator(".code-display").innerText()).replace(/\s+/g, "");
      expect(code).toMatch(/^[A-Z]+-\d+$/);

      /* ── the guest follows the shared link ── */
      await guestPage.goto(`${BASE}/?code=${code}`, { waitUntil: "networkidle" });
      await guestPage.waitForSelector("#join-code", { timeout: 15_000 });
      expect(await guestPage.inputValue("#join-code")).toBe(code);

      await guestPage.fill("#join-name", "Bo");
      await guestPage.click("button.button:has-text('Join')");

      // The host's lobby should learn about Bo without being touched — this
      // is the long poll delivering someone else's change.
      await hostPage.waitForSelector("text=Bo", { timeout: 20_000 });

      /* ── play it ── */
      await hostPage.click("button.button:has-text('Start')");

      for (let step = 0; step < 40; step++) {
        const done =
          (await hostPage.locator("text=FINAL").count()) > 0 ||
          (await hostPage.locator(".podium").count()) > 0;
        if (done) break;

        await answerAnything(hostPage);
        await answerAnything(guestPage);

        for (const page of [hostPage, guestPage]) {
          const skip = page.locator("button.button:has-text('Skip ahead')");
          if (await skip.count()) await skip.first().click();
        }
        await hostPage.waitForTimeout(400);
      }

      await hostPage.waitForSelector(".podium", { timeout: 30_000 });
      await guestPage.waitForSelector(".podium", { timeout: 30_000 });

      /* ── both devices agree on the outcome ── */
      const hostScores = await hostPage.locator(".board__points").allInnerTexts();
      const guestScores = await guestPage.locator(".board__points").allInnerTexts();

      expect(hostScores.length).toBeGreaterThanOrEqual(2);
      expect(hostScores).toEqual(guestScores);
      expect(problems).toEqual([]);
    },
    120_000,
  );
});
