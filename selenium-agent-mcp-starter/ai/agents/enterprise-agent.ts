import * as fs from 'fs';
import * as path from 'path';
import {
  CodeSignal,
  DraftPullRequestPlan,
  GeneratedScriptArtifact,
  GeneratedTestCase,
  RequirementReference,
  ScriptGenerationRequest,
  TraceabilityMatrix,
  generateEnterpriseScript,
  generateGovernedTestCases,
  planDraftPullRequest,
} from '../../enterprise';

export interface EnterpriseGenerationRequest {
  requirements: RequirementReference[];
  codeSignalsByRequirement: Record<string, CodeSignal[]>;
  reviewer: string;
  scriptRequest: ScriptGenerationRequest;
}

export interface EnterpriseGenerationResult {
  testCases: GeneratedTestCase[];
  matrix: TraceabilityMatrix;
  draftPlan: DraftPullRequestPlan;
  scriptArtifact: GeneratedScriptArtifact;
  outputDir: string;
}

export class EnterpriseAgent {
  generate(request: EnterpriseGenerationRequest, repoRoot = path.resolve(__dirname, '../..')): EnterpriseGenerationResult {
    const { testCases, matrix } = generateGovernedTestCases(request.requirements, request.codeSignalsByRequirement);
    const draftPlan = planDraftPullRequest(testCases, request.reviewer);
    const scriptArtifact = generateEnterpriseScript(repoRoot, request.scriptRequest);
    const outputDir = path.join(repoRoot, 'docs', 'enterprise-output');

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'traceability-matrix.json'), JSON.stringify(matrix, null, 2));
    fs.writeFileSync(path.join(outputDir, 'generated-test-cases.json'), JSON.stringify(testCases, null, 2));
    fs.writeFileSync(path.join(outputDir, 'draft-pr-plan.json'), JSON.stringify(draftPlan, null, 2));
    fs.writeFileSync(path.join(outputDir, scriptArtifact.fileName), scriptArtifact.content);

    return {
      testCases,
      matrix,
      draftPlan,
      scriptArtifact,
      outputDir,
    };
  }
}
