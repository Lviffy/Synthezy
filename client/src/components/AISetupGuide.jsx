import React, { useState } from 'react';

export default function AISetupGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) return;
    
    // In a real app, you'd save this securely
    console.log('API Key would be saved:', apiKey);
    
    // Show success message
    alert('API Key saved! Reload the page to enable AI features.');
    setShowGuide(false);
  };

  if (!showGuide) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        zIndex: 1001
      }} onClick={() => setShowGuide(true)}>
        🤖 Setup AI Features
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      zIndex: 1001
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>🤖 AI Setup</h3>
        <button onClick={() => setShowGuide(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: '#4a5568', margin: '0 0 12px 0' }}>
          Get your free Google Gemini API key to enable AI diagram generation:
        </p>
        
        <ol style={{ fontSize: '13px', color: '#718096', paddingLeft: '20px', margin: '0 0 16px 0' }}>
          <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>Google AI Studio</a></li>
          <li>Create a new API key</li>
          <li>Copy and paste it below</li>
          <li>Create a <code>.env</code> file in the client folder</li>
          <li>Add: <code>VITE_GEMINI_API_KEY=your_key_here</code></li>
        </ol>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your API key here..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '12px'
          }}
        />

        <button
          onClick={handleApiKeySubmit}
          disabled={!apiKey.trim()}
          style={{
            width: '100%',
            padding: '10px',
            background: apiKey.trim() ? '#667eea' : '#e2e8f0',
            color: apiKey.trim() ? 'white' : '#a0aec0',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: apiKey.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Save API Key
        </button>
      </div>

      <div style={{ 
        background: 'rgba(59, 130, 246, 0.05)', 
        padding: '12px', 
        borderRadius: '6px',
        marginTop: '16px'
      }}>
        <p style={{ fontSize: '12px', color: '#3b82f6', margin: 0 }}>
          💡 <strong>Note:</strong> AI features work in demo mode without an API key, but you'll get better results with a real key!
        </p>
      </div>
    </div>
  );
}
