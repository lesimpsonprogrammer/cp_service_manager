import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("marketing root page renders for a signed-out visitor", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  });

  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("signup page renders the signup form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: /request access|join workspace/i })).toBeVisible();
  });

  test("login rejects an empty submission without crashing", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    // HTML5 "required" validation blocks submission — we should still be on /login.
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("route protection", () => {
  const protectedRoutes = [
    "/dashboard",
    "/clients",
    "/data-sources",
    "/pipelines",
    "/webhooks",
    "/settings",
    "/invoices",
    "/docs",
    "/templates",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects a signed-out visitor to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login\?redirectTo=/);
    });
  }
});
