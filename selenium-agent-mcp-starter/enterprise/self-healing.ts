import { LocatorCandidate, SelfHealingRequest, SelfHealingResult } from './types';

function scoreCandidate(candidate: LocatorCandidate): number {
  const strategyWeight = {
    role: 40,
    label: 34,
    testid: 30,
    text: 20,
    css: 12,
  }[candidate.strategy];

  const visibility = candidate.visible ? 15 : 0;
  const stability = candidate.stable ? 20 : 0;
  const semantics = candidate.attributes?.name || candidate.attributes?.label ? 10 : 0;

  return strategyWeight + visibility + stability + semantics;
}

function inferReason(candidate: LocatorCandidate, request: SelfHealingRequest): string {
  if (/strict mode|resolved to \d+ elements/i.test(request.failureMessage)) {
    return `The failing locator appears ambiguous. ${candidate.strategy} locator ${candidate.locator} is more specific.`;
  }
  if (/not found|waiting for selector|locator resolved to 0/i.test(request.failureMessage)) {
    return `The original locator no longer matches the DOM. ${candidate.locator} was found as a stable replacement.`;
  }
  return `Selected ${candidate.locator} because it has the strongest stable semantics among the discovered candidates.`;
}

export function suggestLocatorHealing(request: SelfHealingRequest): SelfHealingResult {
  const sorted = [...request.candidates].sort((left, right) => scoreCandidate(right) - scoreCandidate(left));
  const best = sorted[0];

  if (!best) {
    return {
      shouldHeal: false,
      confidence: 0,
      reason: 'No replacement locators were provided for healing.',
      patch: [],
    };
  }

  const confidence = Math.min(100, scoreCandidate(best));
  const healedExpression = best.strategy === 'css'
    ? `By.css('${best.locator}')`
    : best.locator;

  return {
    shouldHeal: confidence >= 45,
    healedLocator: healedExpression,
    confidence,
    reason: inferReason(best, request),
    patch: [
      `File: ${request.pageObjectPath}`,
      `Replace locator ${request.failingLocator}`,
      `With locator ${healedExpression}`,
    ],
  };
}
