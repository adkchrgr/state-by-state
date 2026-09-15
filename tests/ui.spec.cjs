const { test, expect } = require("@playwright/test");
const path = require("node:path");
const url = "file://" + path.resolve(__dirname, "../web/index.html");
async function dragToTarget(page, id, offset = 0) {
  const card = page.locator(`[data-id="${id}"]`);
  await card.scrollIntoViewIfNeeded();
  const from = await card.boundingBox();
  const to = await page.evaluate((id) => {
    const p = geographyApp.puzzle.pieces.find((p) => p.id === id),
      b = Geometry.bounds(p.geometry);
    const pt = new DOMPoint(b.x + b.w / 2, b.y + b.h / 2).matrixTransform(
      document.getElementById("map").getScreenCTM(),
    );
    return { x: pt.x, y: pt.y };
  }, id);
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + offset, to.y, { steps: 8 });
  return to;
}
test.beforeEach(async ({ page }) => {
  await page.goto(url);
});
test("offline real pointer drop, release-only snap, locking and reset confirmation", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator(".piece-card")).toHaveCount(50);
  await dragToTarget(page, "TX");
  await expect(page.locator("#progressText")).toHaveText(
    "0 / 50 states placed",
  );
  await page.mouse.up();
  await expect(page.locator("#progressText")).toHaveText(
    "1 / 50 states placed",
  );
  await expect(page.locator('[data-id="TX"]')).toHaveCount(0);
  await expect(page.locator("#state-TX")).toHaveClass(/placed/);
  await page.locator("#reset").click();
  await expect(page.locator("#confirmDialog")).toBeVisible();
  await page.locator("#cancelReset").click();
  await expect(page.locator("#progressText")).toHaveText(
    "1 / 50 states placed",
  );
  await page.locator("#reset").click();
  await page.locator("#confirmReset").click();
  await expect(page.locator(".piece-card")).toHaveCount(50);
  expect(errors).toEqual([]);
});
test("wrong drop returns; Escape cancels without counting an attempt", async ({
  page,
}) => {
  await dragToTarget(page, "CA", -800);
  await page.mouse.up();
  await expect(page.locator("#progressText")).toHaveText(
    "0 / 50 states placed",
  );
  await expect(page.locator(".ghost")).toHaveCount(0);
  await dragToTarget(page, "CA");
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect(await page.evaluate(() => geographyApp.puzzle.attempts)).toBe(1);
});
test("colonies combined piece counts two and keeps internal boundaries", async ({
  page,
}) => {
  await page.locator("#mode").selectOption("colonies");
  await expect(page.locator(".piece-card")).toHaveCount(12);
  await dragToTarget(page, "MD-DE");
  await page.mouse.up();
  await expect(page.locator("#progressText")).toHaveText(
    "2 / 13 colonies placed",
  );
  await expect(page.locator("#state-MD")).toHaveClass(/placed/);
  await expect(page.locator("#state-DE")).toHaveClass(/placed/);
});
test("challenge hides names and hints, settings survive reload", async ({
  page,
}) => {
  await page.locator("#mode").selectOption("northeast");
  await page.locator("#style").selectOption("challenge");
  await expect(page.locator("#hint")).toBeDisabled();
  await expect(page.locator(".piece-card").first()).toHaveAccessibleName(
    /Unplaced shape/,
  );
  await expect(page.locator(".piece-card span").first()).toHaveText(
    "Identify this shape",
  );
  await page.locator("#sound").click();
  await page.reload();
  await expect(page.locator("#mode")).toHaveValue("northeast");
  await expect(page.locator("#style")).toHaveValue("challenge");
  await expect(page.locator("#sound")).toHaveText("Sound on");
});
test("keyboard placement and responsive layout", async ({ page }) => {
  const card = page.locator('[data-id="KS"]');
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".ghost")).toHaveCount(1);
  const moves = await page.evaluate(() => {
    const a = geographyApp.drag.active;
    return { x: Math.round(-a.dx / 2), y: Math.round(-a.dy / 2) };
  });
  await page.keyboard.down("Shift");
  for (let i = 0; i < Math.abs(moves.x); i++)
    await page.keyboard.press(moves.x > 0 ? "ArrowRight" : "ArrowLeft");
  for (let i = 0; i < Math.abs(moves.y); i++)
    await page.keyboard.press(moves.y > 0 ? "ArrowDown" : "ArrowUp");
  await page.keyboard.up("Shift");
  await page.keyboard.press("Enter");
  await expect(page.locator("#state-KS")).toHaveClass(/placed/);
  await page.setViewportSize({ width: 800, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("#tray")).toBeVisible();
});
test("completion and play again", async ({ page }) => {
  await page.locator("#mode").selectOption("southwest");
  for (const id of ["AZ", "NM", "OK", "TX"]) {
    await dragToTarget(page, id);
    await page.mouse.up();
  }
  await expect(page.locator("#completeDialog")).toBeVisible();
  await expect(page.locator("#completeTitle")).toHaveText("Southwest Complete");
  await page.locator("#again").click();
  await expect(page.locator("#progressText")).toHaveText("0 / 4 states placed");
});
test("no remote requests and no script errors", async ({ page }) => {
  const remote = [],
    errors = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) remote.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await page.locator("#mode").selectOption("colonies");
  await page.locator("#hint").click();
  await page.locator("#settingsButton").click();
  await page.locator("#threshold").selectOption("0.5");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test("native preference bridge loads and saves validated settings", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.nativeSettings = JSON.stringify({ mode: "colonies", sound: false });
    window.savedNativePreferences = null;
    window.webkit = {
      messageHandlers: {
        savePreferences: {
          postMessage: (value) => {
            window.savedNativePreferences = value;
          },
        },
      },
    };
  });
  await page.reload();
  await expect(page.locator("#mode")).toHaveValue("colonies");
  await page.locator("#sound").click();
  expect(
    await page.evaluate(() => JSON.parse(window.savedNativePreferences).sound),
  ).toBe(true);
});
