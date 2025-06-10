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
  }

  /**
   * Calculate optimal element size based on text content
   * @param {string} text - Text content
   * @param {string} tool - Element type
   * @returns {Object} Width and height
   */
  calculateElementSize(text, tool) {
    const baseWidth = 120;
    const baseHeight = 50;
    
    // Estimate text width (rough calculation)
    const textLength = text ? text.length : 0;
    const estimatedTextWidth = textLength * 8; // 8px per character approximation
    
    let width, height;
    
    switch (tool) {
      case 'rectangle':
        width = Math.max(baseWidth, estimatedTextWidth + 40);
        height = text && text.includes('\n') ? baseHeight + 20 : baseHeight;
        break;
      case 'circle':
        const diameter = Math.max(baseWidth, estimatedTextWidth + 60);
        width = height = diameter;
        break;
      case 'diamond':
        width = Math.max(150, estimatedTextWidth + 80);
        height = Math.max(80, width * 0.6);
        break;
      default:
        width = baseWidth;
        height = baseHeight;
    }
    
    return { width, height };
  }
  /**
   * Apply enhanced layout to generated elements
   * @param {Array} elements - Generated elements
   * @param {string} diagramType - Type of diagram
   * @param {string} layoutStyle - Layout style (symmetric, compact, spacious, creative)
   * @returns {Array} Elements with improved layout
   */  applyEnhancedLayout(elements, diagramType, layoutStyle = 'symmetric') {
    const canvas = { width: 1200, height: 800 };
    
    // Debug logging for layout style
    console.log('🎨 Layout Style Application:', {
      layoutStyle,
      diagramType,
      elementCount: elements.length
    });
    
    // Define layout parameters based on style
    const layoutParams = this.getLayoutParameters(layoutStyle);
    console.log('📐 Layout Parameters:', layoutParams);
      switch (diagramType) {
      case 'flowchart':
        return this.createFlowchartLayout(elements, canvas, layoutParams);
      case 'mindmap':
        return this.createMindmapLayout(elements, canvas, layoutParams);
      case 'organization':
        return this.createOrgChartLayout(elements, canvas, layoutParams);
      case 'process':
        return this.createProcessLayout(elements, canvas, layoutParams);
      default:
        return this.improveElementSpacing(elements, layoutParams);
    }
  }
  /**
   * Get layout parameters based on style selection
   * @param {string} layoutStyle - Layout style (symmetric, compact, spacious, creative)
   * @returns {Object} Layout parameters including margin and spacing
   */  getLayoutParameters(layoutStyle) {
    console.log('🎯 Getting layout parameters for style:', layoutStyle);
    
    switch (layoutStyle) {
      case 'compact':
        return {
          margin: 40,
          spacing: { x: 100, y: 80 },
          style: 'compact'
        };
      case 'spacious':
        return {
          margin: 120,
          spacing: { x: 220, y: 160 },
          style: 'spacious'
        };
      case 'creative':
        return {
          margin: 60 + Math.random() * 40, // 60-100px random margin
          spacing: { 
            x: 140 + Math.random() * 80,   // 140-220px random horizontal spacing
            y: 100 + Math.random() * 80    // 100-180px random vertical spacing
          },
          style: 'creative',
          offsetVariation: true,            // Add random offsets to elements
          colorVariation: true             // Use more varied colors
        };
      case 'symmetric':
      default:
        return {
          margin: 80,
          spacing: { x: 160, y: 120 },
          style: 'symmetric'
        };
    }
  }
  /**
   * Create flowchart layout with proper vertical flow
   */
  createFlowchartLayout(elements, canvas, layoutParams) {
    const processElements = elements.filter(el => ['rectangle', 'circle', 'diamond'].includes(el.tool));
    const connectionElements = elements.filter(el => ['arrow', 'line'].includes(el.tool));
    
    let currentY = layoutParams.margin;
    const centerX = canvas.width / 2;
    
    processElements.forEach((element, index) => {
      const size = this.calculateElementSize(element.text, element.tool);
      
      // Apply creative offset if specified
      let xOffset = 0;
      if (layoutParams.offsetVariation) {
        xOffset = (Math.random() - 0.5) * 60; // Random offset up to ±30px
      }
      
      element.x1 = centerX - size.width / 2 + xOffset;
      element.y1 = currentY;
      element.x2 = element.x1 + size.width;
      element.y2 = element.y1 + size.height;
      
      // Apply spacing variation for creative layout
      const spacingY = layoutParams.style === 'creative' 
        ? layoutParams.spacing.y + (Math.random() - 0.5) * 40
        : layoutParams.spacing.y;
      
      currentY += size.height + spacingY;
    });
    
    // Update connections to match new positions
    this.updateVerticalConnections(connectionElements, processElements);
    
    return [...processElements, ...connectionElements];
  }
  /**
   * Create radial mindmap layout
   */
  createMindmapLayout(elements, canvas, layoutParams) {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const centerElement = elements.find(el => el.id.includes('center') || el.id.includes('topic'));
    const branches = elements.filter(el => el.id.includes('branch') || (el.tool === 'rectangle' && el !== centerElement));
    const connections = elements.filter(el => ['line', 'arrow'].includes(el.tool));
    
    if (centerElement) {
      const centerSize = this.calculateElementSize(centerElement.text, centerElement.tool);
      centerElement.x1 = center.x - centerSize.width / 2;
      centerElement.y1 = center.y - centerSize.height / 2;
      centerElement.x2 = centerElement.x1 + centerSize.width;
      centerElement.y2 = centerElement.y1 + centerSize.height;
    }
    
    // Adjust radius based on layout style
    let radius = 250;
    if (layoutParams.style === 'compact') radius = 180;
    else if (layoutParams.style === 'spacious') radius = 320;
    else if (layoutParams.style === 'creative') radius = 200 + Math.random() * 120; // 200-320px
    
    const angleStep = (2 * Math.PI) / branches.length;
    
    branches.forEach((branch, index) => {
      let angle = index * angleStep;
      
      // Add random angle variation for creative layout
      if (layoutParams.style === 'creative') {
        angle += (Math.random() - 0.5) * 0.3; // ±0.15 radians variation
      }
      
      const size = this.calculateElementSize(branch.text, branch.tool);
      
      const x = center.x + Math.cos(angle) * radius - size.width / 2;
      const y = center.y + Math.sin(angle) * radius - size.height / 2;
      
      branch.x1 = x;
      branch.y1 = y;
      branch.x2 = x + size.width;
      branch.y2 = y + size.height;
    });
    
    this.updateRadialConnections(connections, centerElement, branches);
    
    return [centerElement, ...branches, ...connections].filter(Boolean);
  }
  /**
   * Create hierarchical organization chart layout
   */
  createOrgChartLayout(elements, canvas, layoutParams) {
    const processElements = elements.filter(el => ['rectangle', 'circle'].includes(el.tool));
    const connectionElements = elements.filter(el => ['arrow', 'line'].includes(el.tool));
    
    // Group into levels (simplified)
    const levels = [
      processElements.slice(0, 1), // CEO level
      processElements.slice(1, 4), // Manager level
      processElements.slice(4)     // Employee level
    ].filter(level => level.length > 0);
    
    let currentY = layoutParams.margin;
      levels.forEach((level, levelIndex) => {
      const baseSpacing = layoutParams.style === 'compact' ? 150 : 
                         layoutParams.style === 'spacious' ? 250 : 200;
      const totalWidth = level.length * baseSpacing + (level.length - 1) * layoutParams.spacing.x;
      let currentX = (canvas.width - totalWidth) / 2;
      
      level.forEach(element => {
        const size = this.calculateElementSize(element.text, element.tool);
        
        // Apply creative offset if specified
        let xOffset = 0;
        if (layoutParams.offsetVariation) {
          xOffset = (Math.random() - 0.5) * 40; // Random offset up to ±20px
        }
        
        element.x1 = currentX + xOffset;
        element.y1 = currentY;
        element.x2 = element.x1 + size.width;
        element.y2 = element.y1 + size.height;
        
        currentX += size.width + layoutParams.spacing.x;
      });
      
      currentY += 100 + layoutParams.spacing.y;
    });
    
    this.updateHierarchicalConnections(connectionElements, levels);
    
    return [...processElements, ...connectionElements];
  }
  /**
   * Create process layout with horizontal flow
   */
  createProcessLayout(elements, canvas, layoutParams) {
    const processElements = elements.filter(el => ['rectangle', 'circle'].includes(el.tool));
    const connectionElements = elements.filter(el => ['arrow', 'line'].includes(el.tool));
    
    let currentX = layoutParams.margin;
    const centerY = canvas.height / 2;
      processElements.forEach((element, index) => {
      const size = this.calculateElementSize(element.text, element.tool);
      
      // Apply creative offset if specified
      let yOffset = 0;
      if (layoutParams.offsetVariation) {
        yOffset = (Math.random() - 0.5) * 60; // Random offset up to ±30px
      }
      
      element.x1 = currentX;
      element.y1 = centerY - size.height / 2 + yOffset;
      element.x2 = element.x1 + size.width;
      element.y2 = element.y1 + size.height;
      
      // Apply spacing variation for creative layout
      const spacingX = layoutParams.style === 'creative' 
        ? layoutParams.spacing.x + (Math.random() - 0.5) * 40
        : layoutParams.spacing.x;
      
      currentX += size.width + spacingX;
    });
    
    this.updateHorizontalConnections(connectionElements, processElements);
    
    return [...processElements, ...connectionElements];
  }
  /**
   * Improve element spacing for default layouts
   */
  improveElementSpacing(elements, layoutParams) {
    const processElements = elements.filter(el => !['arrow', 'line'].includes(el.tool));
    
    processElements.forEach((element, index) => {
      const size = this.calculateElementSize(element.text, element.tool);
      
      // Update element size based on content
      element.x2 = element.x1 + size.width;
      element.y2 = element.y1 + size.height;
    });
    
    return elements;
  }

  /**
   * Update vertical connections between elements
   */
  updateVerticalConnections(connections, elements) {
    connections.forEach((connection, index) => {
      if (index < elements.length - 1) {
        const startElement = elements[index];
        const endElement = elements[index + 1];
        
        if (startElement && endElement) {
          connection.x1 = startElement.x1 + (startElement.x2 - startElement.x1) / 2;
          connection.y1 = startElement.y2;
          connection.x2 = endElement.x1 + (endElement.x2 - endElement.x1) / 2;
          connection.y2 = endElement.y1;
        }
      }
    });
  }

  /**
   * Update radial connections for mindmaps
   */
  updateRadialConnections(connections, centerElement, branches) {
    if (!centerElement) return;
    
    const centerX = centerElement.x1 + (centerElement.x2 - centerElement.x1) / 2;
    const centerY = centerElement.y1 + (centerElement.y2 - centerElement.y1) / 2;
    
    connections.forEach((connection, index) => {
      if (index < branches.length) {
        const branch = branches[index];
        const branchX = branch.x1 + (branch.x2 - branch.x1) / 2;
        const branchY = branch.y1 + (branch.y2 - branch.y1) / 2;
        
        connection.x1 = centerX;
        connection.y1 = centerY;
        connection.x2 = branchX;
        connection.y2 = branchY;
      }
    });
  }

  /**
   * Update hierarchical connections for org charts
   */
  updateHierarchicalConnections(connections, levels) {
    let connectionIndex = 0;
    
    for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex++) {
      const currentLevel = levels[levelIndex];
      const nextLevel = levels[levelIndex + 1];
      
      currentLevel.forEach(parent => {
        const parentX = parent.x1 + (parent.x2 - parent.x1) / 2;
        const parentY = parent.y2;
        
        // Connect to children (simplified - connects to all in next level)
        const childrenPerParent = Math.ceil(nextLevel.length / currentLevel.length);
        
        for (let i = 0; i < childrenPerParent && connectionIndex < connections.length; i++) {
          const childIndex = currentLevel.indexOf(parent) * childrenPerParent + i;
          if (childIndex < nextLevel.length) {
            const child = nextLevel[childIndex];
            const childX = child.x1 + (child.x2 - child.x1) / 2;
            const childY = child.y1;
            
            if (connections[connectionIndex]) {
              connections[connectionIndex].x1 = parentX;
              connections[connectionIndex].y1 = parentY;
              connections[connectionIndex].x2 = childX;
              connections[connectionIndex].y2 = childY;
              connectionIndex++;
            }
          }
        }
      });
    }
  }

  /**
   * Update horizontal connections for process flows
   */
  updateHorizontalConnections(connections, elements) {
    connections.forEach((connection, index) => {
      if (index < elements.length - 1) {
        const startElement = elements[index];
        const endElement = elements[index + 1];
        
        if (startElement && endElement) {
          connection.x1 = startElement.x2;
          connection.y1 = startElement.y1 + (startElement.y2 - startElement.y1) / 2;
          connection.x2 = endElement.x1;
          connection.y2 = endElement.y1 + (endElement.y2 - endElement.y1) / 2;
        }
      }
    });
  }

  /**
   * Generate complete connected diagrams from text prompt
   * @param {string} prompt - User description of the diagram
   * @param {string} diagramType - Type of diagram to generate
   * @returns {Promise<Array>} Array of connected elements compatible with Synthezy
   */  async generateDiagram(prompt, diagramType = 'flowchart', layoutStyle = 'symmetric') {
    // Input validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt provided');
    }    if (!this.apiKey) {
      const mockElements = this.getCompleteMockDiagram(prompt, diagramType);
      return this.applyEnhancedLayout(mockElements, diagramType, layoutStyle);
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
      }      const data = await response.json();
      const parsedElements = this.parseAIResponse(data, diagramType);
      
      // Apply enhanced layout to the generated elements
      return this.applyEnhancedLayout(parsedElements, diagramType, layoutStyle);
    } catch (error) {
      console.error('AI generation failed:', error);
        // Fallback to mock response with enhanced layout
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('Network error, using mock response');
        const mockElements = this.getCompleteMockDiagram(prompt, diagramType);
        return this.applyEnhancedLayout(mockElements, diagramType, layoutStyle);
      }
      
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
  /**
   * Get enhanced system prompt for specific diagram type
   * @param {string} diagramType - Type of diagram
   * @returns {string} Enhanced system prompt
   */  getEnhancedSystemPrompt(diagramType) {
    const basePrompt = `You are an AI assistant that generates beautiful, well-structured diagrams for the Synthezy whiteboard application.
    
    VISUAL DESIGN PRINCIPLES:
    - Create symmetric, balanced layouts with perfect alignment
    - Use consistent spacing and visual hierarchy
    - Size elements dynamically based on text content length
    - Apply meaningful color coding for different element types
    - Ensure proper visual flow and logical connections
    - Maintain professional appearance with clean lines
    
    SIZING GUIDELINES (Content-Aware):
    - Small text (< 15 chars): 120x50px rectangles
    - Medium text (15-30 chars): 160x50px rectangles  
    - Large text (> 30 chars): 200x60px rectangles
    - Circles: diameter = text width + 60px (minimum 100px)
    - Diamonds: width = text width + 80px (minimum 150px)
    - Adjust height for multi-line text (+20px per line)
    
    LAYOUT PRINCIPLES:
    - Center important elements on the canvas
    - Use consistent spacing: 120px vertical, 160px horizontal
    - Align all elements to an invisible grid
    - Create clear visual hierarchy with size and color
    - Balance elements symmetrically for pleasing composition
    
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
          "text": "meaningful display text (required for shapes)",
          "strokeWidth": 2,
          "strokeColor": "#color_hex",
          "strokeStyle": "solid",
          "fill": "#color_hex",
          "opacity": 100,
          "cornerStyle": "rounded"
        }
      ]
    }
    
    ELEMENT SPECIFICATIONS:
    - Use tool values: "rectangle", "circle", "diamond", "text", "arrow", "line"
    - Coordinates: x1,y1 is top-left, x2,y2 is bottom-right for shapes
    - For arrows/lines: x1,y1 is start point, x2,y2 is end point
    - For text elements: x1,y1 is position, x2,y2 should be x1+text_width,y1+30
    - Always include meaningful, specific text content (not generic labels)
    
    COLOR PALETTE & HIERARCHY:
    - Primary: #3b82f6 (blue) - Main processes
    - Success: #10b981 (green) - Start points, completions
    - Warning: #f59e0b (amber) - Decisions, important items
    - Danger: #ef4444 (red) - End points, critical items
    - Info: #8b5cf6 (purple) - Special categories
    - Accent: #06b6d4 (cyan) - Secondary processes
    - Connections: #64748b (gray) - All arrows and lines
    
    CONNECTION RULES:
    - Always include arrows or lines to connect related elements
    - Arrows should have 2px stroke width and #64748b color
    - Position arrows to connect element edges precisely
    - Create logical flow that guides the eye through the diagram
    - Position arrows to actually connect the edges of elements
    - For flowcharts: Use arrows between all sequential steps
    - For mind maps: Use lines from center to all branches
    - For processes: Connect all sequential steps with arrows`;    const typeSpecific = {
      flowchart: `Create a SYMMETRIC VERTICAL FLOWCHART:
      - Center all elements horizontally on the canvas (x-coordinate around 600)
      - Use consistent vertical spacing (120px between elements)
      - Size rectangles based on text content (120-250px wide)
      - Connect with straight vertical arrows between all sequential steps
      - Layout: Start (green circle) → Process (blue rectangles) → Decision (amber diamond) → End (red circle)
      - Arrange in perfect vertical alignment for professional appearance
      - Include 5-8 connected elements with meaningful, specific text`,
      
      mindmap: `Create a RADIAL MIND MAP with PERFECT SYMMETRY:
      - Place central topic in exact center of canvas (600, 400)
      - Arrange 4-6 main branches in perfect circle around center (250px radius)
      - Size elements proportionally to text content
      - Use straight lines connecting center to each branch
      - Color progression: Center (purple) → Primary branches (blue/cyan) → Sub-branches (green)
      - Add 2-3 sub-branches extending from main branches
      - Create balanced, symmetrical composition`,
      
      organization: `Create a BALANCED ORGANIZATION CHART:
      - Center CEO/President at top (600, 80)
      - Distribute 3-4 managers evenly below CEO (y=180)
      - Center 2-3 employees under each manager (y=280)
      - Use consistent horizontal spacing (200px between same-level elements)
      - Size boxes based on title length (150-250px wide)
      - Visual hierarchy: Executive (purple) → Manager (blue) → Employee (green)
      - Connect with clean vertical/horizontal lines showing reporting structure`,
      
      process: `Create a STREAMLINED PROCESS DIAGRAM:
      - Arrange 5-8 sequential steps horizontally or vertically
      - Use consistent spacing (160px between elements)
      - Size elements based on process description length
      - Alternate colors for visual interest: blue → cyan → green → amber
      - Connect each step with arrows showing process flow
      - Include meaningful process descriptions (not generic labels)
      - Optional: Add feedback loops with curved/dashed arrows`,
      
      timeline: `Create a CHRONOLOGICAL TIMELINE:
      - 5-7 event elements with specific dates
      - Horizontal timeline line or vertical progression
      - Consistent spacing between events (150px)
      - Size event boxes based on description length
      - Use alternating colors for visual rhythm
      - Include specific dates and detailed event descriptions
      - Connect with timeline line and event markers`,
      
      network: `Create a NETWORK TOPOLOGY DIAGRAM:
      - 6-10 node circles representing different system components
      - Logical arrangement showing network relationships
      - Size nodes based on importance/text content
      - Use different colors for different node types
      - Connect related nodes with lines showing data flow
      - Create balanced layout with central hub or distributed topology
      - Label connections with protocols or data types`,
      
      system: `Create a SYSTEM ARCHITECTURE DIAGRAM:
      - Multiple layers: Presentation → Logic → Data
      - Rectangle components sized by complexity
      - Clear separation between architectural layers
      - Use color coding: Frontend (blue), Backend (green), Database (purple)
      - Show data flow with arrows between components
      - Include load balancers, APIs, databases
      - Professional technical diagram appearance`
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
