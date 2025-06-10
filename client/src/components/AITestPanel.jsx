import React from 'react';
import { useAppContext } from '../provider/AppStates';

export default function AITestPanel() {
  const { showAIPanel, setShowAIPanel, toolAction } = useAppContext();
  
  React.useEffect(() => {
    console.log('🔧 AITestPanel mounted. Initial showAIPanel:', showAIPanel);
  }, []);

  React.useEffect(() => {
    console.log('🔧 AITestPanel: showAIPanel changed to:', showAIPanel);
  }, [showAIPanel]);

  const testDirectToggle = () => {
    console.log('🔧 Testing direct AI panel toggle...');
    console.log('🔧 Current showAIPanel:', showAIPanel);
    setShowAIPanel(!showAIPanel);
    console.log('🔧 Called setShowAIPanel with:', !showAIPanel);
  };
  
  const testToolAction = () => {
    console.log('🔧 Testing toolAction for AI...');
    console.log('🔧 Current showAIPanel before toolAction:', showAIPanel);
    toolAction('ai');
    console.log('🔧 Called toolAction("ai")');
  };
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 10000,
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      pointerEvents: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>AI Button Test</h3>
      <p>AI Panel Status: <strong style={{ color: showAIPanel ? '#4CAF50' : '#f44336' }}>
        {showAIPanel ? '✅ OPEN' : '❌ CLOSED'}
      </strong></p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>        <button 
          onClick={testDirectToggle}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            background: '#4CAF50',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            pointerEvents: 'auto'
          }}
        >
          Direct Toggle Test
        </button>
        
        <button 
          onClick={testToolAction}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            background: '#2196F3',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            pointerEvents: 'auto'
          }}
        >
          ToolAction Test
        </button>
      </div>
    </div>
  );
}
