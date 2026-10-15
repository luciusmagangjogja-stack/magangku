import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const baseUrl = process.env.MAGANGKU_URL ?? "http://127.0.0.1:3000";
const screenshotDirectory = join(tmpdir(), "magangku-responsive");
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
];

await mkdir(screenshotDirectory, { recursive: true });
console.log("Launching Chromium...");
const browser = await chromium.launch({ headless: true });
console.log("Chromium ready.");
let failed = false;

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      console.error(`Request failed at ${viewport.width}px: ${request.url()}`);
    });
    console.log(`Opening ${viewport.width}x${viewport.height}...`);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.locator("main").waitFor({ state: "visible" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of Array.from(document.images)) {
        image.scrollIntoView({ block: "center" });
        await image.decode();
      }
      window.scrollTo(0, 0);
    });

    const result = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const images = Array.from(document.images);
      const outsideImages = images.filter((image) => {
        const bounds = image.getBoundingClientRect();
        return bounds.left < -1 || bounds.right > width + 1 || image.naturalWidth === 0;
      });

      return {
        viewportWidth: width,
        documentWidth: document.documentElement.scrollWidth,
        missingSections: ["hero-title", "requirements-title", "positions-title", "facilities-title", "contact-title"]
          .filter((id) => !document.getElementById(id)),
        outsideImages: outsideImages.length,
        whatsapp: document.querySelector(".contact-phone")?.getAttribute("href"),
        registration: document.querySelector(".registration-link")?.getAttribute("href"),
      };
    });

    const errors = [];
    if (result.documentWidth > result.viewportWidth) errors.push("horizontal overflow");
    if (result.missingSections.length) errors.push(`missing sections: ${result.missingSections.join(", ")}`);
    if (result.outsideImages) errors.push(`${result.outsideImages} broken or offscreen images`);
    if (pageErrors.length) errors.push(`browser errors: ${pageErrors.join("; ")}`);
    if (consoleErrors.length) errors.push(`console errors: ${consoleErrors.join("; ")}`);
    if (result.whatsapp !== "https://wa.link/y23pe4") errors.push("WhatsApp link changed");
    if (result.registration !== "http://bit.ly/form_magangku") errors.push("registration link changed");

    const shouldCapture = viewport.width === 1440 || viewport.width === 390;
    if (shouldCapture) {
      await page.screenshot({
        path: join(screenshotDirectory, `${viewport.width}.png`),
        fullPage: true,
      });
    }

    console.log(
      `${viewport.width}x${viewport.height}: ${errors.length ? `FAIL (${errors.join(", ")})` : "PASS"}`,
    );
    failed ||= errors.length > 0;
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`Full-page comparison screenshots: ${screenshotDirectory}`);
if (failed) process.exitCode = 1;
