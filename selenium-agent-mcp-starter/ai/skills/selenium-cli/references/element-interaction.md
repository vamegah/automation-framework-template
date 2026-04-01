# Element Interaction

Preferred order for Selenium interactions in this repo:

1. Use page object methods when they already exist
2. Use clear `By.id`, `By.css`, or other stable locators
3. Avoid brittle positional selectors

Common patterns:

- click visible, interactable controls
- clear fields before typing
- assert visible body text for simple smoke coverage
