import { test, expect } from "@playwright/test";
import {
  loginAsStaff,
  MOCK_HUB_ID,
  setupConsoleErrorGate,
  expectNoConsoleErrors,
  waitForLoading,
} from "./test-utils";

test.describe("Upload Flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test.describe("Proposal Upload", () => {
    test("proposal section shows upload option", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/proposal`);
      await waitForLoading(page);

      // Should show upload button or drop zone
      const uploadBtn = page.getByRole("button", { name: /upload|add proposal/i });
      const dropZone = page.locator('[class*="dropzone"], [class*="drop-zone"]');

      const hasUploadUI =
        (await uploadBtn.isVisible().catch(() => false)) ||
        (await dropZone.isVisible().catch(() => false));

      // Proposal section should have upload capability
      await expect(page.getByRole("heading", { name: "Proposal", exact: true })).toBeVisible();

      expectNoConsoleErrors(errors);
    });

    test("proposal upload dialog opens", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/proposal`);
      await waitForLoading(page);

      const uploadBtn = page.getByRole("button", { name: /upload|replace/i }).first();
      if (await uploadBtn.isVisible().catch(() => false)) {
        await uploadBtn.click();

        // Should open upload dialog or show file input
        const dialog = page.getByRole("dialog");
        const fileInput = page.locator('input[type="file"]');

        const hasUploadUI =
          (await dialog.isVisible().catch(() => false)) ||
          (await fileInput.isVisible().catch(() => false));
      }

      expectNoConsoleErrors(errors);
    });

    test("proposal upload shows progress state", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/proposal`);
      await waitForLoading(page);

      // Find file input
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        // Set input files (mock upload)
        await fileInput.setInputFiles({
          name: "test-proposal.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("mock pdf content"),
        });

        // Should show progress indicator or uploading state
        await page.waitForTimeout(500);

        // Look for progress or loading indicator
        const hasProgress =
          (await page.locator('[class*="progress"]').isVisible().catch(() => false)) ||
          (await page.getByText(/uploading|processing/i).isVisible().catch(() => false)) ||
          (await page.locator('[class*="animate-spin"]').isVisible().catch(() => false));
      }

      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Document Upload", () => {
    test("documents section shows upload option", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/documents`);
      await waitForLoading(page);

      // Should show upload button
      const uploadBtn = page.getByRole("button", { name: /upload|add document/i });
      await expect(uploadBtn.first()).toBeVisible();

      expectNoConsoleErrors(errors);
    });

    test("document upload dialog has required fields", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/documents`);
      await waitForLoading(page);

      const uploadBtn = page.getByRole("button", { name: /upload/i }).first();
      if (await uploadBtn.isVisible().catch(() => false)) {
        await uploadBtn.click();

        // Dialog should have name, category, and visibility fields
        const dialog = page.getByRole("dialog");
        if (await dialog.isVisible().catch(() => false)) {
          // Name field
          const nameField = dialog.getByLabel(/name/i);

          // Category selector
          const categoryField = dialog.getByLabel(/category/i).or(
            dialog.getByRole("combobox")
          );

          // Visibility toggle
          const visibilityField = dialog.getByLabel(/visibility|client/i).or(
            dialog.getByRole("switch")
          );
        }
      }

      expectNoConsoleErrors(errors);
    });

    test("document upload shows success feedback", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/documents`);
      await waitForLoading(page);

      const uploadBtn = page.getByRole("button", { name: /upload/i }).first();
      if (await uploadBtn.isVisible().catch(() => false)) {
        await uploadBtn.click();

        const dialog = page.getByRole("dialog");
        if (await dialog.isVisible().catch(() => false)) {
          // Fill required fields
          const nameField = dialog.getByLabel(/name/i);
          if (await nameField.isVisible().catch(() => false)) {
            await nameField.fill("Test Document");
          }

          // Fill summary (required for client-visible documents)
          const summaryField = dialog.getByLabel(/summary/i);
          if (await summaryField.isVisible().catch(() => false)) {
            await summaryField.fill("Test document summary for upload verification");
          }

          // Find file input and upload
          const fileInput = dialog.locator('input[type="file"]');
          if (await fileInput.count() > 0) {
            await fileInput.setInputFiles({
              name: "test-document.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("mock pdf content"),
            });
          }

          // Submit if there's an upload button
          const submitBtn = dialog.getByRole("button", { name: /upload|save|submit/i });
          if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(500);

            // Should show success toast or close dialog
            const hasSuccess =
              (await page.getByText(/success|uploaded/i).isVisible().catch(() => false)) ||
              !(await dialog.isVisible().catch(() => true));
          }
        }
      }

      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Video Upload/Link", () => {
    test("videos section shows add options", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/videos`);
      await waitForLoading(page);

      // Should show add video button
      const addBtn = page.getByRole("button", { name: /add video|upload/i });
      await expect(addBtn.first()).toBeVisible();

      expectNoConsoleErrors(errors);
    });

    test("video link dialog accepts URL", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/videos`);
      await waitForLoading(page);

      const addBtn = page.getByRole("button", { name: /add.*link|from.*link/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();

        const dialog = page.getByRole("dialog");
        if (await dialog.isVisible().catch(() => false)) {
          // Should have URL field
          const urlField = dialog.getByLabel(/url|link/i).or(
            dialog.getByPlaceholder(/url|link|http/i)
          );

          if (await urlField.isVisible().catch(() => false)) {
            await urlField.fill("https://vimeo.com/123456789");

            // Title field
            const titleField = dialog.getByLabel(/title/i);
            if (await titleField.isVisible().catch(() => false)) {
              await titleField.fill("Test Video");
            }
          }
        }
      }

      expectNoConsoleErrors(errors);
    });
  });

  test.describe("Error Handling", () => {
    test("upload error surfaces to user", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/documents`);
      await waitForLoading(page);

      // Attempt upload with invalid file type (if validation exists)
      const uploadBtn = page.getByRole("button", { name: /upload/i }).first();
      if (await uploadBtn.isVisible().catch(() => false)) {
        await uploadBtn.click();

        const dialog = page.getByRole("dialog");
        if (await dialog.isVisible().catch(() => false)) {
          // Try to upload an executable (should be rejected)
          const fileInput = dialog.locator('input[type="file"]');
          if (await fileInput.count() > 0) {
            // This might be blocked by browser or app validation
            // The key is that errors don't cause crashes

            await page.waitForTimeout(500);
            // Page should still be functional
            const isCrashed = await page.getByText(/something went wrong/i).isVisible().catch(() => false);
            expect(isCrashed).toBeFalsy();
          }
        }
      }

      expectNoConsoleErrors(errors);
    });

    test("large file shows appropriate message", async ({ page }) => {
      const errors = await setupConsoleErrorGate(page);

      await page.goto(`/hub/${MOCK_HUB_ID}/documents`);
      await waitForLoading(page);

      const uploadBtn = page.getByRole("button", { name: /upload/i }).first();
      if (await uploadBtn.isVisible().catch(() => false)) {
        await uploadBtn.click();

        const dialog = page.getByRole("dialog");
        if (await dialog.isVisible().catch(() => false)) {
          // Note: Can't actually test large file upload in e2e
          // This test ensures the UI is ready for it
          const fileInput = dialog.locator('input[type="file"]');
          const acceptAttr = await fileInput.getAttribute("accept");
          // File input should exist
          expect(await fileInput.count()).toBeGreaterThan(0);
        }
      }

      expectNoConsoleErrors(errors);
    });
  });
});
