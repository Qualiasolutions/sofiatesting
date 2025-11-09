import { expect, test } from "@playwright/test";

test.describe("SOFIA Developer Registration Tests", () => {
  test.use({
    baseURL: "https://sofiatesting-69ohbse6x-qualiasolutionscy.vercel.app",
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");

    // Wait for the page to load
    await page.waitForSelector('[data-testid="multimodal-input"]', {
      timeout: 10_000,
    });
  });

  test("SOFIA should extract fields correctly from developer registration with viewing", async ({
    page,
  }) => {
    // Send the exact user query that was failing
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill(
      "i want a registartion developer with viewing tomorrow at 3pm the client is Margarita dimova"
    );

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Check if SOFIA responded correctly by asking only for the developer contact name
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    // Should only ask for developer contact person's name since client name and viewing time were provided
    const responseText = await response.textContent();

    // Verify it asks for developer contact person's name
    expect(responseText?.toLowerCase()).toContain("developer");
    expect(responseText?.toLowerCase()).toContain("contact");
    expect(responseText?.toLowerCase()).toContain("name");

    // Should NOT ask for client name (already extracted: Margarita Dimova)
    expect(responseText?.toLowerCase()).not.toContain("client");
    expect(responseText?.toLowerCase()).not.toContain("margarita");

    // Should NOT ask for viewing time (already extracted: tomorrow at 3pm)
    expect(responseText?.toLowerCase()).not.toContain("viewing");
    expect(responseText?.toLowerCase()).not.toContain("time");

    // Should NOT ask for project name or location (optional fields)
    expect(responseText?.toLowerCase()).not.toContain("project");
    expect(responseText?.toLowerCase()).not.toContain("location");
  });

  test("SOFIA should generate complete developer registration when all fields provided", async ({
    page,
  }) => {
    // Send a complete developer registration request
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill(
      "developer registration with viewing tomorrow at 2pm client is John Smith contact person is Fotis"
    );

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Should generate the complete document immediately since all required fields are present
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    const responseText = await response.textContent();

    // Should contain the complete developer registration document
    expect(responseText).toContain("Dear Fotis,");
    expect(responseText).toContain("Registration Details: John Smith");
    expect(responseText).toContain(
      "Viewing Arranged for: October 21, 2025 at 2:00 PM"
    );
    expect(responseText).toContain("**8%+VAT**");
    expect(responseText).toContain(" CSC Zyprus Property Group LTD");
  });

  test("SOFIA should handle variations of developer registration requests", async ({
    page,
  }) => {
    const testCases = [
      {
        input: "developer registration tomorrow client Maria Papadopoulos",
        expectedToContain: ["developer", "contact", "name"],
        expectedNotToContain: ["maria", "viewing", "time"],
      },
      {
        input: "dev reg with viewing today 4pm client Andreas Georgiou",
        expectedToContain: ["developer", "contact", "name"],
        expectedNotToContain: ["andreas", "today", "4pm"],
      },
      {
        input:
          "registration developer with viewing client is Elena Petrou at 5pm",
        expectedToContain: ["developer", "contact", "name"],
        expectedNotToContain: ["elena", "5pm"],
      },
    ];

    for (const testCase of testCases) {
      // Clear chat and start new conversation
      await page.reload();
      await page.waitForSelector('[data-testid="multimodal-input"]', {
        timeout: 10_000,
      });

      const input = page.locator('[data-testid="multimodal-input"] textarea');
      await input.fill(testCase.input);

      const sendButton = page.locator(
        'button[type="submit"]:has([data-testid="arrow-up-icon"])'
      );
      await sendButton.click();

      await page.waitForSelector('[data-role="assistant"]', {
        timeout: 15_000,
      });

      const response = page
        .locator('[data-role="assistant"] .sophia-response')
        .last();

      const responseText = await response.textContent();

      // Check expectations
      for (const expectedContain of testCase.expectedToContain) {
        expect(responseText?.toLowerCase()).toContain(expectedContain);
      }

      for (const expectedNotToContain of testCase.expectedNotToContain) {
        expect(responseText?.toLowerCase()).not.toContain(expectedNotToContain);
      }
    }
  });

  test("SOFIA should handle developer registration without viewing", async ({
    page,
  }) => {
    // Send developer registration without viewing request
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill(
      "developer registration no viewing client is Andreas Antoniou"
    );

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Should generate immediately since Template 08 only requires client names
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    const responseText = await response.textContent();

    // Should contain the complete developer registration document (no viewing)
    expect(responseText).toContain("Dear XXXXXXXX,");
    expect(responseText).toContain("Registration Details: Andreas Antoniou");
    expect(responseText).toContain("**8%+VAT**");
    expect(responseText).toContain("Looking forward to your prompt reply");
  });

  test("SOFIA should extract viewing times correctly and convert to proper format", async ({
    page,
  }) => {
    const timeTestCases = [
      {
        input:
          "developer registration with viewing tomorrow at 3pm client is Margarita Dimova",
        expectedTime: "3:00 PM",
      },
      {
        input: "dev reg viewing today at 2pm client John Smith",
        expectedTime: "2:00 PM",
      },
      {
        input:
          "developer registration with viewing tomorrow at 4:30 client Maria Papadopoulos",
        expectedTime: "4:30 PM",
      },
    ];

    for (const testCase of timeTestCases) {
      // Clear chat and start new conversation
      await page.reload();
      await page.waitForSelector('[data-testid="multimodal-input"]', {
        timeout: 10_000,
      });

      const input = page.locator('[data-testid="multimodal-input"] textarea');
      await input.fill(testCase.input);

      const sendButton = page.locator(
        'button[type="submit"]:has([data-testid="arrow-up-icon"])'
      );
      await sendButton.click();

      await page.waitForSelector('[data-role="assistant"]', {
        timeout: 15_000,
      });

      const response = page
        .locator('[data-role="assistant"] .sophia-response')
        .last();

      const responseText = await response.textContent();

      // Should only ask for developer contact name (time was extracted)
      expect(responseText?.toLowerCase()).toContain("developer");
      expect(responseText?.toLowerCase()).toContain("contact");
      expect(responseText?.toLowerCase()).toContain("name");
    }
  });

  test("SOFIA should handle edge cases and partial information", async ({
    page,
  }) => {
    // Test case: Only "developer registration" without additional info
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("developer registration");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    const responseText = await response.textContent();

    // Should ask for the required fields: client names and developer contact name
    expect(responseText?.toLowerCase()).toContain("client");
    expect(responseText?.toLowerCase()).toContain("developer");
    expect(responseText?.toLowerCase()).toContain("contact");
    expect(responseText?.toLowerCase()).toContain("name");
  });
});
