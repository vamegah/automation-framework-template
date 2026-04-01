package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.LocatorCandidate;
import com.example.enterprise.EnterpriseModels.SelfHealingRequest;
import com.example.enterprise.EnterpriseModels.SelfHealingResult;

import java.util.Comparator;
import java.util.List;

public class EnterpriseSelfHealing {
    public SelfHealingResult suggest(SelfHealingRequest request) {
        SelfHealingResult result = new SelfHealingResult();
        LocatorCandidate best = request.candidates.stream()
            .max(Comparator.comparingInt(this::scoreCandidate))
            .orElse(null);

        if (best == null) {
            result.shouldHeal = false;
            result.confidence = 0;
            result.reason = "No replacement locators were provided for healing.";
            return result;
        }

        int confidence = Math.min(100, scoreCandidate(best));
        result.shouldHeal = confidence >= 45;
        result.healedLocator = "css".equals(best.strategy) ? "By.css(\"" + best.locator + "\")" : best.locator;
        result.confidence = confidence;
        result.reason = inferReason(best, request.failureMessage);
        result.patch = List.of(
            "File: " + request.pageObjectPath,
            "Replace locator " + request.failingLocator,
            "With locator " + result.healedLocator
        );
        return result;
    }

    private int scoreCandidate(LocatorCandidate candidate) {
        int strategyWeight;
        if ("role".equals(candidate.strategy)) {
            strategyWeight = 40;
        } else if ("label".equals(candidate.strategy)) {
            strategyWeight = 34;
        } else if ("testid".equals(candidate.strategy)) {
            strategyWeight = 30;
        } else if ("text".equals(candidate.strategy)) {
            strategyWeight = 20;
        } else {
            strategyWeight = 12;
        }
        int visibility = candidate.visible ? 15 : 0;
        int stability = candidate.stable ? 20 : 0;
        int semantics = (candidate.attributes.containsKey("name") || candidate.attributes.containsKey("label")) ? 10 : 0;
        return strategyWeight + visibility + stability + semantics;
    }

    private String inferReason(LocatorCandidate candidate, String failureMessage) {
        if (failureMessage != null && failureMessage.matches("(?is).*(strict mode|resolved to \\d+ elements).*")) {
            return "The failing locator appears ambiguous. " + candidate.strategy + " locator " + candidate.locator + " is more specific.";
        }
        if (failureMessage != null && failureMessage.matches("(?is).*(not found|waiting for selector|locator resolved to 0).*")) {
            return "The original locator no longer matches the DOM. " + candidate.locator + " was found as a stable replacement.";
        }
        return "Selected " + candidate.locator + " because it has the strongest stable semantics among the discovered candidates.";
    }
}
