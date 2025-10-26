/**
 * API client for test case operations
 */

const API_BASE_URL = 'http://localhost:5432/api'; // Adjust port if needed

class TestCaseAPI {
  /**
   * Create a new test case
   * @param {Object} testCaseData - Test case data from form
   * @returns {Promise<Object>} Created test case
   */
  static async createTestCase(testCaseData) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${testCaseData.project_id}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCaseData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating test case:', error);
      throw error;
    }
  }

  /**
   * Get all test cases for a project
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} List of test cases
   */
  static async getTestCases(projectId = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/cases?active_only=false`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.cases || [];
    } catch (error) {
      console.error('Error fetching test cases:', error);
      throw error;
    }
  }

  /**
   * Update test case status
   * @param {number} caseId - Test case ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated test case
   */
  static async updateTestCaseStatus(caseId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ execution_status: status })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating test case:', error);
      throw error;
    }
  }

  /**
   * Delete a test case
   * @param {number} caseId - Test case ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteTestCase(caseId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting test case:', error);
      throw error;
    }
  }
}
