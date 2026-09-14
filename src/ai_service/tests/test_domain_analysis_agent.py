import pytest
from src.ai_service.agents.domain_models import (
    DamageCategory,
    DomainAnalysisRequest,
    InspectionPhotoRef,
    InspectionSnapshot,
    RecommendedAction,
)
from src.ai_service.agents.domain_analysis_agent import (
    DomainAnalysisAgent,
    domain_analysis_node,
)
from src.ai_service.tools.domain_tools import EquipmentWearToleranceTool


@pytest.fixture
def agent():
    """Agent configured with deterministic fallback."""
    return DomainAnalysisAgent()


@pytest.fixture
def baseline_pre_inspection():
    return InspectionSnapshot(
        inspection_type="PreRental",
        condition_notes="Pre-rental handover: Motor casing pristine, power cord flexible without cuts, motor sounds optimal.",
        photos=[
            InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/pre/casing.jpg"),
            InspectionPhotoRef(angle="Cord", photo_url="https://rentatool.lk/photos/pre/cord.jpg"),
            InspectionPhotoRef(angle="Motor", photo_url="https://rentatool.lk/photos/pre/motor.jpg"),
        ],
        accumulated_rental_days=45,
    )


class TestDomainAnalysisAgent:

    def test_normal_wear_and_tear_classification(self, agent, baseline_pre_inspection):
        request = DomainAnalysisRequest(
            equipment_id="eq-wash-001",
            equipment_title="Karcher High Pressure Washer",
            category_name="Cleaning",
            replacement_value=65000.0,
            pre_rental_inspection=baseline_pre_inspection,
            post_rental_inspection=InspectionSnapshot(
                inspection_type="PostRental",
                condition_notes="Returned with superficial scuff marks and light cosmetic dirt on lower casing. Motor runs normally.",
                photos=[
                    InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/post/casing.jpg")
                ],
                accumulated_rental_days=48,
            ),
            dispute_claim_notes=None
        )

        result = agent.analyze(request)

        assert result.is_structural_damage is False
        assert result.damage_category == DamageCategory.NORMAL_WEAR_AND_TEAR
        assert result.recommended_action == RecommendedAction.NO_DEDUCTION_STANDARD_WEAR
        assert result.severity_score <= 25.0
        assert result.confidence_score >= 0.80
        assert "NORMAL WEAR-AND-TEAR" in result.analysis_summary

    def test_accidental_structural_damage_cracked_casing(self, agent, baseline_pre_inspection):
        request = DomainAnalysisRequest(
            equipment_id="eq-rotary-002",
            equipment_title="Bosch Professional Rotary Hammer",
            category_name="Power Tools",
            replacement_value=45000.0,
            pre_rental_inspection=baseline_pre_inspection,
            post_rental_inspection=InspectionSnapshot(
                inspection_type="PostRental",
                condition_notes="Casing cracked and shattered near motor mount. Structural housing fracture.",
                photos=[
                    InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/post/cracked_casing.jpg")
                ],
                accumulated_rental_days=20,
            ),
            dispute_claim_notes="Renter dropped tool from scaffolding onto concrete."
        )

        result = agent.analyze(request)

        assert result.is_structural_damage is True
        assert result.damage_category == DamageCategory.ACCIDENTAL_STRUCTURAL_DAMAGE
        assert result.recommended_action in [
            RecommendedAction.PARTIAL_REPAIR_CLAIM,
            RecommendedAction.FULL_REPLACEMENT_CLAIM,
        ]
        assert result.severity_score >= 50.0
        assert "Casing" in result.affected_components
        assert result.requires_human_verification is True

    def test_safety_hazard_severed_power_cord(self, agent, baseline_pre_inspection):
        request = DomainAnalysisRequest(
            equipment_id="eq-grind-003",
            equipment_title="Makita Angle Grinder 9-inch",
            category_name="Power Tools",
            replacement_value=32000.0,
            pre_rental_inspection=baseline_pre_inspection,
            post_rental_inspection=InspectionSnapshot(
                inspection_type="PostRental",
                condition_notes="Power cord is severed and cut by disc. Exposed wire posing severe electrical hazard.",
                photos=[
                    InspectionPhotoRef(angle="Cord", photo_url="https://rentatool.lk/photos/post/cut_cord.jpg")
                ],
                accumulated_rental_days=12,
            ),
            dispute_claim_notes="Owner claiming cord replacement cost."
        )

        result = agent.analyze(request)

        assert result.is_structural_damage is True
        assert result.damage_category == DamageCategory.ACCIDENTAL_STRUCTURAL_DAMAGE
        assert "Power Cord" in result.affected_components

    def test_misuse_or_negligence_thermal_overload(self, agent, baseline_pre_inspection):
        request = DomainAnalysisRequest(
            equipment_id="eq-gen-004",
            equipment_title="Honda 5kVA Silent Generator",
            category_name="Generators & Power",
            replacement_value=280000.0,
            pre_rental_inspection=baseline_pre_inspection,
            post_rental_inspection=InspectionSnapshot(
                inspection_type="PostRental",
                condition_notes="Engine seized. Machine ran without oil resulting in thermal overload and burnt motor windings.",
                photos=[],
                accumulated_rental_days=35,
            ),
            dispute_claim_notes="Renter operated generator continuously with dry oil pan."
        )

        result = agent.analyze(request)

        assert result.is_structural_damage is True
        assert result.damage_category == DamageCategory.MISUSE_OR_NEGLIGENCE
        assert result.recommended_action == RecommendedAction.FULL_REPLACEMENT_CLAIM
        assert result.severity_score >= 75.0

    def test_undetermined_evidence_triggers_staff_inspection(self, agent, baseline_pre_inspection):
        request = DomainAnalysisRequest(
            equipment_id="eq-laser-005",
            equipment_title="DeWalt Rotary Laser Level",
            category_name="Precision & Surveying",
            replacement_value=120000.0,
            pre_rental_inspection=baseline_pre_inspection,
            post_rental_inspection=InspectionSnapshot(
                inspection_type="PostRental",
                condition_notes="ok",
                photos=[],
                accumulated_rental_days=5,
            ),
            dispute_claim_notes=None
        )

        result = agent.analyze(request)

        assert result.damage_category == DamageCategory.UNDETERMINED
        assert result.recommended_action == RecommendedAction.MANUAL_STAFF_INSPECTION_REQUIRED
        assert result.confidence_score < 0.60


class TestDomainTools:

    def test_equipment_wear_tolerance_tool_categories(self):
        tolerance_heavy, is_crit_h, _ = EquipmentWearToleranceTool.calculate_wear_tolerance(
            category_name="Heavy Machinery",
            accumulated_rental_days=20,
            component_name="Chassis"
        )
        assert tolerance_heavy > 0.25
        assert is_crit_h is False

        tolerance_precision, is_crit_p, _ = EquipmentWearToleranceTool.calculate_wear_tolerance(
            category_name="Precision & Surveying",
            accumulated_rental_days=5,
            component_name="Sensor"
        )
        assert tolerance_precision <= 0.10
        assert is_crit_p is False

    def test_zero_tolerance_safety_critical_components(self):
        tolerance, is_crit, exp = EquipmentWearToleranceTool.calculate_wear_tolerance(
            category_name="Heavy Machinery",
            accumulated_rental_days=80,
            component_name="Power Cord"
        )
        assert tolerance == 0.0
        assert is_crit is True
        assert "SAFETY-CRITICAL" in exp

    def test_maintenance_threshold_wear_increase(self):
        tolerance_young, _, _ = EquipmentWearToleranceTool.calculate_wear_tolerance(
            category_name="Power Tools",
            accumulated_rental_days=5,
            component_name="General"
        )
        tolerance_old, _, _ = EquipmentWearToleranceTool.calculate_wear_tolerance(
            category_name="Power Tools",
            accumulated_rental_days=65,  # >= 60 days servicing threshold
            component_name="General"
        )
        assert tolerance_old > tolerance_young


class TestLangGraphNodeIntegration:

    def test_domain_analysis_node_successful_execution(self, baseline_pre_inspection):
        state = {
            "dispute": {
                "equipment_id": "eq-rotary-002",
                "equipment_title": "Bosch Professional Rotary Hammer",
                "category_name": "Power Tools",
                "replacement_value": 45000.0,
                "pre_rental_inspection": baseline_pre_inspection.model_dump(),
                "post_rental_inspection": {
                    "inspection_type": "PostRental",
                    "condition_notes": "Cracked casing near chuck with broken plastic housing.",
                    "photos": [],
                    "accumulated_rental_days": 25,
                },
                "dispute_claim_notes": "Claiming repair fee."
            }
        }

        updated_state = domain_analysis_node(state)

        assert "domain_analysis" in updated_state
        assert updated_state["is_structural_damage"] is True
        assert updated_state["damage_category"] == DamageCategory.ACCIDENTAL_STRUCTURAL_DAMAGE.value
        assert updated_state["domain_analysis"]["equipment_id"] == "eq-rotary-002"

    def test_domain_analysis_node_empty_state_error_handling(self):
        empty_state = {}
        updated_state = domain_analysis_node(empty_state)

        assert updated_state["domain_analysis"] is None
        assert "domain_analysis_error" in updated_state

    def test_multimodal_photo_references_preserved(self, agent, baseline_pre_inspection):
        request = DomainAnalysisRequest(
            equipment_id="eq-multi-006",
            equipment_title="Plate Compactor 90kg",
            category_name="Heavy Machinery",
            replacement_value=185000.0,
            pre_rental_inspection=baseline_pre_inspection,
            post_rental_inspection=InspectionSnapshot(
                inspection_type="PostRental",
                condition_notes="Chassis bent and cracked casing near vibrator unit.",
                photos=[
                    InspectionPhotoRef(angle="Casing", photo_url="https://rentatool.lk/photos/casing.jpg"),
                    InspectionPhotoRef(angle="Motor", photo_url="https://rentatool.lk/photos/motor.jpg")
                ],
                accumulated_rental_days=70,
            ),
            dispute_claim_notes="Vibrator mount cracked after dropping off trailer."
        )

        result = agent.analyze(request)
        assert result.is_structural_damage is True
        assert len(result.findings) >= 1
        assert result.wear_tolerance_factor > 0.30  # Heavy machinery + >60 days age allowance

    def test_invalid_replacement_value_validation_fails(self, baseline_pre_inspection):
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            DomainAnalysisRequest(
                equipment_id="eq-invalid",
                equipment_title="Invalid Tool",
                category_name="Power Tools",
                replacement_value=-100.0,  # Invalid: gt=0 constraint
                pre_rental_inspection=baseline_pre_inspection,
                post_rental_inspection=baseline_pre_inspection
            )

    def test_agent_custom_model_initialization(self):
        agent_custom = DomainAnalysisAgent(model_name="gemini-1.5-pro", api_key=None)
        assert agent_custom.model_name == "gemini-1.5-pro"
        assert agent_custom.llm is None

