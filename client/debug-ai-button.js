// Debug script to test AI button functionality
console.log('Testing AI button click functionality...');

// Check if the AI button exists
const aiButton = document.querySelector('.toolbutton.ai');
console.log('AI button found:', aiButton);

if (aiButton) {
  console.log('AI button attributes:', {
    'data-tool': aiButton.getAttribute('data-tool'),
    'class': aiButton.className,
    'title': aiButton.title
  });
  
  // Test click event manually
  console.log('Attempting to click AI button...');
  aiButton.click();
  
  // Check if AI panel is visible after click
  setTimeout(() => {
    const aiPanel = document.querySelector('.ai-tool-panel');
    console.log('AI panel found after click:', aiPanel);
    console.log('AI panel visibility:', aiPanel ? getComputedStyle(aiPanel).display : 'not found');
  }, 100);
} else {
  console.log('AI button not found in DOM');
}

// List all toolbuttons for comparison
const allToolButtons = document.querySelectorAll('.toolbutton');
console.log('All tool buttons:', Array.from(allToolButtons).map(btn => ({
  slug: btn.getAttribute('data-tool'),
  class: btn.className
})));
