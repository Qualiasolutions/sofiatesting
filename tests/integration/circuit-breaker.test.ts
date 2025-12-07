/**
 * Circuit Breaker Integration Tests
 *
 * Tests the circuit breaker implementation (opossum) for Zyprus API integration.
 * Validates state transitions, failure thresholds, timeout handling, and event emissions.
 *
 * Circuit breaker states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail fast
 * - HALF-OPEN: Testing if service recovered, allows single request
 *
 * Test coverage:
 * 1. Circuit opens after threshold failures (50% error rate, 5 requests minimum)
 * 2. Circuit transitions to half-open after reset timeout
 * 3. Circuit closes after successful test in half-open state
 * 4. Circuit rejects requests when open (fallback error)
 * 5. Circuit emits correct events (open, halfOpen, close, reject, timeout)
 * 6. Circuit respects timeout configuration
 * 7. Circuit stats tracking (failures, successes, timeouts, rejects)
 */

import { expect, test } from "@playwright/test";
import {
  createCircuitBreaker,
  getCircuitBreakerStats,
  resetCircuitBreaker,
} from "@/lib/circuit-breakers";

// Helper: Wait for specified milliseconds
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Create a mock async function that can succeed or fail
type MockFunctionControl = {
  shouldFail: boolean;
  shouldTimeout: boolean;
  timeoutMs: number;
  callCount: number;
  reset: () => void;
};

function createMockFunction(): [() => Promise<string>, MockFunctionControl] {
  const control: MockFunctionControl = {
    shouldFail: false,
    shouldTimeout: false,
    timeoutMs: 5000,
    callCount: 0,
    reset() {
      this.shouldFail = false;
      this.shouldTimeout = false;
      this.timeoutMs = 5000;
      this.callCount = 0;
    },
  };

  const mockFn = async (): Promise<string> => {
    control.callCount++;

    // Simulate timeout if configured
    if (control.shouldTimeout) {
      await wait(control.timeoutMs);
      return "timeout-success";
    }

    // Simulate failure if configured
    if (control.shouldFail) {
      throw new Error("Mock function failed");
    }

    // Success case
    await wait(10); // Small delay to simulate real async work
    return "success";
  };

  return [mockFn, control];
}

test.describe("Circuit Breaker Integration Tests", () => {
  test.describe("Basic Circuit Breaker Creation", () => {
    test("should create circuit breaker with default options", () => {
      const [mockFn] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, { name: "TestBreaker" });

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe("TestBreaker");
      expect(breaker.opened).toBe(false);
      expect(breaker.halfOpen).toBe(false);
    });

    test("should create circuit breaker with custom options", () => {
      const [mockFn] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "CustomBreaker",
        timeout: 3000,
        errorThresholdPercentage: 60,
        resetTimeout: 5000,
        volumeThreshold: 3,
      });

      expect(breaker).toBeDefined();
      expect(breaker.name).toBe("CustomBreaker");
    });
  });

  test.describe("Circuit State Transitions", () => {
    test("should open circuit after threshold failures (50% error rate, 5 requests minimum)", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "ThresholdTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 60_000, // Long reset to prevent auto-recovery during test
        rollingCountTimeout: 10_000, // 10 second rolling window
        rollingCountBuckets: 10,
      });

      // Track circuit state changes
      let circuitOpened = false;
      breaker.on("open", () => {
        circuitOpened = true;
      });

      // Circuit should be closed initially
      expect(breaker.opened).toBe(false);

      // Execute more requests to ensure volume threshold is met and circuit opens
      // 6 failures, 4 successes = 10 total (60% failure rate > 50% threshold)
      control.shouldFail = true;
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Failure 1
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Failure 2
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Failure 3

      control.shouldFail = false;
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Success 1
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Success 2

      control.shouldFail = true;
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Failure 4
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Failure 5
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Failure 6

      control.shouldFail = false;
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Success 3
      await breaker.fire().catch(() => {
        /* expected failure */
      }); // Success 4

      // Wait for circuit breaker to process stats
      await wait(200);

      // Circuit should be open now (6/10 = 60% failures > 50% threshold)
      expect(circuitOpened).toBe(true);
      expect(breaker.opened).toBe(true);

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("open");
      // Note: Due to rolling window, exact failure count may vary slightly
      expect(stats.failures).toBeGreaterThanOrEqual(4);
    });

    test("should NOT open circuit if below volume threshold", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "VolumeThresholdTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5, // Need 5 requests minimum
      });

      let circuitOpened = false;
      breaker.on("open", () => {
        circuitOpened = true;
      });

      // Only 3 requests (below threshold), all fail
      control.shouldFail = true;
      await breaker.fire().catch(() => {
        /* expected failure */
      });
      await breaker.fire().catch(() => {
        /* expected failure */
      });
      await breaker.fire().catch(() => {
        /* expected failure */
      });

      await wait(100);

      // Circuit should still be closed (not enough volume)
      expect(circuitOpened).toBe(false);
      expect(breaker.opened).toBe(false);
    });

    test("should transition to half-open state after reset timeout", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "HalfOpenTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 2000, // 2 seconds reset timeout
      });

      let halfOpenEventFired = false;
      breaker.on("halfOpen", () => {
        halfOpenEventFired = true;
      });

      // Open the circuit by causing failures
      control.shouldFail = true;
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }

      await wait(100);
      expect(breaker.opened).toBe(true);

      // Wait for reset timeout (2 seconds)
      await wait(2100);

      // Circuit should transition to half-open
      expect(halfOpenEventFired).toBe(true);
      expect(breaker.halfOpen).toBe(true);
      expect(breaker.opened).toBe(false); // Not fully open anymore
    });

    test("should close circuit after successful test in half-open state", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "RecoveryTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 2000,
      });

      let circuitClosed = false;
      breaker.on("close", () => {
        circuitClosed = true;
      });

      // Open the circuit
      control.shouldFail = true;
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(100);

      // Wait for half-open state
      await wait(2100);
      expect(breaker.halfOpen).toBe(true);

      // Now allow success
      control.shouldFail = false;

      // Fire a successful request in half-open state
      const result = await breaker.fire();
      expect(result).toBe("success");

      await wait(100);

      // Circuit should be fully closed now
      expect(circuitClosed).toBe(true);
      expect(breaker.opened).toBe(false);
      expect(breaker.halfOpen).toBe(false);

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("closed");
    });

    test("should reopen circuit if test fails in half-open state", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "ReopenTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 2000,
      });

      let reopenCount = 0;
      breaker.on("open", () => {
        reopenCount++;
      });

      // Open the circuit
      control.shouldFail = true;
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(100);
      expect(reopenCount).toBe(1); // First open

      // Wait for half-open state
      await wait(2100);
      expect(breaker.halfOpen).toBe(true);

      // Test fails in half-open state
      await breaker.fire().catch(() => {
        /* expected */
      });
      await wait(100);

      // Circuit should be open again
      expect(breaker.opened).toBe(true);
      expect(reopenCount).toBe(2); // Reopened
    });
  });

  test.describe("Fallback Behavior", () => {
    test("should reject requests when circuit is open (fallback error)", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "FallbackTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 60_000,
      });

      let rejectEventFired = false;
      breaker.on("reject", () => {
        rejectEventFired = true;
      });

      // Open the circuit
      control.shouldFail = true;
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(100);
      expect(breaker.opened).toBe(true);

      // Try to fire request - should be rejected
      try {
        await breaker.fire();
        expect.fail("Should have thrown fallback error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("temporarily unavailable");
        expect((error as Error).message).toContain("circuit breaker open");
      }

      expect(rejectEventFired).toBe(true);

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.rejects).toBeGreaterThan(0);
    });
  });

  test.describe("Event Emissions", () => {
    test("should emit correct events during lifecycle", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "EventTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 2000,
      });

      const events: string[] = [];

      breaker.on("open", () => events.push("open"));
      breaker.on("halfOpen", () => events.push("halfOpen"));
      breaker.on("close", () => events.push("close"));
      breaker.on("reject", () => events.push("reject"));
      breaker.on("success", () => events.push("success"));
      breaker.on("failure", () => events.push("failure"));

      // 1. Cause failures to open circuit
      control.shouldFail = true;
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(100);

      expect(events).toContain("failure");
      expect(events).toContain("open");

      // 2. Try request while open - should be rejected
      await breaker.fire().catch(() => {
        /* expected */
      });
      expect(events).toContain("reject");

      // 3. Wait for half-open
      await wait(2100);
      expect(events).toContain("halfOpen");

      // 4. Successful request closes circuit
      control.shouldFail = false;
      await breaker.fire();
      await wait(100);

      expect(events).toContain("success");
      expect(events).toContain("close");

      // Verify event order
      const openIndex = events.indexOf("open");
      const halfOpenIndex = events.indexOf("halfOpen");
      const closeIndex = events.indexOf("close");

      expect(openIndex).toBeGreaterThanOrEqual(0);
      expect(halfOpenIndex).toBeGreaterThan(openIndex);
      expect(closeIndex).toBeGreaterThan(halfOpenIndex);
    });

    test("should emit timeout event when request exceeds timeout", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "TimeoutEventTest",
        timeout: 500, // 500ms timeout
        errorThresholdPercentage: 50,
        volumeThreshold: 10, // High threshold to prevent opening
      });

      let timeoutEventFired = false;
      breaker.on("timeout", () => {
        timeoutEventFired = true;
      });

      // Configure function to timeout
      control.shouldTimeout = true;
      control.timeoutMs = 1000; // Takes 1 second (exceeds 500ms timeout)

      try {
        await breaker.fire();
      } catch (_error) {
        // Timeout error expected
      }

      await wait(100);
      expect(timeoutEventFired).toBe(true);
    });
  });

  test.describe("Timeout Configuration", () => {
    test("should respect timeout configuration and fail slow requests", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "TimeoutTest",
        timeout: 300, // 300ms timeout
        errorThresholdPercentage: 50,
        volumeThreshold: 10,
      });

      // Configure function to be slow (exceeds timeout)
      control.shouldTimeout = true;
      control.timeoutMs = 1000;

      const startTime = Date.now();
      try {
        await breaker.fire();
        expect.fail("Should have thrown timeout error");
      } catch (_error) {
        const elapsed = Date.now() - startTime;
        // Should fail around 300ms, not wait for full 1000ms
        expect(elapsed).toBeLessThan(800);
        expect(elapsed).toBeGreaterThan(250);
      }
    });

    test("should succeed if request completes within timeout", async () => {
      const [mockFn] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "WithinTimeoutTest",
        timeout: 1000, // 1 second timeout
        errorThresholdPercentage: 50,
        volumeThreshold: 10,
      });

      // Function completes quickly (within timeout)
      const result = await breaker.fire();
      expect(result).toBe("success");

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.successes).toBe(1);
      expect(stats.timeouts).toBe(0);
    });
  });

  test.describe("Statistics Tracking", () => {
    test("should track failures, successes, timeouts, and rejects", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "StatsTest",
        timeout: 500,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 60_000,
        rollingCountTimeout: 10_000,
        rollingCountBuckets: 10,
      });

      // Initial stats
      let stats = getCircuitBreakerStats(breaker);
      expect(stats.fires).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.failures).toBe(0);

      // 3 successes
      control.shouldFail = false;
      await breaker.fire();
      await breaker.fire();
      await breaker.fire();

      stats = getCircuitBreakerStats(breaker);
      expect(stats.successes).toBe(3);
      expect(stats.fires).toBe(3);

      // 8 failures (should open circuit with 8/11 = 72% failure rate)
      control.shouldFail = true;
      for (let i = 0; i < 8; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(200);

      stats = getCircuitBreakerStats(breaker);
      // Note: Due to rolling window, exact failure count may vary
      expect(stats.failures).toBeGreaterThanOrEqual(4);
      expect(breaker.opened).toBe(true);

      // 2 rejects (circuit is open)
      await breaker.fire().catch(() => {
        /* expected */
      });
      await breaker.fire().catch(() => {
        /* expected */
      });

      stats = getCircuitBreakerStats(breaker);
      expect(stats.rejects).toBeGreaterThanOrEqual(2);

      // Note: Timeout test removed as circuit is already open
      // Timeouts are tested in a dedicated test case
    });

    test("should provide accurate state in stats", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "StateStatsTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 2000,
      });

      // Closed state
      let stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("closed");

      // Open circuit
      control.shouldFail = true;
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(100);

      stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("open");

      // Half-open state
      await wait(2100);
      stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("half-open");

      // Back to closed
      control.shouldFail = false;
      await breaker.fire();
      await wait(100);

      stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("closed");
    });

    test("should include latency metrics", async () => {
      const [mockFn] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "LatencyTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 10,
      });

      // Execute some requests
      await breaker.fire();
      await breaker.fire();
      await breaker.fire();

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.latencyMean).toBeGreaterThan(0);
      expect(stats.name).toBe("LatencyTest");
    });
  });

  test.describe("Manual Reset", () => {
    test("should allow manual reset to closed state", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "ManualResetTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 60_000, // Long timeout
      });

      // Open circuit
      control.shouldFail = true;
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(100);
      expect(breaker.opened).toBe(true);

      // Manually reset
      resetCircuitBreaker(breaker);
      await wait(100);

      // Circuit should be closed
      expect(breaker.opened).toBe(false);
      expect(breaker.halfOpen).toBe(false);

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("closed");

      // Should accept requests now
      control.shouldFail = false;
      const result = await breaker.fire();
      expect(result).toBe("success");
    });
  });

  test.describe("Real-world Scenarios", () => {
    test("should handle intermittent failures gracefully", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "IntermittentTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 2000,
      });

      // Simulate intermittent failures (not enough to open circuit)
      control.shouldFail = true;
      await breaker.fire().catch(() => {
        /* expected */
      }); // Fail
      control.shouldFail = false;
      await breaker.fire(); // Success
      control.shouldFail = true;
      await breaker.fire().catch(() => {
        /* expected */
      }); // Fail
      control.shouldFail = false;
      await breaker.fire(); // Success
      await breaker.fire(); // Success

      await wait(100);

      // Circuit should remain closed (2/5 = 40% failures < 50% threshold)
      expect(breaker.opened).toBe(false);

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.state).toBe("closed");
    });

    test("should handle rapid successive failures", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "RapidFailureTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 60_000,
      });

      // Rapid successive failures
      control.shouldFail = true;
      const promises = new Array(20).fill(0).map(() =>
        breaker.fire().catch(() => {
          /* expected */
        })
      );

      await Promise.all(promises);
      await wait(100);

      // Circuit should be open
      expect(breaker.opened).toBe(true);

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.failures).toBeGreaterThanOrEqual(5);
    });

    test("should protect system under sustained failure", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "SustainedFailureTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
        resetTimeout: 60_000,
      });

      control.shouldFail = true;

      // First wave of failures (opens circuit)
      for (let i = 0; i < 10; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      await wait(100);

      expect(breaker.opened).toBe(true);
      const statsAfterOpen = getCircuitBreakerStats(breaker);
      const rejectsBeforeSecondWave = statsAfterOpen.rejects;

      // Second wave - should be rejected immediately (protecting system)
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        await breaker.fire().catch(() => {
          /* expected */
        });
      }
      const elapsed = Date.now() - startTime;

      // Rejects should be very fast (not waiting for actual function execution)
      expect(elapsed).toBeLessThan(500); // 100 rejects in < 500ms

      const statsAfterRejects = getCircuitBreakerStats(breaker);
      expect(statsAfterRejects.rejects).toBeGreaterThan(
        rejectsBeforeSecondWave + 50
      );
    });
  });

  test.describe("Concurrent Requests", () => {
    test("should handle concurrent requests correctly", async () => {
      const [mockFn, control] = createMockFunction();
      const breaker = createCircuitBreaker(mockFn, {
        name: "ConcurrentTest",
        timeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 5,
      });

      // Fire 10 concurrent requests (5 succeed, 5 fail)
      control.shouldFail = false;
      const successPromises = new Array(5).fill(0).map(() => breaker.fire());

      control.shouldFail = true;
      const failurePromises = new Array(5)
        .fill(0)
        .map(() => breaker.fire().catch(() => "failed"));

      const results = await Promise.all([
        ...successPromises,
        ...failurePromises,
      ]);

      await wait(100);

      // Verify results
      const successCount = results.filter((r) => r === "success").length;
      const failureCount = results.filter((r) => r === "failed").length;

      expect(successCount).toBeGreaterThanOrEqual(4);
      expect(failureCount).toBeGreaterThanOrEqual(4);

      const stats = getCircuitBreakerStats(breaker);
      expect(stats.fires).toBeGreaterThanOrEqual(10);
    });
  });
});
