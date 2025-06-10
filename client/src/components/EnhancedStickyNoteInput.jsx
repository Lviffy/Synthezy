import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../provider/AppStates';
import { aiService } from '../utils/aiService';

export default function EnhancedStickyNoteInput({ position, onComplete, style, canvasPosition }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const { setElements, elements } = useAppContext();

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const generateSuggestions = async () => {
    if (!title.trim() || title.length < 3) return;
    
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await aiService.generateSuggestions(title);
      setAiSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setShowSuggestions(false);
  };

  const handleTitleBlur = () => {
    // Debounce the suggestion generation
    if (title.trim().length >= 3) {
      setTimeout(generateSuggestions, 500);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setContent(suggestion);
    setShowSuggestions(false);
    if (contentInputRef.current) {
      contentInputRef.current.focus();
    }
  };

  const handleSubmit = () => {
    if (!title.trim() && !content.trim()) {
      onComplete();
      return;
    }

    const finalContent = content || title;
    const displayText = title && content ? `${title}\n\n${content}` : finalContent;

    const newElement = {
      id: `sticky-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool: 'stickyNote',
      x1: position.x,
      y1: position.y,
      x2: position.x + 200,
      y2: position.y + 120,
      text: displayText,
      strokeWidth: 2,
      strokeColor: style?.strokeColor || '#f59e0b',
      strokeStyle: 'solid',
      fill: style?.fill || '#fef3c7',
      opacity: 100,
      cornerStyle: 'rounded'
    };

    setElements(prev => [...prev, newElement]);
    onComplete();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onComplete();
    }
  };

  return (
    <div style={{
      position: "absolute",
      left: position.x,
      top: position.y,
      background: "rgba(255, 255, 255, 0.98)",
      border: "1px solid rgba(0, 0, 0, 0.08)",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      backdropFilter: "blur(20px)",
      minWidth: "320px",
      maxWidth: "420px",
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📝 Smart Sticky Note
        </h3>
        <p style={{
          fontSize: '12px',
          color: '#718096',
          margin: 0
        }}>
          AI will suggest content based on your title
        </p>
      </div>

      {/* Title Input */}
      <input
        ref={titleInputRef}
        type="text"
        value={title}
        onChange={handleTitleChange}
        onBlur={handleTitleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Enter note title..."
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: "600",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "8px",
          marginBottom: "12px",
          background: "rgba(249, 250, 251, 0.8)",
          transition: "border-color 0.2s ease"
        }}
        onFocus={(e) => e.target.style.borderColor = '#667eea'}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
          handleTitleBlur();
        }}
      />

      {/* AI Suggestions */}
      {(isLoadingSuggestions || (showSuggestions && aiSuggestions.length > 0)) && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#4a5568', 
            marginBottom: '8px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isLoadingSuggestions ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                Generating suggestions...
              </>
            ) : (
              <>
                🤖 AI Suggestions:
              </>
            )}
          </p>
          {!isLoadingSuggestions && aiSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'rgba(102, 126, 234, 0.05)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '6px',
                fontSize: '13px',
                color: '#4c51bf',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                lineHeight: '1.4'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                e.target.style.transform = 'translateX(2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Content Input */}
      <textarea
        ref={contentInputRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add detailed content... (optional)"
        rows={4}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "14px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "8px",
          marginBottom: "16px",
          resize: "vertical",
          fontFamily: "inherit",
          lineHeight: "1.5",
          background: "white",
          transition: "border-color 0.2s ease"
        }}
        onFocus={(e) => e.target.style.borderColor = '#667eea'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'}
      />

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <p style={{
          fontSize: '11px',
          color: '#718096',
          margin: 0
        }}>
          Ctrl/Cmd + Enter to save • Esc to cancel
        </p>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onComplete}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              color: '#4a5568',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.05)';
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#5a67d8';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Save Note
          </button>
        </div>
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
