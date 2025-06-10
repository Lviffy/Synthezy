// Quick test of AI service functionality
import { aiService } from './src/utils/aiService.js';

console.log('🔍 Testing AI Service...');

// Test the AI service directly
async function testAIService() {
  try {
    console.log('📋 Testing with a simple flowchart request...');
    
    const result = await aiService.generateDiagram('Create a simple login process flowchart', 'flowchart');
    
    console.log('✅ AI Service Response:', result);
    console.log('📊 Number of elements generated:', result.length);
    
    if (result.length > 0) {
      console.log('🎯 First element:', result[0]);
    }
    
  } catch (error) {
    console.error('❌ AI Service Error:', error);
  }
}

testAIService();
