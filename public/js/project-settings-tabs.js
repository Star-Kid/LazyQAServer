/**
 * Applies Tailwind classes and indicator positioning for tab groups that share
 * the declarative data attributes on the project settings page.
 */
function moveTabIndicator(indicator, wrapper, activeButton) {
  if (!indicator || !activeButton) {
    return;
  }

  const reference = wrapper || activeButton.offsetParent;
  if (!reference) {
    return;
  }

  const referenceRect = reference.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  const translateX = buttonRect.left - referenceRect.left;

  indicator.style.width = `${buttonRect.width}px`;
  indicator.style.transform = `translateX(${translateX}px)`;
  indicator.style.opacity = "1";
}

/**
 * Sets up an interactive tab group by wiring active classes, hidden panels, and
 * the animated indicator that glides between triggers.
 */
function initializeTabGroup(groupName) {
  const wrapper = document.querySelector(`[data-tab-wrapper="${groupName}"]`);
  const indicator = document.querySelector(`[data-tab-indicator="${groupName}"]`);
  const buttons = Array.from(
    document.querySelectorAll(`[data-tab-target][data-tab-group="${groupName}"]`)
  );
  const panels = Array.from(
    document.querySelectorAll(`[data-tab-panel][data-tab-group="${groupName}"]`)
  );

  if (!buttons.length || !panels.length) {
    return null;
  }

  const activate = (targetName) => {
    buttons.forEach((button) => {
      button.classList.remove("text-blue-600", "font-semibold");
      button.classList.add("text-gray-500");
      button.setAttribute("aria-selected", "false");
    });

    panels.forEach((panel) => {
      panel.classList.add("hidden");
    });

    const activeButton = buttons.find((button) => button.dataset.tabTarget === targetName);
    const activePanel = panels.find((panel) => panel.dataset.tabSection === targetName);

    if (!activeButton || !activePanel) {
      return;
    }

    activeButton.classList.remove("text-gray-500");
    activeButton.classList.add("text-blue-600", "font-semibold");
    activeButton.setAttribute("aria-selected", "true");

    activePanel.classList.remove("hidden");

    if (indicator) {
      indicator.dataset.activeTarget = targetName;
      window.requestAnimationFrame(() => moveTabIndicator(indicator, wrapper, activeButton));
    }
  };

  buttons.forEach((button) => {
    if (!button.hasAttribute("type")) {
      button.setAttribute("type", "button");
    }
    button.setAttribute("role", "tab");
    const controlledId = `${groupName}-panel-${button.dataset.tabTarget}`;
    button.setAttribute("aria-controls", controlledId);
    button.addEventListener("click", () => activate(button.dataset.tabTarget));
  });

  panels.forEach((panel) => {
    panel.setAttribute("role", "tabpanel");
    if (!panel.id) {
      panel.id = `${groupName}-panel-${panel.dataset.tabSection}`;
    }
  });

  const defaultButton = buttons.find((button) => button.hasAttribute("data-tab-default"));
  const initialTarget = defaultButton ? defaultButton.dataset.tabTarget : buttons[0].dataset.tabTarget;
  activate(initialTarget);

  return {
    wrapper,
    indicator,
    getActiveButton: () => buttons.find((button) => button.getAttribute("aria-selected") === "true"),
    moveIndicator: () => {
      const activeButton = buttons.find((button) => button.getAttribute("aria-selected") === "true");
      if (indicator && activeButton) {
        window.requestAnimationFrame(() => moveTabIndicator(indicator, wrapper, activeButton));
      }
    },
  };
}

/**
 * Creates a select-like multi-choice dropdown where each option shows a
 * checkbox while the closed state mirrors a native select control.
 */
function initializeMultiSelect(widget) {
  const trigger = widget.querySelector("[data-multi-select-trigger]");
  const panel = widget.querySelector("[data-multi-select-panel]");
  const summary = widget.querySelector("[data-multi-select-summary]");
  const input = widget.querySelector("[data-multi-select-input]");
  const options = Array.from(widget.querySelectorAll("[data-multi-select-option]"));
  const placeholder = widget.getAttribute("data-multi-select-placeholder") || "Select options";

  if (!trigger || !panel || !summary || !input || !options.length) {
    return;
  }

  const closePanel = () => {
    panel.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
  };

  const openPanel = () => {
    panel.classList.remove("hidden");
    trigger.setAttribute("aria-expanded", "true");
  };

  const updateSummary = () => {
    const checkedValues = options.filter((option) => option.checked).map((option) => option.value);
    summary.textContent = checkedValues.length ? checkedValues.join(", ") : placeholder;
    input.value = checkedValues.join(",");
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (panel.classList.contains("hidden")) {
      openPanel();
    } else {
      closePanel();
    }
  });

  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  options.forEach((option) => {
    option.addEventListener("change", updateSummary);
  });

  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.classList.contains("hidden")) {
      closePanel();
      trigger.focus();
    }
  });

  updateSummary();
}

/**
 * Binds the interactive behaviours once the DOM is ready so layout measurements
 * (indicator width/offsets) are based on rendered dimensions.
 */
document.addEventListener("DOMContentLoaded", () => {
  const tabGroups = ["primary", "application"]
    .map((groupName) => initializeTabGroup(groupName))
    .filter(Boolean);

  window.addEventListener("resize", () => {
    tabGroups.forEach((group) => {
      if (group && typeof group.moveIndicator === "function") {
        group.moveIndicator();
      }
    });
  });

  const multiSelectWidgets = document.querySelectorAll("[data-multi-select]");
  multiSelectWidgets.forEach((widget) => initializeMultiSelect(widget));
});
