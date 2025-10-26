// The modal helpers are intentionally framework-free so they can be reused across
// the static prototypes. Keeping the code vanilla JS makes it easier to embed in
// any HTML page that shares the sidebar navigation.

document.addEventListener('DOMContentLoaded', () => {
  initializeTestCaseModal();
});

/**
 * initializeTestCaseModal wires the reusable slide-in panel for creating manual
 * test cases. It attaches open/close handlers, manages tab systems, hydrates the
 * multi-select dropdowns, and keeps the UI state accessible for keyboard users.
 */
function initializeTestCaseModal() {
  const modal = document.getElementById('testCaseModal');
  if (!modal) {
    return;
  }

  const activeClass = 'modal-active';
  const bodyScrollClass = 'overflow-hidden';
  const openTriggers = document.querySelectorAll('[data-modal-trigger="test-case"]');
  const closeButtons = modal.querySelectorAll('[data-modal-dismiss]');
  const overlay = modal.querySelector('[data-modal-overlay]');
  const firstField = modal.querySelector('[data-modal-initial-focus]');
  const scrollRegion = modal.querySelector('[data-modal-tab-panels]');

  const tabGroups = ['primary', 'platform']
    .map((groupName) => initializeModalTabGroup(modal, groupName))
    .filter(Boolean);

  const multiSelectControllers = Array.from(modal.querySelectorAll('[data-multi-select]'))
    .map((widget) => initializeModalMultiSelect(widget))
    .filter(Boolean);

  const refreshTextareaHeights = initializeAutoGrowTextareas(modal);
  const refreshActionPreview = initializeActionPreview(modal);

  const openModal = (event) => {
    if (event) {
      event.preventDefault();
    }
    modal.classList.add(activeClass);
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add(bodyScrollClass);

    tabGroups.forEach((group) => group.reset());
    multiSelectControllers.forEach((controller) => controller.refresh());
    refreshTextareaHeights();
    refreshActionPreview();

    window.requestAnimationFrame(() => {
      tabGroups.forEach((group) => group.moveIndicator());
      if (firstField) {
        firstField.focus();
      }
    });
  };

  const closeModal = () => {
    modal.classList.remove(activeClass);
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove(bodyScrollClass);
    if (scrollRegion) {
      scrollRegion.scrollTop = 0;
    }
  };

  openTriggers.forEach((trigger) => {
    trigger.addEventListener('click', openModal);
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains(activeClass)) {
      closeModal();
    }
  });

  window.addEventListener('resize', () => {
    if (modal.classList.contains(activeClass)) {
      tabGroups.forEach((group) => group.moveIndicator());
    }
  });
}

/**
 * Positions the animated indicator underneath the active modal tab trigger.
 */
function moveModalTabIndicator(indicator, wrapper, activeButton) {
  if (!indicator || !wrapper || !activeButton) {
    return;
  }

  const wrapperRect = wrapper.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  const translateX = buttonRect.left - wrapperRect.left;

  indicator.style.width = `${buttonRect.width}px`;
  indicator.style.transform = `translateX(${translateX}px)`;
  indicator.style.opacity = '1';
}

/**
 * Sets up a modal-specific tab group (primary definition/platform/options tabs
 * or the nested application-type tabs). The helper returns callbacks so the
 * parent modal can reset state every time it opens.
 */
function initializeModalTabGroup(modal, groupName) {
  const wrapper = modal.querySelector(`[data-modal-tab-wrapper="${groupName}"]`);
  const indicator = modal.querySelector(`[data-modal-tab-indicator="${groupName}"]`);
  const buttons = Array.from(
    modal.querySelectorAll(`[data-modal-tab-group="${groupName}"][data-modal-tab-target]`)
  );
  const panels = Array.from(
    modal.querySelectorAll(`[data-modal-tab-group="${groupName}"][data-modal-tab-section]`)
  );

  if (!buttons.length || !panels.length) {
    return null;
  }

  if (wrapper) {
    wrapper.setAttribute('role', 'tablist');
  }

  const defaultButton = buttons.find((button) => button.hasAttribute('data-modal-tab-default')) || buttons[0];
  const defaultTarget = defaultButton.dataset.modalTabTarget;

  const activate = (targetName) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.modalTabTarget === targetName;
      button.setAttribute('aria-selected', String(isActive));
      button.classList.toggle('font-semibold', isActive);
      button.classList.toggle('text-gray-500', !isActive);
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.modalTabSection === targetName;
      panel.classList.toggle('hidden', !isActive);
      panel.setAttribute('aria-hidden', String(!isActive));
    });

    const activeButton = buttons.find((button) => button.dataset.modalTabTarget === targetName);
    if (indicator && activeButton) {
      window.requestAnimationFrame(() =>
        moveModalTabIndicator(indicator, wrapper || activeButton.offsetParent, activeButton)
      );
    }
  };

  buttons.forEach((button) => {
    if (!button.hasAttribute('type')) {
      button.setAttribute('type', 'button');
    }
    button.setAttribute('role', 'tab');
    const controlledId = `${groupName}-panel-${button.dataset.modalTabTarget}`;
    button.setAttribute('aria-controls', controlledId);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      activate(button.dataset.modalTabTarget);
    });
  });

  panels.forEach((panel) => {
    panel.setAttribute('role', 'tabpanel');
    if (!panel.id) {
      panel.id = `${groupName}-panel-${panel.dataset.modalTabSection}`;
    }
  });

  activate(defaultTarget);

  return {
    reset: () => activate(defaultTarget),
    moveIndicator: () => {
      const activeButton = buttons.find((button) => button.getAttribute('aria-selected') === 'true');
      if (indicator && activeButton) {
        moveModalTabIndicator(indicator, wrapper || activeButton.offsetParent, activeButton);
      }
    },
  };
}

/**
 * Converts declarative checkbox dropdown markup into a select-like multi choice
 * control. The returned controller exposes a refresh method so the modal can
 * keep the summary text in sync when the panel reopens.
 */
function initializeModalMultiSelect(widget) {
  const trigger = widget.querySelector('[data-multi-select-trigger]');
  const panel = widget.querySelector('[data-multi-select-panel]');
  const summary = widget.querySelector('[data-multi-select-summary]');
  const input = widget.querySelector('[data-multi-select-input]');
  const options = Array.from(widget.querySelectorAll('[data-multi-select-option]'));
  const placeholder = widget.getAttribute('data-multi-select-placeholder') || 'Select options';

  if (!trigger || !panel || !summary || !input || !options.length) {
    return null;
  }

  const closePanel = () => {
    panel.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  };

  const openPanel = () => {
    panel.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
  };

  const updateSummary = () => {
    const checkedValues = options
      .filter((option) => option.checked)
      .map((option) => option.value.trim())
      .filter(Boolean);
    summary.textContent = checkedValues.length ? checkedValues.join(', ') : placeholder;
    input.value = checkedValues.join(',');
  };

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (panel.classList.contains('hidden')) {
      openPanel();
    } else {
      closePanel();
    }
  });

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  options.forEach((option) => {
    option.addEventListener('change', updateSummary);
  });

  document.addEventListener('click', (event) => {
    if (!widget.contains(event.target)) {
      closePanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.classList.contains('hidden')) {
      closePanel();
      trigger.focus();
    }
  });

  updateSummary();

  return {
    refresh: updateSummary,
  };
}

/**
 * Auto-expands textarea fields so multi-line instructions never hide behind a
 * scrollbar, matching the expectation that long manual steps remain visible.
 */
function initializeAutoGrowTextareas(modal) {
  const textareas = Array.from(modal.querySelectorAll('textarea[data-autogrow]'));

  const refresh = () => {
    textareas.forEach((textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  };

  textareas.forEach((textarea) => {
    textarea.addEventListener('input', refresh);
  });

  refresh();

  return refresh;
}

/**
 * Keeps the generated test case title in sync with the Action field so the modal
 * preview reflects the future card heading in real time.
 */
function initializeActionPreview(modal) {
  const sourceField = modal.querySelector('[data-action-source]');
  const preview = modal.querySelector('[data-action-preview]');
  if (!sourceField || !preview) {
    return () => {};
  }

  const fallback = preview.getAttribute('data-default-preview') || preview.textContent || 'Untitled test case';

  const update = () => {
    const nextValue = sourceField.value.trim();
    preview.textContent = nextValue || fallback;
  };

  sourceField.addEventListener('input', update);
  sourceField.addEventListener('change', update);

  update();

  return update;
}
