// Add this script to browser console to test AI button functionality

console.log('=== AI Button Test Script ===');

// Check if AI button exists
const aiButton = document.querySelector('.toolbutton.ai');
console.log('AI button found:', !!aiButton);

if (aiButton) {
  console.log('AI button classes:', aiButton.className);
  console.log('AI button data-tool:', aiButton.getAttribute('data-tool'));
  
  // Test click functionality
  console.log('Testing AI button click...');
  aiButton.click();
  
  // Check if AI panel appears
  setTimeout(() => {
    const aiPanel = document.querySelector('.ai-tool-panel, [class*="ai"]');
    console.log('AI panel found after click:', !!aiPanel);
    if (aiPanel) {
      console.log('AI panel classes:', aiPanel.className);
    }
  }, 500);
} else {
  console.log('Available toolbuttons:');
  document.querySelectorAll('.toolbutton').forEach((btn, i) => {
    console.log(`${i + 1}. ${btn.getAttribute('data-tool')} (${btn.className})`);
  });
}

console.log('=== End Test Script ===');
