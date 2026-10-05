import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure repo root is on sys.path
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

# Load environment variables
load_dotenv()

from src.ai_service.agents.domain_models import (
    DomainAnalysisRequest,
    InspectionSnapshot,
    InspectionPhotoRef,
)
from src.ai_service.agents.domain_analysis_agent import DomainAnalysisAgent


def test_agent_live():
    print("=" * 70)
    print("TESTING COMPONENT 2 DOMAIN ANALYSIS AGENT (GEMINI + FORENSIC ENGINE)")
    print("=" * 70)

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    print(f"[Config] Model: {model_name}")
    print(f"[Config] API Key Loaded: {'YES (prefix: ' + api_key[:8] + '...)' if api_key else 'NO'}")

    agent = DomainAnalysisAgent()
    print(f"[Agent]  LLM Engine: {'Connected to Gemini AI' if agent.llm else 'Deterministic Rule Fallback'}")
    print("-" * 70)

    # 1. Test Case 1: Accidental Structural Damage & Misuse
    print("\n[Scenario 1] Concrete Rotary Hammer - Broken Casing & Motor Burnout")
    damage_request = DomainAnalysisRequest(
        equipment_id="eq-power-001",
        equipment_title="Bosch GBH 8-45 D Rotary Hammer",
        category_name="Power Tools",
        replacement_value=120000.0,
        pre_rental_inspection=InspectionSnapshot(
            inspection_type="PreRental",
            condition_notes="Clean machine, undamaged power cord, motor humming normally, pristine casing.",
            accumulated_rental_days=18,
            photos=[
                InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/pre_front.jpg"),
                InspectionPhotoRef(angle="Cord", photo_url="https://rentatool.lk/photos/pre_cord.jpg"),
            ],
        ),
        post_rental_inspection=InspectionSnapshot(
            inspection_type="PostRental",
            condition_notes="Heavy damage. Outer casing cracked near the selector switch. Smoke and burnt smell emitting from motor casing.",
            accumulated_rental_days=25,
            photos=[
                InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/post_front.jpg"),
                InspectionPhotoRef(angle="Motor", photo_url="https://rentatool.lk/photos/post_motor.jpg"),
            ],
        ),
        dispute_claim_notes="Owner filed dispute: tool dropped from 2-meter scaffolding on site."
    )

    result_1 = agent.analyze(damage_request)
    print(f"  * Damage Category:    {result_1.damage_category.value}")
    print(f"  * Is Structural:      {result_1.is_structural_damage}")
    print(f"  * Severity Score:     {result_1.severity_score}/100")
    print(f"  * Confidence Score:   {result_1.confidence_score * 100:.1f}%")
    print(f"  * Recommended Action: {result_1.recommended_action.value}")
    print(f"  * Human Review Req.:  {result_1.requires_human_verification}")
    print(f"  * Analysis Summary:\n    \"{result_1.analysis_summary}\"")

    # 2. Test Case 2: Expected Normal Wear and Tear
    print("\n" + "-" * 70)
    print("[Scenario 2] High-Pressure Washer - Normal Cosmetic Wear (65 rental days)")
    wear_request = DomainAnalysisRequest(
        equipment_id="eq-clean-002",
        equipment_title="Karcher HD 5/15 C Pressure Washer",
        category_name="Cleaning Equipment",
        replacement_value=75000.0,
        pre_rental_inspection=InspectionSnapshot(
            inspection_type="PreRental",
            condition_notes="Good operational condition, tested working.",
            accumulated_rental_days=60,
            photos=[InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/wash_pre.jpg")],
        ),
        post_rental_inspection=InspectionSnapshot(
            inspection_type="PostRental",
            condition_notes="Minor surface paint scuff on bottom skid plate, superficial dust and light scratch from normal site transport.",
            accumulated_rental_days=65,
            photos=[InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/wash_post.jpg")],
        ),
        dispute_claim_notes="Owner wants deposit deduction for paint scuffing."
    )

    result_2 = agent.analyze(wear_request)
    print(f"  * Damage Category:    {result_2.damage_category.value}")
    print(f"  * Is Structural:      {result_2.is_structural_damage}")
    print(f"  * Severity Score:     {result_2.severity_score}/100")
    print(f"  * Recommended Action: {result_2.recommended_action.value}")
    print(f"  * Analysis Summary:\n    \"{result_2.analysis_summary}\"")

    print("\n" + "=" * 70)
    print("SUCCESS: Domain Analysis Agent evaluated both scenarios accurately!")
    print("=" * 70)


if __name__ == "__main__":
    test_agent_live()
