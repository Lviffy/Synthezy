// Quick Browser Test for Collision Detection
// Paste this into the browser console to test positioning

console.log('🧪 BROWSER COLLISION DETECTION TEST');
console.log('===================================');

// Test the positioning system directly
function testPositioning() {
  // Simulate existing elements on canvas
  const existingElements = [
    { id: 'test1', x1: 200, y1: 100, x2: 400, y2: 200 },
    { id: 'test2', x1: 500, y1: 150, x2: 700, y2: 250 }
  ];

  // Simulate new elements to position
  const newElements = [
    { id: 'new1', x1: 0, y1: 0, x2: 150, y2: 100 },
    { id: 'new2', x1: 0, y1: 120, x2: 100, y2: 170 }
  ];

  console.log('📊 Existing elements:', existingElements.length);
  console.log('🆕 New elements:', newElements.length);

  // Test if the positionElementsAwayFromExisting function exists
  if (typeof window.positionElementsAwayFromExisting === 'function') {
    console.log('✅ Positioning function is available');
    
    const positioned = window.positionElementsAwayFromExisting(newElements, existingElements);
    console.log('📍 Positioned elements:', positioned);
    
    // Check for overlap
    let hasOverlap = false;
    positioned.forEach(newEl => {
      existingElements.forEach(existingEl => {
        const newBounds = {
          minX: Math.min(newEl.x1, newEl.x2),
          minY: Math.min(newEl.y1, newEl.y2),
          maxX: Math.max(newEl.x1, newEl.x2),
          maxY: Math.max(newEl.y1, newEl.y2)
        };
        const existingBounds = {
          minX: Math.min(existingEl.x1, existingEl.x2),
          minY: Math.min(existingEl.y1, existingEl.y2),
          maxX: Math.max(existingEl.x1, existingEl.x2),
          maxY: Math.max(existingEl.y1, existingEl.y2)
        };
        
        // Check overlap with 50px padding
        if (!(newBounds.maxX + 50 < existingBounds.minX || 
              existingBounds.maxX + 50 < newBounds.minX || 
              newBounds.maxY + 50 < existingBounds.minY || 
              existingBounds.maxY + 50 < newBounds.minY)) {
          hasOverlap = true;
        }
      });
    });
    
    console.log('🔍 Overlap detected:', hasOverlap);
    console.log(hasOverlap ? '❌ FAIL: Elements overlap!' : '✅ SUCCESS: No overlap detected!');
  } else {
    console.log('⚠️ Positioning function not found - this is expected in production');
    console.log('📋 To test, generate diagrams using the AI panel and watch console logs');
  }
}

// Instructions for manual testing
console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
console.log('1. Click the 🤖 AI button in the toolbar');
console.log('2. Generate first diagram: "User authentication flow"');
console.log('3. Generate second diagram: "Database schema design"');
console.log('4. Watch console for positioning logs');
console.log('5. Verify no visual overlap on canvas');

// Test collision detection math
console.log('\n🔢 MATHEMATICAL COLLISION DETECTION TEST:');

function testRectangleOverlap(rect1, rect2, padding = 0) {
  return !(rect1.maxX + padding < rect2.minX || 
           rect2.maxX + padding < rect1.minX || 
           rect1.maxY + padding < rect2.minY || 
           rect2.maxY + padding < rect1.minY);
}

// Test cases
const tests = [
  {
    name: 'Overlapping rectangles',
    rect1: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    rect2: { minX: 50, minY: 50, maxX: 150, maxY: 150 },
    expected: true
  },
  {
    name: 'Non-overlapping rectangles',
    rect1: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    rect2: { minX: 200, minY: 200, maxX: 300, maxY: 300 },
    expected: false
  },
  {
    name: 'Adjacent rectangles with padding',
    rect1: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    rect2: { minX: 120, minY: 0, maxX: 220, maxY: 100 },
    padding: 30,
    expected: true
  }
];

tests.forEach(test => {
  const result = testRectangleOverlap(test.rect1, test.rect2, test.padding || 0);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.name}: ${result} (expected: ${test.expected})`);
});

// Run the positioning test
testPositioning();

console.log('\n🎯 Ready to test! Generate some diagrams and watch the magic happen!');
