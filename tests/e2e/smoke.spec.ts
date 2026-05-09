import path from "node:path";
import { expect, test } from "@playwright/test";

test("imports sample data, persists across reload, and restores from a share link", async ({
  browser,
  page
}) => {
  await page.goto("/");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin
  });

  await expect(page.getByRole("heading", { name: "Civic Asset Audit Walker" })).toBeVisible();
  await expect(
    page.getByLabel("Project links", { exact: true }).getByRole("link", { name: "GitHub" })
  ).toHaveAttribute("href", "https://github.com/baditaflorin/civic-asset-audit-walker");
  await expect(page.getByText(/v0\.3\.0/)).toBeVisible();
  await expect(page.getByText(/commit [a-f0-9]{7}/)).toBeVisible();

  await page.getByRole("button", { name: "Load sample" }).click();
  await expect(page.getByText("3 reports · 3 mapped")).toBeVisible();

  await page.getByRole("button", { name: "Use demo" }).click();
  await page.getByRole("button", { name: "Save report" }).click();
  await expect(page.getByText("4 reports · 3 mapped")).toBeVisible();

  await page.reload();
  await expect(page.getByText("4 reports · 3 mapped")).toBeVisible();

  await page.getByRole("button", { name: "Share link" }).click();
  const shareUrl = await page.evaluate(() => navigator.clipboard.readText());

  const sharedContext = await browser.newContext();
  const sharedPage = await sharedContext.newPage();
  await sharedPage.goto(shareUrl);
  await expect(sharedPage.getByText("4 reports · 3 mapped")).toBeVisible();
  await sharedContext.close();
});

test("restores a workspace snapshot from file upload", async ({ page }) => {
  await page.goto("/");

  const input = page.locator('input[type="file"]');
  await input.setInputFiles(
    path.resolve(process.cwd(), "test/fixtures/workspace-snapshot.json")
  );

  await expect(page.getByText("1 reports · 1 mapped")).toBeVisible();
  await expect(page.getByText("CAW-36H11-000301")).toBeVisible();
  await expect(page.getByLabel("Asset tag")).toHaveValue("CAW-36H11-000555");
});
