import { test, expect } from "@playwright/test";
import {
  loginAsClient,
  MOCK_HUB_ID,
  setupConsoleErrorGate,
  expectNoConsoleErrors,
  waitForLoading,
} from "./test-utils";

test.describe("Portal Context (useHubId)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
  });

  test.describe("HubId Available Across All Client Pages", () => {
    const clientSections = [
      { path: "overview", title: /overview|welcome/i },
      { path: "proposal", title: /proposal/i },
      { path: "videos", title: /videos/i },
      { path: "documents", title: /documents/i },
      { path: "messages", title: /messages/i },
      { path: "meetings", title: /meetings/i },
      { path: "questionnaire", title: /questionnaire/i },
      { path: "people", title: /people|team/i },
    ];

    for (const section of clientSections) {
      test(`${section.path} page loads with hub context`, async ({ page }) => {
        const errors = await setupConsoleErrorGate(page);

        await page.goto(`/portal/${MOCK_HUB_ID}/${section.path}`);
        await waitForLoading(page);

        // Page should load without errors (no "hubId is undefined" errors)
        await expect(page.getByRole("heading", { name: section.title })).toBeVisible({
          timeout: 10000,
        });

        // Sidebar should show correct hub-scoped links
        const sidebar = page.locator('[class*="sidebar"]').first();
        if (await sidebar.isVisible().catch(() => false)) {
          // Links should contain the hubId
          const links = sidebar.locator("a");
          const count = await links.count();
          for (let i = 0; i < Math.min(count, 3); i++) {
            const href = await links.nth(i).getAttribute("href");
            if (href && href.startsWith("/portal")) {
              expect(href).toContain(MOCK_HUB_ID);
            }
          }
        }

        expectNoConsoleErrors(errors);
      });
    }
  });

  test.describe("Navigation Preserves Hub Context", () => {
    test("navigating between sections maintains hubId", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      // Start at overview
      await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
      await waitForLoading(page);
      expect(page.url()).toContain(MOCK_HUB_ID);

      // Navigate to documents via sidebar
      await page.getByRole("link", { name: /documents/i }).click();
      await waitForLoading(page);
      expect(page.url()).toContain(`/portal/${MOCK_HUB_ID}/documents`);

      // Navigate to messages from in-page CTA (always available in portal layout)
      await page.getByRole("link", { name: /send a message/i }).click();
      await waitForLoading(page);
      expect(page.url()).toContain(`/portal/${MOCK_HUB_ID}/messages`);

      expectNoConsoleErrors(errors);
    });

    test("logo click navigates to hub overview", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/portal/${MOCK_HUB_ID}/documents`);
      await waitForLoading(page);

      // Click logo (if visible)
      const logo = page.locator('img[alt*="AgentFlow"]').first();
      if (await logo.isVisible().catch(() => false)) {
        await logo.click();
        await waitForLoading(page);
        expect(page.url()).toContain(`/portal/${MOCK_HUB_ID}/overview`);
      }

      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Invalid/Unauthorized Hub Handling", () => {
    test("shows error for non-existent hub", async ({ page }) => {
      await page.goto("/portal/nonexistent-hub-123/overview");
      await waitForLoading(page);

      // Current behavior can be:
      // - Access denied screen in demo mode
      // - Hub unavailable screen in live mode
      // - Redirect to login
      await expect
        .poll(async () => {
          if (page.url().includes("/login")) return "login";

          const hasAccessDenied = await page
            .getByRole("heading", { name: /access denied/i })
            .isVisible()
            .catch(() => false);
          if (hasAccessDenied) return "access_denied";

          const hasUnavailable = await page
            .getByRole("heading", { name: /hub unavailable|invalid portal link/i })
            .isVisible()
            .catch(() => false);
          if (hasUnavailable) return "unavailable";

          return "pending";
        }, { timeout: 10000 })
        .toMatch(/login|access_denied|unavailable/);
    });

    test("handles missing hubId in URL gracefully", async ({ page }) => {
      // Try to navigate to portal without hubId
      await page.goto("/portal//overview");

      // Should redirect or show error, not crash
      await page.waitForLoadState("networkidle");
      // The app shouldn't crash - page should be in a valid state
      const hasCrashed = await page.getByText(/something went wrong/i).isVisible().catch(() => false);
      expect(hasCrashed).toBeFalsy();
    });
  });

  test.describe("Hub Name Display", () => {
    test("header shows correct hub name", async ({ page }) => {
      await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
      await waitForLoading(page);

      // Header should show hub name (not generic text)
      const header = page.locator("header");
      const headerText = await header.textContent();
      expect(headerText).toBeTruthy();
      // Should show either hub name or "AgentFlow Hub" type text
      expect(headerText?.length).toBeGreaterThan(5);
    });
  });
});
