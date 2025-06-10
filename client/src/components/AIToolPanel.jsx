import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../provider/AppStates';
import { aiService } from '../utils/aiService';

export default function AIToolPanel() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagramType, setDiagramType] = useState('flowchart');
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
    const { setElements, elements, setSelectedTool, showAIPanel, setShowAIPanel } = useAppContext();

  const diagramTypes = [
    { value: 'flowchart', label: 'Flowchart', icon: '📊', desc: 'Process flows and decisions' },
    { value: 'mindmap', label: 'Mind Map', icon: '🧠', desc: 'Ideas and concepts' },
    { value: 'process', label: 'Process Diagram', icon: '⚙️', desc: 'Step-by-step procedures' },
    { value: 'organization', label: 'Org Chart', icon: '🏢', desc: 'Hierarchical structures' },
    { value: 'timeline', label: 'Timeline', icon: '📅', desc: 'Chronological events' },
    { value: 'network', label: 'Network Diagram', icon: '🌐', desc: 'Connected systems' },
    { value: 'system', label: 'System Architecture', icon: '🏗️', desc: 'Technical architecture' }
  ];

  // Clear error when prompt changes
  useEffect(() => {
    if (error) setError(null);
  }, [prompt, error]);

  // Close panel when showAIPanel becomes false
  useEffect(() => {
    setIsVisible(showAIPanel);
  }, [showAIPanel]);
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your diagram');
      return;
    }
    
    console.log('🤖 Starting AI diagram generation...');
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('📝 Prompt:', prompt.trim());
      console.log('📊 Diagram type:', diagramType);
      console.log('📋 Current elements count:', elements.length);
      
      const generatedElements = await aiService.generateDiagram(prompt.trim(), diagramType);
        console.log('✨ Generated elements:', generatedElements);
      console.log('🔢 Number of elements generated:', generatedElements.length);
      
      // Debug: Log the first few elements to see their content
      console.log('📄 Sample element details:');
      generatedElements.slice(0, 3).forEach((el, i) => {
        console.log(`Element ${i}:`, {
          id: el.id,
          tool: el.tool,
          text: el.text,
          x1: el.x1,
          y1: el.y1,
          x2: el.x2,
          y2: el.y2
        });
      });
      
      if (!generatedElements || generatedElements.length === 0) {
        throw new Error('No elements were generated. Please try a different description.');
      }
      
      // Find a good position to place new elements (avoid overlap)
      const offset = Math.floor(elements.length / 10) * 50;
      const positionedElements = generatedElements.map(element => ({
        ...element,
        x1: element.x1 + offset,
        y1: element.y1 + offset,
        x2: element.x2 + offset,
        y2: element.y2 + offset
      }));
      
      console.log('📍 Positioned elements:', positionedElements);
      
      // Add generated elements to canvas
      console.log('📝 Before setElements - current count:', elements.length);
      setElements(prev => {
        const newElements = [...prev, ...positionedElements];
        console.log('📝 After setElements - new count:', newElements.length);
        console.log('🎨 New elements added to canvas:', positionedElements.map(e => e.id));
        return newElements;
      });
      
      // Switch to selection tool
      setSelectedTool('selection');
      
      // Clear prompt and show success
      setPrompt('');
      
      console.log(`✅ Successfully generated ${positionedElements.length} elements`);
      
    } catch (error) {
      console.error('Generation failed:', error);
      setError(error.message || 'Failed to generate diagram. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, diagramType, elements, setElements, setSelectedTool]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (setShowAIPanel) {
      setShowAIPanel(false);
    }
  }, [setShowAIPanel]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleGenerate, handleClose]);

  const quickExamples = [
    'User registration and login flow',
    'E-commerce checkout process',
    'Project management workflow',
    'Software development lifecycle',
    'Customer support ticket system',
    'Team organizational structure',
    'Data processing pipeline',
    'System architecture overview'
  ];

  if (!isVisible) return null;

  return (    <div 
      className="ai-tool-panel"
      style={{
        position: 'fixed',
        right: '20px',
        top: '100px',
        width: '360px',
        maxHeight: 'calc(100vh - 120px)',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        animation: 'slideInRight 0.3s ease-out',
        pointerEvents: 'auto'
      }}
      onKeyDown={handleKeyPress}
      tabIndex={-1}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: '0', 
          fontSize: '18px', 
          fontWeight: '700',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🤖 AI Diagram Generator
        </h3>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#718096',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
          onMouseOut={(e) => e.target.style.background = 'none'}
          title="Close AI Panel (Esc)"
        >
          ×
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(254, 226, 226, 0.8)',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#c53030',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Diagram Type Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: '#2d3748'
        }}>
          Diagram Type
        </label>
        <select 
          value={diagramType}
          onChange={(e) => setDiagramType(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'}
        >
          {diagramTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label} - {type.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: '#2d3748'
        }}>
          Describe your diagram
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="e.g., 'Create a user login process with email verification and password reset'"
          rows={4}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'}
        />
        <p style={{
          fontSize: '12px',
          color: '#718096',
          margin: '8px 0 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>💡</span>
          Press Ctrl/Cmd + Enter to generate • Esc to close
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        style={{
          width: '100%',
          padding: '14px',
          background: isGenerating ? '#e2e8f0' : '#667eea',
          color: isGenerating ? '#718096' : 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: !prompt.trim() ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!isGenerating && prompt.trim()) {
            e.target.style.background = '#5a67d8';
            e.target.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          if (!isGenerating) {
            e.target.style.background = '#667eea';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        {isGenerating ? (
          <>
            <span style={{ 
              animation: 'spin 1s linear infinite',
              display: 'inline-block'
            }}>🔄</span>
            Generating...
          </>
        ) : (
          <>
            <span>✨</span>
            Generate Diagram
          </>
        )}
      </button>

      {/* Quick Examples */}
      <div style={{ marginTop: '24px' }}>
        <p style={{ 
          fontSize: '13px', 
          color: '#4a5568', 
          marginBottom: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>💡</span>
          Quick Examples:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {quickExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              style={{
                textAlign: 'left',
                background: 'rgba(102, 126, 234, 0.05)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#5a67d8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                e.target.style.transform = 'translateX(2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.15)';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      {/* API Key Status */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        background: 'rgba(59, 130, 246, 0.05)', 
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.15)'
      }}>
        <p style={{ 
          fontSize: '12px', 
          color: '#3b82f6', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>ℹ️</span>
          {aiService.apiKey ? 'AI-powered generation active' : 'Using demo mode - add VITE_GEMINI_API_KEY for full AI features'}
        </p>
      </div>      {/* Inline styles for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .ai-tool-panel::-webkit-scrollbar {
          width: 6px;
        }
        
        .ai-tool-panel::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        
        .ai-tool-panel::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .ai-tool-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
