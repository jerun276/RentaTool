"""Component 4: Escrow Ledger & Security Deposit Claims
Owner: Student 4 (Jathu)

Responsibility:
Action / Tool Agent: Executes deterministic financial and wear-and-tear calculations
using strictly allow-listed tools. Calculates allowable depreciation, benchmark
repair costs, and ensures damage deductions never exceed the pre-authorized escrow deposit.
"""
from __future__ import annotations

import logging
import math
import os
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ActionToolAgent")

# Authoritative Equipment Benchmark Replacement Values (in LKR)
BENCHMARK_REPLACEMENT_COSTS: Dict[str, float] = {
    "concrete mixer": 125000.0,
    "demolition hammer": 85000.0,
    "rotary hammer drill": 45000.0,
    "power trowel": 160000.0,
    "chainsaw": 55000.0,
    "plate compactor": 140000.0,
    "angle grinder": 22000.0,
    "scaffolding tower": 95000.0,
    "generator": 180000.0,
    "pressure washer": 65000.0,
    "default": 50000.0,
}

# Standard repair ratio by damage severity
SEVERITY_REPAIR_RATIOS: Dict[str, float] = {
    "minor": 0.10,       # Cosmetic, scratch, missing minor bolt
    "moderate": 0.25,    # Damaged guard, cracked casing, blunt cutting blade
    "severe": 0.60,      # Motor burnout, fractured structural frame
    "total_loss": 1.00,  # Unusable, beyond economic repair
}


def get_equipment_replacement_cost(equipment_category: str) -> float:
    """Allow-listed tool: returns the authoritative market replacement benchmark for the equipment."""
    cleaned = (equipment_category or "").strip().lower()
    for key, val in BENCHMARK_REPLACEMENT_COSTS.items():
        if key in cleaned:
            return val
    return BENCHMARK_REPLACEMENT_COSTS["default"]


def calculate_rental_wear_factor(rental_duration_days: int, tool_age_months: int = 6) -> float:
    """
    Allow-listed tool: calculates normal wear-and-tear depreciation discount factor.
    Returns a float between 0.00 and 0.40 (max 40% wear deduction allowance).
    """
    duration = max(1, rental_duration_days)
    age = max(1, tool_age_months)

    # 1.5% discount per rental day + 1.0% per month of operating age, capped at 40%
    factor = (duration * 0.015) + (age * 0.010)
    return round(min(0.40, max(0.02, factor)), 3)


def compute_repair_deduction(
    equipment_category: str,
    damage_severity: str,
    rental_duration_days: int,
    held_deposit: float,
    tool_age_months: int = 6,
    manual_repair_estimate: Optional[float] = None
) -> Dict[str, Any]:
    """
    Allow-listed tool: executes deterministic repair & deduction calculation.
    Caps the final deduction strictly to held_deposit to prevent negative escrow balances.
    """
    replacement_cost = get_equipment_replacement_cost(equipment_category)
    wear_factor = calculate_rental_wear_factor(rental_duration_days, tool_age_months)

    severity_key = damage_severity.strip().lower() if damage_severity else "moderate"
    severity_ratio = SEVERITY_REPAIR_RATIOS.get(severity_key, 0.25)

    if manual_repair_estimate and manual_repair_estimate > 0:
        gross_damage = min(manual_repair_estimate, replacement_cost)
    else:
        gross_damage = round(replacement_cost * severity_ratio, 2)

    # Apply normal wear-and-tear discount so renter isn't charged for pre-existing or operational wear
    wear_discount = round(gross_damage * wear_factor, 2)
    net_damage = round(max(0.0, gross_damage - wear_discount), 2)

    # Deposit cap enforcement: final deduction can NEVER exceed pre-authorized deposit
    proposed_deduction = round(min(net_damage, held_deposit), 2)
    renter_refund = round(max(0.0, held_deposit - proposed_deduction), 2)
    is_deposit_capped = net_damage > held_deposit

    return {
        "equipment_category": equipment_category,
        "benchmark_replacement_cost": replacement_cost,
        "damage_severity": severity_key,
        "gross_damage_estimate": gross_damage,
        "wear_factor": wear_factor,
        "wear_discount_applied": wear_discount,
        "net_damage": net_damage,
        "held_deposit": held_deposit,
        "proposed_deduction": proposed_deduction,
        "renter_refund": renter_refund,
        "is_deposit_capped": is_deposit_capped,
    }


@dataclass
class ActionProposal:
    claim_id: Optional[str]
    booking_id: Optional[str]
    proposed_deduction: float
    held_deposit: float
    renter_refund: float
    is_deposit_capped: bool
    breakdown: Dict[str, Any]
    tool_calls: List[Dict[str, Any]]
    explanation: str
    confidence_score: float = 0.95


class ActionToolAgent:
    """
    Component 4 Action / Tool Agent:
    Validates claim deductions using allow-listed tools, computes wear-and-tear allowances,
    and produces authoritative dispute resolution figures for human staff adjudication.
    """

    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.llm = None
        self._initialize_llm()

    def _initialize_llm(self) -> None:
        if not self.api_key:
            logger.info("No Gemini API key supplied. Running ActionToolAgent in deterministic mode.")
            return

        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model=self.model_name,
                google_api_key=self.api_key,
                temperature=0.1
            )
        except Exception as ex:
            logger.warning(f"Could not load Gemini LLM for ActionToolAgent: {ex}. Using deterministic mode.")
            self.llm = None

    def evaluate_deduction(
        self,
        equipment_category: str,
        damage_severity: str,
        held_deposit: float,
        rental_duration_days: int = 3,
        tool_age_months: int = 6,
        manual_repair_estimate: Optional[float] = None,
        claim_id: Optional[str] = None,
        booking_id: Optional[str] = None,
    ) -> ActionProposal:
        """Evaluates deduction proposal using allow-listed tools with audit logging."""
        tool_calls: List[Dict[str, Any]] = []

        # Tool Call 1: Benchmark replacement lookup
        cost = get_equipment_replacement_cost(equipment_category)
        tool_calls.append({
            "tool": "get_equipment_replacement_cost",
            "inputs": {"equipment_category": equipment_category},
            "output": cost
        })

        # Tool Call 2: Wear factor calculation
        wear = calculate_rental_wear_factor(rental_duration_days, tool_age_months)
        tool_calls.append({
            "tool": "calculate_rental_wear_factor",
            "inputs": {"rental_duration_days": rental_duration_days, "tool_age_months": tool_age_months},
            "output": wear
        })

        # Tool Call 3: Full deterministic computation
        calc = compute_repair_deduction(
            equipment_category=equipment_category,
            damage_severity=damage_severity,
            rental_duration_days=rental_duration_days,
            held_deposit=held_deposit,
            tool_age_months=tool_age_months,
            manual_repair_estimate=manual_repair_estimate
        )
        tool_calls.append({
            "tool": "compute_repair_deduction",
            "inputs": {
                "equipment_category": equipment_category,
                "damage_severity": damage_severity,
                "held_deposit": held_deposit
            },
            "output": calc
        })

        explanation = (
            f"Evaluated {equipment_category} with '{damage_severity}' damage. "
            f"Benchmark replacement: LKR {calc['benchmark_replacement_cost']:,.2f}. "
            f"Gross damage: LKR {calc['gross_damage_estimate']:,.2f}. "
            f"Wear-and-tear allowance ({calc['wear_factor']*100:.1f}%): -LKR {calc['wear_discount_applied']:,.2f}. "
            f"Net damage: LKR {calc['net_damage']:,.2f}. "
            f"Proposed deduction capped to deposit: LKR {calc['proposed_deduction']:,.2f} "
            f"(Renter refund: LKR {calc['renter_refund']:,.2f})."
        )

        return ActionProposal(
            claim_id=claim_id,
            booking_id=booking_id,
            proposed_deduction=calc["proposed_deduction"],
            held_deposit=held_deposit,
            renter_refund=calc["renter_refund"],
            is_deposit_capped=calc["is_deposit_capped"],
            breakdown=calc,
            tool_calls=tool_calls,
            explanation=explanation,
            confidence_score=0.95
        )


def action_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node for Component 4 Action / Tool Agent.
    Consumes state, computes deduction proposal using allow-listed tools,
    and returns updated state for staff review or settlement.
    """
    agent = ActionToolAgent()

    equipment = state.get("equipment_category", "Concrete Mixer")
    severity = state.get("damage_severity", "moderate")
    held_deposit = float(state.get("held_deposit", 20000.0))
    rental_days = int(state.get("rental_duration_days", 3))
    tool_age = int(state.get("tool_age_months", 6))
    estimate = state.get("manual_repair_estimate")
    estimate_val = float(estimate) if estimate is not None else None

    proposal = agent.evaluate_deduction(
        equipment_category=equipment,
        damage_severity=severity,
        held_deposit=held_deposit,
        rental_duration_days=rental_days,
        tool_age_months=tool_age,
        manual_repair_estimate=estimate_val,
        claim_id=state.get("claim_id"),
        booking_id=state.get("booking_id")
    )

    state["action_proposal"] = asdict(proposal)
    state["proposed_deduction"] = proposal.proposed_deduction
    state["renter_refund"] = proposal.renter_refund
    state["action_completed"] = True
    return state
