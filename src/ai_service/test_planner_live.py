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

load_dotenv()

from src.ai_service.agents.domain_models import (
    InspectionSnapshot,
    InspectionPhotoRef,
)
from src.ai_service.agents.planner_models import (
    DisputeContext,
    DisputeWorkflowState,
    WorkflowResolutionState,
)
from src.ai_service.agents.planner_agent import PlannerAgent


def test_planner_live():
    print("=" * 75)
    print("TESTING COMPONENT 3: PLANNER & COORDINATOR AGENT (LANGGRAPH WORKFLOW)")
    print("=" * 75)

    planner = PlannerAgent()
    print(f"[Config] Planner Agent Model: {planner.model_name}")
    print(f"[Config] Engine Mode: {'Gemini AI Orchestrator' if planner.llm else 'Deterministic State Graph'}")
    print("-" * 75)

    # 1. Dispute Scenario
    print("\n[Scenario] Renter disputes damaged Rotary Hammer return")
    print("           Deposit: LKR 10,000 | Replacement Value: LKR 45,000")

    context = DisputeContext(
        claim_id="CLM-7001",
        booking_id="BKG-3001",
        equipment_id="EQ-DRILL-01",
        equipment_title="Bosch Professional GBH 8-45 D Rotary Hammer",
        category_name="Power Tools",
        daily_rate=3500.0,
        replacement_value=45000.0,
        security_deposit_amount=10000.0,
        dispute_description="Tool returned with deeply cracked motor casing and burnt smoke on trigger pull.",
        renter_id="USR-RENTER-99",
        owner_id="USR-OWNER-88",
        pre_rental_inspection=InspectionSnapshot(
            inspection_type="PreRental",
            condition_notes="Motor casing pristine, power cord flexible, operational test passed.",
            photos=[InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/pre/casing.jpg")],
            accumulated_rental_days=15,
        ),
        post_rental_inspection=InspectionSnapshot(
            inspection_type="PostRental",
            condition_notes="Deep casing fracture near switch, exposed wiring, burnt motor smell.",
            photos=[InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/post/cracked.jpg")],
            accumulated_rental_days=18,
        ),
    )

    # Step 1: Generate Sequential Dispute Resolution Plan
    print("\n>>> Step 1: Planner Agent generates sequential resolution plan...")
    plan = planner.generate_plan(context)
    print(f"    Total Plan Steps: {len(plan.steps)}")
    for s in plan.steps:
        print(f"    - [{s.step_id}] Target: {s.target_agent.value} | {s.description}")

    # Step 2: Build and execute LangGraph dispute graph
    print("\n>>> Step 2: Executing multi-agent LangGraph workflow graph...")
    graph = planner.build_dispute_graph()

    initial_state: DisputeWorkflowState = {
        "claim_id": context.claim_id,
        "booking_id": context.booking_id,
        "equipment_id": context.equipment_id,
        "equipment_title": context.equipment_title,
        "category_name": context.category_name,
        "daily_rate": context.daily_rate,
        "replacement_value": context.replacement_value,
        "security_deposit_amount": context.security_deposit_amount,
        "dispute_description": context.dispute_description,
        "renter_id": context.renter_id,
        "owner_id": context.owner_id,
        "pre_rental_inspection": context.pre_rental_inspection.model_dump(),
        "post_rental_inspection": context.post_rental_inspection.model_dump(),
        "audit_trail": []
    }

    graph_state = graph.invoke(initial_state)
    print(f"    Workflow State:          {graph_state.get('resolution_state')}")
    print(f"    Halted for Staff Review: {graph_state.get('is_halted_for_human_approval')}")
    print(f"    Damage Classified:       {graph_state.get('damage_category')}")
    print(f"    Proposed Deduction:      LKR {graph_state.get('proposed_deduction', 0.0):,.2f}")

    # Step 3: Inspect AI Proposed Settlement Dossier
    dossier_data = graph_state.get("arbitration_dossier")
    if dossier_data:
        print("\n>>> Step 3: AI Arbitration Dossier generated:")
        print(f"    - Damage Classification: {dossier_data.get('damage_classification')}")
        print(f"    - Severity Score:        {dossier_data.get('severity_score')}/100")
        print(f"    - Proposed Deduction:    LKR {dossier_data.get('proposed_deduction', 0.0):,.2f}")
        print(f"    - Owner Payout Amount:   LKR {dossier_data.get('recommended_owner_payout', 0.0):,.2f}")
        print(f"    - Renter Refund Amount:  LKR {dossier_data.get('recommended_renter_refund', 0.0):,.2f}")

    # Step 4: Simulate Human Review Decision on Web Portal (Human-in-the-Loop)
    print("\n>>> Step 4: Simulating Staff Adjudication on Web Portal (Human-in-the-Loop)...")
    graph_state["human_review_decision"] = "Approve"
    settled_state = planner.adjudicate_human_decision(graph_state)
    print(f"    Staff Review Action:     {settled_state.get('human_review_decision')}")
    print(f"    Final Resolution:        {settled_state.get('resolution_state')}")
    print(f"    Final Owner Payout:      LKR {settled_state.get('owner_payout_amount', 0.0):,.2f}")
    print(f"    Final Renter Refund:     LKR {settled_state.get('renter_refund_amount', 0.0):,.2f}")

    print("\n" + "=" * 75)
    print("SUCCESS: Component 3 Planner Agent & LangGraph workflow verified!")
    print("=" * 75)


if __name__ == "__main__":
    test_planner_live()
