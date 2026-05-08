import { expect, test } from "@playwright/test";

test("loads the Pages app and creates a demo report", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Civic Asset Audit Walker" })).toBeVisible();
  await expect(
    page.getByLabel("Project links", { exact: true }).getByRole("link", { name: "GitHub" })
  ).toHaveAttribute("href", "https://github.com/baditaflorin/civic-asset-audit-walker");
  await expect(page.getByText(/v0\.1\.0/)).toBeVisible();
  await expect(page.getByText(/commit/)).toBeVisible();

  await page.getByRole("button", { name: "Use demo" }).click();
  await page.getByRole("button", { name: "Save report" }).click();

  await expect(page.getByText("Saved CAW-36H11-000023.")).toBeVisible();
  await expect(page.getByText("1 reports · 0 mapped")).toBeVisible();
});
