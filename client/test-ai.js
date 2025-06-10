#!/usr/bin/env node

/**
 * Simple test script for AI Service
 * Run with: node test-ai.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Now import the AI service after environment is configured
const { aiService } = await import('./src/utils/aiService.js');

async function testAIService() {
  console.log('🤖 Testing AI Service...\n');
  console.log('📋 Configuration:');
  console.log('   API Key:', aiService.apiKey ? '✅ Configured' : '❌ Not found (using mock data)');
  console.log('   Environment file:', join(__dirname, '.env'));
  console.log('');

  const testPrompts = [
    { prompt: 'Simple user login flow', type: 'flowchart' },
    { prompt: 'E-commerce checkout process', type: 'process' },
    { prompt: 'Team organization chart', type: 'organization' }
  ];

  for (const { prompt, type } of testPrompts) {
    console.log(`📝 Testing: "${prompt}" (${type})`);
    
    try {
      const startTime = Date.now();
      const elements = await aiService.generateDiagram(prompt, type);
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Generated ${elements.length} elements in ${duration}ms`);
      console.log(`   📊 Elements: ${elements.map(e => `${e.tool}${e.text ? `("${e.text.substring(0,20)}...")` : ''}`).join(', ')}`);
      
      // Validate element structure
      const validElements = elements.filter(e => 
        e.id && e.tool && typeof e.x1 === 'number' && typeof e.y1 === 'number'
      );
      console.log(`   🔍 Valid elements: ${validElements.length}/${elements.length}`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test suggestions
  console.log('🧠 Testing suggestions...');
  try {
    const startTime = Date.now();
    const suggestions = await aiService.generateSuggestions('Project Planning');
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Generated ${suggestions.length} suggestions in ${duration}ms`);
    suggestions.forEach((s, i) => console.log(`   ${i + 1}. "${s}"`));
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n🎉 AI Service test completed!');
  
  // Show setup instructions if no API key
  if (!aiService.apiKey) {
    console.log('\n💡 To enable full AI features:');
    console.log('   1. Get API key from: https://makersuite.google.com/app/apikey');
    console.log('   2. Create .env file: VITE_GEMINI_API_KEY=your_key_here');
    console.log('   3. Restart the development server');
  }
}

testAIService().catch(console.error);
