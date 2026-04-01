import { CodeSignal, DraftPullRequestPlan, GeneratedTestCase, RequirementReference, RiskScoreBreakdown, TraceabilityMatrix } from './types';

function mapBusinessImpactToScore(impact: RequirementReference['businessImpact']): number {
  switch (impact) {
    case 'critical':
      return 45;
    case 'high':
      return 32;
    case 'medium':
      return 20;
    default:
      return 10;
  }
}

function toCriticality(score: number): RiskScoreBreakdown['criticality'] {
  if (score >= 85) {
    return 'critical';
  }
  if (score >= 65) {
    return 'high';
  }
  if (score >= 40) {
    return 'medium';
  }
  return 'low';
}

export function scoreRequirementRisk(requirement: RequirementReference, codeSignals: CodeSignal[]): RiskScoreBreakdown {
  const signal = codeSignals[0] ?? {
    filePath: 'unknown',
    cyclomaticComplexity: 1,
    churn: 1,
    touchedDomains: [],
  };

  const codeComplexity = Math.min(30, signal.cyclomaticComplexity * 2);
  const businessImpact = mapBusinessImpactToScore(requirement.businessImpact);
  const changeBreadth = Math.min(25, (signal.touchedDomains.length * 4) + Math.min(signal.churn, 9));
  const total = Math.min(100, codeComplexity + businessImpact + changeBreadth);

  return {
    codeComplexity,
    businessImpact,
    changeBreadth,
    total,
    criticality: toCriticality(total),
  };
}

function buildExpectedResults(requirement: RequirementReference): string[] {
  if (requirement.acceptanceCriteria.length > 0) {
    return requirement.acceptanceCriteria.map((criterion) => `Verified: ${criterion}`);
  }
  return [`Requirement ${requirement.id} behaves as described.`];
}

export function generateGovernedTestCases(
  requirements: RequirementReference[],
  codeSignalsByRequirement: Record<string, CodeSignal[]>,
): { testCases: GeneratedTestCase[]; matrix: TraceabilityMatrix } {
  const generatedAt = new Date().toISOString();
  const testCases = requirements.map((requirement, index) => {
    const risk = scoreRequirementRisk(requirement, codeSignalsByRequirement[requirement.id] ?? []);
    const testCaseId = `TC-${requirement.id}-${index + 1}`;

    return {
      id: testCaseId,
      title: `${requirement.id} - ${requirement.title}`,
      type: 'ui' as const,
      requirementId: requirement.id,
      preconditions: [
        `Requirement source is ${requirement.source}.`,
        'Linked acceptance criteria were fetched from the webhook payload.',
      ],
      steps: [
        `Review requirement ${requirement.id} acceptance criteria.`,
        'Exercise the user journey with stable selectors and enterprise waits.',
        'Capture evidence for the traceability matrix.',
      ],
      expectedResults: buildExpectedResults(requirement),
      riskScore: risk.total,
      criticality: risk.criticality,
      reviewState: 'draft' as const,
      tags: ['@generated', `@req:${requirement.id}`, `@criticality:${risk.criticality}`],
    };
  });

  return {
    testCases,
    matrix: {
      generatedAt,
      rows: testCases.map((testCase) => ({
        requirementId: testCase.requirementId,
        requirementTitle: requirements.find((item) => item.id === testCase.requirementId)?.title ?? testCase.requirementId,
        generatedTestCaseId: testCase.id,
        generatedTestCaseTitle: testCase.title,
        source: requirements.find((item) => item.id === testCase.requirementId)?.source ?? 'jira',
        riskScore: testCase.riskScore,
        criticality: testCase.criticality,
      })),
    },
  };
}

export function planDraftPullRequest(testCases: GeneratedTestCase[], reviewer: string): DraftPullRequestPlan {
  const ids = testCases.map((testCase) => testCase.requirementId);
  return {
    title: `Draft: generated tests for ${ids.join(', ')}`,
    branchName: `draft/generated-tests/${ids.join('-').toLowerCase()}`,
    baseBranch: 'main',
    reviewers: [reviewer],
    labels: ['ai-generated', 'qa-review', 'draft-pr'],
    isDraft: true,
    summary: `Generated ${testCases.length} governed test case(s). Review required before merge.`,
    artifacts: ['traceability-matrix.json', 'generated-test-cases.json'],
  };
}
