import { expect, test } from "@playwright/test";

test.describe("SOFIA Enhanced Formatting Tests", () => {
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

  test("SOFIA should render numbered lists with proper formatting", async ({
    page,
  }) => {
    // Send a message that should trigger a numbered list response
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("I need a registration");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Check if numbered lists are properly formatted
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    // Look for numbered list elements
    const numberedLists = response.locator("ol");
    await expect(numberedLists).toBeVisible();

    // Check if list items have proper styling
    const listItems = response.locator("ol li");
    if ((await listItems.count()) > 0) {
      // Verify list items have proper spacing and formatting
      const firstListItem = listItems.first();
      await expect(firstListItem).toHaveCSS("list-style-type", "decimal");
      await expect(firstListItem).toHaveCSS("padding-left", "24px"); // pl-6 = 24px
      await expect(firstListItem).toHaveCSS("margin-bottom", "4px"); // mb-1 = 4px
    }
  });

  test("SOFIA should render bold text correctly", async ({ page }) => {
    // Send a message that should trigger bold text in response
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("What's your agency fee?");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Check for bold text elements
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();
    const boldElements = response.locator("strong, b");

    if ((await boldElements.count()) > 0) {
      // Verify bold elements have proper styling
      const firstBold = boldElements.first();
      await expect(firstBold).toHaveCSS("font-weight", "700"); // font-bold
    }
  });

  test("SOFIA should render headings with proper hierarchy", async ({
    page,
  }) => {
    // Send a message that might trigger headings
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("Generate a marketing agreement");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Check for heading elements
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();

    // Check H1 elements
    const h1Elements = response.locator("h1");
    if ((await h1Elements.count()) > 0) {
      const h1 = h1Elements.first();
      await expect(h1).toHaveCSS("font-size", "24px"); // text-2xl = 24px
      await expect(h1).toHaveCSS("font-weight", "700"); // font-bold
    }

    // Check H2 elements
    const h2Elements = response.locator("h2");
    if ((await h2Elements.count()) > 0) {
      const h2 = h2Elements.first();
      await expect(h2).toHaveCSS("font-size", "20px"); // text-xl = 20px
      await expect(h2).toHaveCSS("font-weight", "600"); // font-semibold
    }
  });

  test("SOFIA should render bullet points correctly", async ({ page }) => {
    // Send a message that might trigger bullet points
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("I need a valuation quote");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Check for unordered lists
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();
    const unorderedLists = response.locator("ul");

    if ((await unorderedLists.count()) > 0) {
      // Verify unordered lists have proper styling
      const firstList = unorderedLists.first();
      await expect(firstList).toHaveCSS("list-style-type", "disc");
      await expect(firstList).toHaveCSS("padding-left", "24px"); // pl-6 = 24px
    }
  });

  test("SOFIA response container should have proper CSS classes", async ({
    page,
  }) => {
    // Send any message to get a response
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("Hello SOFIA");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Check if the response container has the proper CSS class
    const responseContainer = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();
    await expect(responseContainer).toHaveClass(/sophia-response/);

    // Check if container has base styling
    await expect(responseContainer).toHaveCSS("line-height", /1\.6/); // leading-relaxed
    await expect(responseContainer).toHaveCSS("font-size", /14px/); // text-sm
  });

  test("SOFIA should handle line breaks and paragraphs correctly", async ({
    page,
  }) => {
    // Send a message that should trigger a multi-line response
    const input = page.locator('[data-testid="multimodal-input"] textarea');
    await input.fill("Tell me about your services");

    // Click the send button
    const sendButton = page.locator(
      'button[type="submit"]:has([data-testid="arrow-up-icon"])'
    );
    await sendButton.click();

    // Wait for SOFIA's response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15_000 });

    // Check for paragraph elements
    const response = page
      .locator('[data-role="assistant"] .sophia-response')
      .last();
    const paragraphs = response.locator("p");

    if ((await paragraphs.count()) > 1) {
      // Verify paragraphs have proper spacing
      const firstParagraph = paragraphs.first();
      await expect(firstParagraph).toHaveCSS("margin-bottom", "16px"); // mb-4 = 16px
      await expect(firstParagraph).toHaveCSS("line-height", /1\.6/); // leading-relaxed
    }

    // Check for line break elements
    const lineBreaks = response.locator("br");
    if ((await lineBreaks.count()) > 0) {
      const br = lineBreaks.first();
      await expect(br).toHaveCSS("display", "block"); // block
      await expect(br).toHaveCSS("margin-top", "8px"); // my-2 = 8px
    }
  });
});
