// Simple AI button test
// Run this in browser console to debug the AI button

console.log('=== AI Button Debug Test ===');

// Check if buttons exist
const aiButton = document.querySelector('.toolbutton.ai');
const allButtons = document.querySelectorAll('.toolbutton');

console.log('Total toolbuttons found:', allButtons.length);
console.log('AI button found:', !!aiButton);

if (aiButton) {
  console.log('AI button details:', {
    className: aiButton.className,
    dataAttr: aiButton.getAttribute('data-tool'),
    title: aiButton.title,
    onclick: aiButton.onclick,
    hasClickListener: !!aiButton.onclick
  });
  
  // Check if the button is clickable
  const rect = aiButton.getBoundingClientRect();
  console.log('AI button position:', rect);
  
  // Test manual click
  console.log('Testing manual click...');
  aiButton.click();
  
  // Check for AI panel after click
  setTimeout(() => {
    const aiPanel = document.querySelector('.ai-tool-panel');
    console.log('AI panel after click:', !!aiPanel);
  }, 500);
} else {
  console.log('Available buttons:', 
    Array.from(allButtons).map(btn => ({
      tool: btn.getAttribute('data-tool'),
      class: btn.className
    }))
  );
}

console.log('=== End Debug Test ===');
