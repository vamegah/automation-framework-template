package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.EnterpriseGenerationRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Path;
import java.nio.file.Paths;

public class EnterpriseAgentMain {
    public static void main(String[] args) throws Exception {
        Path repoRoot = Paths.get("").toAbsolutePath();
        Path requestPath = args.length > 0
            ? repoRoot.resolve(args[0]).normalize()
            : repoRoot.resolve("src/main/resources/enterprise-map.json").normalize();

        ObjectMapper mapper = new ObjectMapper();
        EnterpriseGenerationRequest request = mapper.readValue(requestPath.toFile(), EnterpriseGenerationRequest.class);
        EnterpriseAgent agent = new EnterpriseAgent();
        EnterpriseModels.EnterpriseGenerationResult result = agent.generate(request, repoRoot);
        System.out.println("Generated enterprise artifacts in " + result.outputDir);
    }
}
