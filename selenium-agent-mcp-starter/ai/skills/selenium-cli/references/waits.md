# Waits

Avoid hard-coded sleeps.

Preferred waiting strategy:

- use `waitForElement()` from the base page
- wait for interactable controls before clicking
- wait for visible text or URL changes after major actions
