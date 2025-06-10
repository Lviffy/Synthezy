#!/usr/bin/env node

/**
 * AI Diagram Generator Demo Script
 * Showcases the capabilities of the AI integration
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const { aiService } = await import('./src/utils/aiService.js');

console.log('🎨 SYNTHEZY AI DIAGRAM GENERATOR DEMO');
console.log('=====================================\n');

const demos = [
  {
    title: '🔄 User Authentication Flow',
    prompt: 'Create a complete user authentication system with login, registration, email verification, and password reset',
    type: 'flowchart'
  },
  {
    title: '🧠 Product Development Strategy',
    prompt: 'Map out a comprehensive product development strategy including market research, design, development, testing, and launch phases',
    type: 'mindmap'
  },
  {
    title: '🏢 Software Engineering Team',
    prompt: 'Design an engineering team structure with CTO, engineering managers, senior developers, junior developers, and QA engineers',
    type: 'organization'
  },
  {
    title: '⚙️ CI/CD Pipeline',
    prompt: 'Create a continuous integration and deployment pipeline from code commit to production deployment',
    type: 'process'
  },
  {
    title: '📅 Project Timeline',
    prompt: 'Show a 6-month project timeline for building a mobile app including planning, design, development, testing, and launch',
    type: 'timeline'
  }
];

async function runDemo() {
  console.log(`🔑 API Status: ${aiService.apiKey ? '✅ Live AI' : '🔄 Demo Mode'}`);
  console.log(`🌐 Service: Google Gemini AI`);
  console.log(`⚡ Features: 7 diagram types, natural language processing\n`);

  for (let i = 0; i < demos.length; i++) {
    const demo = demos[i];
    
    console.log(`${demo.title}`);
    console.log(`📝 Prompt: "${demo.prompt}"`);
    console.log(`📊 Type: ${demo.type}`);
    
    try {
      const startTime = Date.now();
      console.log('🔄 Generating...');
      
      const elements = await aiService.generateDiagram(demo.prompt, demo.type);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Success! Generated ${elements.length} elements in ${(duration/1000).toFixed(1)}s`);
      
      // Show element breakdown
      const breakdown = elements.reduce((acc, el) => {
        acc[el.tool] = (acc[el.tool] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`📋 Elements: ${Object.entries(breakdown).map(([tool, count]) => `${count}x ${tool}`).join(', ')}`);
      
      // Show sample elements with text
      const withText = elements.filter(e => e.text && e.text.length > 0).slice(0, 3);
      if (withText.length > 0) {
        console.log(`💬 Sample content:`);
        withText.forEach((el, idx) => {
          console.log(`   ${idx + 1}. ${el.tool}: "${el.text.substring(0, 40)}${el.text.length > 40 ? '...' : ''}"`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Add delay between demos for readability
    if (i < demos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Test suggestions feature
  console.log('🧠 SMART SUGGESTIONS DEMO');
  console.log('========================');
  
  const suggestionTopics = ['Project Management', 'Team Building', 'Marketing Strategy'];
  
  for (const topic of suggestionTopics) {
    console.log(`💡 Topic: "${topic}"`);
    
    try {
      const suggestions = await aiService.generateSuggestions(topic);
      console.log(`✅ Generated ${suggestions.length} suggestions:`);
      suggestions.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s}`);
      });
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎉 DEMO COMPLETE!');
  console.log('=================');
  console.log('');
  console.log('🚀 Ready to use in Synthezy:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Open http://localhost:5174');
  console.log('   3. Click the 🤖 AI button');
  console.log('   4. Try any of the prompts above!');
  console.log('');
  console.log('📚 More info: see AI_FEATURES.md');
}

runDemo().catch(console.error);
