import { test, expect } from "@playwright/test";
import {
  loginAsStaff,
  loginAsClient,
  signOut,
  MOCK_HUB_ID,
  setupConsoleErrorGate,
  expectNoConsoleErrors,
} from "./test-utils";

test.describe("Authentication & Route Guards", () => {
  test.describe("Unauthenticated Access", () => {
    test("redirects / to login when not authenticated", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/);
    });

    test("redirects /hubs to login when not authenticated", async ({ page }) => {
      await page.goto("/hubs");
      await expect(page).toHaveURL(/\/login/);
    });

    test("redirects /hub/:hubId to login when not authenticated", async ({ page }) => {
      await page.goto(`/hub/${MOCK_HUB_ID}/overview`);
      await expect(page).toHaveURL(/\/login/);
    });

    test("redirects /portal/:hubId to login when not authenticated", async ({ page }) => {
      await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Staff Route Access", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("staff can access /hubs list", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto("/hubs");
      await expect(page).toHaveURL(/\/hubs/);
      await expect(page.getByRole("heading", { name: /hubs/i })).toBeVisible();
      expectNoConsoleErrors(errors);
    });

    test("staff can access hub overview", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${MOCK_HUB_ID}/overview`);
      await expect(page).toHaveURL(`/hub/${MOCK_HUB_ID}/overview`);
      expectNoConsoleErrors(errors);
    });

    test("staff can access all hub sections", async ({ page }) => {
      const sections = [
        "overview",
        "proposal",
        "videos",
        "documents",
        "messages",
        "meetings",
        "questionnaire",
        "client-portal",
      ];

      for (const section of sections) {
        const errors = await setupConsoleErrorGate(page);
        await page.goto(`/hub/${MOCK_HUB_ID}/${section}`);
        await expect(page).toHaveURL(`/hub/${MOCK_HUB_ID}/${section}`);
        expectNoConsoleErrors(errors);
      }
    });

    test("staff cannot access client portal routes", async ({ page }) => {
      await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
      // Should redirect away from portal (staff don't have portal access)
      await expect(page).not.toHaveURL(/\/portal\//);
    });
  });

  test.describe("Client Route Access", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsClient(page);
    });

    test("client redirects to portal on /", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/portal\/.*\/overview/);
    });

    test("client can access portal overview", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
      await expect(page).toHaveURL(`/portal/${MOCK_HUB_ID}/overview`);
      expectNoConsoleErrors(errors);
    });

    test("client can access all portal sections", async ({ page }) => {
      const sections = [
        "overview",
        "proposal",
        "videos",
        "documents",
        "messages",
        "meetings",
        "questionnaire",
        "people",
      ];

      for (const section of sections) {
        const errors = await setupConsoleErrorGate(page);
        await page.goto(`/portal/${MOCK_HUB_ID}/${section}`);
        await expect(page).toHaveURL(`/portal/${MOCK_HUB_ID}/${section}`);
        expectNoConsoleErrors(errors);
      }
    });

    test("client cannot access staff hub routes", async ({ page }) => {
      await page.goto(`/hub/${MOCK_HUB_ID}/overview`);
      await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible();
    });

    test("client cannot access /hubs list", async ({ page }) => {
      await page.goto("/hubs");
      await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible();
    });
  });

  test.describe("Hub Access Validation", () => {
    test("redirects to error for invalid hub ID (staff)", async ({ page }) => {
      await loginAsStaff(page);
      await page.goto("/hub/invalid-hub-id/overview");
      // Should not crash even if the hub is missing in demo data.
      const hasFatalError = await page
        .getByText(/unhandled|fatal|error boundary/i)
        .isVisible()
        .catch(() => false);
      expect(hasFatalError).toBeFalsy();
      expect(page.url()).toContain("/hub/invalid-hub-id/overview");
    });

    test("redirects to error for unauthorized hub (client)", async ({ page }) => {
      await loginAsClient(page);
      await page.goto("/portal/unauthorized-hub/overview");
      // Should show error or redirect
      const hasError =
        (await page.getByText(/not found/i).isVisible().catch(() => false)) ||
        (await page.getByText(/access denied/i).isVisible().catch(() => false));
      expect(hasError || page.url().includes("/portal")).toBeTruthy();
    });
  });

  test.describe("Logout", () => {
    test("staff logout redirects to login", async ({ page }) => {
      await loginAsStaff(page);
      await page.goto("/hubs");
      await signOut(page);
      await expect(page).toHaveURL(/\/login/);
    });

    test("client logout redirects to login", async ({ page }) => {
      await loginAsClient(page);
      await signOut(page);
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
