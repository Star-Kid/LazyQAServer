/**
 * Initialize interactive behavior for the responsive sidebar.
 * The logic is loaded on every page because the layout is shared across the UI.
 */
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('[data-role="app-sidebar"]');
  const toggleButton = document.querySelector('[data-role="mobile-menu-toggle"]');
  const overlay = document.querySelector('[data-role="sidebar-overlay"]');

  if (!sidebar || !toggleButton || !overlay) {
    return;
  }

  /**
   * Update the aria-expanded state and overlay visibility based on whether the sidebar is open.
   * @param {boolean} isOpen - Indicates whether the sidebar should be visible on mobile screens.
   */
  const setSidebarState = (isOpen) => {
    sidebar.classList.toggle('is-open', isOpen);
    overlay.classList.toggle('visible', isOpen);
    toggleButton.setAttribute('aria-expanded', String(isOpen));
  };

  /**
   * Open the sidebar and focus the first interactive element to support accessibility.
   */
  const openSidebar = () => {
    setSidebarState(true);

    const focusableLink = sidebar.querySelector('a, button, select, input, textarea');
    if (focusableLink) {
      focusableLink.focus({ preventScroll: true });
    }
  };

  /**
   * Close the sidebar when the menu should be hidden on mobile screens.
   */
  const closeSidebar = () => {
    setSidebarState(false);
  };

  toggleButton.addEventListener('click', () => {
    const isCurrentlyOpen = sidebar.classList.contains('is-open');
    if (isCurrentlyOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSidebar();
    }
  });

  const desktopBreakpoint = window.matchMedia('(min-width: 1024px)');

  /**
   * Close the sidebar when the layout transitions to the desktop breakpoint to avoid double scrollbars.
   * @param {MediaQueryListEvent | MediaQueryList} query - Media query change event.
   */
  const handleBreakpointChange = (query) => {
    if (query.matches) {
      closeSidebar();
    }
  };

  if (typeof desktopBreakpoint.addEventListener === 'function') {
    desktopBreakpoint.addEventListener('change', handleBreakpointChange);
  } else {
    desktopBreakpoint.addListener(handleBreakpointChange);
  }

  handleBreakpointChange(desktopBreakpoint);
});
