export type WorkItemSource = 'jira' | 'azure-devops' | 'linear';

export type BusinessImpact = 'low' | 'medium' | 'high' | 'critical';

export type FrameworkLanguage = 'typescript-selenium' | 'csharp-dotnet' | 'python' | 'java';

export type SecretProvider = 'vault' | 'aws-secrets-manager';

export type AlertChannel = 'slack' | 'jira';

export interface RequirementReference {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  linkedRequirements: string[];
  source: WorkItemSource;
  url?: string;
  labels: string[];
  businessImpact: BusinessImpact;
}

export interface TraceabilityRow {
  requirementId: string;
  requirementTitle: string;
  generatedTestCaseId: string;
  generatedTestCaseTitle: string;
  source: WorkItemSource;
  riskScore: number;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface GeneratedTestCase {
  id: string;
  title: string;
  type: 'ui' | 'api';
  requirementId: string;
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
  riskScore: number;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  reviewState: 'draft';
  tags: string[];
}

export interface TraceabilityMatrix {
  generatedAt: string;
  rows: TraceabilityRow[];
}

export interface DraftPullRequestPlan {
  title: string;
  branchName: string;
  baseBranch: string;
  reviewers: string[];
  labels: string[];
  isDraft: true;
  summary: string;
  artifacts: string[];
}

export interface CodeSignal {
  filePath: string;
  cyclomaticComplexity: number;
  churn: number;
  touchedDomains: string[];
}

export interface RiskScoreBreakdown {
  codeComplexity: number;
  businessImpact: number;
  changeBreadth: number;
  total: number;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface ScriptGenerationRequest {
  framework: FrameworkLanguage;
  testName: string;
  pageObjectHint: string;
  scenario: string[];
  assertions: string[];
  secretKeys: string[];
  secretProvider: SecretProvider;
}

export interface PageObjectMethodMatch {
  className: string;
  importPath: string;
  methodNames: string[];
}

export interface GeneratedScriptArtifact {
  framework: FrameworkLanguage;
  fileName: string;
  content: string;
  reusedPageObjects: PageObjectMethodMatch[];
  secretPlaceholders: string[];
}

export interface ReviewBotFinding {
  severity: 'error' | 'warning';
  rule: string;
  message: string;
  line?: number;
}

export interface SyntheticProfile {
  locale: string;
  firstNamePool: string[];
  lastNamePool: string[];
  emailDomain: string;
  cities: string[];
  cardPrefixes: string[];
}

export interface SyntheticRecord {
  [key: string]: string | number | boolean | null;
}

export interface MaskingResult {
  maskedRecord: SyntheticRecord;
  maskedFields: string[];
}

export interface SeedScript {
  tableName: string;
  sql: string;
}

export interface TestFailureEvidence {
  testName: string;
  testError: string;
  videoPath?: string;
  curlCommand: string;
  service: string;
  endpoint?: string;
  requestId?: string;
}

export interface LogEntry {
  timestamp: string;
  source: 'test' | 'aut';
  provider: 'datadog' | 'splunk' | 'cloudwatch' | 'selenium';
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  endpoint?: string;
  statusCode?: number;
}

export interface RootCauseReport {
  summary: string;
  likelyRootCause: string;
  correlatedProviders: string[];
  evidence: string[];
  alertPayloads: Array<{
    channel: AlertChannel;
    title: string;
    body: string;
  }>;
}

export interface TestRunHistoryEntry {
  testName: string;
  executedAt: string;
  passedOnRetry: boolean;
  failedInitially: boolean;
}

export interface FlakyTestDecision {
  testName: string;
  failureCountThisWeek: number;
  shouldQuarantine: boolean;
  quarantineReason?: string;
}

export interface LocatorCandidate {
  locator: string;
  strategy: 'role' | 'label' | 'testid' | 'text' | 'css';
  attributes?: Record<string, string>;
  visible?: boolean;
  stable?: boolean;
}

export interface SelfHealingRequest {
  failingLocator: string;
  failureMessage: string;
  pageObjectPath: string;
  pageObjectSource: string;
  candidates: LocatorCandidate[];
}

export interface SelfHealingResult {
  shouldHeal: boolean;
  healedLocator?: string;
  confidence: number;
  reason: string;
  patch: string[];
}

export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
}

export interface JsonContractSchema {
  type: 'object' | 'array';
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required: string[];
}

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ContractTestArtifact {
  fileName: string;
  content: string;
}

export interface SecurityTestCase {
  id: string;
  title: string;
  category: 'sql-injection' | 'xss' | 'auth-bypass' | 'input-validation' | 'rate-limit';
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
  severity: 'medium' | 'high' | 'critical';
}

export interface AccessibilityFinding {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  rule: string;
  selector: string;
  message: string;
}

export interface AccessibilityRecommendation {
  findingId: string;
  fix: string;
  assertion: string;
}

export interface AccessibilityCoverageArtifact {
  summary: string;
  recommendations: AccessibilityRecommendation[];
  assertions: string[];
}

export interface PipelineSuiteMetric {
  name: string;
  averageDurationSeconds: number;
  failureRate: number;
  requiresSerial: boolean;
}

export interface PipelineOptimizationPlan {
  recommendedWorkers: number;
  shardCount: number;
  quarantinedTests: string[];
  workflowYaml: string;
  rationale: string[];
}
