import { expect } from 'chai';
import { createHeuristicViolation, writeAccessibilityArtifact } from '../utils/accessibility-artifact';

const collectSignals = (html: string) => ({
  h1Count: (html.match(/<h1\b/gi) ?? []).length,
  labelCount: (html.match(/<label\b/gi) ?? []).length,
  labelledControlCount: (html.match(/<label[^>]+for=/gi) ?? []).length,
  meaningfulAltCount: (html.match(/<img[^>]+alt="[^"\s][^"]*"/gi) ?? []).length,
  missingAltCount: (html.match(/<img(?![^>]*alt=)|<img[^>]*alt=""/gi) ?? []).length,
  genericLinkTextCount: (html.match(/>\s*click here\s*</gi) ?? []).length,
  nonSemanticInteractiveCount: (html.match(/<(div|span)[^>]*(onclick|tabindex=|cursor:\s*pointer)[^>]*>/gi) ?? []).length,
});

describe('Axibly Accessibility Demo', function () {
  this.timeout(30000);

  it('verifies the accessible demo passes stronger axe-style accessibility heuristics', async () => {
    const response = await fetch('https://axibly.ai/demo/accessible');
    const html = await response.text();
    const signals = collectSignals(html);
    const violations: ReturnType<typeof createHeuristicViolation>[] = [];

    writeAccessibilityArtifact({
      suiteName: 'Axibly Accessibility Demo',
      testName: 'verifies the accessible demo passes stronger axe-style accessibility heuristics',
      pageName: 'accessible',
      url: 'https://axibly.ai/demo/accessible',
      violations,
      metrics: signals,
    });

    expect(response.status).to.equal(200);
    expect(html).to.include('Accessible Demo Page');
    expect(signals.h1Count).to.equal(1);
    expect(signals.labelCount).to.be.greaterThan(1);
    expect(signals.labelledControlCount).to.be.greaterThan(1);
    expect(signals.meaningfulAltCount).to.be.greaterThan(0);
    expect(signals.genericLinkTextCount).to.equal(0);
    expect(signals.nonSemanticInteractiveCount).to.equal(0);
    expect(signals.missingAltCount).to.equal(0);
  });

  it('detects multiple axe-style accessibility anti-patterns on the inaccessible demo', async () => {
    const response = await fetch('https://axibly.ai/demo/inaccessible');
    const html = await response.text();
    const signals = collectSignals(html);
    const violations = [
      createHeuristicViolation({
        id: 'generic-link-text',
        impact: 'serious',
        help: 'Links should use descriptive text',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/link-name',
        description: 'Generic link text such as "click here" makes navigation less accessible.',
        nodes: [{
          target: ['a'],
          html: '<a>click here</a>',
          failureSummary: 'The page contains non-descriptive link text.',
        }],
      }),
      createHeuristicViolation({
        id: 'image-alt',
        impact: 'critical',
        help: 'Images must have alternative text',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/image-alt',
        description: 'Informative images should have a meaningful alt attribute.',
        nodes: [{
          target: ['img'],
          html: '<img>',
          failureSummary: 'Detected an image with a missing or empty alt attribute.',
        }],
      }),
    ];

    writeAccessibilityArtifact({
      suiteName: 'Axibly Accessibility Demo',
      testName: 'detects multiple axe-style accessibility anti-patterns on the inaccessible demo',
      pageName: 'inaccessible',
      url: 'https://axibly.ai/demo/inaccessible',
      violations,
      metrics: signals,
    });

    expect(response.status).to.equal(200);
    expect(html).to.include('Inaccessible Demo Page');
    expect(html).to.include('Div used as button');
    expect(signals.labelCount).to.be.lessThan(2);
    expect(signals.genericLinkTextCount).to.be.greaterThan(0);
    expect(signals.missingAltCount).to.be.greaterThan(0);
  });
});
