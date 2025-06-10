import React from 'react';

export default function ClickTest() {
  const handleClick = () => {
    alert('Click works!');
    console.log('✅ Basic click event working!');
  };

  return (
    <div 
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'red',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 10001,
        cursor: 'pointer',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      CLICK TEST - Click me!
    </div>
  );
}
