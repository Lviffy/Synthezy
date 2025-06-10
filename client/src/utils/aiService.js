/**
 * AI Service for generating complete diagrams using Google Gemini API
 * Creates interconnected diagrams with proper relationships and detailed content
 */

export class AIService {
  constructor() {
    // Handle both Vite environment and Node.js environment
    this.apiKey = typeof import.meta !== 'undefined' && import.meta.env 
      ? import.meta.env.VITE_GEMINI_API_KEY
      : process.env.VITE_GEMINI_API_KEY;
    
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    
    if (!this.apiKey) {
      console.warn('AI Service: No API key found. Using mock responses.');
    }
  }  /**
   * Generate complete connected diagrams from text prompt
   * @param {string} prompt - User description of the diagram
   * @param {string} diagramType - Type of diagram to generate
   * @returns {Promise<Array>} Array of connected elements compatible with Synthezy
   */
  async generateDiagram(prompt, diagramType = 'flowchart') {
    // Input validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt provided');
    }

    if (!this.apiKey) {
      return this.getCompleteMockDiagram(prompt, diagramType);
    }

    try {
      const systemPrompt = this.getEnhancedSystemPrompt(diagramType);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser request: ${prompt.trim()}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data, diagramType);
    } catch (error) {
      console.error('AI generation failed:', error);
      
      // Fallback to mock response
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('Network error, using mock response');
        return this.getCompleteMockDiagram(prompt, diagramType);
      }
      
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
  /**
   * Get enhanced system prompt for specific diagram type
   * @param {string} diagramType - Type of diagram
   * @returns {string} Enhanced system prompt
   */
  getEnhancedSystemPrompt(diagramType) {
    const basePrompt = `You are an AI assistant that generates complete, interconnected diagrams for the Synthezy whiteboard application. 
    Generate comprehensive diagrams with 7-15 connected elements that form a cohesive, meaningful diagram.
    
    CRITICAL: You must generate a COMPLETE diagram with proper connections and relationships, not just scattered elements.
    
    Return ONLY a valid JSON object with this exact structure:
    {
      "elements": [
        {
          "id": "unique_id",
          "tool": "rectangle|circle|diamond|text|arrow|line",
          "x1": number,
          "y1": number,
          "x2": number,
          "y2": number,
          "text": "display text (required for shapes)",
          "strokeWidth": 2,
          "strokeColor": "#color_hex",
          "strokeStyle": "solid",
          "fill": "#color_hex",
          "opacity": 100,
          "cornerStyle": "rounded"
        }
      ]
    }
    
    Element Guidelines:
    - Use tool values: "rectangle", "circle", "diamond", "text", "arrow", "line"
    - Coordinates: x1,y1 is top-left, x2,y2 is bottom-right for shapes
    - For arrows/lines: x1,y1 is start point, x2,y2 is end point
    - For text elements: x1,y1 is the text position, x2,y2 should be x1+100,y1+30
    - Keep elements reasonably sized (100-200px wide, 40-60px tall for rectangles)
    - Space elements appropriately (80-150px apart)
    - Use colors: #3b82f6 (blue), #10b981 (green), #ef4444 (red), #f59e0b (amber), #8b5cf6 (purple), #06b6d4 (cyan)
    - Always add meaningful text content to shapes (not just "Step 1", "Process", etc.)
    - Create logical flow with connecting arrows/lines between related elements
    
    Connection Rules:
    - Always include arrows or lines to connect related elements
    - Arrows should have 2px stroke width and #64748b color
    - Position arrows to actually connect the edges of elements
    - For flowcharts: Use arrows between all sequential steps
    - For mind maps: Use lines from center to all branches
    - For processes: Connect all sequential steps with arrows`;

    const typeSpecific = {
      flowchart: `Create a COMPLETE FLOWCHART with:
      - 1 start circle (green #10b981)
      - 3-5 process rectangles (blue #3b82f6) with detailed descriptions
      - 1-2 decision diamonds (amber #f59e0b) with yes/no questions
      - 1-2 end circles (red #ef4444)
      - Arrows connecting ALL elements in logical flow
      - Arrange vertically or in branching pattern
      - Include specific, detailed text for each step`,
      
      mindmap: `Create a COMPLETE MIND MAP with:
      - 1 central circle topic (purple #8b5cf6) in the center
      - 4-6 main branch rectangles (different colors) around the center
      - 2-3 sub-branches for some main branches
      - Lines connecting center to all main branches
      - Lines connecting main branches to sub-branches
      - Meaningful, specific text for each node
      - Radial layout spreading outward from center`,
      
      process: `Create a COMPLETE PROCESS DIAGRAM with:
      - 5-8 sequential step rectangles (alternating blue #3b82f6 and cyan #06b6d4)
      - Arrows connecting each step to the next
      - Detailed descriptions of what happens in each step
      - Linear horizontal or vertical arrangement
      - Optional feedback loops with curved arrows
      - Clear start and end points`,
      
      organization: `Create a COMPLETE ORGANIZATIONAL CHART with:
      - 1 top-level rectangle (purple #8b5cf6) for CEO/Leader
      - 2-3 manager rectangles (blue #3b82f6) reporting to top
      - 3-5 employee rectangles (green #10b981) under managers
      - Lines connecting all reporting relationships
      - Specific job titles and names
      - Hierarchical tree structure`,
      
      timeline: `Create a COMPLETE TIMELINE with:
      - 5-7 event rectangles (alternating colors) with dates
      - Horizontal or vertical timeline line
      - Arrows or lines connecting events in chronological order
      - Specific dates and detailed event descriptions
      - Milestones marked with different shapes
      - Clear temporal progression`,
      
      network: `Create a COMPLETE NETWORK DIAGRAM with:
      - 6-10 node circles (different colors for different types)
      - Lines connecting related nodes
      - Specific labels for each node type
      - Different connection types (solid/dashed lines)
      - Clustered or distributed layout
      - Legend elements explaining node types`,
      
      system: `Create a COMPLETE SYSTEM ARCHITECTURE with:
      - 4-6 component rectangles (different colors for different layers)
      - Arrows showing data/information flow
      - Database elements (cylinders using circles)
      - User interface elements
      - External systems
      - Detailed component names and functions
      - Layered or service-oriented layout`
    };

    return `${basePrompt}\n\n${typeSpecific[diagramType] || typeSpecific.flowchart}`;
  }

  /**
   * Get system prompt for specific diagram type
   * @param {string} diagramType - Type of diagram
   * @returns {string} System prompt
   */
  getSystemPrompt(diagramType) {
    // Keep the old method for backwards compatibility
    return this.getEnhancedSystemPrompt(diagramType);
  }

  /**
   * Parse AI response and convert to Synthezy elements
   * @param {Object} response - AI API response
   * @param {string} diagramType - Diagram type for fallback
   * @returns {Array} Validated elements
   */
  parseAIResponse(response, diagramType) {
    try {
      const content = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content in AI response');
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[1]);
      
      if (!parsed.elements || !Array.isArray(parsed.elements)) {
        throw new Error('Invalid response format: missing elements array');
      }

      // Validate and clean elements
      const validatedElements = parsed.elements
        .filter(element => this.validateElement(element))
        .map(element => this.normalizeElement(element));

      if (validatedElements.length === 0) {
        throw new Error('No valid elements found in response');
      }

      return validatedElements;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getCompleteMockDiagram(prompt, diagramType);
    }
  }

  /**
   * Validate element structure
   * @param {Object} element - Element to validate
   * @returns {boolean} Is valid
   */
  validateElement(element) {
    return (
      element &&
      typeof element === 'object' &&
      typeof element.x1 === 'number' &&
      typeof element.y1 === 'number' &&
      typeof element.x2 === 'number' &&
      typeof element.y2 === 'number' &&
      ['rectangle', 'circle', 'diamond', 'text', 'arrow', 'line'].includes(element.tool)
    );
  }

  /**
   * Normalize element to Synthezy format
   * @param {Object} element - Raw element
   * @returns {Object} Normalized element
   */
  normalizeElement(element) {
    return {
      id: element.id || `ai-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool: element.tool,
      x1: Math.round(element.x1),
      y1: Math.round(element.y1),
      x2: Math.round(element.x2),
      y2: Math.round(element.y2),
      text: element.text || '',
      strokeWidth: Math.max(element.strokeWidth || 2, 1),
      strokeColor: this.validateColor(element.strokeColor) || '#3b82f6',
      strokeStyle: element.strokeStyle || 'solid',
      fill: this.validateColor(element.fill) || 'transparent',
      opacity: Math.max(Math.min(element.opacity || 100, 100), 0),
      cornerStyle: element.cornerStyle || 'rounded'
    };
  }

  /**
   * Validate hex color
   * @param {string} color - Color to validate
   * @returns {string|null} Valid color or null
   */
  validateColor(color) {
    if (!color || typeof color !== 'string') return null;
    
    // Check if it's a valid hex color
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexPattern.test(color) ? color : null;
  }
  /**
   * Get comprehensive mock diagrams for testing/fallback
   * @param {string} prompt - User prompt
   * @param {string} diagramType - Diagram type
   * @returns {Array} Complete mock diagram elements
   */
  getCompleteMockDiagram(prompt, diagramType) {
    const mockDiagrams = {
      flowchart: [
        {
          id: 'start-1',
          tool: 'circle',
          x1: 200,
          y1: 50,
          x2: 300,
          y2: 100,
          text: 'Start Process',
          strokeWidth: 2,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: '#10b981',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'process-1',
          tool: 'rectangle',
          x1: 150,
          y1: 150,
          x2: 350,
          y2: 200,
          text: `Analyze ${prompt.slice(0, 20) || 'Requirements'}`,
          strokeWidth: 2,
          strokeColor: '#3b82f6',
          strokeStyle: 'solid',
          fill: '#3b82f6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'decision-1',
          tool: 'diamond',
          x1: 175,
          y1: 250,
          x2: 325,
          y2: 330,
          text: 'Requirements\nClear?',
          strokeWidth: 2,
          strokeColor: '#f59e0b',
          strokeStyle: 'solid',
          fill: '#f59e0b',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'process-2',
          tool: 'rectangle',
          x1: 400,
          y1: 250,
          x2: 600,
          y2: 300,
          text: 'Gather More Information',
          strokeWidth: 2,
          strokeColor: '#06b6d4',
          strokeStyle: 'solid',
          fill: '#06b6d4',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'process-3',
          tool: 'rectangle',
          x1: 150,
          y1: 380,
          x2: 350,
          y2: 430,
          text: 'Implement Solution',
          strokeWidth: 2,
          strokeColor: '#8b5cf6',
          strokeStyle: 'solid',
          fill: '#8b5cf6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'process-4',
          tool: 'rectangle',
          x1: 150,
          y1: 480,
          x2: 350,
          y2: 530,
          text: 'Test & Validate',
          strokeWidth: 2,
          strokeColor: '#06b6d4',
          strokeStyle: 'solid',
          fill: '#06b6d4',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'end-1',
          tool: 'circle',
          x1: 200,
          y1: 580,
          x2: 300,
          y2: 630,
          text: 'Complete',
          strokeWidth: 2,
          strokeColor: '#ef4444',
          strokeStyle: 'solid',
          fill: '#ef4444',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Connecting arrows
        {
          id: 'arrow-1',
          tool: 'arrow',
          x1: 250,
          y1: 100,
          x2: 250,
          y2: 150,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-2',
          tool: 'arrow',
          x1: 250,
          y1: 200,
          x2: 250,
          y2: 250,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-3',
          tool: 'arrow',
          x1: 325,
          y1: 290,
          x2: 400,
          y2: 275,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-4',
          tool: 'arrow',
          x1: 500,
          y1: 250,
          x2: 500,
          y2: 200,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-5',
          tool: 'arrow',
          x1: 450,
          y1: 200,
          x2: 350,
          y2: 175,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-6',
          tool: 'arrow',
          x1: 250,
          y1: 330,
          x2: 250,
          y2: 380,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-7',
          tool: 'arrow',
          x1: 250,
          y1: 430,
          x2: 250,
          y2: 480,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-8',
          tool: 'arrow',
          x1: 250,
          y1: 530,
          x2: 250,
          y2: 580,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Labels
        {
          id: 'label-yes',
          tool: 'text',
          x1: 260,
          y1: 350,
          x2: 300,
          y2: 370,
          text: 'YES',
          strokeWidth: 1,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'label-no',
          tool: 'text',
          x1: 340,
          y1: 260,
          x2: 380,
          y2: 280,
          text: 'NO',
          strokeWidth: 1,
          strokeColor: '#ef4444',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        }
      ],
      
      mindmap: [
        {
          id: 'center-1',
          tool: 'circle',
          x1: 300,
          y1: 250,
          x2: 500,
          y2: 320,
          text: prompt.slice(0, 25) || 'Central Topic',
          strokeWidth: 3,
          strokeColor: '#8b5cf6',
          strokeStyle: 'solid',
          fill: '#8b5cf6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Main branches
        {
          id: 'branch-1',
          tool: 'rectangle',
          x1: 100,
          y1: 100,
          x2: 250,
          y2: 150,
          text: 'Key Concept 1',
          strokeWidth: 2,
          strokeColor: '#06b6d4',
          strokeStyle: 'solid',
          fill: '#06b6d4',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'branch-2',
          tool: 'rectangle',
          x1: 550,
          y1: 100,
          x2: 700,
          y2: 150,
          text: 'Key Concept 2',
          strokeWidth: 2,
          strokeColor: '#f59e0b',
          strokeStyle: 'solid',
          fill: '#f59e0b',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'branch-3',
          tool: 'rectangle',
          x1: 100,
          y1: 400,
          x2: 250,
          y2: 450,
          text: 'Key Concept 3',
          strokeWidth: 2,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: '#10b981',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'branch-4',
          tool: 'rectangle',
          x1: 550,
          y1: 400,
          x2: 700,
          y2: 450,
          text: 'Key Concept 4',
          strokeWidth: 2,
          strokeColor: '#ef4444',
          strokeStyle: 'solid',
          fill: '#ef4444',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Sub-branches
        {
          id: 'sub-1',
          tool: 'circle',
          x1: 50,
          y1: 50,
          x2: 150,
          y2: 90,
          text: 'Detail A',
          strokeWidth: 2,
          strokeColor: '#06b6d4',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'sub-2',
          tool: 'circle',
          x1: 50,
          y1: 160,
          x2: 150,
          y2: 200,
          text: 'Detail B',
          strokeWidth: 2,
          strokeColor: '#06b6d4',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'sub-3',
          tool: 'circle',
          x1: 720,
          y1: 50,
          x2: 820,
          y2: 90,
          text: 'Detail C',
          strokeWidth: 2,
          strokeColor: '#f59e0b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Connecting lines
        {
          id: 'line-1',
          tool: 'line',
          x1: 300,
          y1: 285,
          x2: 250,
          y2: 125,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-2',
          tool: 'line',
          x1: 500,
          y1: 285,
          x2: 550,
          y2: 125,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-3',
          tool: 'line',
          x1: 300,
          y1: 285,
          x2: 250,
          y2: 425,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-4',
          tool: 'line',
          x1: 500,
          y1: 285,
          x2: 550,
          y2: 425,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-5',
          tool: 'line',
          x1: 100,
          y1: 125,
          x2: 100,
          y2: 90,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-6',
          tool: 'line',
          x1: 100,
          y1: 150,
          x2: 100,
          y2: 180,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-7',
          tool: 'line',
          x1: 700,
          y1: 125,
          x2: 770,
          y2: 90,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        }
      ],
      
      process: [
        {
          id: 'step-1',
          tool: 'rectangle',
          x1: 50,
          y1: 200,
          x2: 200,
          y2: 250,
          text: 'Planning Phase',
          strokeWidth: 2,
          strokeColor: '#3b82f6',
          strokeStyle: 'solid',
          fill: '#3b82f6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'step-2',
          tool: 'rectangle',
          x1: 250,
          y1: 200,
          x2: 400,
          y2: 250,
          text: 'Design & Analysis',
          strokeWidth: 2,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: '#10b981',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'step-3',
          tool: 'rectangle',
          x1: 450,
          y1: 200,
          x2: 600,
          y2: 250,
          text: 'Development',
          strokeWidth: 2,
          strokeColor: '#f59e0b',
          strokeStyle: 'solid',
          fill: '#f59e0b',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'step-4',
          tool: 'rectangle',
          x1: 250,
          y1: 300,
          x2: 400,
          y2: 350,
          text: 'Testing Phase',
          strokeWidth: 2,
          strokeColor: '#8b5cf6',
          strokeStyle: 'solid',
          fill: '#8b5cf6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'step-5',
          tool: 'rectangle',
          x1: 450,
          y1: 300,
          x2: 600,
          y2: 350,
          text: 'Deployment',
          strokeWidth: 2,
          strokeColor: '#ef4444',
          strokeStyle: 'solid',
          fill: '#ef4444',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'step-6',
          tool: 'rectangle',
          x1: 250,
          y1: 400,
          x2: 400,
          y2: 450,
          text: 'Maintenance',
          strokeWidth: 2,
          strokeColor: '#06b6d4',
          strokeStyle: 'solid',
          fill: '#06b6d4',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Process flow arrows
        {
          id: 'arrow-1',
          tool: 'arrow',
          x1: 200,
          y1: 225,
          x2: 250,
          y2: 225,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-2',
          tool: 'arrow',
          x1: 400,
          y1: 225,
          x2: 450,
          y2: 225,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-3',
          tool: 'arrow',
          x1: 525,
          y1: 250,
          x2: 325,
          y2: 300,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-4',
          tool: 'arrow',
          x1: 400,
          y1: 325,
          x2: 450,
          y2: 325,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'arrow-5',
          tool: 'arrow',
          x1: 525,
          y1: 350,
          x2: 325,
          y2: 400,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Feedback loop
        {
          id: 'feedback-arrow',
          tool: 'arrow',
          x1: 250,
          y1: 325,
          x2: 125,
          y2: 250,
          strokeWidth: 2,
          strokeColor: '#ef4444',
          strokeStyle: 'dashed',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        }
      ],
      
      organization: [
        {
          id: 'ceo',
          tool: 'rectangle',
          x1: 300,
          y1: 50,
          x2: 500,
          y2: 100,
          text: 'CEO / President',
          strokeWidth: 2,
          strokeColor: '#8b5cf6',
          strokeStyle: 'solid',
          fill: '#8b5cf6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'cto',
          tool: 'rectangle',
          x1: 100,
          y1: 150,
          x2: 280,
          y2: 200,
          text: 'CTO',
          strokeWidth: 2,
          strokeColor: '#3b82f6',
          strokeStyle: 'solid',
          fill: '#3b82f6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'cmo',
          tool: 'rectangle',
          x1: 320,
          y1: 150,
          x2: 480,
          y2: 200,
          text: 'CMO',
          strokeWidth: 2,
          strokeColor: '#3b82f6',
          strokeStyle: 'solid',
          fill: '#3b82f6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'cfo',
          tool: 'rectangle',
          x1: 520,
          y1: 150,
          x2: 700,
          y2: 200,
          text: 'CFO',
          strokeWidth: 2,
          strokeColor: '#3b82f6',
          strokeStyle: 'solid',
          fill: '#3b82f6',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'dev-lead',
          tool: 'rectangle',
          x1: 50,
          y1: 250,
          x2: 200,
          y2: 300,
          text: 'Dev Lead',
          strokeWidth: 2,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: '#10b981',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'qa-lead',
          tool: 'rectangle',
          x1: 220,
          y1: 250,
          x2: 360,
          y2: 300,
          text: 'QA Lead',
          strokeWidth: 2,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: '#10b981',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'marketing-lead',
          tool: 'rectangle',
          x1: 380,
          y1: 250,
          x2: 520,
          y2: 300,
          text: 'Marketing Lead',
          strokeWidth: 2,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: '#10b981',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'finance-lead',
          tool: 'rectangle',
          x1: 540,
          y1: 250,
          x2: 680,
          y2: 300,
          text: 'Finance Lead',
          strokeWidth: 2,
          strokeColor: '#10b981',
          strokeStyle: 'solid',
          fill: '#10b981',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        // Reporting lines
        {
          id: 'line-ceo-cto',
          tool: 'line',
          x1: 350,
          y1: 100,
          x2: 190,
          y2: 150,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-ceo-cmo',
          tool: 'line',
          x1: 400,
          y1: 100,
          x2: 400,
          y2: 150,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-ceo-cfo',
          tool: 'line',
          x1: 450,
          y1: 100,
          x2: 610,
          y2: 150,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-cto-dev',
          tool: 'line',
          x1: 150,
          y1: 200,
          x2: 125,
          y2: 250,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-cto-qa',
          tool: 'line',
          x1: 220,
          y1: 200,
          x2: 290,
          y2: 250,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-cmo-marketing',
          tool: 'line',
          x1: 400,
          y1: 200,
          x2: 450,
          y2: 250,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        },
        {
          id: 'line-cfo-finance',
          tool: 'line',
          x1: 610,
          y1: 200,
          x2: 610,
          y2: 250,
          strokeWidth: 2,
          strokeColor: '#64748b',
          strokeStyle: 'solid',
          fill: 'transparent',
          opacity: 100,
          cornerStyle: 'rounded'
        }
      ]
    };

    return mockDiagrams[diagramType] || mockDiagrams.flowchart;
  }

  /**
   * Get mock response for testing/fallback (legacy method)
   * @param {string} prompt - User prompt
   * @param {string} diagramType - Diagram type
   * @returns {Array} Mock elements
   */
  getMockResponse(prompt, diagramType) {
    // Redirect to the new comprehensive method
    return this.getCompleteMockDiagram(prompt, diagramType);
  }

  /**
   * Generate content suggestions for sticky notes
   * @param {string} title - Sticky note title
   * @returns {Promise<Array>} Array of suggestion strings
   */
  async generateSuggestions(title) {
    if (!title || title.trim().length === 0) {
      return [];
    }

    if (!this.apiKey) {
      return this.getMockSuggestions(title);
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate 3 brief, actionable content suggestions for a sticky note titled "${title}". 
                     Each suggestion should be 1-2 sentences and practical.
                     Return as a JSON array of strings: ["suggestion 1", "suggestion 2", "suggestion 3"]`
            }]
          }]
        })
      });

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) return this.getMockSuggestions(title);

      const jsonMatch = content.match(/\[(.*)\]/s);
      if (jsonMatch) {
        const suggestions = JSON.parse(`[${jsonMatch[1]}]`);
        return Array.isArray(suggestions) ? suggestions.slice(0, 3) : this.getMockSuggestions(title);
      }

      return this.getMockSuggestions(title);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return this.getMockSuggestions(title);
    }
  }

  /**
   * Get mock suggestions for testing
   * @param {string} title - Note title
   * @returns {Array} Mock suggestions
   */
  getMockSuggestions(title) {
    const suggestions = [
      `Break down "${title}" into actionable steps`,
      `List key resources needed for "${title}"`,
      `Define success criteria for "${title}"`
    ];
    return suggestions;
  }
}

// Export singleton instance
export const aiService = new AIService();
