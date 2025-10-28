import { expect, test } from "@playwright/test";

test.describe("SOFIA Local Development Test", () => {
  test.use({
    baseURL: "http://localhost:3001",
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the local development server
    await page.goto("/");

    // Wait for the page to load
    await page.waitForSelector('[data-testid="multimodal-input"]', {
      timeout: 15_000,
    });
  });

  test("SOFIA should correctly extract Margarita Dimova from developer registration request", async ({
    page,
  }) => {
    // Send the exact user query that was failing
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("i want a registartion developer with viewing tomorrow at 3pm the client is Margarita dimova");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 30_000 });

    // Get SOFIA's response
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    const responseText = await response.textContent();
    console.log("SOFIA's Response:", responseText);

    // CRITICAL TEST: Verify that SOFIA only asks for developer contact person's name
    // Should NOT ask for client name (already extracted: Margarita Dimova)
    // Should NOT ask for viewing time (already extracted: tomorrow at 3pm)

    expect(responseText?.toLowerCase()).toContain("developer");
    expect(responseText?.toLowerCase()).toContain("contact");
    expect(responseText?.toLowerCase()).toContain("name");

    // These should NOT be in the response since they were provided
    expect(responseText?.toLowerCase()).not.toContain("margarita");
    expect(responseText?.toLowerCase()).not.toContain("client");
    expect(responseText?.toLowerCase()).not.toContain("viewing");
    expect(responseText?.toLowerCase()).not.toContain("time");
    expect(responseText?.toLowerCase()).not.toContain("3pm");

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/margarita-local-response.png',
      fullPage: false
    });

    console.log("✅ TEST PASSED: SOFIA correctly extracted fields and only asked for developer contact name");
  });

  test("SOFIA should generate complete document when developer contact name is provided", async ({
    page,
  }) => {
    // Send the complete request with developer contact name
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("i want a registartion developer with viewing tomorrow at 3pm the client is Margarita dimova contact person is Fotis");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 30_000 });

    // Get SOFIA's response
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    const responseText = await response.textContent();
    console.log("SOFIA's Complete Response:", responseText);

    // Should generate the complete developer registration document
    expect(responseText).toContain("Dear Fotis,");
    expect(responseText).toContain("Registration Details: Margarita dimova");
    expect(responseText).toContain("Viewing Arranged for: October 21, 2025 at 3:00 PM");
    expect(responseText).toContain("**8%+VAT**");
    expect(responseText).toContain("CSC Zyprus Property Group LTD");

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/margarita-local-complete.png',
      fullPage: false
    });

    console.log("✅ TEST PASSED: SOFIA generated complete document with all extracted fields");
  });
});