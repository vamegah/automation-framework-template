package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.GeneratedScriptArtifact;
import com.example.enterprise.EnterpriseModels.PageObjectMethodMatch;
import com.example.enterprise.EnterpriseModels.ReviewBotFinding;
import com.example.enterprise.EnterpriseModels.ScriptGenerationRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class EnterpriseScriptGenerator {
    public GeneratedScriptArtifact generate(String repoRoot, ScriptGenerationRequest request) throws IOException {
        List<PageObjectMethodMatch> matches = findPageObjectMatches(repoRoot, request.pageObjectHint, request.scenario);
        List<String> secretPlaceholders = buildSecretExpressions(request.secretKeys, request.secretProvider);

        GeneratedScriptArtifact artifact = new GeneratedScriptArtifact();
        artifact.framework = request.framework;
        artifact.reusedPageObjects = matches;
        artifact.secretPlaceholders = secretPlaceholders;

        if ("typescript-selenium".equalsIgnoreCase(request.framework)) {
            artifact.fileName = slugify(request.testName) + ".spec.ts";
            artifact.content = renderTypeScript(request, matches, secretPlaceholders);
            return artifact;
        }

        if ("csharp-dotnet".equalsIgnoreCase(request.framework)) {
            artifact.fileName = alphanumeric(request.testName) + ".cs";
            artifact.content = renderCSharp(request, matches, secretPlaceholders);
            return artifact;
        }

        artifact.fileName = slugify(request.testName) + ".txt";
        artifact.content = "Framework " + request.framework + " is supported conceptually. Add a project-specific renderer before merge.";
        return artifact;
    }

    public List<ReviewBotFinding> reviewGeneratedCode(String content) {
        List<ReviewBotFinding> findings = new ArrayList<>();
        String[] lines = content.split("\\R");

        for (int index = 0; index < lines.length; index++) {
            String line = lines[index];
            if (line.contains("Thread.sleep(") || line.contains("sleep(") || line.contains("setTimeout(")) {
                findings.add(buildFinding("error", "no-hard-waits", "Replace hard waits with WebDriver conditions or page-object waits.", index + 1));
            }

            if (line.matches(".*password\\s*=\\s*['\\\"].+['\\\"].*") || line.matches(".*api[_-]?key\\s*[:=]\\s*['\\\"].+['\\\"].*")) {
                findings.add(buildFinding("error", "no-hardcoded-secrets", "Credentials must come from Vault, AWS Secrets Manager, or environment placeholders.", index + 1));
            }
        }

        return findings;
    }

    private List<PageObjectMethodMatch> findPageObjectMatches(String repoRoot, String hint, List<String> scenario) throws IOException {
        Path pagesDir = Paths.get(repoRoot, "src", "main", "java", "com", "example", "pages");
        if (!Files.exists(pagesDir)) {
            return List.of();
        }

        try (Stream<Path> stream = Files.list(pagesDir)) {
            return stream
                .filter(path -> path.getFileName().toString().endsWith("Page.java"))
                .map(path -> indexPageObject(path, hint, scenario))
                .filter(match -> match != null)
                .collect(Collectors.toList());
        }
    }

    private PageObjectMethodMatch indexPageObject(Path path, String hint, List<String> scenario) {
        try {
            String fileName = path.getFileName().toString().toLowerCase(Locale.ROOT);
            String normalizedHint = hint == null ? "" : hint.toLowerCase(Locale.ROOT);
            String content = Files.readString(path);

            Matcher classMatcher = Pattern.compile("public class (\\w+)").matcher(content);
            if (!classMatcher.find()) {
                return null;
            }

            String className = classMatcher.group(1);
            if (!fileName.contains(normalizedHint) && !className.toLowerCase(Locale.ROOT).contains(normalizedHint)) {
                return null;
            }

            Matcher methodMatcher = Pattern.compile("public void (\\w+)\\(").matcher(content);
            List<String> methods = new ArrayList<>();
            while (methodMatcher.find()) {
                methods.add(methodMatcher.group(1));
            }

            List<String> matchedMethods = methods.stream()
                .filter(method -> scenario.stream().anyMatch(step -> step.toLowerCase(Locale.ROOT).contains(method.toLowerCase(Locale.ROOT))))
                .collect(Collectors.toList());

            PageObjectMethodMatch match = new PageObjectMethodMatch();
            match.className = className;
            match.importPath = "com.example.pages." + className;
            match.methodNames = matchedMethods.isEmpty() ? methods.stream().limit(3).collect(Collectors.toList()) : matchedMethods;
            return match;
        } catch (IOException exception) {
            return null;
        }
    }

    private List<String> buildSecretExpressions(List<String> secretKeys, String provider) {
        return secretKeys.stream()
            .map(key -> "vault".equalsIgnoreCase(provider) ? "getVaultSecret(\"" + key + "\")" : "getAwsSecret(\"" + key + "\")")
            .collect(Collectors.toList());
    }

    private String renderTypeScript(ScriptGenerationRequest request, List<PageObjectMethodMatch> matches, List<String> secretPlaceholders) {
        List<String> imports = new ArrayList<>();
        imports.add("import { expect } from 'chai';");
        imports.add("import { SeleniumConfig } from '../../selenium.config';");
        for (PageObjectMethodMatch match : matches) {
            imports.add("import { " + match.className + " } from '../../pages/" + toKebabCase(match.className.replace("Page", "")) + ".page';");
        }

        List<String> body = new ArrayList<>();
        body.add("describe('" + request.testName + "', () => {");
        body.add("  it('executes the generated enterprise flow', async () => {");
        body.add("    const config = new SeleniumConfig();");
        body.add("    const driver = await config.getDriver();");
        body.add(renderSecretHelper(request.secretProvider));

        for (int index = 0; index < matches.size(); index++) {
            PageObjectMethodMatch match = matches.get(index);
            String variableName = Character.toLowerCase(match.className.charAt(0)) + match.className.substring(1);
            body.add("    const " + variableName + " = new " + match.className + "(driver);");
            if (!request.secretKeys.isEmpty()) {
                body.add("    const " + request.secretKeys.get(0).toLowerCase(Locale.ROOT) + " = " + secretPlaceholders.get(0) + ";");
            }
            if (!match.methodNames.isEmpty()) {
                body.add("    await " + variableName + "." + match.methodNames.get(0) + "();");
            }
        }

        for (String step : request.scenario) {
            body.add("    // " + step);
        }
        for (String assertion : request.assertions) {
            body.add("    // Assert: " + assertion);
        }

        body.add("    expect(await driver.getCurrentUrl()).to.be.a('string');");
        body.add("    await config.quitDriver();");
        body.add("  });");
        body.add("});");

        return String.join("\n", imports) + "\n\n" + String.join("\n", body) + "\n";
    }

    private String renderCSharp(ScriptGenerationRequest request, List<PageObjectMethodMatch> matches, List<String> secretPlaceholders) {
        List<String> lines = new ArrayList<>();
        lines.add("using NUnit.Framework;");
        lines.add("");
        lines.add("namespace Generated.SeleniumEnterprise;");
        lines.add("");
        lines.add("public class GeneratedEnterpriseTest");
        lines.add("{");
        lines.add("    [Test]");
        lines.add("    public void " + alphanumeric(request.testName) + "()");
        lines.add("    {");
        lines.add("        // Reuse page objects: " + matches.stream().map(match -> match.className).collect(Collectors.joining(", ")));
        for (int index = 0; index < request.secretKeys.size(); index++) {
            lines.add("        var " + request.secretKeys.get(index).toLowerCase(Locale.ROOT) + " = \"" + secretPlaceholders.get(index) + "\";");
        }
        lines.add("        Assert.Pass(\"Draft enterprise script generated for review.\");");
        lines.add("    }");
        lines.add("}");
        return String.join("\n", lines) + "\n";
    }

    private String renderSecretHelper(String provider) {
        if ("vault".equalsIgnoreCase(provider)) {
            return String.join("\n",
                "    function getVaultSecret(key: string): string {",
                "      return process.env[key] ?? `vault://qa/${key}`;",
                "    }"
            );
        }

        return String.join("\n",
            "    function getAwsSecret(key: string): string {",
            "      return process.env[key] ?? `aws-secrets-manager://qa/${key}`;",
            "    }"
        );
    }

    private ReviewBotFinding buildFinding(String severity, String rule, String message, int line) {
        ReviewBotFinding finding = new ReviewBotFinding();
        finding.severity = severity;
        finding.rule = rule;
        finding.message = message;
        finding.line = line;
        return finding;
    }

    private String slugify(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }

    private String alphanumeric(String value) {
        return value.replaceAll("[^A-Za-z0-9]+", "");
    }

    private String toKebabCase(String value) {
        return value
            .replaceAll("([a-z])([A-Z])", "$1-$2")
            .toLowerCase(Locale.ROOT);
    }
}
