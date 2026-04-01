from src.enterprise.models import LocatorCandidate, SelfHealingRequest, SelfHealingResult


class EnterpriseSelfHealing:
    def suggest(self, request: SelfHealingRequest) -> SelfHealingResult:
        if not request.candidates:
            return SelfHealingResult(
                should_heal=False,
                confidence=0,
                reason="No replacement locators were provided for healing.",
                patch=[],
            )

        best = max(request.candidates, key=self._score_candidate)
        confidence = min(100, self._score_candidate(best))
        healed_locator = best.locator if best.strategy != "css" else f"('{best.locator}')"

        return SelfHealingResult(
            should_heal=confidence >= 45,
            healed_locator=healed_locator,
            confidence=confidence,
            reason=self._infer_reason(best, request.failure_message),
            patch=[
                f"File: {request.page_object_path}",
                f"Replace locator {request.failing_locator}",
                f"With locator {healed_locator}",
            ],
        )

    def _score_candidate(self, candidate: LocatorCandidate) -> int:
        strategy_weight = {
            "role": 40,
            "label": 34,
            "testid": 30,
            "text": 20,
            "css": 12,
        }.get(candidate.strategy, 12)
        visibility = 15 if candidate.visible else 0
        stability = 20 if candidate.stable else 0
        semantics = 10 if candidate.attributes.get("name") or candidate.attributes.get("label") else 0
        return strategy_weight + visibility + stability + semantics

    def _infer_reason(self, candidate: LocatorCandidate, failure_message: str) -> str:
        lowered = failure_message.lower()
        if "strict mode" in lowered or "resolved to 2 elements" in lowered:
            return f"The failing locator appears ambiguous. {candidate.strategy} locator {candidate.locator} is more specific."
        if "not found" in lowered or "resolved to 0" in lowered:
            return f"The original locator no longer matches the DOM. {candidate.locator} was found as a stable replacement."
        return f"Selected {candidate.locator} because it has the strongest stable semantics among the discovered candidates."
