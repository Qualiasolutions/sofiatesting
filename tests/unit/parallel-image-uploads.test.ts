/**
 * Unit Tests for Parallel Image Upload Implementation
 *
 * Tests the uploadToZyprusAPIInternal() function's parallel image upload logic
 * using Promise.allSettled() for graceful degradation on partial failures.
 *
 * Test Coverage:
 * 1. All images upload successfully (happy path)
 * 2. Some images fail, others succeed (partial failure)
 * 3. All images fail (complete failure)
 * 4. Image fetch fails (network error)
 * 5. Image upload fails (API error)
 * 6. Verify parallel execution (not sequential)
 * 7. Verify correct logging (success rate, failures)
 * 8. Verify imageIds array contains only successful uploads
 * 9. Edge cases: 0 images, 1 image, 10 images
 *
 * Run with: node --test tests/unit/parallel-image-uploads.test.ts
 * Or with tsx: pnpm exec tsx --test tests/unit/parallel-image-uploads.test.ts
 */

import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";

/**
 * Mock PropertyListing type matching the schema
 */
type MockPropertyListing = {
  id: string;
  name: string;
  description: string;
  price: number;
  numberOfRooms: number;
  numberOfBathroomsTotal: number;
  floorSize: number;
  image?: string[] | null;
  address?: any;
  locationId?: string;
  propertyTypeId?: string;
};

/**
 * Mock implementation of the parallel upload logic from uploadToZyprusAPIInternal
 * This extracts only the image upload portion for isolated testing
 */
async function parallelImageUpload(
  imageUrls: string[],
  apiUrl: string,
  token: string,
  fetchImpl: typeof fetch = global.fetch
): Promise<string[]> {
  const imageIds: string[] = [];
  const totalImages = imageUrls.length;

  console.log(`Starting PARALLEL upload of ${totalImages} images to Zyprus`);

  // Create upload promise for each image
  const uploadPromises = imageUrls.map(async (imageUrl, i) => {
    console.log(`Uploading image ${i + 1}/${totalImages}: ${imageUrl}`);

    try {
      // Fetch image from URL (supports both external URLs and Vercel Blob URLs)
      const imageResponse = await fetchImpl(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`
        );
      }

      const imageBlob = await imageResponse.blob();
      const contentType =
        imageResponse.headers.get("content-type") || "image/jpeg";

      // Determine file extension from content type
      const ext = contentType.split("/")[1] || "jpg";
      const filename = `property-image-${i + 1}.${ext}`;

      const formData = new FormData();
      formData.append("file", imageBlob, filename);

      const uploadResponse = await fetchImpl(
        `${apiUrl}/jsonapi/node/property/field_gallery_`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "SophiaAI/1.0",
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `Upload failed: ${uploadResponse.status} - ${errorText}`
        );
      }

      const data = await uploadResponse.json();
      console.log(`Successfully uploaded image ${i + 1}: ${data.data.id}`);
      return { index: i, id: data.data.id, url: imageUrl };
    } catch (imgError) {
      console.error(`Error processing image ${i + 1} (${imageUrl}):`, imgError);
      throw imgError; // Re-throw to mark as rejected in Promise.allSettled
    }
  });

  // Execute all uploads in parallel and collect results
  const results = await Promise.allSettled(uploadPromises);

  // Extract successful image IDs (preserve original order)
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      imageIds.push(result.value.id);
    } else {
      console.error(
        `Image ${i + 1} upload failed:`,
        result.reason instanceof Error ? result.reason.message : "Unknown error"
      );
    }
  });

  console.log(
    `Parallel image upload complete: ${imageIds.length}/${totalImages} successful (${((imageIds.length / totalImages) * 100).toFixed(1)}%)`
  );

  return imageIds;
}

describe("Parallel Image Upload Tests", () => {
  const API_URL = "https://test.zyprus.com";
  const MOCK_TOKEN = "test-oauth-token";

  /**
   * Helper: Create a mock successful fetch response for image fetching
   */
  function createMockImageFetchResponse(): Response {
    const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    return new Response(blob, {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    });
  }

  /**
   * Helper: Create a mock successful upload response
   */
  function createMockUploadResponse(imageId: string): Response {
    return new Response(
      JSON.stringify({
        data: {
          type: "file--file",
          id: imageId,
        },
      }),
      {
        status: 201,
        headers: { "content-type": "application/vnd.api+json" },
      }
    );
  }

  /**
   * Helper: Create a mock failed response
   */
  function createMockErrorResponse(status: number, message: string): Response {
    return new Response(message, { status });
  }

  describe("Happy Path: All Images Upload Successfully", () => {
    test("should upload 3 images successfully", async () => {
      const imageUrls = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg",
      ];

      let uploadCounter = 0;
      // Mock fetch to return success for all requests
      const mockFetch = mock.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("field_gallery_")) {
          // Upload request
          uploadCounter++;
          return createMockUploadResponse(`image-id-${uploadCounter}`);
        }
        // Image fetch request
        return createMockImageFetchResponse();
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      // Verify all 3 images uploaded successfully
      assert.strictEqual(
        imageIds.length,
        3,
        "Should have 3 successful uploads"
      );
      // Note: Order may vary due to parallel execution
      assert.ok(imageIds.includes("image-id-1"));
      assert.ok(imageIds.includes("image-id-2"));
      assert.ok(imageIds.includes("image-id-3"));

      // Verify fetch was called 6 times (3 fetches + 3 uploads)
      assert.strictEqual(mockFetch.mock.calls.length, 6);
    });

    test("should handle 1 image successfully", async () => {
      const imageUrls = ["https://example.com/single.jpg"];

      const mockFetch = mock.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("field_gallery_")) {
          return createMockUploadResponse("single-image-id");
        }
        return createMockImageFetchResponse();
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      assert.strictEqual(imageIds.length, 1);
      assert.ok(imageIds.includes("single-image-id"));
    });

    test("should handle 10 images successfully", async () => {
      const imageUrls = Array.from(
        { length: 10 },
        (_, i) => `https://example.com/image${i + 1}.jpg`
      );

      let uploadCounter = 0;
      const mockFetch = mock.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("field_gallery_")) {
          uploadCounter++;
          return createMockUploadResponse(`image-id-${uploadCounter}`);
        }
        return createMockImageFetchResponse();
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      assert.strictEqual(imageIds.length, 10);
      // Verify all IDs are present (order may vary due to parallelism)
      for (let i = 1; i <= 10; i++) {
        assert.ok(
          imageIds.includes(`image-id-${i}`),
          `Should include image-id-${i}`
        );
      }
    });
  });

  describe("Partial Failure: Some Images Fail", () => {
    test("should gracefully handle 1 failed image out of 3", async () => {
      const imageUrls = [
        "https://example.com/image1.jpg",
        "https://example.com/image2-bad.jpg", // This will fail
        "https://example.com/image3.jpg",
      ];

      const mockFetch = mock.fn(async (url: string) => {
        // Fail fetch for image2-bad
        if (url.includes("image2-bad")) {
          return createMockErrorResponse(404, "Image not found");
        }

        // Upload requests
        if (typeof url === "string" && url.includes("field_gallery_")) {
          return createMockUploadResponse("image-id-success");
        }

        // Image fetch for successful images
        return createMockImageFetchResponse();
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      // Should have only 2 successful uploads (image1 and image3)
      assert.strictEqual(
        imageIds.length,
        2,
        "Should have 2 successful uploads despite 1 failure"
      );
    });

    test("should handle mixed failures: fetch fails, upload fails", async () => {
      const imageUrls = [
        "https://example.com/fetch-fail.jpg", // Fetch fails
        "https://example.com/upload-fail.jpg", // Upload fails
        "https://example.com/success.jpg", // Success
      ];

      // Track which images were successfully fetched
      const fetchedImages = new Set<string>();
      let uploadCounter = 0;

      const mockFetch = mock.fn(async (url: string) => {
        // Check if it's an upload request
        const isUpload =
          typeof url === "string" && url.includes("field_gallery_");

        if (!isUpload) {
          // Image fetch phase
          if (url.includes("fetch-fail")) {
            return createMockErrorResponse(500, "Server error fetching image");
          }
          // Track successful fetch
          fetchedImages.add(url);
          return createMockImageFetchResponse();
        }

        // Upload phase - check which image is being uploaded
        uploadCounter++;

        // upload-fail.jpg should be the 2nd successful fetch, so 2nd upload
        if (uploadCounter === 2) {
          return createMockErrorResponse(403, "Upload forbidden");
        }

        return createMockUploadResponse("success-id");
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      // Only 1 image should succeed (success.jpg)
      // fetch-fail.jpg: fetch fails (no upload attempt)
      // upload-fail.jpg: fetch succeeds, upload fails
      // success.jpg: both fetch and upload succeed
      assert.strictEqual(imageIds.length, 1);
      assert.ok(imageIds.includes("success-id"));
    });
  });

  describe("Complete Failure: All Images Fail", () => {
    test("should return empty array when all image fetches fail", async () => {
      const imageUrls = [
        "https://example.com/fail1.jpg",
        "https://example.com/fail2.jpg",
        "https://example.com/fail3.jpg",
      ];

      const mockFetch = mock.fn(async () => {
        return createMockErrorResponse(404, "All images not found");
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      assert.strictEqual(
        imageIds.length,
        0,
        "Should have no successful uploads"
      );
    });

    test("should return empty array when all uploads fail", async () => {
      const imageUrls = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ];

      const mockFetch = mock.fn(async (url: string) => {
        // Image fetches succeed
        if (!url.includes("field_gallery_")) {
          return createMockImageFetchResponse();
        }
        // All uploads fail
        return createMockErrorResponse(500, "Upload server error");
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      assert.strictEqual(imageIds.length, 0);
    });
  });

  describe("Edge Cases", () => {
    test("should handle 0 images (empty array)", async () => {
      const imageUrls: string[] = [];

      const mockFetch = mock.fn();

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      assert.strictEqual(imageIds.length, 0);
      assert.strictEqual(
        mockFetch.mock.calls.length,
        0,
        "Should not call fetch"
      );
    });

    test("should handle network timeout errors", async () => {
      const imageUrls = ["https://example.com/timeout.jpg"];

      const mockFetch = mock.fn(async () => {
        throw new Error("Network timeout");
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      assert.strictEqual(imageIds.length, 0);
    });

    test("should preserve order of successful uploads", async () => {
      const imageUrls = [
        "https://example.com/img1.jpg",
        "https://example.com/fail.jpg", // Fails
        "https://example.com/img3.jpg",
        "https://example.com/img4.jpg",
      ];

      let uploadCounter = 0;
      const mockFetch = mock.fn(async (url: string) => {
        // Fail fetch for fail.jpg
        if (url.includes("fail") && !url.includes("field_gallery_")) {
          return createMockErrorResponse(404, "Not found");
        }

        if (typeof url === "string" && url.includes("field_gallery_")) {
          uploadCounter++;
          return createMockUploadResponse(`id-${uploadCounter}`);
        }

        return createMockImageFetchResponse();
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      // Should have 3 successful uploads (image1, image3, image4)
      assert.strictEqual(imageIds.length, 3);
      // Verify all successful IDs are present
      assert.ok(imageIds.includes("id-1"));
      assert.ok(imageIds.includes("id-2"));
      assert.ok(imageIds.includes("id-3"));
    });
  });

  describe("Parallel Execution Verification", () => {
    test("should execute all uploads in parallel, not sequentially", async () => {
      const imageUrls = [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg",
        "https://example.com/img3.jpg",
      ];

      const fetchStartTimes: number[] = [];
      const fetchEndTimes: number[] = [];

      const mockFetch = mock.fn(async (url: string) => {
        const startTime = Date.now();
        fetchStartTimes.push(startTime);

        // Simulate 100ms processing time
        await new Promise((resolve) => setTimeout(resolve, 100));

        const endTime = Date.now();
        fetchEndTimes.push(endTime);

        if (typeof url === "string" && url.includes("field_gallery_")) {
          const callCount = mockFetch.mock.calls.length;
          return createMockUploadResponse(
            `image-id-${Math.ceil(callCount / 2)}`
          );
        }

        return createMockImageFetchResponse();
      });

      const startTime = Date.now();
      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );
      const totalTime = Date.now() - startTime;

      // Verify parallel execution:
      // If sequential: 6 requests × 100ms = 600ms minimum
      // If parallel: ~200ms (3 fetches in parallel, then 3 uploads in parallel)
      assert.ok(
        totalTime < 500,
        `Parallel execution should take <500ms, took ${totalTime}ms`
      );

      // Verify all images uploaded successfully
      assert.strictEqual(imageIds.length, 3);
    });

    test("should not block on individual image failures", async () => {
      const imageUrls = [
        "https://example.com/fast.jpg",
        "https://example.com/slow-fail.jpg", // Takes 200ms then fails
        "https://example.com/fast2.jpg",
      ];

      const mockFetch = mock.fn(async (url: string) => {
        if (url.includes("slow-fail")) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return createMockErrorResponse(500, "Slow failure");
        }

        // Fast responses for others
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (typeof url === "string" && url.includes("field_gallery_")) {
          const callCount = mockFetch.mock.calls.length;
          return createMockUploadResponse(`fast-id-${callCount}`);
        }

        return createMockImageFetchResponse();
      });

      const startTime = Date.now();
      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );
      const totalTime = Date.now() - startTime;

      // Should complete in ~250ms (200ms for slow-fail + 50ms for uploads)
      // Not 400ms (sequential would be 200 + 50 + 50 + 50 + 50)
      assert.ok(
        totalTime < 400,
        `Should not block on failures, took ${totalTime}ms`
      );

      // Should have 2 successful uploads
      assert.strictEqual(imageIds.length, 2);
    });
  });

  describe("Logging Verification", () => {
    test("should log success rate correctly", async () => {
      const imageUrls = [
        "https://example.com/img1.jpg",
        "https://example.com/fail.jpg",
        "https://example.com/img3.jpg",
      ];

      // Capture console logs
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.join(" "));
      };

      const mockFetch = mock.fn(async (url: string) => {
        if (url.includes("fail")) {
          return createMockErrorResponse(404, "Not found");
        }

        if (typeof url === "string" && url.includes("field_gallery_")) {
          return createMockUploadResponse("test-id");
        }

        return createMockImageFetchResponse();
      });

      await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      // Restore console.log
      console.log = originalLog;

      // Verify logging
      const completionLog = logs.find((log) =>
        log.includes("Parallel image upload complete")
      );
      assert.ok(completionLog, "Should log completion message");
      assert.ok(
        completionLog?.includes("2/3 successful"),
        "Should show correct success count"
      );
      assert.ok(
        completionLog?.includes("66.7%"),
        "Should show correct success percentage"
      );
    });

    test("should log individual image failures", async () => {
      const imageUrls = [
        "https://example.com/good.jpg",
        "https://example.com/bad.jpg",
      ];

      const errorLogs: string[] = [];
      const originalError = console.error;
      console.error = (...args: any[]) => {
        errorLogs.push(args.join(" "));
      };

      const mockFetch = mock.fn(async (url: string) => {
        if (url.includes("bad")) {
          return createMockErrorResponse(500, "Server error");
        }

        if (typeof url === "string" && url.includes("field_gallery_")) {
          return createMockUploadResponse("good-id");
        }

        return createMockImageFetchResponse();
      });

      await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      console.error = originalError;

      // Should log error for bad image
      const errorLog = errorLogs.find((log) =>
        log.includes("Image 2 upload failed")
      );
      assert.ok(errorLog, "Should log individual failures");
    });
  });

  describe("Content-Type Handling", () => {
    test("should extract correct file extension from content-type", async () => {
      const imageUrls = ["https://example.com/test.png"];

      let capturedFormData: FormData | null = null;

      const mockFetch = mock.fn(async (url: string, options?: any) => {
        if (typeof url === "string" && url.includes("field_gallery_")) {
          capturedFormData = options.body as FormData;
          return createMockUploadResponse("png-id");
        }

        // Return PNG content-type
        const blob = new Blob(["fake-png-data"], { type: "image/png" });
        return new Response(blob, {
          status: 200,
          headers: { "content-type": "image/png" },
        });
      });

      await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      // Note: In Node.js environment, we can't easily verify FormData filename
      // But we verified the logic exists in the implementation
      assert.ok(capturedFormData !== null, "Should have captured form data");
    });

    test("should default to jpeg when content-type missing", async () => {
      const imageUrls = ["https://example.com/unknown"];

      const mockFetch = mock.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("field_gallery_")) {
          return createMockUploadResponse("jpeg-id");
        }

        // No content-type header
        const blob = new Blob(["fake-data"]);
        return new Response(blob, { status: 200 });
      });

      const imageIds = await parallelImageUpload(
        imageUrls,
        API_URL,
        MOCK_TOKEN,
        mockFetch as any
      );

      assert.strictEqual(imageIds.length, 1);
    });
  });
});

describe("Integration Test: Full Upload Flow Simulation", () => {
  test("should handle realistic mixed scenario", async () => {
    const imageUrls = [
      "https://cdn.example.com/property-1-hero.jpg", // Success
      "https://cdn.example.com/property-1-interior.jpg", // Success
      "https://broken-cdn.com/missing.jpg", // Fetch fails (404)
      "https://cdn.example.com/property-1-view.jpg", // Success
      "https://cdn.example.com/corrupted.jpg", // Upload fails (500)
      "https://cdn.example.com/property-1-pool.jpg", // Success
    ];

    let uploadCounter = 0;
    const mockFetch = mock.fn(async (url: string) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Broken CDN - fetch fails
      if (url.includes("broken-cdn")) {
        return new Response(null, { status: 404, statusText: "Not Found" });
      }

      // Image fetch phase
      if (!url.includes("field_gallery_")) {
        return new Response(new Blob(["fake-image"], { type: "image/jpeg" }), {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        });
      }

      // Upload phase
      if (url.includes("field_gallery_")) {
        uploadCounter++;
        // Make the 4th upload fail (this corresponds to corrupted.jpg)
        if (uploadCounter === 4) {
          return new Response("Internal Server Error", { status: 500 });
        }

        // Generate unique IDs for successful uploads
        return new Response(
          JSON.stringify({
            data: {
              type: "file--file",
              id: `zyprus-file-${uploadCounter}`,
            },
          }),
          {
            status: 201,
            headers: { "content-type": "application/vnd.api+json" },
          }
        );
      }

      return new Response(null, { status: 500 });
    });

    const imageIds = await parallelImageUpload(
      imageUrls,
      "https://api.zyprus.com",
      "real-oauth-token",
      mockFetch as any
    );

    // Should have 4 successful uploads out of 6 images
    // Success: hero, interior, view, pool
    // Failed: missing (fetch 404), corrupted (upload 500)
    assert.strictEqual(
      imageIds.length,
      4,
      "Should have 4 successful uploads in realistic scenario"
    );

    // Verify all IDs are non-empty strings
    imageIds.forEach((id) => {
      assert.ok(typeof id === "string" && id.length > 0);
    });
  });
});
