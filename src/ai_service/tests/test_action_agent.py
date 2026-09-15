import pytest
from src.ai_service.agents.action_agent import (
    ActionToolAgent,
    ActionProposal,
    action_agent_node,
    get_equipment_replacement_cost,
    calculate_rental_wear_factor,
    compute_repair_deduction,
    BENCHMARK_REPLACEMENT_COSTS,
)


class TestAllowListedTools:
    def test_get_equipment_replacement_cost_known_categories(self):
        assert get_equipment_replacement_cost("Concrete Mixer 350L") == 125000.0
        assert get_equipment_replacement_cost("demolition hammer") == 85000.0
        assert get_equipment_replacement_cost("chainsaw stihl") == 55000.0
        assert get_equipment_replacement_cost("Plate Compactor") == 140000.0

    def test_get_equipment_replacement_cost_fallback(self):
        assert get_equipment_replacement_cost("Unknown Futuristic Drill") == BENCHMARK_REPLACEMENT_COSTS["default"]
        assert get_equipment_replacement_cost("") == BENCHMARK_REPLACEMENT_COSTS["default"]

    def test_calculate_rental_wear_factor_bounds(self):
        # Short rental, new tool -> small wear discount
        wear_short = calculate_rental_wear_factor(rental_duration_days=1, tool_age_months=1)
        assert 0.02 <= wear_short <= 0.10

        # Long rental, older tool -> bounded at 0.40 (40% maximum allowable wear discount)
        wear_long = calculate_rental_wear_factor(rental_duration_days=30, tool_age_months=24)
        assert wear_long == 0.40

    def test_compute_repair_deduction_minor_damage(self):
        result = compute_repair_deduction(
            equipment_category="rotary hammer drill",
            damage_severity="minor",
            rental_duration_days=2,
            held_deposit=15000.0,
            tool_age_months=4
        )
        assert result["benchmark_replacement_cost"] == 45000.0
        assert result["damage_severity"] == "minor"
        assert result["gross_damage_estimate"] == 4500.0  # 10% of 45,000
        assert result["wear_discount_applied"] > 0
        assert result["proposed_deduction"] < 4500.0
        assert result["renter_refund"] == round(15000.0 - result["proposed_deduction"], 2)
        assert result["is_deposit_capped"] is False

    def test_compute_repair_deduction_capped_by_deposit(self):
        # Total loss on concrete mixer (125,000 LKR), but held deposit is only 20,000 LKR
        result = compute_repair_deduction(
            equipment_category="concrete mixer",
            damage_severity="total_loss",
            rental_duration_days=5,
            held_deposit=20000.0,
            tool_age_months=12
        )
        # Net damage is substantial (> 80,000 LKR), but deduction MUST be capped to 20,000 LKR
        assert result["proposed_deduction"] == 20000.0
        assert result["renter_refund"] == 0.0
        assert result["is_deposit_capped"] is True

    def test_compute_repair_deduction_with_manual_estimate(self):
        result = compute_repair_deduction(
            equipment_category="demolition hammer",
            damage_severity="moderate",
            rental_duration_days=3,
            held_deposit=25000.0,
            manual_repair_estimate=12000.0
        )
        assert result["gross_damage_estimate"] == 12000.0
        assert result["proposed_deduction"] <= 12000.0


class TestActionToolAgent:
    def test_evaluate_deduction_creates_full_proposal(self):
        agent = ActionToolAgent()
        proposal = agent.evaluate_deduction(
            equipment_category="power trowel",
            damage_severity="moderate",
            held_deposit=30000.0,
            rental_duration_days=4,
            tool_age_months=8,
            claim_id="claim-test-123",
            booking_id="booking-test-456"
        )
        assert isinstance(proposal, ActionProposal)
        assert proposal.claim_id == "claim-test-123"
        assert proposal.booking_id == "booking-test-456"
        assert proposal.proposed_deduction > 0
        assert proposal.held_deposit == 30000.0
        assert proposal.renter_refund == round(30000.0 - proposal.proposed_deduction, 2)
        assert len(proposal.tool_calls) == 3

        # Verify tool calls trace
        tool_names = [call["tool"] for call in proposal.tool_calls]
        assert "get_equipment_replacement_cost" in tool_names
        assert "calculate_rental_wear_factor" in tool_names
        assert "compute_repair_deduction" in tool_names

        # Verify explanation includes LKR breakdown
        assert "LKR" in proposal.explanation
        assert "power trowel" in proposal.explanation


class TestLangGraphActionNode:
    def test_action_agent_node_updates_state(self):
        initial_state = {
            "claim_id": "c-999",
            "booking_id": "b-888",
            "equipment_category": "Plate Compactor",
            "damage_severity": "severe",
            "held_deposit": 25000.0,
            "rental_duration_days": 7,
            "tool_age_months": 10
        }

        updated_state = action_agent_node(initial_state)

        assert updated_state["action_completed"] is True
        assert "action_proposal" in updated_state
        assert updated_state["proposed_deduction"] > 0
        assert updated_state["proposed_deduction"] <= 25000.0
        assert updated_state["renter_refund"] >= 0
        assert updated_state["proposed_deduction"] + updated_state["renter_refund"] == 25000.0
