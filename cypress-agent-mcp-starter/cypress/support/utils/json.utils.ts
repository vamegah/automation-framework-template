export function loadJson<T = any>(filePath: string): T {
  // In Cypress, we can use cy.readFile, but for agents outside Cypress we need Node fs.
  // We'll create a wrapper that works in both environments.
  if (typeof cy !== 'undefined') {
    // Inside Cypress test
    return cy.readFile(filePath).then((data) => data as T);
  } else {
    // Outside Cypress (e.g., in a Node script)
    const fs = require('fs');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  }
}