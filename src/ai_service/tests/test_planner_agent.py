import pytest
from datetime import datetime, timezone
from src.ai_service.agents.domain_models import (
    DamageCategory,
    InspectionPhotoRef,
    InspectionSnapshot,
)
from src.ai_service.agents.planner_models import (
    DisputeContext,
    DisputeTargetAgent,
    DisputeWorkflowState,
    WorkflowResolutionState,
)
from src.ai_service.agents.planner_agent import PlannerAgent


@pytest.fixture
def planner_agent():
    return PlannerAgent()


@pytest.fixture
def sample_pre_inspection():
    return InspectionSnapshot(
        inspection_type="PreRental",
        condition_notes="Pre-rental handover: Motor casing pristine, power cord flexible, motor running optimal.",
        photos=[
            InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/pre/casing.jpg"),
            InspectionPhotoRef(angle="Motor", photo_url="https://rentatool.lk/photos/pre/motor.jpg"),
        ],
        accumulated_rental_days=20,
    )


@pytest.fixture
def sample_structural_dispute_context(sample_pre_inspection):
    return DisputeContext(
        claim_id="CLM-1001",
        booking_id="BKG-5001",
        equipment_id="EQ-DRILL-01",
        equipment_title="Bosch Professional Rotary Hammer",
        category_name="Power Tools",
        daily_rate=2500.0,
        replacement_value=45000.0,
        security_deposit_amount=10000.0,
        dispute_description="Tool returned with deeply cracked motor casing and burnt smell upon motor ignition.",
        renter_id="USR-RENTER-01",
        owner_id="USR-OWNER-01",
        pre_rental_inspection=sample_pre_inspection,
        post_rental_inspection=InspectionSnapshot(
            inspection_type="PostRental",
            condition_notes="Deep crack on motor casing, exposed coil wire, motor burnt.",
            photos=[
                InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/post/casing_cracked.jpg")
            ],
            accumulated_rental_days=23,
        ),
    )


@pytest.fixture
def sample_wear_and_tear_context(sample_pre_inspection):
    return DisputeContext(
        claim_id="CLM-1002",
        booking_id="BKG-5002",
        equipment_id="EQ-WASHER-02",
        equipment_title="Karcher Pressure Washer",
        category_name="Cleaning",
        daily_rate=3000.0,
        replacement_value=60000.0,
        security_deposit_amount=12000.0,
        dispute_description="Owner claims dirt and minor cosmetic scuff marks on handle.",
        renter_id="USR-RENTER-02",
        owner_id="USR-OWNER-02",
        pre_rental_inspection=sample_pre_inspection,
        post_rental_inspection=InspectionSnapshot(
            inspection_type="PostRental",
            condition_notes="Superficial scuff marks, cosmetic dust. Machine functions perfectly.",
            photos=[
                InspectionPhotoRef(angle="General", photo_url="https://rentatool.lk/photos/post/scuff.jpg")
            ],
            accumulated_rental_days=24,
        ),
    )


class TestPlannerAgent:

    def test_deterministic_plan_generation(self, planner_agent, sample_structural_dispute_context):
        plan = planner_agent.generate_plan(sample_structural_dispute_context)

        assert plan is not None
        assert plan.claim_id == "CLM-1001"
        assert plan.booking_id == "BKG-5001"
        assert len(plan.steps) == 5

        step_ids = [s.step_id for s in plan.steps]
        assert "STEP_01_BASELINES" in step_ids
        assert "STEP_02_FORENSIC_DELTA_ANALYSIS" in step_ids
        assert "STEP_03_TOOL_REPAIR_CALCULATION" in step_ids
        assert "STEP_04_SAFETY_CAP_AUDIT" in step_ids
        assert "STEP_05_HUMAN_APPROVAL_PAUSE" in step_ids

        # Verify agent role assignments match rubric
        assert plan.steps[1].target_agent == DisputeTargetAgent.DOMAIN_ANALYSIS_AGENT
        assert plan.steps[2].target_agent == DisputeTargetAgent.ACTION_AGENT
        assert plan.steps[3].target_agent == DisputeTargetAgent.VALIDATION_AGENT
        assert plan.steps[4].target_agent == DisputeTargetAgent.HUMAN_OPERATIONS

    def test_compile_arbitration_dossier_caps_at_deposit(self, planner_agent):
        state: DisputeWorkflowState = {
            "claim_id": "CLM-99",
            "booking_id": "BKG-99",
            "equipment_title": "Heavy Drill",
            "category_name": "Power Tools",
            "dispute_description": "Damaged chuck",
            "security_deposit_amount": 5000.0,
            "proposed_deduction": 8500.0,  # Exceeds deposit of 5000
            "pre_rental_inspection": {"condition_notes": "All pristine"},
            "post_rental_inspection": {"condition_notes": "Chuck broken"},
            "damage_category": "ACCIDENTAL_STRUCTURAL_DAMAGE",
        }

        dossier = planner_agent.compile_arbitration_dossier(state)

        assert dossier.proposed_deduction == 5000.0  # Capped to deposit
        assert dossier.recommended_owner_payout == 5000.0
        assert dossier.recommended_renter_refund == 0.0

    def test_langgraph_dispute_execution_structural_damage(self, planner_agent, sample_structural_dispute_context):
        """
        Tests end-to-end execution of the LangGraph dispute graph for structural damage.
        Verifies sequential progression and persistent pause at 'PendingStaffApproval'.
        """
        graph = planner_agent.build_dispute_graph()

        initial_state: DisputeWorkflowState = {
            "claim_id": sample_structural_dispute_context.claim_id,
            "booking_id": sample_structural_dispute_context.booking_id,
            "equipment_id": sample_structural_dispute_context.equipment_id,
            "equipment_title": sample_structural_dispute_context.equipment_title,
            "category_name": sample_structural_dispute_context.category_name,
            "daily_rate": sample_structural_dispute_context.daily_rate,
            "replacement_value": sample_structural_dispute_context.replacement_value,
            "security_deposit_amount": sample_structural_dispute_context.security_deposit_amount,
            "dispute_description": sample_structural_dispute_context.dispute_description,
            "renter_id": sample_structural_dispute_context.renter_id,
            "owner_id": sample_structural_dispute_context.owner_id,
            "pre_rental_inspection": sample_structural_dispute_context.pre_rental_inspection.model_dump(),
            "post_rental_inspection": sample_structural_dispute_context.post_rental_inspection.model_dump(),
            "audit_trail": []
        }

        # Run until the human approval breakpoint
        final_state = graph.invoke(initial_state)

        assert final_state["resolution_state"] == WorkflowResolutionState.PENDING_STAFF_APPROVAL.value
        assert final_state["is_halted_for_human_approval"] is True
        assert final_state["is_structural_damage"] is True
        assert final_state["proposed_deduction"] > 0.0
        assert final_state["arbitration_dossier"] is not None

        # Verify audit trail recorded all agent milestones
        audit_nodes = [entry["node"] for entry in final_state["audit_trail"]]
        assert "planner_init" in audit_nodes
        assert "domain_analysis" in audit_nodes
        assert "action_tool" in audit_nodes
        assert "validation_safety" in audit_nodes
        assert "planner_compile" in audit_nodes

    def test_langgraph_wear_and_tear_branching(self, planner_agent, sample_wear_and_tear_context):
        """
        Tests dynamic branching in LangGraph when Domain Analysis detects standard wear-and-tear:
        Planner must bypass repair deduction tools and set proposed deduction to LKR 0.
        """
        graph = planner_agent.build_dispute_graph()

        initial_state: DisputeWorkflowState = {
            "claim_id": sample_wear_and_tear_context.claim_id,
            "booking_id": sample_wear_and_tear_context.booking_id,
            "equipment_id": sample_wear_and_tear_context.equipment_id,
            "equipment_title": sample_wear_and_tear_context.equipment_title,
            "category_name": sample_wear_and_tear_context.category_name,
            "daily_rate": sample_wear_and_tear_context.daily_rate,
            "replacement_value": sample_wear_and_tear_context.replacement_value,
            "security_deposit_amount": sample_wear_and_tear_context.security_deposit_amount,
            "dispute_description": sample_wear_and_tear_context.dispute_description,
            "renter_id": sample_wear_and_tear_context.renter_id,
            "owner_id": sample_wear_and_tear_context.owner_id,
            "pre_rental_inspection": sample_wear_and_tear_context.pre_rental_inspection.model_dump(),
            "post_rental_inspection": sample_wear_and_tear_context.post_rental_inspection.model_dump(),
            "audit_trail": []
        }

        final_state = graph.invoke(initial_state)

        # In wear-and-tear, action_tool is bypassed, and deduction must be zero
        assert final_state["is_structural_damage"] is False
        assert final_state["damage_category"] == DamageCategory.NORMAL_WEAR_AND_TEAR.value
        assert final_state["proposed_deduction"] == 0.0

        dossier = final_state["arbitration_dossier"]
        assert dossier["proposed_deduction"] == 0.0
        assert dossier["recommended_owner_payout"] == 0.0
        assert dossier["recommended_renter_refund"] == sample_wear_and_tear_context.security_deposit_amount

    def test_human_adjudication_approve_decision(self, planner_agent):
        """
        Tests the human adjudication node when the staff manager approves the AI deduction.
        """
        state: DisputeWorkflowState = {
            "claim_id": "CLM-500",
            "security_deposit_amount": 10000.0,
            "proposed_deduction": 4500.0,
            "human_review_decision": "Approve",
            "audit_trail": []
        }

        result = planner_agent.adjudicate_human_decision(state)

        assert result["final_deduction"] == 4500.0
        assert result["owner_payout_amount"] == 4500.0
        assert result["renter_refund_amount"] == 5500.0
        assert result["resolution_state"] == WorkflowResolutionState.SETTLED.value
        assert result["is_halted_for_human_approval"] is False

    def test_human_adjudication_reject_decision(self, planner_agent):
        """
        Tests the human adjudication node when the staff manager rejects the claim.
        Final deduction is 0.0 and renter receives a 100% refund.
        """
        state: DisputeWorkflowState = {
            "claim_id": "CLM-501",
            "security_deposit_amount": 8000.0,
            "proposed_deduction": 3500.0,
            "human_review_decision": "Reject",
            "audit_trail": []
        }

        result = planner_agent.adjudicate_human_decision(state)

        assert result["final_deduction"] == 0.0
        assert result["owner_payout_amount"] == 0.0
        assert result["renter_refund_amount"] == 8000.0
        assert result["resolution_state"] == WorkflowResolutionState.SETTLED.value

    def test_human_adjudication_revise_decision(self, planner_agent):
        """
        Tests the human adjudication node when the staff manager adjusts the deduction.
        """
        state: DisputeWorkflowState = {
            "claim_id": "CLM-502",
            "security_deposit_amount": 10000.0,
            "proposed_deduction": 6000.0,
            "human_review_decision": "Revise",
            "revised_deduction": 4000.0,
            "audit_trail": []
        }

        result = planner_agent.adjudicate_human_decision(state)

        assert result["final_deduction"] == 4000.0
        assert result["owner_payout_amount"] == 4000.0
        assert result["renter_refund_amount"] == 6000.0
        assert result["resolution_state"] == WorkflowResolutionState.SETTLED.value

    def test_llm_failover_to_deterministic_engine(self, sample_structural_dispute_context):
        """
        Verifies that when LLM fails or encounters an error, the agent seamlessly
        falls back to the deterministic planning engine without crashing.
        """
        agent = PlannerAgent()
        agent.llm = "mock_invalid_llm"  # Forces exception when calling .invoke()

        plan = agent.generate_plan(sample_structural_dispute_context)

        assert plan is not None
        assert len(plan.steps) == 5
        assert plan.claim_id == sample_structural_dispute_context.claim_id

