import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

class DrawingService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/drawings`;
  }

  // Save or update drawing data
  async saveDrawing(sessionId, data) {
    try {
      const response = await axios.post(`${this.baseURL}/${sessionId}`, {
        data: data
      });
      
      if (response.data.success) {
        return response.data.data.drawing;
      } else {
        throw new Error(response.data.message || 'Failed to save drawing');
      }
    } catch (error) {
      console.error('Save drawing error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to save drawing'
      );
    }
  }

  // Retrieve existing drawing for a session
  async getDrawing(sessionId) {
    try {
      const response = await axios.get(`${this.baseURL}/${sessionId}`);
      
      if (response.data.success) {
        return response.data.data.drawing;
      } else {
        throw new Error(response.data.message || 'Failed to load drawing');
      }
    } catch (error) {
      // If drawing doesn't exist (404), return null instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      
      console.error('Get drawing error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to load drawing'
      );
    }
  }

  // Get all drawings for the current user
  async getUserDrawings(page = 1, limit = 10) {
    try {
      const response = await axios.get(`${this.baseURL}?page=${page}&limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to load drawings');
      }
    } catch (error) {
      console.error('Get user drawings error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to load drawings'
      );
    }
  }

  // Delete a drawing (only owner can delete)
  async deleteDrawing(sessionId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${sessionId}`);
      
      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete drawing');
      }
    } catch (error) {
      console.error('Delete drawing error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete drawing'
      );
    }
  }

  // Create a new drawing session for an authenticated user
  async createNewSession(title = 'Untitled Drawing') {
    try {
      // Generate a unique session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save empty drawing to create the session
      const drawing = await this.saveDrawing(sessionId, []);
      
      // Update metadata if provided
      if (title !== 'Untitled Drawing') {
        drawing.metadata = { ...drawing.metadata, title };
      }
      
      return {
        sessionId,
        ...drawing
      };
    } catch (error) {
      console.error('Create session error:', error);
      throw new Error('Failed to create new drawing session');
    }
  }

  // Throttled save function to prevent excessive API calls
  createThrottledSave(delay = 2000) {
    let timeoutId = null;
    let lastSavePromise = Promise.resolve();

    return (sessionId, data) => {
      // Clear any pending save
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Return a promise that resolves when the save actually happens
      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            // Wait for any previous save to complete
            await lastSavePromise;
            
            // Perform the save
            lastSavePromise = this.saveDrawing(sessionId, data);
            const result = await lastSavePromise;
            
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  }

  // Auto-save functionality with exponential backoff on errors
  createAutoSave(sessionId, onError = null) {
    const throttledSave = this.createThrottledSave(1500); // Save every 1.5 seconds
    let retryCount = 0;
    const maxRetries = 3;

    return async (data) => {
      try {
        await throttledSave(sessionId, data);
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Exponential backoff: wait 2^retryCount seconds before next attempt
          const delay = Math.pow(2, retryCount) * 1000;
          console.warn(`Auto-save failed, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          
          setTimeout(() => {
            this.createAutoSave(sessionId, onError)(data);
          }, delay);
        } else {
          console.error('Auto-save failed after maximum retries:', error);
          if (onError) {
            onError(error);
          }
        }
      }
    };
  }
}

// Export singleton instance
export const drawingService = new DrawingService();
export default drawingService;
