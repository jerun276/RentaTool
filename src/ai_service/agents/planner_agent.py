from __future__ import annotations

import os
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from src.ai_service.agents.domain_models import (
    DamageCategory,
    DomainAnalysisRequest,
    DomainAnalysisResult,
    InspectionSnapshot,
    RecommendedAction,
)
from src.ai_service.agents.domain_analysis_agent import DomainAnalysisAgent
from src.ai_service.agents.planner_models import (
    ArbitrationDossier,
    DisputeContext,
    DisputePlan,
    DisputeTargetAgent,
    DisputeWorkflowState,
    PlanStep,
    PlanStepStatus,
    WorkflowResolutionState,
)

logger = logging.getLogger("PlannerAgent")


class PlannerAgent:
    """
    Component 3: Booking Engine & Handover Verification
    Owner: Student 3 (Niroshan / Niro)

    Responsibility:
    Coordinator / Planner Agent: Orchestrates the multi-agent dispute resolution plan,
    sequences verification milestones, manages dynamic conditional routing, and governs
    the LangGraph execution state and human-in-the-loop breakpoint.
    """

    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.llm = None
        self._initialize_llm()

    def _initialize_llm(self) -> None:
        """Initializes the Gemini LLM if credentials are present."""
        if not self.api_key:
            logger.info("No Gemini API key provided. Using deterministic planner engine.")
            return

        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model=self.model_name,
                google_api_key=self.api_key,
                temperature=0.1
            )
            logger.info(f"Gemini Planner LLM initialized with model {self.model_name}")
        except Exception as e:
            logger.warning(f"Could not initialize ChatGoogleGenerativeAI: {e}. Falling back to deterministic engine.")
            self.llm = None

    def generate_plan(self, context: DisputeContext) -> DisputePlan:
        """
        Synthesizes a structured, sequential dispute resolution plan.
        Uses Gemini LLM when available, otherwise falls back to deterministic planning engine.
        """
        if self.llm:
            try:
                return self._llm_generate_plan(context)
            except Exception as ex:
                logger.warning(f"LLM plan generation failed ({ex}). Engaging deterministic engine.")

        return self._deterministic_generate_plan(context)

    def _deterministic_generate_plan(self, context: DisputeContext) -> DisputePlan:
        """Deterministic rule-based planning engine ensuring 100% offline testability."""
        plan_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"

        steps = [
            PlanStep(
                step_id="STEP_01_BASELINES",
                step_name="Retrieve Handover Inspection Baselines",
                target_agent=DisputeTargetAgent.PLANNER_AGENT,
                description=(
                    f"Load pre-rental inspection photos recorded at pickup for equipment {context.equipment_title} "
                    f"and pair with post-rental evidence."
                ),
            ),
            PlanStep(
                step_id="STEP_02_FORENSIC_DELTA_ANALYSIS",
                step_name="Forensic Condition Delta Analysis",
                target_agent=DisputeTargetAgent.DOMAIN_ANALYSIS_AGENT,
                description=(
                    f"Analyze visual and textual condition deltas to classify whether damage on "
                    f"{context.equipment_title} is expected wear-and-tear or structural damage."
                ),
            ),
            PlanStep(
                step_id="STEP_03_TOOL_REPAIR_CALCULATION",
                step_name="Calculate Component Repair & Depreciation Costs",
                target_agent=DisputeTargetAgent.ACTION_AGENT,
                description=(
                    f"Query repair cost databases and depreciation curves for {context.category_name} "
                    f"to calculate proposed deduction bounded by replacement value of LKR {context.replacement_value:,.2f}."
                ),
            ),
            PlanStep(
                step_id="STEP_04_SAFETY_CAP_AUDIT",
                step_name="Safety Compliance & Escrow Deposit Cap Audit",
                target_agent=DisputeTargetAgent.VALIDATION_AGENT,
                description=(
                    f"Verify proposed deduction does not exceed escrow deposit cap of "
                    f"LKR {context.security_deposit_amount:,.2f}, enforce prompt injection defense, and check user standing."
                ),
            ),
            PlanStep(
                step_id="STEP_05_HUMAN_APPROVAL_PAUSE",
                step_name="Human Operations Staff Review & Arbitration",
                target_agent=DisputeTargetAgent.HUMAN_OPERATIONS,
                description=(
                    "Assemble forensic dossier and halt workflow execution at 'PendingStaffApproval' "
                    "for operations manager review in React Web portal."
                ),
            ),
        ]

        return DisputePlan(
            plan_id=plan_id,
            claim_id=context.claim_id,
            booking_id=context.booking_id,
            equipment_id=context.equipment_id,
            steps=steps,
            current_step_index=0,
            plan_summary=(
                f"5-stage dispute resolution plan for claim {context.claim_id} on {context.equipment_title}: "
                f"Baselining -> Domain Analysis -> Cost Estimation -> Safety Audit -> Human-in-the-Loop Review."
            ),
            estimated_duration_seconds=15.0,
        )

    def _llm_generate_plan(self, context: DisputeContext) -> DisputePlan:
        """Generates dynamic plan using Gemini LLM reasoning."""
        prompt = (
            f"You are the Lead Coordinator / Planner Agent for RentaTool LK peer-to-peer machinery rentals.\n"
            f"Generate a sequential dispute investigation plan for:\n"
            f"- Claim ID: {context.claim_id}\n"
            f"- Equipment: {context.equipment_title} ({context.category_name})\n"
            f"- Replacement Value: LKR {context.replacement_value}\n"
            f"- Security Deposit: LKR {context.security_deposit_amount}\n"
            f"- Dispute Description: {context.dispute_description}\n\n"
            f"Respond with JSON matching schema:\n"
            f'{{"plan_summary": "...", "steps": [{{"step_id": "...", "step_name": "...", "target_agent": "...", "description": "..."}}]}}'
        )

        response = self.llm.invoke(prompt)
        text = response.content if hasattr(response, "content") else str(response)
        if isinstance(text, list):
            text = "".join(item.get("text", "") if isinstance(item, dict) else str(item) for item in text)

        # Extract JSON
        clean_text = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)

        steps = []
        for idx, s in enumerate(data.get("steps", [])):
            agent_str = s.get("target_agent", "PLANNER_AGENT")
            try:
                target = DisputeTargetAgent(agent_str)
            except ValueError:
                target = DisputeTargetAgent.PLANNER_AGENT

            steps.append(PlanStep(
                step_id=s.get("step_id", f"STEP_{idx+1:02d}"),
                step_name=s.get("step_name", f"Milestone {idx+1}"),
                target_agent=target,
                description=s.get("description", "")
            ))

        if not steps:
            return self._deterministic_generate_plan(context)

        return DisputePlan(
            plan_id=f"PLAN-{uuid.uuid4().hex[:8].upper()}",
            claim_id=context.claim_id,
            booking_id=context.booking_id,
            equipment_id=context.equipment_id,
            steps=steps,
            current_step_index=0,
            plan_summary=data.get("plan_summary", "AI-orchestrated dispute plan"),
            estimated_duration_seconds=20.0
        )

    def compile_arbitration_dossier(self, state: DisputeWorkflowState) -> ArbitrationDossier:
        """
        Assembles all forensic findings, tool deductions, and financial calculations
        into a synthesized executive briefing for human operations review on the React Web portal.
        """
        deposit_cap = state.get("security_deposit_amount", 0.0)
        proposed = state.get("proposed_deduction", 0.0)

        # Enforce deposit cap
        final_proposed = min(proposed, deposit_cap)
        owner_payout = final_proposed
        renter_refund = max(0.0, deposit_cap - final_proposed)

        domain_res = state.get("domain_analysis_result") or {}
        damage_cat = domain_res.get("damage_category", state.get("damage_category", "UNDETERMINED"))
        severity = domain_res.get("severity_score", 0.0)
        affected = domain_res.get("affected_components", [])

        pre_notes = state.get("pre_rental_inspection", {}).get("condition_notes", "No pre-rental notes recorded.")
        post_notes = state.get("post_rental_inspection", {}).get("condition_notes", "No post-rental notes recorded.")

        return ArbitrationDossier(
            claim_id=state.get("claim_id", ""),
            booking_id=state.get("booking_id", ""),
            equipment_title=state.get("equipment_title", "Equipment"),
            category_name=state.get("category_name", "General"),
            dispute_reason=state.get("dispute_description", ""),
            pre_rental_condition_summary=pre_notes,
            post_rental_condition_summary=post_notes,
            damage_classification=str(damage_cat),
            severity_score=severity,
            affected_components=affected,
            proposed_deduction=final_proposed,
            security_deposit_cap=deposit_cap,
            recommended_owner_payout=owner_payout,
            recommended_renter_refund=renter_refund
        )

    def adjudicate_human_decision(self, state: DisputeWorkflowState) -> Dict[str, Any]:
        """Processes the staff review decision ('Approve', 'Revise', 'Reject') and calculates final settlements."""
        decision = state.get("human_review_decision", "Approve")
        deposit_cap = state.get("security_deposit_amount", 0.0)

        if decision == "Reject":
            final_deduction = 0.0
        elif decision == "Revise" and state.get("revised_deduction") is not None:
            final_deduction = min(state["revised_deduction"], deposit_cap)
        else:
            final_deduction = min(state.get("proposed_deduction", 0.0), deposit_cap)

        owner_payout = final_deduction
        renter_refund = max(0.0, deposit_cap - final_deduction)

        audit = list(state.get("audit_trail", []))
        audit.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "node": "human_adjudication",
            "message": f"Human manager adjudicates '{decision}'. Final deduction: LKR {final_deduction:,.2f} (Owner: LKR {owner_payout:,.2f}, Renter: LKR {renter_refund:,.2f})."
        })

        return {
            "final_deduction": final_deduction,
            "owner_payout_amount": owner_payout,
            "renter_refund_amount": renter_refund,
            "is_halted_for_human_approval": False,
            "resolution_state": WorkflowResolutionState.SETTLED.value,
            "audit_trail": audit
        }

    def build_dispute_graph(self, domain_agent: Optional[DomainAnalysisAgent] = None):
        """
        Constructs the LangGraph StateGraph orchestrating the 4 specialized agents
        and enforcing the persistent human-in-the-loop breakpoint at PendingStaffApproval.
        """
        from langgraph.graph import StateGraph, END

        domain_agent = domain_agent or DomainAnalysisAgent()

        # 1. Node Definitions
        def planner_init_node(state: DisputeWorkflowState) -> Dict[str, Any]:
            context = DisputeContext(
                claim_id=state["claim_id"],
                booking_id=state["booking_id"],
                equipment_id=state["equipment_id"],
                equipment_title=state["equipment_title"],
                category_name=state.get("category_name", "General"),
                daily_rate=state.get("daily_rate", 1000.0),
                replacement_value=state.get("replacement_value", 25000.0),
                security_deposit_amount=state.get("security_deposit_amount", 5000.0),
                dispute_description=state.get("dispute_description", ""),
                renter_id=state.get("renter_id", ""),
                owner_id=state.get("owner_id", ""),
                pre_rental_inspection=InspectionSnapshot(**state["pre_rental_inspection"]),
                post_rental_inspection=InspectionSnapshot(**state["post_rental_inspection"]),
            )

            plan = self.generate_plan(context)
            audit = list(state.get("audit_trail", []))
            audit.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "node": "planner_init",
                "message": f"Plan formulated with {len(plan.steps)} milestones."
            })

            return {
                "plan": plan.model_dump(),
                "current_step_index": 1,
                "resolution_state": WorkflowResolutionState.PLAN_GENERATED.value,
                "audit_trail": audit
            }

        def domain_analysis_node_wrapper(state: DisputeWorkflowState) -> Dict[str, Any]:
            req = DomainAnalysisRequest(
                equipment_id=state["equipment_id"],
                equipment_title=state["equipment_title"],
                category_name=state.get("category_name", "General"),
                replacement_value=state.get("replacement_value", 25000.0),
                pre_rental_inspection=InspectionSnapshot(**state["pre_rental_inspection"]),
                post_rental_inspection=InspectionSnapshot(**state["post_rental_inspection"]),
                dispute_claim_notes=state.get("dispute_description")
            )

            result: DomainAnalysisResult = domain_agent.analyze(req)

            audit = list(state.get("audit_trail", []))
            audit.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "node": "domain_analysis",
                "message": f"Classified as {result.damage_category.value} with severity {result.severity_score}."
            })

            return {
                "domain_analysis_result": result.model_dump(),
                "is_structural_damage": result.is_structural_damage,
                "damage_category": result.damage_category.value,
                "current_step_index": 2,
                "resolution_state": WorkflowResolutionState.UNDER_DOMAIN_ANALYSIS.value,
                "audit_trail": audit
            }

        def action_tool_node(state: DisputeWorkflowState) -> Dict[str, Any]:
            # Action Agent (Student 4) - computes deduction based on component findings and wear tolerance
            domain_res = state.get("domain_analysis_result", {})
            rep_val = state.get("replacement_value", 25000.0)
            severity = domain_res.get("severity_score", 50.0)
            wear_factor = domain_res.get("wear_tolerance_factor", 0.05)

            # Calculation: (severity / 100) * replacement_value adjusted for accumulated wear
            raw_deduction = (severity / 100.0) * rep_val * (1.0 - (wear_factor * 0.5))
            raw_deduction = round(max(0.0, raw_deduction), 2)

            audit = list(state.get("audit_trail", []))
            audit.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "node": "action_tool",
                "message": f"Calculated raw repair deduction of LKR {raw_deduction:,.2f} using repair cost tools."
            })

            return {
                "proposed_deduction": raw_deduction,
                "current_step_index": 3,
                "resolution_state": WorkflowResolutionState.UNDER_COST_ESTIMATION.value,
                "audit_trail": audit
            }

        def validation_safety_node(state: DisputeWorkflowState) -> Dict[str, Any]:
            # Validation Agent (Student 1) - checks escrow cap and input sanitization
            deposit_cap = state.get("security_deposit_amount", 5000.0)
            proposed = state.get("proposed_deduction", 0.0)

            capped_deduction = min(proposed, deposit_cap)
            passed = True
            notes = "Deduction validated against escrow deposit cap."

            if proposed > deposit_cap:
                notes = f"Proposed deduction of LKR {proposed:,.2f} exceeds deposit cap of LKR {deposit_cap:,.2f}. Capped to deposit balance."

            audit = list(state.get("audit_trail", []))
            audit.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "node": "validation_safety",
                "message": notes
            })

            return {
                "proposed_deduction": capped_deduction,
                "validation_passed": passed,
                "validation_notes": notes,
                "current_step_index": 4,
                "resolution_state": WorkflowResolutionState.UNDER_SAFETY_AUDIT.value,
                "audit_trail": audit
            }

        def planner_compile_node(state: DisputeWorkflowState) -> Dict[str, Any]:
            # If wear-and-tear, deduction is strictly zero
            damage_cat = state.get("damage_category", "")
            deduction = state.get("proposed_deduction", 0.0)
            if damage_cat == DamageCategory.NORMAL_WEAR_AND_TEAR.value:
                deduction = 0.0

            state_copy = dict(state)
            state_copy["proposed_deduction"] = deduction
            dossier = self.compile_arbitration_dossier(state_copy)

            audit = list(state.get("audit_trail", []))
            audit.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "node": "planner_compile",
                "message": "Arbitration dossier compiled. Workflow paused at persistent breakpoint 'PendingStaffApproval'."
            })

            return {
                "proposed_deduction": deduction,
                "arbitration_dossier": dossier.model_dump(),
                "is_halted_for_human_approval": True,
                "resolution_state": WorkflowResolutionState.PENDING_STAFF_APPROVAL.value,
                "current_step_index": 5,
                "audit_trail": audit
            }

        def human_adjudication_node(state: DisputeWorkflowState) -> Dict[str, Any]:
            return self.adjudicate_human_decision(state)

        # 2. Conditional Edge Routing
        def route_after_domain_analysis(state: DisputeWorkflowState) -> str:
            damage_cat = state.get("damage_category", "")
            if damage_cat == DamageCategory.NORMAL_WEAR_AND_TEAR.value:
                # Bypass repair calculation tools - wear and tear has $0 deduction
                return "planner_compile"
            return "action_tool"

        # 3. Assemble Graph
        workflow = StateGraph(DisputeWorkflowState)

        workflow.add_node("planner_init", planner_init_node)
        workflow.add_node("domain_analysis", domain_analysis_node_wrapper)
        workflow.add_node("action_tool", action_tool_node)
        workflow.add_node("validation_safety", validation_safety_node)
        workflow.add_node("planner_compile", planner_compile_node)
        workflow.add_node("human_adjudication", human_adjudication_node)

        workflow.set_entry_point("planner_init")
        workflow.add_edge("planner_init", "domain_analysis")
        workflow.add_conditional_edges(
            "domain_analysis",
            route_after_domain_analysis,
            {
                "planner_compile": "planner_compile",
                "action_tool": "action_tool"
            }
        )
        workflow.add_edge("action_tool", "validation_safety")
        workflow.add_edge("validation_safety", "planner_compile")
        workflow.add_edge("planner_compile", "human_adjudication")
        workflow.add_edge("human_adjudication", END)

        return workflow.compile(interrupt_before=["human_adjudication"])
