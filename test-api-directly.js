// Simple Node.js script to test the API directly
const fetch = require('node-fetch');

async function testSOFIAFieldExtraction() {
  console.log("🧪 Testing SOFIA Field Extraction Fix...");

  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: "test-chat-" + Date.now(),
        message: {
          id: "msg-" + Date.now(),
          role: "user",
          parts: [
            {
              type: "text",
              text: "i want a registartion developer with viewing tomorrow at 3pm the client is Margarita dimova",
            },
          ],
        },
        selectedChatModel: "chat-model-small",
        selectedVisibilityType: "private",
      }),
    });

    if (response.status === 200) {
      console.log("✅ API Response Status:", response.status);

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
      }

      console.log("📄 Full SOFIA Response:");
      console.log(fullResponse);

      // Check if field extraction worked correctly
      const lowerResponse = fullResponse.toLowerCase();

      console.log("\n🔍 Analyzing Response:");

      // Should ask for developer contact name
      if (lowerResponse.includes("developer") && lowerResponse.includes("contact")) {
        console.log("✅ Correctly asks for developer contact name");
      } else {
        console.log("❌ Does NOT ask for developer contact name");
      }

      // Should NOT ask for client name (already provided)
      if (!lowerResponse.includes("margarita") && !lowerResponse.includes("client")) {
        console.log("✅ Correctly does NOT ask for client name");
      } else {
        console.log("❌ INCORRECTLY asks for client name (was provided: Margarita Dimova)");
      }

      // Should NOT ask for viewing time (already provided)
      if (!lowerResponse.includes("3pm") && !lowerResponse.includes("viewing")) {
        console.log("✅ Correctly does NOT ask for viewing time");
      } else {
        console.log("❌ INCORRECTLY asks for viewing time (was provided: tomorrow at 3pm)");
      }

    } else {
      console.log("❌ API Error Status:", response.status);
      const errorText = await response.text();
      console.log("Error Response:", errorText);
    }

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testSOFIAFieldExtraction();