package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.DraftPullRequestPlan;
import com.example.enterprise.EnterpriseModels.EnterpriseGenerationRequest;
import com.example.enterprise.EnterpriseModels.EnterpriseGenerationResult;
import com.example.enterprise.EnterpriseModels.GeneratedScriptArtifact;
import com.example.enterprise.EnterpriseModels.GeneratedTestCase;
import com.example.enterprise.EnterpriseModels.TraceabilityMatrix;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class EnterpriseAgent {
    private final EnterpriseGovernanceService governanceService = new EnterpriseGovernanceService();
    private final EnterpriseScriptGenerator scriptGenerator = new EnterpriseScriptGenerator();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EnterpriseGenerationResult generate(EnterpriseGenerationRequest request, Path repoRoot) throws IOException {
        EnterpriseGovernanceService.GeneratedArtifacts governed = governanceService.generateGovernedTestCases(
            request.requirements,
            request.codeSignalsByRequirement
        );
        List<GeneratedTestCase> testCases = governed.testCases;
        TraceabilityMatrix matrix = governed.matrix;
        DraftPullRequestPlan draftPlan = governanceService.planDraftPullRequest(testCases, request.reviewer);
        GeneratedScriptArtifact scriptArtifact = scriptGenerator.generate(repoRoot.toString(), request.scriptRequest);

        Path outputDir = repoRoot.resolve("docs").resolve("enterprise-output");
        Files.createDirectories(outputDir);
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(outputDir.resolve("traceability-matrix.json").toFile(), matrix);
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(outputDir.resolve("generated-test-cases.json").toFile(), testCases);
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(outputDir.resolve("draft-pr-plan.json").toFile(), draftPlan);
        Files.writeString(outputDir.resolve(scriptArtifact.fileName), scriptArtifact.content);

        EnterpriseGenerationResult result = new EnterpriseGenerationResult();
        result.testCases = testCases;
        result.matrix = matrix;
        result.draftPlan = draftPlan;
        result.scriptArtifact = scriptArtifact;
        result.outputDir = outputDir.toString();
        return result;
    }

    public EnterpriseGenerationResult generate(EnterpriseGenerationRequest request) throws IOException {
        return generate(request, Paths.get("").toAbsolutePath());
    }
}
