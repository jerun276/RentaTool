from __future__ import annotations

import os
import json
import logging
from typing import Any, Dict, List, Optional

from src.ai_service.agents.domain_models import (
    ComponentFinding,
    DamageCategory,
    DomainAnalysisRequest,
    DomainAnalysisResult,
    RecommendedAction,
)
from src.ai_service.tools.domain_tools import EquipmentWearToleranceTool

logger = logging.getLogger("DomainAnalysisAgent")


class DomainAnalysisAgent:
    """
    Component 2: Equipment Catalog & Asset Condition Inspection
    Owner: Student 2 (Jerun)

    Responsibility:
    Classifies visual and textual condition deltas between pre-rental and post-rental
    inspections to distinguish expected wear-and-tear from accidental structural damage.
    Provides structured forensic assessment for dispute triage.
    """

    STRUCTURAL_DAMAGE_KEYWORDS = {
        "crack": 45, "broken": 50, "fracture": 60, "severed": 75, "cut": 65,
        "shattered": 80, "burnt": 85, "smoke": 80, "burst": 90, "bent chassis": 65,
        "cracked casing": 70, "damaged motor": 85, "frayed": 60, "exposed wire": 70
    }

    MISUSE_KEYWORDS = {
        "water ingress": 80, "ran without oil": 95, "thermal overload": 75,
        "submerged": 90, "wrong fuel": 90, "dropped from height": 70
    }

    NORMAL_WEAR_KEYWORDS = [
        "scuff", "light scratch", "superficial", "dust", "dirt",
        "paint fade", "minor scuff", "slight cosmetic", "normal wear"
    ]

    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.llm = None
        self._initialize_llm()

    def _initialize_llm(self) -> None:
        """Attempts to initialize the Gemini LLM if package and credentials are present."""
        if not self.api_key:
            logger.info("No Gemini API key provided. Using deterministic forensic engine.")
            return

        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model=self.model_name,
                google_api_key=self.api_key,
                temperature=0.1
            )
            logger.info(f"Gemini LLM initialized with model {self.model_name}")
        except Exception as e:
            logger.warning(f"Could not initialize ChatGoogleGenerativeAI: {e}. Falling back to deterministic engine.")
            self.llm = None

    def analyze(self, request: DomainAnalysisRequest) -> DomainAnalysisResult:
        """
        Executes forensic delta analysis between pre-rental and post-rental inspections.
        Uses Gemini LLM when available, with automatic failover to the deterministic engine.
        """
        if self.llm:
            try:
                return self._llm_multimodal_analysis(request)
            except Exception as ex:
                logger.warning(f"LLM analysis failed with error: {ex}. Engaging deterministic engine.")

        return self._deterministic_rule_analysis(request)

    def _deterministic_rule_analysis(self, request: DomainAnalysisRequest) -> DomainAnalysisResult:
        """
        Deterministic rule-based forensic analysis engine.
        Evaluates condition notes, photo angle coverage, and category wear factors.
        """
        pre_notes = request.pre_rental_inspection.condition_notes.lower()
        post_notes = request.post_rental_inspection.condition_notes.lower()
        claim_notes = (request.dispute_claim_notes or "").lower()
        combined_post = f"{post_notes} {claim_notes}"

        tolerance, is_crit, wear_explanation = EquipmentWearToleranceTool.calculate_wear_tolerance(
            request.category_name,
            request.post_rental_inspection.accumulated_rental_days,
            component_name="General"
        )

        findings: List[ComponentFinding] = []
        affected_components: List[str] = []
        detected_structural_keywords: List[str] = []
        detected_misuse_keywords: List[str] = []
        detected_wear_keywords: List[str] = []
        max_defect_severity = 0.0

        # Component checks: Casing, Cord, Motor
        components_to_check = [
            ("Casing", "Outer housing and protective body"),
            ("Power Cord", "Electrical cable, wiring and plug"),
            ("Motor", "Engine / Drive unit and internal rotor"),
            ("Chassis", "Base frame and mechanical mounting")
        ]

        for comp_name, comp_role in components_to_check:
            comp_key = comp_name.lower()
            comp_mentioned = comp_key in pre_notes or comp_key in combined_post

            comp_pre = "Pristine, clean, no damage" if comp_key in pre_notes and "damage" not in pre_notes else "Inspected"
            comp_post = "Intact"
            is_damaged = False
            is_wear = False
            defect_desc = "No damage detected"
            repair_ratio = 0.0

            # Check for structural damage on component (evaluate all matches, pick highest severity)
            best_kw = None
            best_sev = 0.0
            for kw, sev in self.STRUCTURAL_DAMAGE_KEYWORDS.items():
                if kw in combined_post and (comp_key in combined_post or len(combined_post) < 120):
                    is_damaged = True
                    if sev > best_sev:
                        best_sev = float(sev)
                        best_kw = kw
                    if kw not in detected_structural_keywords:
                        detected_structural_keywords.append(kw)

            if best_kw:
                comp_post = f"Defective: {best_kw} identified"
                defect_desc = f"Identified {best_kw} affecting {comp_name}"
                repair_ratio = best_sev / 100.0 * 0.4
                max_defect_severity = max(max_defect_severity, best_sev)

            # Check for misuse on component (evaluate all matches, pick highest severity)
            best_m_kw = None
            best_m_sev = 0.0
            for m_kw, m_sev in self.MISUSE_KEYWORDS.items():
                if m_kw in combined_post and (comp_key in combined_post or "motor" in comp_key):
                    is_damaged = True
                    if m_sev > best_m_sev:
                        best_m_sev = float(m_sev)
                        best_m_kw = m_kw
                    if m_kw not in detected_misuse_keywords:
                        detected_misuse_keywords.append(m_kw)

            if best_m_kw:
                comp_post = f"Failure: {best_m_kw}"
                defect_desc = f"Identified operational misuse: {best_m_kw}"
                repair_ratio = best_m_sev / 100.0 * 0.6
                max_defect_severity = max(max_defect_severity, best_m_sev)

            # Check for normal wear keywords
            if not is_damaged:
                for w_kw in self.NORMAL_WEAR_KEYWORDS:
                    if w_kw in combined_post:
                        is_wear = True
                        comp_post = f"Cosmetic wear: {w_kw}"
                        defect_desc = f"Minor cosmetic wear: {w_kw}"
                        repair_ratio = 0.0
                        if w_kw not in detected_wear_keywords:
                            detected_wear_keywords.append(w_kw)
                        break

            if is_damaged or is_wear:
                findings.append(ComponentFinding(
                    component_name=comp_name,
                    pre_condition=comp_pre,
                    post_condition=comp_post,
                    is_damaged=is_damaged,
                    is_wear_and_tear=is_wear,
                    defect_description=defect_desc,
                    estimated_repair_cost_ratio=repair_ratio
                ))
                if is_damaged:
                    affected_components.append(comp_name)

        # Classification decision logic
        if detected_misuse_keywords:
            damage_category = DamageCategory.MISUSE_OR_NEGLIGENCE
            is_structural = True
            severity_score = min(100.0, max_defect_severity)
            confidence_score = 0.90
            action = (
                RecommendedAction.FULL_REPLACEMENT_CLAIM
                if severity_score >= 80.0
                else RecommendedAction.PARTIAL_REPAIR_CLAIM
            )
            summary = (
                f"Dispute analysis confirms MISUSE / OPERATIONAL NEGLIGENCE on {request.equipment_title}. "
                f"Evidence indicates {', '.join(detected_misuse_keywords)}. "
                f"Defect is beyond warranty and standard wear allowances."
            )

        elif detected_structural_keywords:
            damage_category = DamageCategory.ACCIDENTAL_STRUCTURAL_DAMAGE
            is_structural = True
            severity_score = min(100.0, max_defect_severity)
            confidence_score = 0.92
            action = (
                RecommendedAction.FULL_REPLACEMENT_CLAIM
                if severity_score >= 75.0
                else RecommendedAction.PARTIAL_REPAIR_CLAIM
            )
            summary = (
                f"Forensic delta indicates ACCIDENTAL STRUCTURAL DAMAGE on {request.equipment_title}. "
                f"Components affected: {', '.join(affected_components or ['General Body'])}. "
                f"Identified defects: {', '.join(detected_structural_keywords)}. "
                f"Structural damage is non-wear and warrants a deposit deduction claim."
            )

        elif detected_wear_keywords or (not is_damaged and len(combined_post) > 10):
            damage_category = DamageCategory.NORMAL_WEAR_AND_TEAR
            is_structural = False
            severity_score = min(20.0, 10.0 + (5.0 if request.post_rental_inspection.accumulated_rental_days >= 60 else 0.0))
            confidence_score = 0.88
            action = RecommendedAction.NO_DEDUCTION_STANDARD_WEAR
            summary = (
                f"Observed condition delta represents NORMAL WEAR-AND-TEAR for {request.equipment_title}. "
                f"Evidence shows superficial cosmetic wear ({', '.join(detected_wear_keywords or ['minor surface scuffs'])}). "
                f"{wear_explanation} No security deposit deduction justified."
            )

        else:
            damage_category = DamageCategory.UNDETERMINED
            is_structural = False
            severity_score = 0.0
            confidence_score = 0.40
            action = RecommendedAction.MANUAL_STAFF_INSPECTION_REQUIRED
            summary = (
                f"Insufficient condition delta evidence between pre- and post-rental inspection for {request.equipment_title}. "
                f"Manual staff arbitration required."
            )

        return DomainAnalysisResult(
            equipment_id=request.equipment_id,
            is_structural_damage=is_structural,
            damage_category=damage_category,
            severity_score=round(severity_score, 1),
            confidence_score=round(confidence_score, 2),
            affected_components=affected_components,
            findings=findings,
            analysis_summary=summary,
            recommended_action=action,
            wear_tolerance_factor=round(tolerance, 2),
            requires_human_verification=(confidence_score < 0.70 or is_structural)
        )

    def _llm_multimodal_analysis(self, request: DomainAnalysisRequest) -> DomainAnalysisResult:
        """Invokes Gemini LLM with structured prompt."""
        from langchain_core.messages import SystemMessage, HumanMessage

        system_prompt = (
            "You are the Domain Analysis Agent in the RentaTool LK dispute triage system. "
            "Your task is to analyze equipment condition deltas between pre-rental and post-rental inspections. "
            "Categorize findings into: NORMAL_WEAR_AND_TEAR, ACCIDENTAL_STRUCTURAL_DAMAGE, MISUSE_OR_NEGLIGENCE, or UNDETERMINED. "
            "You must respond with valid JSON matching the DomainAnalysisResult schema."
        )

        user_content = {
            "equipment_id": request.equipment_id,
            "equipment_title": request.equipment_title,
            "category": request.category_name,
            "replacement_value": request.replacement_value,
            "pre_rental": {
                "notes": request.pre_rental_inspection.condition_notes,
                "photos": [p.model_dump() for p in request.pre_rental_inspection.photos],
                "accumulated_days": request.pre_rental_inspection.accumulated_rental_days,
            },
            "post_rental": {
                "notes": request.post_rental_inspection.condition_notes,
                "photos": [p.model_dump() for p in request.post_rental_inspection.photos],
                "accumulated_days": request.post_rental_inspection.accumulated_rental_days,
            },
            "dispute_claim_notes": request.dispute_claim_notes
        }

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Analyze the following inspection delta:\n{json.dumps(user_content, indent=2)}")
        ]

        response = self.llm.invoke(messages)
        content_text = response.content if hasattr(response, "content") else str(response)

        # Parse JSON
        cleaned = content_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        parsed = json.loads(cleaned.strip())
        return DomainAnalysisResult(**parsed)


# ==============================================================================
# LangGraph State Node Integration
# ==============================================================================

def domain_analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph StateGraph node function for Student 2's Domain Analysis Agent.
    
    Reads dispute input from state, performs forensic delta analysis, and
    emits the structured domain analysis report into state['domain_analysis'].
    """
    agent = DomainAnalysisAgent()

    # Extract request payload from state
    dispute_data = state.get("dispute") or state.get("domain_analysis_request") or {}

    if isinstance(dispute_data, DomainAnalysisRequest):
        request = dispute_data
    elif isinstance(dispute_data, dict) and dispute_data:
        request = DomainAnalysisRequest(**dispute_data)
    else:
        # Fallback default empty request if uninitialized
        return {
            **state,
            "domain_analysis": None,
            "domain_analysis_error": "Missing or invalid dispute data in state"
        }

    result = agent.analyze(request)

    return {
        **state,
        "domain_analysis": result.model_dump(),
        "is_structural_damage": result.is_structural_damage,
        "damage_category": result.damage_category.value,
        "recommended_action": result.recommended_action.value
    }
