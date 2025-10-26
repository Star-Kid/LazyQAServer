// Simple tab controller for the account settings console.
// Keeps the markup declarative by toggling aria roles, focus styles, and Tailwind utility classes.
document.addEventListener("DOMContentLoaded", () => {
  const triggers = Array.from(document.querySelectorAll("[data-tab-target]"));
  const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const indicator = document.querySelector("[data-tab-indicator]");

  if (!triggers.length || !panels.length || !indicator) {
    return;
  }

  /**
   * Activate the requested tab and ensure the indicator matches its width/position.
   * @param {HTMLButtonElement} targetButton - the trigger that should be marked as selected.
   * @param {boolean} shouldUpdateUrl - when true, synchronise the hash/query so deep links stay current.
   */
  const activateTab = (targetButton, shouldUpdateUrl = true) => {
    const targetId = targetButton.dataset.tabTarget;

    triggers.forEach((trigger) => {
      const isActive = trigger === targetButton;
      trigger.classList.toggle("text-blue-600", isActive);
      trigger.classList.toggle("text-gray-600", !isActive);
      trigger.setAttribute("aria-selected", String(isActive));
      trigger.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === targetId;
      panel.classList.toggle("hidden", !isActive);
    });

    const { offsetLeft, offsetWidth } = targetButton;
    indicator.style.transform = `translateX(${offsetLeft}px)`;
    indicator.style.width = `${offsetWidth}px`;

    if (shouldUpdateUrl) {
      try {
        const url = new URL(window.location.href);
        url.hash = targetId;
        history.replaceState(null, "", url);
      } catch (error) {
        // Fallback for older browsers that do not expose URL or history APIs.
        window.location.hash = targetId;
      }
    }
  };

  const findTriggerById = (tabId) => triggers.find((trigger) => trigger.dataset.tabTarget === tabId);

  let parsedUrl;
  try {
    parsedUrl = new URL(window.location.href);
  } catch (error) {
    parsedUrl = null;
  }
  const preferredTabId = (parsedUrl && parsedUrl.searchParams.get("tab")) || (window.location.hash || "").replace("#", "");
  const initialTrigger = findTriggerById(preferredTabId) || triggers[0];

  // Ensure the desired tab is highlighted by default.
  activateTab(initialTrigger, false);

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => activateTab(trigger));
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateTab(trigger);
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const currentIndex = triggers.indexOf(trigger);
        const delta = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + delta + triggers.length) % triggers.length;
        triggers[nextIndex].focus();
        activateTab(triggers[nextIndex]);
      }
    });
  });

  window.addEventListener("hashchange", () => {
    const targetId = (window.location.hash || "").replace("#", "");
    const matchingTrigger = findTriggerById(targetId);
    if (matchingTrigger) {
      activateTab(matchingTrigger, false);
    }
  });

  const licenseInput = document.querySelector("[data-license-quantity]");
  const licenseTotal = document.querySelector("[data-license-total]");

  if (licenseInput && licenseTotal) {
    /**
     * Clamp the license quantity to a positive integer and surface the billed total.
     */
    const updateLicenseTotal = () => {
      const rawValue = Number.parseInt(licenseInput.value, 10);
      const quantity = Number.isNaN(rawValue) ? 1 : Math.max(1, rawValue);
      if (quantity !== rawValue) {
        licenseInput.value = String(quantity);
      }
      const total = (quantity * 9.99).toFixed(2);
      licenseTotal.textContent = `$${total}`;
    };

    licenseInput.addEventListener("input", updateLicenseTotal);
    licenseInput.addEventListener("change", updateLicenseTotal);
    updateLicenseTotal();
  }

  const menuContainers = Array.from(document.querySelectorAll("[data-user-menu]"));
  const menuInstances = [];

  const closeAllMenus = (exception) => {
    menuInstances.forEach((instance) => {
      if (instance !== exception) {
        instance.closeMenu();
      }
    });
  };

  menuContainers.forEach((container) => {
    const toggle = container.querySelector("[data-user-menu-toggle]");
    const menu = container.querySelector("[data-user-menu-list]");
    const items = menu ? Array.from(menu.querySelectorAll("button")) : [];

    if (!toggle || !menu) {
      return;
    }

    const instance = {
      container,
      toggle,
      menu,
      closeMenu: () => {
        menu.classList.add("hidden");
        toggle.setAttribute("aria-expanded", "false");
      },
    };

    const openMenu = () => {
      closeAllMenus(instance);
      menu.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
      if (items.length) {
        items[0].focus();
      }
    };

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        instance.closeMenu();
      } else {
        openMenu();
      }
    });

    toggle.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle.click();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        openMenu();
      }
    });

    menu.addEventListener("click", (event) => event.stopPropagation());

    items.forEach((item) => {
      item.addEventListener("click", () => {
        instance.closeMenu();
        toggle.focus();
      });
    });

    menuInstances.push(instance);
  });

  document.addEventListener("click", () => closeAllMenus());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const openInstance = menuInstances.find((instance) => instance.toggle.getAttribute("aria-expanded") === "true");
      if (openInstance) {
        openInstance.closeMenu();
        openInstance.toggle.focus();
      }
    }
  });
});
