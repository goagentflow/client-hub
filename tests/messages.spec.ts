import { test, expect } from "@playwright/test";
import {
  loginAsStaff,
  loginAsClient,
  MOCK_HUB_ID,
  setupConsoleErrorGate,
  expectNoConsoleErrors,
  waitForLoading,
} from "./test-utils";

function makeMessageText(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

test.describe("Messages Feed", () => {
  test.describe("Staff", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStaff(page);
    });

    test("renders feed and composer", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/messages`);
      await waitForLoading(page);

      await expect(page.getByRole("heading", { name: /messages/i })).toBeVisible();
      await expect(page.getByTestId("message-feed")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();
      await expect(page.getByTestId("message-send-button")).toBeVisible();

      const messageCount = await page.getByTestId("message-item").count();
      const emptyVisible = await page.getByTestId("message-feed-empty").isVisible().catch(() => false);
      expect(messageCount > 0 || emptyVisible).toBeTruthy();

      expectNoConsoleErrors(errors);
    });

    test("sends a new staff message", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/messages`);
      await waitForLoading(page);

      const initialCount = await page.getByTestId("message-item").count();
      const draft = makeMessageText("Staff e2e message");

      await page.getByTestId("message-input").fill(draft);
      await page.getByTestId("message-send-button").click();

      await expect(page.getByTestId("message-item").filter({ hasText: draft })).toHaveCount(1);
      await expect(page.getByTestId("message-item")).toHaveCount(initialCount + 1);

      expectNoConsoleErrors(errors);
    });

    test("disables send for whitespace-only input", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/messages`);
      await waitForLoading(page);

      const sendButton = page.getByTestId("message-send-button");
      await expect(sendButton).toBeDisabled();

      await page.getByTestId("message-input").fill("   ");
      await expect(sendButton).toBeDisabled();

      await page.getByTestId("message-input").fill("hello");
      await expect(sendButton).toBeEnabled();

      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Portal", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsClient(page);
    });

    test("renders portal feed", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/portal/${MOCK_HUB_ID}/messages`);
      await waitForLoading(page);

      await expect(page.getByRole("heading", { name: /messages/i })).toBeVisible();
      await expect(page.getByTestId("message-feed")).toBeVisible();
      await expect(page.getByTestId("message-input")).toBeVisible();
      await expect(page.getByTestId("message-send-button")).toBeVisible();

      expectNoConsoleErrors(errors);
    });

    test("sends a new portal message", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/portal/${MOCK_HUB_ID}/messages`);
      await waitForLoading(page);

      const initialCount = await page.getByTestId("message-item").count();
      const draft = makeMessageText("Portal e2e message");

      await page.getByTestId("message-input").fill(draft);
      await page.getByTestId("message-send-button").click();

      await expect(page.getByTestId("message-item").filter({ hasText: draft })).toHaveCount(1);
      await expect(page.getByTestId("message-item")).toHaveCount(initialCount + 1);

      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Security", () => {
    test("message body is rendered as text and does not execute scripts", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await loginAsStaff(page);
      await page.goto(`/hub/${MOCK_HUB_ID}/messages`);
      await waitForLoading(page);

      await page.evaluate(() => {
        (window as Window & { __messageXssFlag?: number }).__messageXssFlag = 0;
      });

      const payload = `<img src=x onerror="window.__messageXssFlag=1"><script>window.__messageXssFlag=1</script>`;
      await page.getByTestId("message-input").fill(payload);
      await page.getByTestId("message-send-button").click();

      await expect(page.getByTestId("message-item").filter({ hasText: payload })).toHaveCount(1);

      const scriptsInFeed = await page.getByTestId("message-feed").locator("script").count();
      const handlersInFeed = await page
        .getByTestId("message-feed")
        .locator("[onerror], [onclick], [onload]")
        .count();
      const xssFlag = await page.evaluate(() => {
        return (window as Window & { __messageXssFlag?: number }).__messageXssFlag ?? 0;
      });

      expect(scriptsInFeed).toBe(0);
      expect(handlersInFeed).toBe(0);
      expect(xssFlag).toBe(0);

      expectNoConsoleErrors(errors);
    });
  });
});
