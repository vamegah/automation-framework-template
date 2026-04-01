package com.example.agents;

import com.example.config.DriverFactory;
import com.example.pages.LoginPage;
import com.example.utils.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class TestGeneratorAgent implements Agent {
    private WebDriver driver;

    @Override
    public void execute(String mapFilePath) throws Exception {
        Path workingDir = Paths.get("").toAbsolutePath();
        Path repoRoot = workingDir.endsWith("selenium-agent-mcp-starter-java")
            ? workingDir
            : workingDir.resolve("selenium-agent-mcp-starter-java");
        Path absoluteMapPath = repoRoot.resolve(mapFilePath).normalize();
        JsonNode root = JsonUtils.parseJsonFile(absoluteMapPath.toString());
        JsonNode tasks = root.get("tasks");

        generateArtifacts(repoRoot, tasks);
        driver = DriverFactory.createDriver();

        try {
            for (JsonNode task : tasks) {
                String url = task.get("url").asText();
                driver.get(url);

                for (JsonNode action : task.get("actions")) {
                    String type = action.get("type").asText();

                    switch (type) {
                        case "navigate":
                            driver.get(action.path("url").asText(url));
                            break;
                        case "login":
                            LoginPage loginPage = new LoginPage(driver);
                            loginPage.login(action.path("username").asText(""), action.path("password").asText(""));
                            break;
                        case "click":
                            driver.findElement(By.cssSelector(action.path("selector").asText("body"))).click();
                            break;
                        case "type":
                            WebElement input = driver.findElement(By.cssSelector(action.path("selector").asText("body")));
                            input.clear();
                            input.sendKeys(action.path("value").asText(""));
                            break;
                        case "assertText":
                            String bodyText = driver.findElement(By.tagName("body")).getText();
                            String expectedText = action.has("value") ? action.get("value").asText() : action.path("text").asText("");
                            if (!bodyText.contains(expectedText)) {
                                throw new AssertionError("Expected page to contain: " + expectedText);
                            }
                            break;
                        case "assertUrl":
                            String expectedUrl = action.path("url").asText("");
                            String currentUrl = driver.getCurrentUrl();
                            if (!currentUrl.contains(expectedUrl)) {
                                throw new AssertionError("Expected URL '" + currentUrl + "' to include '" + expectedUrl + "'");
                            }
                            break;
                        case "screenshot":
                            Path screenshotPath = repoRoot.resolve(action.path("path").asText("screenshots/generated.png")).normalize();
                            Files.createDirectories(screenshotPath.getParent());
                            File screenshotFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
                            Files.copy(screenshotFile.toPath(), screenshotPath, StandardCopyOption.REPLACE_EXISTING);
                            break;
                        default:
                            break;
                    }
                }
            }
        } finally {
            DriverFactory.quitDriver();
        }
    }

    private void generateArtifacts(Path repoRoot, JsonNode tasks) throws Exception {
        Path outputDir = repoRoot.resolve("src/test/java/com/example/tests/generated");
        Path reportPath = repoRoot.resolve("docs/generated-coverage.md");
        Files.createDirectories(outputDir);
        Files.createDirectories(reportPath.getParent());

        Files.writeString(outputDir.resolve("GeneratedJourneysTest.java"), renderJUnit(tasks));
        Files.writeString(reportPath, renderCoverage(repoRoot, tasks));
    }

    private String renderJUnit(JsonNode tasks) {
        List<String> tests = new ArrayList<>();

        for (int i = 0; i < tasks.size(); i++) {
            JsonNode task = tasks.get(i);
            String testName = toMethodName(task.path("name").asText("generated task " + (i + 1)));
            List<String> lines = new ArrayList<>();
            lines.add("    @Test");
            lines.add("    void " + testName + "() {");
            lines.add("        loginPage.navigateTo(\"" + task.get("url").asText() + "\");");

            for (JsonNode action : task.get("actions")) {
                lines.add(renderStep(action));
            }

            lines.add("    }");
            tests.add(String.join("\n", lines));
        }

        return String.join("\n", List.of(
            "package com.example.tests.generated;",
            "",
            "import com.example.config.DriverFactory;",
            "import com.example.pages.LoginPage;",
            "import org.junit.jupiter.api.*;",
            "import org.openqa.selenium.By;",
            "import org.openqa.selenium.WebDriver;",
            "",
            "import static org.junit.jupiter.api.Assertions.assertTrue;",
            "",
            "class GeneratedJourneysTest {",
            "    private WebDriver driver;",
            "    private LoginPage loginPage;",
            "",
            "    @BeforeEach",
            "    void setUp() {",
            "        driver = DriverFactory.createDriver();",
            "        loginPage = new LoginPage(driver);",
            "    }",
            "",
            "    @AfterEach",
            "    void tearDown() {",
            "        DriverFactory.quitDriver();",
            "    }",
            "",
            String.join("\n\n", tests),
            "}",
            ""
        ));
    }

    private String renderStep(JsonNode action) {
        String type = action.get("type").asText();
        switch (type) {
            case "navigate":
                return "        loginPage.navigateTo(\"" + action.path("url").asText("/") + "\");";
            case "login":
                return "        loginPage.login(\"" + action.path("username").asText("") + "\", \"" + action.path("password").asText("") + "\");";
            case "click":
                return "        driver.findElement(By.cssSelector(\"" + action.path("selector").asText("body") + "\")).click();";
            case "type":
                return String.join("\n", List.of(
                    "        {",
                    "            var input = driver.findElement(By.cssSelector(\"" + action.path("selector").asText("body") + "\"));",
                    "            input.clear();",
                    "            input.sendKeys(\"" + action.path("value").asText("") + "\");",
                    "        }"
                ));
            case "assertText":
                String expectedText = action.has("value") ? action.get("value").asText() : action.path("text").asText("");
                return "        assertTrue(driver.findElement(By.tagName(\"body\")).getText().contains(\"" + expectedText + "\"));";
            case "assertUrl":
                return "        assertTrue(driver.getCurrentUrl().contains(\"" + action.path("url").asText("") + "\"));";
            case "screenshot":
                return "        // Screenshot path: " + action.path("path").asText("screenshots/generated.png");
            default:
                return "        // Unsupported action";
        }
    }

    private String renderCoverage(Path repoRoot, JsonNode tasks) throws Exception {
        List<String> existingTests = Files.exists(repoRoot.resolve("src/test/java"))
            ? Files.walk(repoRoot.resolve("src/test/java"))
                .filter(path -> path.toString().endsWith("Test.java"))
                .map(path -> repoRoot.relativize(path).toString().replace("\\", "/"))
                .sorted()
                .collect(Collectors.toList())
            : List.of();

        List<String> missing = new ArrayList<>();
        for (JsonNode task : tasks) {
            String taskName = toMethodName(task.path("name").asText(task.get("url").asText()));
            boolean present = existingTests.stream().anyMatch(test -> test.toLowerCase().contains(taskName.toLowerCase()));
            if (!present) {
                missing.add(task.path("name").asText(task.get("url").asText()));
            }
        }

        List<String> lines = new ArrayList<>();
        lines.add("## Selenium Java Coverage Report");
        lines.add("");
        lines.add("### Covered");
        for (String test : existingTests) {
            lines.add("- [x] " + test);
        }
        lines.add("");
        lines.add("### Missing");
        if (missing.isEmpty()) {
            lines.add("- [x] No obvious gaps detected");
        } else {
            for (String item : missing) {
                lines.add("- [ ] " + item);
            }
        }
        lines.add("");
        return String.join("\n", lines);
    }

    private String toMethodName(String value) {
        String cleaned = value.replaceAll("[^A-Za-z0-9]+", " ").trim();
        String[] parts = cleaned.split("\\s+");
        StringBuilder builder = new StringBuilder("test");
        for (String part : parts) {
            if (part.isEmpty()) {
                continue;
            }
            builder.append(part.substring(0, 1).toUpperCase()).append(part.substring(1));
        }
        return builder.toString();
    }
}
