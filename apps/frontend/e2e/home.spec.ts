import { test, expect } from "@playwright/test";

test("トップページで人物一覧を表示できる", async ({ page }) => {
  await page.route("**/persons", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: 1, name: "織田信長" },
        { id: 2, name: "豊臣秀吉" },
      ]),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "人物一覧" })).toBeVisible();
  await expect(page.getByText(/名$/)).toBeVisible();
  await expect(page.getByText("織田信長")).toBeVisible();
  await expect(page.getByText("豊臣秀吉")).toBeVisible();
});
