"""RentaTool LK – Internal Agentic AI Subsystem Service Entrypoint.

Unifies all 4 specialized agents into a single high-performance FastAPI microservice:
- Component 1: Validation & Safety Agent (Identity, KYC, and Prompt Injection Defense)
- Component 2: Domain Analysis Agent (Equipment Wear-and-Tear vs. Damage Forensics)
- Component 3: Planner Agent (Dispute Triage & StateGraph Orchestration)
- Component 4: Action Tool Agent (Deterministic Deductions & Deposit Cap Enforcement)
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure repo root is on sys.path
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from src.ai_service.agents.action_agent import ActionProposal, ActionToolAgent
from src.ai_service.agents.domain_analysis_agent import DomainAnalysisAgent
from src.ai_service.agents.domain_models import DomainAnalysisRequest, DomainAnalysisResult
from src.ai_service.agents.planner_agent import PlannerAgent
from src.ai_service.agents.planner_models import DisputeContext, DisputePlan, DisputeWorkflowState
from src.ai_service.agents.validation_agent import (
    ValidationRequest,
    ValidationResponse,
    ValidationSafetyAgent,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("RentaToolAIService")

app = FastAPI(
    title="RentaTool LK AI Subsystem API",
    version="1.0.0",
    description="Internal Agentic AI Microservice for Peer-to-Peer Rental Dispute Triage (SE3090 Assignment 1)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate agents once at startup
validation_agent = ValidationSafetyAgent()
domain_agent = DomainAnalysisAgent()
planner_agent = PlannerAgent()
action_agent = ActionToolAgent()


# --- Health & Metadata ---

@app.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "Healthy",
        "service": "RentaTool.AIService",
        "agents": {
            "validation_agent": "Active (Deterministic)",
            "domain_analysis_agent": "Active (Gemini / Forensic)",
            "planner_agent": "Active (Coordinator)",
            "action_tool_agent": "Active (Allow-listed Tools)",
        },
        "llm_connected": bool(domain_agent.llm or planner_agent.llm),
    }


# --- Component 1: Validation & Safety ---

@app.post("/api/v1/ai/validate", response_model=ValidationResponse)
def validate_identity_and_safety(request: ValidationRequest) -> ValidationResponse:
    try:
        result = validation_agent.validate_workflow_input(
            document_type=request.document_type,
            document_number=request.document_number,
            name=request.name,
            proposed_deduction=request.proposed_deduction,
            held_deposit=request.held_deposit,
            free_text=request.free_text,
        )
        return ValidationResponse(
            approved=result.approved,
            errors=result.errors,
            warnings=result.warnings,
        )
    except Exception as exc:
        logger.error("Validation agent error: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


# --- Component 2: Domain Analysis (Wear vs. Damage) ---

@app.post("/api/v1/ai/analyze-domain", response_model=DomainAnalysisResult)
def analyze_equipment_damage(request: DomainAnalysisRequest) -> DomainAnalysisResult:
    try:
        result = domain_agent.analyze(request)
        return result
    except Exception as exc:
        logger.error("Domain analysis agent error: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


# --- Component 3: Dispute Planner & Workflow ---

@app.post("/api/v1/ai/plan-dispute")
def generate_dispute_plan(context: DisputeContext) -> Dict[str, Any]:
    try:
        plan = planner_agent.formulate_plan(context)
        return {
            "plan_id": plan.plan_id,
            "claim_id": plan.claim_id,
            "booking_id": plan.booking_id,
            "dispute_summary": plan.dispute_summary,
            "human_in_the_loop_required": plan.human_in_the_loop_required,
            "initial_state": plan.initial_state.value,
            "estimated_resolution_time_hours": plan.estimated_resolution_time_hours,
            "steps": [
                {
                    "step_id": s.step_id,
                    "target_agent": s.target_agent.value,
                    "action_name": s.action_name,
                    "description": s.description,
                    "status": s.status.value,
                }
                for s in plan.steps
            ],
        }
    except Exception as exc:
        logger.error("Planner agent error: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


# --- Component 4: Action Tool & Deductions ---

class ActionExecutionRequest(BaseModel):
    equipment_category: str = Field(..., description="e.g. 'Rotary Hammer Drill', 'Plate Compactor'")
    damage_severity: str = Field(default="moderate", description="'minor', 'moderate', 'severe', or 'total_loss'")
    rental_duration_days: int = Field(default=5, ge=1)
    tool_age_months: int = Field(default=6, ge=1)
    held_deposit: float = Field(..., ge=0)
    claim_id: Optional[str] = None
    booking_id: Optional[str] = None


@app.post("/api/v1/ai/execute-action")
def execute_deduction_calculation(request: ActionExecutionRequest) -> Dict[str, Any]:
    try:
        proposal = action_agent.evaluate_deduction(
            equipment_category=request.equipment_category,
            damage_severity=request.damage_severity,
            rental_duration_days=request.rental_duration_days,
            tool_age_months=request.tool_age_months,
            held_deposit=request.held_deposit,
            claim_id=request.claim_id,
            booking_id=request.booking_id,
        )
        return {
            "claim_id": proposal.claim_id,
            "booking_id": proposal.booking_id,
            "proposed_deduction": proposal.proposed_deduction,
            "held_deposit": proposal.held_deposit,
            "renter_refund": proposal.renter_refund,
            "is_deposit_capped": proposal.is_deposit_capped,
            "confidence_score": proposal.confidence_score,
            "explanation": proposal.explanation,
            "breakdown": proposal.breakdown,
            "tool_calls": proposal.tool_calls,
        }
    except Exception as exc:
        logger.error("Action agent error: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("src.ai_service.main:app", host="0.0.0.0", port=port, reload=False)
