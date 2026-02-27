import { Page, expect } from "@playwright/test";

/**
 * Test utilities for AgentFlow Pitch Hub E2E tests
 */

// Demo user credentials (must match auth.service.ts DEMO_USERS)
export const MOCK_STAFF_USER = {
  email: "hamish@goagentflow.com",
  password: "password123",
  displayName: "Hamish Nicklin",
};

export const MOCK_CLIENT_USER = {
  email: "sarah@whitmorelaw.co.uk",
  password: "password123",
  displayName: "Sarah Mitchell",
};

// Must match a hub ID from mock data (hub-1 through hub-5)
export const MOCK_HUB_ID = "hub-1";

/**
 * Log in as staff user
 */
export async function loginAsStaff(page: Page): Promise<void> {
  await page.goto("/login");
  // Use label-based selectors for stability
  await page.getByLabel(/email/i).fill(MOCK_STAFF_USER.email);
  await page.getByLabel(/password/i).fill(MOCK_STAFF_USER.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  // Staff can land on launcher (current flow) or hubs (legacy flow)
  await expect(page).toHaveURL(/\/(launcher|hubs)/);
}

/**
 * Log in as client user
 */
export async function loginAsClient(page: Page): Promise<void> {
  await page.goto("/login");
  // Use label-based selectors for stability
  await page.getByLabel(/email/i).fill(MOCK_CLIENT_USER.email);
  await page.getByLabel(/password/i).fill(MOCK_CLIENT_USER.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  // Wait for redirect to portal
  await expect(page).toHaveURL(/\/portal\//);
}

/**
 * Navigate to a staff hub section
 */
export async function navigateToStaffSection(
  page: Page,
  section: "overview" | "proposal" | "videos" | "documents" | "messages" | "meetings" | "questionnaire" | "client-portal"
): Promise<void> {
  await page.goto(`/hub/${MOCK_HUB_ID}/${section}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Navigate to a client portal section
 */
export async function navigateToClientSection(
  page: Page,
  section: "overview" | "proposal" | "videos" | "documents" | "messages" | "meetings" | "questionnaire" | "people"
): Promise<void> {
  await page.goto(`/portal/${MOCK_HUB_ID}/${section}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Check for console errors and fail test if found
 */
export async function setupConsoleErrorGate(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known benign errors
      if (!text.includes("ResizeObserver") && !text.includes("favicon.ico")) {
        errors.push(text);
      }
    }
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

  return errors;
}

/**
 * Verify no console errors occurred
 */
export function expectNoConsoleErrors(errors: string[]): void {
  if (errors.length > 0) {
    throw new Error(`Console errors detected:\n${errors.join("\n")}`);
  }
}

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoading(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(150);
}
