// The navigation helper makes the static test case cards behave like links so
// users can open the detail surface from any whitespace tap, not just the text.

document.addEventListener('DOMContentLoaded', () => {
  setupTestCaseCardNavigation();
});

/**
 * setupTestCaseCardNavigation wires click and keyboard handlers on every card
 * that declares `data-test-case-target`. The logic preserves native behaviour
 * for embedded controls (links, buttons, selects) while letting the surrounding
 * container redirect to the requested details page. Keyboard support mirrors a
 * standard link: pressing Enter or Space while the card is focused triggers the
 * navigation.
 */
function setupTestCaseCardNavigation() {
  const cards = document.querySelectorAll('[data-test-case-target]');
  const interactiveSelector = 'a, button, [role="button"], input, textarea, select, label, summary';

  cards.forEach((card) => {
    const target = card.dataset.testCaseTarget;
    if (!target) {
      return;
    }

    const navigateToTarget = () => {
      window.location.href = target;
    };

    card.addEventListener('click', (event) => {
      if (event.defaultPrevented) {
        return;
      }

      const interactiveElement = event.target.closest(interactiveSelector);
      if (interactiveElement && interactiveElement !== card) {
        return;
      }

      navigateToTarget();
    });

    card.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.target !== card) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigateToTarget();
      }
    });
  });
}
