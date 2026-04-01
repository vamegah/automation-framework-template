type AccessibilitySignals = {
  h1Count: number;
  labelCount: number;
  labelledControlCount: number;
  meaningfulAltCount: number;
  missingAltCount: number;
  genericLinkTextCount: number;
  nonSemanticInteractiveCount: number;
};

const collectSignals = (html: string): AccessibilitySignals => ({
  h1Count: (html.match(/<h1\b/gi) ?? []).length,
  labelCount: (html.match(/<label\b/gi) ?? []).length,
  labelledControlCount: (html.match(/<label[^>]+for=/gi) ?? []).length,
  meaningfulAltCount: (html.match(/<img[^>]+alt="[^"\s][^"]*"/gi) ?? []).length,
  missingAltCount: (html.match(/<img(?![^>]*alt=)|<img[^>]*alt=""/gi) ?? []).length,
  genericLinkTextCount: (html.match(/>\s*click here\s*</gi) ?? []).length,
  nonSemanticInteractiveCount: (html.match(/<(div|span)[^>]*(onclick|tabindex=|cursor:\s*pointer)[^>]*>/gi) ?? []).length,
});

describe('Axibly Accessibility Demo', () => {
  const writeArtifact = (testName: string, pageName: string, violations: axe.Result[]) =>
    cy.url().then((url) => cy.task('writeAccessibilityReport', {
      suiteName: 'Axibly Accessibility Demo',
      testName,
      pageName,
      url,
      violations,
    }));

  beforeEach(() => {
    cy.on('uncaught:exception', () => false);
  });

  it('verifies the accessible demo passes real axe-core assertions and stronger heuristics', () => {
    cy.visit('https://axibly.ai/demo/accessible');
    cy.injectAxe();
    let violations: axe.Result[] = [];

    cy.checkA11y(undefined, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
    }, (results) => {
      violations = results;
    }, true).then(() => writeArtifact(
      'verifies the accessible demo passes real axe-core assertions and stronger heuristics',
      'accessible',
      violations,
    ));

    cy.document().then((document) => {
      const html = document.documentElement.outerHTML;
      const signals = collectSignals(html);

      expect(html).to.include('Accessible Demo Page');
      expect(signals.h1Count).to.equal(1);
      expect(signals.labelCount).to.be.greaterThan(1);
      expect(signals.labelledControlCount).to.be.greaterThan(1);
      expect(signals.meaningfulAltCount).to.be.greaterThan(0);
      expect(signals.genericLinkTextCount).to.equal(0);
      expect(signals.nonSemanticInteractiveCount).to.equal(0);
      expect(signals.missingAltCount).to.equal(0);
    });
  });

  it('detects real axe-core violations on the inaccessible demo', () => {
    cy.visit('https://axibly.ai/demo/inaccessible');
    cy.injectAxe();
    let violations: axe.Result[] = [];

    cy.checkA11y(
      undefined,
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      },
      (results) => {
        violations = results;
        expect(results.length).to.be.greaterThan(0);
        const violationIds = results.map((violation) => violation.id);
        expect(violationIds).to.include.members(['image-alt', 'link-name']);
      },
      true,
    ).then(() => writeArtifact(
      'detects real axe-core violations on the inaccessible demo',
      'inaccessible',
      violations,
    ));

    cy.document().then((document) => {
      const html = document.documentElement.outerHTML;
      const signals = collectSignals(html);

      expect(html).to.include('Inaccessible Demo Page');
      expect(html).to.include('Div used as button');
      expect(signals.genericLinkTextCount).to.be.greaterThan(0);
      expect(signals.missingAltCount).to.be.greaterThan(0);
      expect(signals.labelCount).to.be.lessThan(2);
    });
  });
});
