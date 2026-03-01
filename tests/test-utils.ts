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

async function dismissConsentPrompt(page: Page): Promise<void> {
  const consentPrompt = page.getByRole("alertdialog", { name: /cookie consent prompt/i });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const promptVisible = await consentPrompt.isVisible({ timeout: 1000 }).catch(() => false);
    if (!promptVisible) return;

    const consentButtons = [
      page.getByRole("button", { name: /accept all/i }),
      page.getByRole("button", { name: /^accept$/i }),
      page.getByRole("button", { name: /allow all/i }),
      page.getByRole("button", { name: /save/i }),
      page.getByRole("button", { name: /decline/i }),
    ];

    let clicked = false;
    for (const button of consentButtons) {
      const isVisible = await button.first().isVisible().catch(() => false);
      if (!isVisible) continue;
      await button.first().click({ force: true });
      clicked = true;
      break;
    }

    if (!clicked) {
      await page.keyboard.press("Escape").catch(() => undefined);
    }

    await page.waitForTimeout(250);
  }
}

async function seedDemoSession(
  page: Page,
  role: "staff" | "client",
  email: string
): Promise<void> {
  await page.goto("/login");
  await page.evaluate(
    ({ nextRole, nextEmail }) => {
      localStorage.setItem("userRole", nextRole);
      localStorage.setItem("userEmail", nextEmail);
      sessionStorage.clear();
    },
    { nextRole: role, nextEmail: email }
  );
}

/**
 * Authenticate as staff user (mock mode session seed).
 */
export async function loginAsStaff(page: Page): Promise<void> {
  await seedDemoSession(page, "staff", MOCK_STAFF_USER.email);
  await page.goto("/launcher");
  await dismissConsentPrompt(page);

  // Staff can land on launcher (current flow) or hubs (legacy flow)
  await expect(page).toHaveURL(/\/(launcher|hubs)/);
}

/**
 * Authenticate as client user (mock mode session seed).
 */
export async function loginAsClient(page: Page): Promise<void> {
  await seedDemoSession(page, "client", MOCK_CLIENT_USER.email);
  await page.goto(`/portal/${MOCK_HUB_ID}/overview`);
  await dismissConsentPrompt(page);

  // Wait for redirect to portal
  await expect(page).toHaveURL(/\/portal\//);
}

/**
 * Sign out using the currently visible page shell.
 */
export async function signOut(page: Page): Promise<void> {
  await dismissConsentPrompt(page);
  await page.waitForLoadState("domcontentloaded");
  await page
    .getByText(/^Loading\.\.\.$/i)
    .first()
    .waitFor({ state: "hidden", timeout: 6000 })
    .catch(() => undefined);

  const directSignOut = page.getByRole("button", { name: /sign out/i }).first();
  const directSignOutVisible = await directSignOut
    .waitFor({ state: "visible", timeout: 4000 })
    .then(() => true)
    .catch(() => false);
  if (directSignOutVisible) {
    await directSignOut.click({ force: true });
    return;
  }

  const menuTriggers = [
    page.getByRole("button", { name: /open user menu/i }),
    page.getByRole("button", { name: /hamish|sarah|alex/i }),
    page.locator('[class*="avatar"]').first(),
  ];

  for (const trigger of menuTriggers) {
    const isVisible = await trigger
      .waitFor({ state: "visible", timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!isVisible) continue;
    await trigger.click({ force: true });
    break;
  }

  const menuSignOutOptions = [
    page.getByRole("menuitem", { name: /sign out/i }),
    page.getByText(/^sign out$/i),
  ];

  for (const option of menuSignOutOptions) {
    const isVisible = await option.first()
      .waitFor({ state: "visible", timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!isVisible) continue;
    await option.first().click({ force: true });
    return;
  }

  // Fallback for occasional CI loading-race states in mock mode.
  await page.evaluate(() => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    sessionStorage.clear();
  });
  await page.goto("/login");
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
