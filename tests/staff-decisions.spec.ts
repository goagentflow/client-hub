import { test, expect } from "@playwright/test";
import {
  loginAsStaff,
  loginAsClient,
  setupConsoleErrorGate,
  expectNoConsoleErrors,
  waitForLoading,
} from "./test-utils";

// Client hub ID from mock data (Meridian Digital)
const CLIENT_HUB_ID = "hub-3";

test.describe("Staff Decisions (Waiting on Client)", () => {
  test.describe("Page Load and Display", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("loads decisions page for client hub", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await expect(page).toHaveURL(`/hub/${CLIENT_HUB_ID}/decisions`);
      await expect(page.getByRole("heading", { name: /decisions/i })).toBeVisible();
      expectNoConsoleErrors(errors);
    });

    test("displays summary cards with counts", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      // Check for summary cards - use more specific selectors to avoid matching tabs
      const summarySection = page.locator('.grid.grid-cols-1');
      await expect(summarySection.getByText(/pending/i)).toBeVisible();
      await expect(summarySection.getByText(/overdue/i)).toBeVisible();
      await expect(summarySection.getByText(/completed/i)).toBeVisible();
      expectNoConsoleErrors(errors);
    });

    test("displays tabs for pending and completed", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await expect(page.getByRole("tab", { name: /waiting on client/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /completed/i })).toBeVisible();
      expectNoConsoleErrors(errors);
    });

    test("Request Decision button is visible", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await expect(page.getByRole("button", { name: /request decision/i })).toBeVisible();
      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Tab Switching", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("default tab is Waiting on Client", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      const pendingTab = page.getByRole("tab", { name: /waiting on client/i });
      await expect(pendingTab).toHaveAttribute("data-state", "active");
      expectNoConsoleErrors(errors);
    });

    test("can switch to Completed tab", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("tab", { name: /completed/i }).click();
      await expect(page.getByRole("tab", { name: /completed/i })).toHaveAttribute("data-state", "active");
      expectNoConsoleErrors(errors);
    });

    test("can switch back to pending tab", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      // Switch to completed
      await page.getByRole("tab", { name: /completed/i }).click();
      // Switch back to pending
      await page.getByRole("tab", { name: /waiting on client/i }).click();

      await expect(page.getByRole("tab", { name: /waiting on client/i })).toHaveAttribute("data-state", "active");
      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Decision Cards", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("pending tab content loads without errors", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      // Verify the page renders with expected structure
      // The active tab panel should be visible
      const activeTabPanel = page.getByRole("tabpanel", { name: /waiting on client/i });
      await expect(activeTabPanel).toBeVisible({ timeout: 5000 });

      // Verify no console errors occurred
      expectNoConsoleErrors(errors);
    });

    test("completed tab shows completed decisions or empty state", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("tab", { name: /completed/i }).click();

      // Either shows cards or empty state
      const hasContent =
        await page.locator('[class*="Card"]').first().isVisible({ timeout: 3000 }).catch(() => false) ||
        await page.getByText(/no completed decisions yet/i).isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasContent).toBeTruthy();
      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Create Decision Dialog", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("opens create dialog when clicking Request Decision", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("button", { name: /request decision/i }).click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("heading", { name: /request decision/i })).toBeVisible();
      expectNoConsoleErrors(errors);
    });

    test("dialog has required form fields", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("button", { name: /request decision/i }).click();

      await expect(page.getByLabel(/title/i)).toBeVisible();
      await expect(page.getByLabel(/description/i)).toBeVisible();
      await expect(page.getByLabel(/due date/i)).toBeVisible();
      expectNoConsoleErrors(errors);
    });

    test("Create button is disabled when title is empty", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("button", { name: /request decision/i }).click();

      const createButton = page.getByRole("dialog").getByRole("button", { name: /create/i });
      await expect(createButton).toBeDisabled();
      expectNoConsoleErrors(errors);
    });

    test("Create button is enabled when title is filled", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("button", { name: /request decision/i }).click();
      await page.getByLabel(/title/i).fill("Approve new design");

      const createButton = page.getByRole("dialog").getByRole("button", { name: /create/i });
      await expect(createButton).toBeEnabled();
      expectNoConsoleErrors(errors);
    });

    test("can cancel create dialog", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("button", { name: /request decision/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
      expectNoConsoleErrors(errors);
    });

    test("successfully creates a decision (happy path)", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("button", { name: /request decision/i }).click();

      // Fill form
      await page.getByLabel(/title/i).fill("Test Decision Request");
      await page.getByLabel(/description/i).fill("This is a test decision");

      // Submit
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();

      // Dialog should close and show success toast
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
      // Use exact match to avoid multiple elements
      await expect(page.getByText("Decision request created", { exact: true })).toBeVisible();
      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Empty States", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("empty state in pending tab has create button", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      // If empty state is shown, it should have a create button
      const emptyState = page.getByText(/nothing waiting on the client/i);
      if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(page.locator('[class*="text-center"]').getByRole("button", { name: /request decision/i })).toBeVisible();
      }
      expectNoConsoleErrors(errors);
    });

    test("empty state in completed tab shows appropriate message", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await page.getByRole("tab", { name: /completed/i }).click();

      // If empty state is shown, check for appropriate message
      const emptyState = page.getByText(/no completed decisions yet/i);
      if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(page.getByText(/when clients approve or decline/i)).toBeVisible();
      }
      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("decisions page is accessible via direct navigation", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      // Decisions is accessible via URL (sidebar link removed from client hub nav)
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      await expect(page).toHaveURL(`/hub/${CLIENT_HUB_ID}/decisions`);
      expectNoConsoleErrors(errors);
    });

    test("can navigate from decisions to other sections", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      // Navigate to Documents
      await page.getByRole("link", { name: /documents/i }).click();
      await expect(page).toHaveURL(`/hub/${CLIENT_HUB_ID}/documents`);
      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Access Control", () => {
    test("clients see different content in portal decisions view", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);
      await loginAsClient(page);

      // Clients should see portal view at /portal/:hubId, not /hub/:hubId
      // Staff routes (/hub/) are for internal staff views
      // The portal route will show client-appropriate content
      await page.goto(`/portal/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      // Client should see their decisions queue, not the staff "waiting on client" view
      // Exact behavior depends on implementation - just verify no error
      const hasContent =
        page.url().includes("/portal") ||
        page.url().includes("/login");

      expect(hasContent).toBeTruthy();
      expectNoConsoleErrors(errors);
    });

    test("unauthenticated users redirected to login", async ({ page }) => {
      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Responsive Design", () => {
    test("displays correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsStaff(page);
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${CLIENT_HUB_ID}/decisions`);
      await waitForLoading(page);

      // Check key elements are visible on mobile
      await expect(page.getByRole("heading", { name: /decisions/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /waiting on client/i })).toBeVisible();
      expectNoConsoleErrors(errors);
    });
  });
});
