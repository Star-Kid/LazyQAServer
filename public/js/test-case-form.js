/**
 * Test Case Form Handler
 * Handles form submission and test case creation
 */

class TestCaseForm {
  constructor() {
    this.form = null;
    this.currentProjectId = 1; // Default project ID
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Find the "Create test case" button in the modal
    const createButton = document.querySelector('#testCaseModal button[type="button"].bg-blue-600');
    
    if (createButton) {
      createButton.addEventListener('click', (e) => this.handleCreateTestCase(e));
    }

    // Load existing test cases when page loads
    this.loadTestCases();
  }

  /**
   * Handle create test case button click
   */
  async handleCreateTestCase(event) {
    event.preventDefault();

    try {
      // Get form values
      const formData = this.getFormData();
      
      // Validate form
      if (!this.validateForm(formData)) {
        this.showError('Please fill in the test description');
        return;
      }

      // Show loading state
      this.setLoadingState(true);

      // Create test case via API
      const testCase = await TestCaseAPI.createTestCase(formData);

      // Add to UI
      this.addTestCaseToBoard(testCase);

      // Close modal
      this.closeModal();

      // Show success message
      this.showSuccess('Test case created successfully!');

      // Reset form
      this.resetForm();

    } catch (error) {
      console.error('Error creating test case:', error);
      this.showError('Failed to create test case: ' + error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Get form data from modal inputs
   */
  getFormData() {
    const description = document.getElementById('manualTestDescription')?.value || '';
    const testType = document.getElementById('manualTestType')?.value || '';
    const owner = document.getElementById('manualTestOwner')?.value || '';
    const dueDate = document.getElementById('manualTestDue')?.value || '';

    // Get active application type
    const activeTab = document.querySelector('.tab-trigger.is-active')?.dataset.tabTarget || 'web';
    
    let appType = '';
    if (activeTab === 'web') {
      appType = document.getElementById('manualTestBrowser')?.value || 'Google Chrome';
    } else if (activeTab === 'desktop') {
      appType = document.getElementById('manualTestDesktop')?.value || 'Windows 11';
    } else if (activeTab === 'mobile') {
      appType = document.getElementById('manualTestMobile')?.value || 'iOS';
    }

    // Map form data to API schema
    return {
      project_id: this.currentProjectId,
      description: description,
      is_active: true,
      machine_ip: '127.0.0.1', // Default for now
      name: description.substring(0, 100), // Legacy compatibility
      prompt: `Test Type: ${testType}\nApp: ${appType}\nOwner: ${owner}\nDue: ${dueDate}`, // Legacy
      // Store metadata in the prompt field as JSON for now
      metadata: {
        test_type: testType,
        app_type: appType,
        app_category: activeTab,
        owner: owner,
        due_date: dueDate,
        priority: this.inferPriority(testType),
        created_from: 'web_ui'
      }
    };
  }

  /**
   * Infer priority from test type
   */
  inferPriority(testType) {
    const priorityMap = {
      'Penetration testing': 'Critical',
      'Business logic validation': 'High',
      'Cross-browser compatibility': 'Medium',
      'Frontend bug detection': 'Medium'
    };
    return priorityMap[testType] || 'Medium';
  }

  /**
   * Validate form data
   */
  validateForm(formData) {
    if (!formData.description || formData.description.trim() === '') {
      return false;
    }
    return true;
  }

  /**
   * Add test case card to the board
   */
  addTestCaseToBoard(testCase) {
    const recentCasesSection = document.querySelector('section[aria-labelledby="recent-cases-heading"]');
    
    if (!recentCasesSection) {
      console.error('Recent cases section not found');
      return;
    }

    // Create test case card HTML
    const testCaseCard = this.createTestCaseCard(testCase);

    // Find the container div that holds all test case cards
    const cardsContainer = recentCasesSection.querySelector('.space-y-3');
    
    if (cardsContainer) {
      // Insert at the beginning of the container
      cardsContainer.insertBefore(testCaseCard, cardsContainer.firstChild);
    } else {
      // Fallback: insert after the header
      const headerDiv = recentCasesSection.querySelector('.flex.items-center');
      if (headerDiv) {
        headerDiv.insertAdjacentElement('afterend', testCaseCard);
      }
    }

    // Add click handler for navigation
    testCaseCard.addEventListener('click', () => {
      window.location.href = `test-case-details.html?id=${testCase.id}`;
    });

    // Animate in
    setTimeout(() => {
      testCaseCard.style.opacity = '1';
      testCaseCard.style.transform = 'translateY(0)';
    }, 10);
  }

  /**
   * Create test case card HTML element
   */
  createTestCaseCard(testCase) {
    const article = document.createElement('article');
    article.className = 'flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm shadow transition hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
    article.setAttribute('data-test-case-id', testCase.id);
    article.setAttribute('role', 'link');
    article.setAttribute('tabindex', '0');
    article.style.opacity = '0';
    article.style.transform = 'translateY(-10px)';
    article.style.transition = 'all 0.3s ease';

    // Parse metadata from prompt if available
    let metadata = {};
    try {
      if (testCase.prompt && testCase.prompt.includes('Test Type:')) {
        const lines = testCase.prompt.split('\n');
        metadata.test_type = lines[0]?.split(': ')[1] || 'Manual test';
        metadata.app_type = lines[1]?.split(': ')[1] || 'Not specified';
        metadata.owner = lines[2]?.split(': ')[1] || 'Unassigned';
        metadata.priority = this.inferPriority(metadata.test_type);
      }
    } catch (e) {
      console.error('Error parsing metadata:', e);
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Map execution status to display status
    const statusMap = {
      'pending': { label: 'Pending', color: 'blue' },
      'running': { label: 'Running', color: 'yellow' },
      'completed': { label: 'Passed', color: 'green' },
      'failed': { label: 'Failed', color: 'red' }
    };
    const status = statusMap[testCase.execution_status] || statusMap['pending'];

    article.innerHTML = `
      <div class="pl-1">
        <h3 class="text-[15px] font-medium text-slate-900">${this.escapeHtml(testCase.description)}</h3>
        <p class="mt-1 text-slate-600">${this.escapeHtml(metadata.test_type || 'Manual test')}</p>
        <dl class="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div class="flex items-center gap-1">
            <dt class="sr-only">Last updated</dt>
            <dd class="text-slate-400">Created: ${formattedDate}</dd>
          </div>
          <div class="flex items-center gap-1 font-medium text-slate-700">
            <dt class="sr-only">Run count</dt>
            <dd>Run 0×</dd>
          </div>
          <div class="flex items-center gap-1">
            <dt class="sr-only">Agent</dt>
            <dd class="inline-flex items-center gap-1">
              <span class="text-slate-400">${this.getAppIcon(metadata.app_type)}</span>
              <span>${this.escapeHtml(metadata.app_type || 'Not specified')}</span>
            </dd>
          </div>
        </dl>
      </div>
      <div class="text-right">
        <div class="mb-2 flex items-center justify-end gap-2">
          <span class="rounded px-3 py-1 text-xs font-semibold text-${status.color}-800 bg-${status.color}-100">${status.label}</span>
          <span class="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">
            <span class="text-slate-400">⏱</span>
            <span>—</span>
          </span>
        </div>
        <p class="text-sm font-medium text-slate-900">${this.escapeHtml(metadata.owner || 'Unassigned')}</p>
        <p class="text-xs text-slate-500">Priority: ${this.escapeHtml(metadata.priority || 'Medium')}</p>
      </div>
    `;

    return article;
  }

  /**
   * Get icon for app type
   */
  getAppIcon(appType) {
    if (!appType) return '🧪';
    
    const appTypeLower = appType.toLowerCase();
    
    if (appTypeLower.includes('chrome') || appTypeLower.includes('browser')) return '🌐';
    if (appTypeLower.includes('windows') || appTypeLower.includes('mac') || appTypeLower.includes('linux')) return '💻';
    if (appTypeLower.includes('ios') || appTypeLower.includes('android') || appTypeLower.includes('mobile')) return '📱';
    
    return '🧪';
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Load existing test cases from API
   */
  async loadTestCases() {
    try {
      const result = await TestCaseAPI.getTestCases(this.currentProjectId);
      console.log(`Loaded ${result.length} test cases from database`);
      
      // Optionally refresh the board with real data from DB
      // You can uncomment this to replace static data with DB data
      // this.renderTestCases(result);
    } catch (error) {
      console.error('Error loading test cases:', error);
      console.log('Will use static test cases from HTML');
    }
  }

  /**
   * Close the modal
   */
  closeModal() {
    const modal = document.getElementById('testCaseModal');
    const dismissButton = modal?.querySelector('[data-modal-dismiss]');
    
    if (dismissButton) {
      dismissButton.click();
    } else {
      // Fallback: hide modal manually
      modal?.setAttribute('aria-hidden', 'true');
      modal?.classList.remove('is-visible');
    }
  }

  /**
   * Reset form fields
   */
  resetForm() {
    const descInput = document.getElementById('manualTestDescription');
    const typeSelect = document.getElementById('manualTestType');
    const ownerInput = document.getElementById('manualTestOwner');
    const dueInput = document.getElementById('manualTestDue');
    
    if (descInput) descInput.value = '';
    if (typeSelect) typeSelect.value = 'All';
    if (ownerInput) ownerInput.value = '';
    if (dueInput) dueInput.value = '';
  }

  /**
   * Set loading state on create button
   */
  setLoadingState(isLoading) {
    const createButton = document.querySelector('#testCaseModal button[type="button"].bg-blue-600');
    
    if (createButton) {
      if (isLoading) {
        createButton.disabled = true;
        createButton.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Creating...';
        createButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        createButton.disabled = false;
        createButton.textContent = 'Create test case';
        createButton.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification toast
   */
  showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all duration-300 transform translate-x-full`;
    
    if (type === 'success') {
      toast.classList.add('bg-green-500');
      toast.innerHTML = `<span class="mr-2">✓</span>${message}`;
    } else if (type === 'error') {
      toast.classList.add('bg-red-500');
      toast.innerHTML = `<span class="mr-2">✕</span>${message}`;
    } else {
      toast.classList.add('bg-blue-500');
      toast.innerHTML = message;
    }

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is ready
new TestCaseForm();
