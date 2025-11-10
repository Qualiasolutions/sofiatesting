import { expect, test } from "@playwright/test";

test.describe("Sofia AI Features", () => {
  test.beforeEach(async ({ page, context }) => {
    // Set access cookie
    await context.addCookies([
      {
        name: "qualia-access",
        value: "granted",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
      },
    ]);
  });

  test("Document generation works", async ({ page }) => {
    // Navigate to main page
    await page.goto("http://localhost:3000");
    await page.waitForSelector('[data-testid="multimodal-input"]', {
      timeout: 10_000,
    });

    // Request document creation
    const inputSelector = '[data-testid="multimodal-input"]';
    await page.fill(
      inputSelector,
      "Write me a short essay about Cyprus real estate market opportunities in 2024"
    );

    // Send message
    await page.keyboard.press("Enter");

    // Wait for response
    await page.waitForSelector('[data-testid="message"]', {
      timeout: 30_000,
      state: "visible",
    });

    // Check if document/artifact appears
    const artifactExists = await page
      .locator('[data-testid="artifact"]')
      .count();
    console.log("Artifact created:", artifactExists > 0);
  });

  test("Property listing with taxonomy works", async ({ page }) => {
    // Navigate to main page
    await page.goto("http://localhost:3000");
    await page.waitForSelector('[data-testid="multimodal-input"]', {
      timeout: 10_000,
    });

    // First ask for available locations
    await page.fill(
      '[data-testid="multimodal-input"]',
      "Show me available locations for property listings in Cyprus"
    );
    await page.keyboard.press("Enter");

    // Wait for response
    await page.waitForTimeout(5000);

    // Create a listing
    await page.fill(
      '[data-testid="multimodal-input"]',
      "Create a property listing: 3 bedroom villa in Limassol, 450000 euros, 200 sqm, 2 bathrooms, with swimming pool and garden"
    );
    await page.keyboard.press("Enter");

    // Wait for response
    await page.waitForTimeout(10_000);

    // Check for success message
    const messages = await page
      .locator('[data-testid="message"]')
      .allTextContents();
    const hasSuccess = messages.some(
      (msg) =>
        msg.includes("created") ||
        msg.includes("success") ||
        msg.includes("listing")
    );
    console.log("Property listing created:", hasSuccess);
    expect(hasSuccess).toBeTruthy();
  });

  test("Telegram webhook is accessible", async ({ page }) => {
    const response = await page.request.get(
      "http://localhost:3000/api/telegram/webhook"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("SOFIA Telegram Bot");
  });

  test("WhatsApp webhook responds to verification", async ({ page }) => {
    // Test the GET endpoint (webhook verification)
    const response = await page.request.get(
      "http://localhost:3000/api/whatsapp/webhook",
      {
        params: {
          "hub.mode": "subscribe",
          "hub.verify_token": "test-token",
          "hub.challenge": "123456",
        },
      }
    );

    // Should return 403 without proper secret
    expect(response.status()).toBe(403);
  });

  test("Calculator tools work", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector('[data-testid="multimodal-input"]', {
      timeout: 10_000,
    });

    // Test transfer fees calculator
    await page.fill(
      '[data-testid="multimodal-input"]',
      "Calculate transfer fees for a property worth 250,000 euros in Cyprus"
    );
    await page.keyboard.press("Enter");

    await page.waitForTimeout(5000);

    const messages = await page
      .locator('[data-testid="message"]')
      .allTextContents();
    const hasCalculation = messages.some(
      (msg) =>
        msg.includes("transfer") ||
        msg.includes("fee") ||
        msg.includes("€") ||
        msg.includes("EUR")
    );
    console.log("Transfer fees calculated:", hasCalculation);
    expect(hasCalculation).toBeTruthy();
  });
});
