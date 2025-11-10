# Unit Tests

This directory contains unit tests for isolated functions and logic in the SOFIA application.

## Running Tests

```bash
# Run all unit tests
pnpm test:unit

# Run specific test file
pnpm test:unit:parallel-uploads
```

## Test Files

### `parallel-image-uploads.test.ts`

Comprehensive unit tests for the parallel image upload implementation in `lib/zyprus/client.ts`.

**Coverage:**
- ✅ Happy path: All images upload successfully (0, 1, 3, 10 images)
- ✅ Partial failure: Some images fail, others succeed gracefully
- ✅ Complete failure: All images fail (returns empty array)
- ✅ Image fetch fails (network error handling)
- ✅ Image upload fails (API error handling)
- ✅ Parallel execution verification (not sequential)
- ✅ Correct logging (success rate, individual failures)
- ✅ ImageIds array contains only successful uploads
- ✅ Edge cases: empty array, network timeouts, content-type handling
- ✅ Integration test: Realistic mixed scenario

**Test Strategy:**
- Uses Node.js built-in test framework (`node:test`)
- Mocks `fetch()` to simulate API responses
- Tests parallel execution with `Promise.allSettled()`
- Verifies graceful degradation on failures
- Validates logging and error handling

**Key Test Cases:**
1. **All images succeed**: Verifies 100% success rate
2. **Partial failures**: Validates graceful degradation (e.g., 2/3 succeed)
3. **All images fail**: Returns empty array without throwing
4. **Mixed failure types**: Handles both fetch and upload failures
5. **Parallel vs Sequential**: Confirms parallel execution (<500ms for 6 requests)
6. **Order preservation**: Successful uploads maintain order
7. **Content-Type handling**: Extracts correct file extensions

## Test Output

Each test run shows:
- Test suite name and test case name
- Pass/fail status with detailed error messages
- Execution time per test
- Summary: `# tests X # pass Y # fail Z`

Example successful run:
```
# tests 17
# suites 9
# pass 17
# fail 0
# duration_ms 1059.056268
```

## Writing New Unit Tests

When adding new unit tests to this directory:

1. **Use Node.js test framework**:
   ```typescript
   import { describe, test, mock } from "node:test";
   import assert from "node:assert";
   ```

2. **Isolate the function under test**:
   - Extract the logic into a testable function
   - Mock external dependencies (fetch, database, etc.)
   - Focus on one function or feature per test file

3. **Follow AAA pattern**:
   - **Arrange**: Set up test data and mocks
   - **Act**: Execute the function under test
   - **Assert**: Verify expected behavior

4. **Test edge cases**:
   - Empty inputs
   - Maximum inputs
   - Error conditions
   - Boundary values

5. **Add to package.json**:
   ```json
   {
     "scripts": {
       "test:unit:your-feature": "pnpm exec tsx --test tests/unit/your-feature.test.ts"
     }
   }
   ```

## Debugging Tests

### Run with verbose output:
```bash
node --test --test-reporter=spec tests/unit/parallel-image-uploads.test.ts
```

### Run specific test suite:
```bash
# Node.js test framework doesn't support .only() yet
# Use grep to filter tests:
pnpm test:unit:parallel-uploads 2>&1 | grep "Happy Path"
```

### Debug with console logs:
- Tests capture `console.log` and `console.error`
- Logs appear in test output prefixed with `#`
- Use logs to trace execution flow

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies (database, API, etc.)
- Fast execution (<2 seconds total)
- Consistent results (no flaky tests)
- Clear pass/fail status

Add to GitHub Actions:
```yaml
- name: Run unit tests
  run: pnpm test:unit
```

## Test Philosophy

**Unit tests should:**
- ✅ Test one function in isolation
- ✅ Run fast (<100ms per test)
- ✅ Be deterministic (no random failures)
- ✅ Not require external services
- ✅ Have clear, descriptive names
- ✅ Test both success and failure paths

**Unit tests should NOT:**
- ❌ Make real network requests
- ❌ Access real databases
- ❌ Depend on other tests
- ❌ Test multiple features at once
- ❌ Use real timers (use mocks)

## Resources

- [Node.js Test Runner Docs](https://nodejs.org/api/test.html)
- [TypeScript with TSX](https://github.com/privatenumber/tsx)
- [Assert API](https://nodejs.org/api/assert.html)
- [Mock Functions](https://nodejs.org/api/test.html#mocking)
