import React from 'react';

export default function UILockDiagnostic() {
  const [bodyClasses, setBodyClasses] = React.useState('');
  const [hasLockUI, setHasLockUI] = React.useState(false);

  React.useEffect(() => {
    const checkBodyClasses = () => {
      const classes = document.body.className;
      setBodyClasses(classes);
      setHasLockUI(classes.includes('lock-ui'));
    };

    checkBodyClasses();
    
    // Check every second
    const interval = setInterval(checkBodyClasses, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const removeLockUI = () => {
    document.body.classList.remove('lock-ui');
    console.log('🔓 Removed lock-ui class from body');
  };

  const addLockUI = () => {
    document.body.classList.add('lock-ui');
    console.log('🔒 Added lock-ui class to body');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: hasLockUI ? 'red' : 'green',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 10002,
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      pointerEvents: 'auto',
      maxWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>UI Lock Diagnostic</h3>
      <p><strong>Body classes:</strong> <code>{bodyClasses || 'none'}</code></p>
      <p><strong>Has lock-ui:</strong> {hasLockUI ? '🔒 YES (BLOCKING CLICKS)' : '🔓 NO'}</p>
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button 
          onClick={removeLockUI}
          style={{
            padding: '5px 8px',
            border: 'none',
            borderRadius: '4px',
            background: '#4CAF50',
            color: 'white',
            cursor: 'pointer',
            fontSize: '11px',
            pointerEvents: 'auto'
          }}
        >
          Remove Lock
        </button>
        
        <button 
          onClick={addLockUI}
          style={{
            padding: '5px 8px',
            border: 'none',
            borderRadius: '4px',
            background: '#f44336',
            color: 'white',
            cursor: 'pointer',
            fontSize: '11px',
            pointerEvents: 'auto'
          }}
        >
          Add Lock
        </button>
      </div>
    </div>
  );
}
