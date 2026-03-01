import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  loginAsStaff,
  loginAsClient,
  MOCK_HUB_ID,
  waitForLoading,
} from "./test-utils";

test.describe("Accessibility & Console Errors", () => {
  test.describe("Console Error Gate", () => {
    test("login page has no console errors", async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("ResizeObserver") && !text.includes("favicon.ico")) {
            errors.push(text);
          }
        }
      });

      page.on("pageerror", (err) => {
        errors.push(err.message);
      });

      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      expect(errors).toHaveLength(0);
    });

    test("staff hub list has no console errors", async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("ResizeObserver") && !text.includes("favicon.ico")) {
            errors.push(text);
          }
        }
      });

      await loginAsStaff(page);
      await page.goto("/hubs");
      await waitForLoading(page);

      expect(errors).toHaveLength(0);
    });

    test("staff hub overview has no console errors", async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("ResizeObserver") && !text.includes("favicon.ico")) {
            errors.push(text);
          }
        }
      });

      await loginAsStaff(page);
      await page.goto(`/hub/${MOCK_HUB_ID}/overview`);
      await waitForLoading(page);

      expect(errors).toHaveLength(0);
    });

    test("client portal has no console errors", async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("ResizeObserver") && !text.includes("favicon.ico")) {
            errors.push(text);
          }
        }
      });

      await loginAsClient(page);
      await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
      await waitForLoading(page);

      expect(errors).toHaveLength(0);
    });

    test("navigation between pages produces no errors", async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!text.includes("ResizeObserver") && !text.includes("favicon.ico")) {
            errors.push(text);
          }
        }
      });

      await loginAsStaff(page);

      // Navigate through several pages
      const pages = [
        "/hubs",
        `/hub/${MOCK_HUB_ID}/overview`,
        `/hub/${MOCK_HUB_ID}/proposal`,
        `/hub/${MOCK_HUB_ID}/documents`,
        `/hub/${MOCK_HUB_ID}/messages`,
      ];

      for (const url of pages) {
        await page.goto(url);
        await waitForLoading(page);
      }

      expect(errors).toHaveLength(0);
    });
  });

  test.describe("Accessibility (axe-core)", () => {
    test("login page passes basic a11y", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude('[role="presentation"]') // Exclude decorative elements
        .analyze();

      // Filter out minor issues
      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical"
      );

      if (criticalViolations.length > 0) {
        console.log("Critical a11y violations:", JSON.stringify(criticalViolations, null, 2));
      }

      expect(criticalViolations).toHaveLength(0);
    });

    test("hub list page passes basic a11y", async ({ page }) => {
      await loginAsStaff(page);
      await page.goto("/hubs");
      await waitForLoading(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude('[role="presentation"]')
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical"
      );

      if (criticalViolations.length > 0) {
        console.log("Critical a11y violations:", JSON.stringify(criticalViolations, null, 2));
      }

      expect(criticalViolations).toHaveLength(0);
    });

    test("staff overview passes basic a11y", async ({ page }) => {
      await loginAsStaff(page);
      await page.goto(`/hub/${MOCK_HUB_ID}/overview`);
      await waitForLoading(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude('[role="presentation"]')
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical"
      );

      expect(criticalViolations).toHaveLength(0);
    });

    test("client portal overview passes basic a11y", async ({ page }) => {
      await loginAsClient(page);
      await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
      await waitForLoading(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude('[role="presentation"]')
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical"
      );

      expect(criticalViolations).toHaveLength(0);
    });

    test("client messages passes basic a11y", async ({ page }) => {
      await loginAsClient(page);
      await page.goto(`/portal/${MOCK_HUB_ID}/messages`);
      await waitForLoading(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude('[role="presentation"]')
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === "critical"
      );

      expect(criticalViolations).toHaveLength(0);
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("login form is keyboard accessible", async ({ page }) => {
      await page.goto("/login");
      await page.locator("body").focus();

      // Tab through focusable elements until we reach a button.
      // Login now includes a Microsoft button + optional demo form in mock mode.
      let focusedTag = "";
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press("Tab");
        focusedTag = await page.evaluate(
          () => document.activeElement?.tagName.toLowerCase() ?? ""
        );
        if (["button", "input", "a", "select", "textarea"].includes(focusedTag)) break;
      }

      expect(["button", "input", "a", "select", "textarea"]).toContain(focusedTag);
    });

    test("sidebar navigation is keyboard accessible", async ({ page }) => {
      await loginAsStaff(page);
      await page.goto(`/hub/${MOCK_HUB_ID}/overview`);
      await waitForLoading(page);

      // Find any links in the left navigation area
      const sidebarLinks = page.locator("aside a, nav a");
      const count = await sidebarLinks.count();

      if (count > 0) {
        // First link should be focusable
        await sidebarLinks.first().focus();
        const focusedHref = await page.locator(':focus').getAttribute("href");
        expect(focusedHref).toBeTruthy();
      }
    });
  });

  test.describe("Error States Don't Crash", () => {
    test("404 route renders gracefully", async ({ page }) => {
      const errors: string[] = [];

      page.on("pageerror", (err) => {
        errors.push(err.message);
      });

      await page.goto("/nonexistent-route-12345");
      await page.waitForLoadState("networkidle");

      // Page should not crash
      const hasCrashed = await page.getByText(/unhandled|crash|fatal/i).isVisible().catch(() => false);
      expect(hasCrashed).toBeFalsy();

      // Should show 404-style UI or redirect to login
      const has404Heading = await page.getByRole("heading", { name: /404/i }).isVisible().catch(() => false);
      const hasNotFoundCopy = await page.getByText(/page not found|not found/i).first().isVisible().catch(() => false);
      const redirectedToLogin = page.url().includes("/login");

      expect(has404Heading || hasNotFoundCopy || redirectedToLogin).toBeTruthy();
    });

    test("malformed hub ID doesn't crash", async ({ page }) => {
      const errors: string[] = [];

      page.on("pageerror", (err) => {
        errors.push(err.message);
      });

      await loginAsStaff(page);
      await page.goto("/hub/../../etc/passwd/overview");
      await page.waitForLoadState("networkidle");

      // Should not crash, should redirect or show error
      const hasCrashed = await page.getByText(/unhandled|crash/i).isVisible().catch(() => false);
      expect(hasCrashed).toBeFalsy();
    });
  });
});
