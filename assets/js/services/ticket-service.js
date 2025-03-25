/**
 * Ticket Service
 * Handles all ticket-related API operations
 */

const TicketService = {
  /**
   * Get all ticket categories
   * @returns {Promise} Promise with ticket categories
   */
  async getCategories() {
    try {
      return await ApiService.get('/ticket/ticket-category');
    } catch (error) {
      console.error('Error fetching ticket categories:', error);
      throw error;
    }
  },
  
  /**
   * Get all ticket forms with categories
   * @returns {Promise} Promise with ticket forms
   */
  async getFormsWithCategories() {
    try {
      const response = await ApiService.get('/ticket/ticket-forms-with-categories');
      console.log('Raw forms with categories response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object') {
        // Check if the response has a data property that's an array
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        
        // Check other common properties that might contain the forms array
        const possibleArrayProps = ['forms', 'results', 'items'];
        for (const prop of possibleArrayProps) {
          if (response[prop] && Array.isArray(response[prop])) {
            return response[prop];
          }
        }
      }
      
      // If we couldn't find an array, return an empty array
      console.warn('Could not find forms array in response:', response);
      return [];
    } catch (error) {
      console.error('Error fetching ticket forms with categories:', error);
      throw error;
    }
  },
  
  /**
   * Get all ticket forms
   * @returns {Promise} Promise with ticket forms
   */
  async getForms() {
    try {
      const response = await ApiService.get('/ticket/ticket-form');
      console.log('Raw forms response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object') {
        // Check if the response has a data property that's an array
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        
        // Check other common properties that might contain the forms array
        const possibleArrayProps = ['forms', 'results', 'items'];
        for (const prop of possibleArrayProps) {
          if (response[prop] && Array.isArray(response[prop])) {
            return response[prop];
          }
        }
      }
      
      // If we couldn't find an array, return an empty array
      console.warn('Could not find forms array in response:', response);
      return [];
    } catch (error) {
      console.error('Error fetching ticket forms:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific ticket form
   * @param {string|number} formId - The form ID
   * @returns {Promise} Promise with ticket form details
   */
  async getForm(formId) {
    try {
      return await ApiService.get(`/ticket/ticket-form/${formId}`);
    } catch (error) {
      console.error(`Error fetching ticket form ${formId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get all ticket statuses
   * @returns {Promise} Promise with ticket statuses
   */
  async getStatuses() {
    try {
      return await ApiService.get('/ticket/ticket-status');
    } catch (error) {
      console.error('Error fetching ticket statuses:', error);
      throw error;
    }
  },
  
  /**
   * Get all ticket entries (user's tickets)
   * @returns {Promise} Promise with ticket entries
   */
  async getTickets() {
    try {
      return await ApiService.get('/ticket/ticket-entry');
    } catch (error) {
      console.error('Error fetching ticket entries:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific ticket entry
   * @param {string|number} ticketId - The ticket ID
   * @returns {Promise} Promise with ticket entry details
   */
  async getTicket(ticketId) {
    try {
      return await ApiService.get(`/ticket/ticket-entry/${ticketId}`);
    } catch (error) {
      console.error(`Error fetching ticket entry ${ticketId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new ticket
   * @param {Object} ticketData - The ticket data
   * @returns {Promise} Promise with created ticket
   */
  async createTicket(ticketData) {
    try {
      return await ApiService.post('/ticket/ticket-entry', ticketData);
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },
  
  /**
   * Update a ticket
   * @param {string|number} ticketId - The ticket ID
   * @param {Object} ticketData - The ticket data
   * @returns {Promise} Promise with updated ticket
   */
  async updateTicket(ticketId, ticketData) {
    try {
      return await ApiService.patch(`/ticket/ticket-entry/${ticketId}`, ticketData);
    } catch (error) {
      console.error(`Error updating ticket ${ticketId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a ticket
   * @param {string|number} ticketId - The ticket ID
   * @returns {Promise} Promise with deletion result
   */
  async deleteTicket(ticketId) {
    try {
      return await ApiService.delete(`/ticket/ticket-entry/${ticketId}`);
    } catch (error) {
      console.error(`Error deleting ticket ${ticketId}:`, error);
      throw error;
    }
  },
  
  /**
   * Add a comment to a ticket
   * @param {Object} commentData - The comment data
   * @returns {Promise} Promise with created comment
   */
  async addComment(commentData) {
    try {
      return await ApiService.post('/ticket/comment', commentData);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  
  /**
   * Get comments for a ticket
   * @param {string|number} ticketId - The ticket ID
   * @returns {Promise} Promise with ticket comments
   */
  async getComments(ticketId) {
    try {
      return await ApiService.get(`/ticket/comments/${ticketId}`);
    } catch (error) {
      console.error(`Error fetching comments for ticket ${ticketId}:`, error);
      throw error;
    }
  }
};