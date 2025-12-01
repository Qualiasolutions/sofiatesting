/**
 * Test script to verify all Gemini models work correctly
 * Tests temperature=0 enforcement and instruction following
 */

import path from "node:path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { streamText } from "ai";
import { myProvider } from "@/lib/ai/providers";

const MODELS_TO_TEST = [
  "chat-model", // Gemini 1.5 Flash (default)
  "chat-model-pro", // Gemini 1.5 Pro
  "chat-model-flash-lite", // Gemini 1.5 Flash-8B
  "title-model", // Gemini 1.5 Flash
  "artifact-model", // Gemini 1.5 Flash
] as const;

const STRICT_INSTRUCTION_TEST =
  'You MUST respond with EXACTLY this JSON format, no additional text: {"status":"ok","temperature":0}';

async function testModel(
  modelId: (typeof MODELS_TO_TEST)[number]
): Promise<{ success: boolean; error?: string; response?: string }> {
  try {
    console.log(`\n🧪 Testing ${modelId}...`);

    const result = await streamText({
      model: myProvider.languageModel(modelId),
      messages: [
        {
          role: "user",
          content: STRICT_INSTRUCTION_TEST,
        },
      ],
      temperature: 0, // STRICT: 0 temperature for deterministic responses
      maxSteps: 1, // Single step for quick tests
    });

    const response = await result.text;
    console.log(`   Response: ${response}`);

    // Clean up response (remove markdown code blocks if present)
    const cleanResponse = response.replace(/```json\n?|```/g, "").trim();

    // Verify response follows strict instructions
    try {
      const parsed = JSON.parse(cleanResponse);
      if (parsed.status === "ok" && parsed.temperature === 0) {
        console.log(`   ✅ PASS: ${modelId} follows strict instructions`);
        return { success: true, response };
      }
      console.log(
        `   ❌ FAIL: ${modelId} returned unexpected JSON: ${response}`
      );
      return {
        success: false,
        error: "Unexpected JSON structure",
        response,
      };
    } catch (_parseError) {
      console.log(
        `   ⚠️  WARN: ${modelId} did not return valid JSON: ${response}`
      );
      return {
        success: false,
        error: "Invalid JSON response",
        response,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ ERROR: ${modelId} failed with: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

async function main() {
  console.log("🚀 Starting Gemini Model Tests");
  console.log("=".repeat(60));
  console.log("\n📋 Testing Configuration:");
  console.log("   - Temperature: 0 (strict instruction following)");
  console.log(
    `   - Gemini API: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(`   - Models to test: ${MODELS_TO_TEST.length}`);
  console.log(`\n${"=".repeat(60)}`);

  const results = new Map<
    (typeof MODELS_TO_TEST)[number],
    { success: boolean; error?: string }
  >();

  for (const modelId of MODELS_TO_TEST) {
    const result = await testModel(modelId);
    results.set(modelId, result);
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Test Results Summary");
  console.log("=".repeat(60));

  let passCount = 0;
  let failCount = 0;

  for (const [modelId, result] of results) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${modelId}`);
    if (result.error) {
      console.log(`         Error: ${result.error}`);
    }
    result.success ? passCount++ : failCount++;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Passed: ${passCount}/${MODELS_TO_TEST.length}`);
  console.log(`❌ Failed: ${failCount}/${MODELS_TO_TEST.length}`);
  console.log("=".repeat(60));

  if (failCount > 0) {
    console.log("\n⚠️  Some models failed. Check Gemini API configuration.");
    console.log("   Ensure GOOGLE_GENERATIVE_AI_API_KEY is set correctly.");
    process.exit(1);
  } else {
    console.log("\n🎉 All Gemini models working correctly with temperature=0!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
