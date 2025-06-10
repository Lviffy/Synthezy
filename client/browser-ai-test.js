// Browser console test script
// Paste this into the browser console to test AI button functionality

console.log('🔍 === AI BUTTON DIAGNOSTIC TEST ===');

// Check if AI button exists
const aiButton = document.querySelector('.toolbutton.ai');
console.log('AI Button Element:', aiButton);

if (aiButton) {
  console.log('✅ AI button found');
  console.log('Button classes:', aiButton.className);
  console.log('Button data-tool:', aiButton.getAttribute('data-tool'));
  console.log('Button position:', aiButton.getBoundingClientRect());
  
  // Check if it's visible
  const isVisible = aiButton.offsetParent !== null;
  console.log('Button visible:', isVisible);
  
  // Check computed styles
  const styles = window.getComputedStyle(aiButton);
  console.log('Button pointer-events:', styles.pointerEvents);
  console.log('Button z-index:', styles.zIndex);
  console.log('Button position style:', styles.position);
  
  // Try to click it
  console.log('🖱️ Attempting to click AI button...');
  aiButton.click();
  
} else {
  console.log('❌ AI button not found');
  
  // List all available buttons
  const allButtons = document.querySelectorAll('.toolbutton');
  console.log('Available toolbar buttons:', allButtons.length);
  
  allButtons.forEach((btn, index) => {
    console.log(`Button ${index}:`, {
      classes: btn.className,
      dataTool: btn.getAttribute('data-tool'),
      title: btn.title
    });
  });
}

console.log('🔍 === END DIAGNOSTIC TEST ===');
