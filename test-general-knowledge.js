// Test the general knowledge tool directly
import { getGeneralKnowledge } from './lib/ai/tools/get-general-knowledge.js';

async function testGeneralKnowledge() {
  try {
    console.log('Testing general knowledge tool...');

    // Test with investment categories query
    const result = await getGeneralKnowledge.execute({
      query: 'investment categories for PR'
    });

    console.log('Test result:', JSON.stringify(result, null, 2));

    // Check if the result contains expected content
    if (result.content && result.content.includes('Minimum Investment: EUR 300,000')) {
      console.log('✅ Test passed! Found expected content about investment categories');
    } else {
      console.log('❌ Test failed! Expected content not found');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testGeneralKnowledge();