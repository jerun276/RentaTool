from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class DamageCategory(str, Enum):
    """Classification of condition delta between pre- and post-rental inspection."""
    NORMAL_WEAR_AND_TEAR = "NORMAL_WEAR_AND_TEAR"
    ACCIDENTAL_STRUCTURAL_DAMAGE = "ACCIDENTAL_STRUCTURAL_DAMAGE"
    MISUSE_OR_NEGLIGENCE = "MISUSE_OR_NEGLIGENCE"
    UNDETERMINED = "UNDETERMINED"


class RecommendedAction(str, Enum):
    """Action recommendation emitted to the Planner & Action agents."""
    NO_DEDUCTION_STANDARD_WEAR = "NO_DEDUCTION_STANDARD_WEAR"
    PARTIAL_REPAIR_CLAIM = "PARTIAL_REPAIR_CLAIM"
    FULL_REPLACEMENT_CLAIM = "FULL_REPLACEMENT_CLAIM"
    MANUAL_STAFF_INSPECTION_REQUIRED = "MANUAL_STAFF_INSPECTION_REQUIRED"


class InspectionPhotoRef(BaseModel):
    """Reference to an angle-tagged inspection photo."""
    angle: str = Field(..., description="Camera angle: Casing, Cord, Motor, General")
    photo_url: str = Field(..., description="URL or local path to photograph")
    timestamp: Optional[datetime] = None


class InspectionSnapshot(BaseModel):
    """Photographic and textual inspection record from handover."""
    inspection_type: str = Field(..., description="PreRental or PostRental")
    condition_notes: str = Field(..., description="Notes logged by inspector or renter")
    photos: List[InspectionPhotoRef] = Field(default_factory=list)
    accumulated_rental_days: int = Field(default=0, ge=0)


class ComponentFinding(BaseModel):
    """Forensic assessment of an individual tool component."""
    component_name: str = Field(..., description="E.g., Casing, Power Cord, Motor, Chuck, Blade Guard")
    pre_condition: str = Field(..., description="Condition noted during pre-rental inspection")
    post_condition: str = Field(..., description="Condition noted during post-rental inspection")
    is_damaged: bool = Field(..., description="True if defect or physical damage is present")
    is_wear_and_tear: bool = Field(..., description="True if defect is within expected operational wear limits")
    defect_description: str = Field(..., description="Detailed description of identified issue")
    estimated_repair_cost_ratio: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Estimated portion of total replacement value required for component restoration"
    )


class DomainAnalysisRequest(BaseModel):
    """Input payload for the Domain Analysis Agent."""
    equipment_id: str
    equipment_title: str
    category_name: str
    replacement_value: float = Field(..., gt=0)
    pre_rental_inspection: InspectionSnapshot
    post_rental_inspection: InspectionSnapshot
    dispute_claim_notes: Optional[str] = None


class DomainAnalysisResult(BaseModel):
    """Structured forensic report emitted by the Domain Analysis Agent."""
    equipment_id: str
    is_structural_damage: bool = Field(..., description="True if equipment requires physical repair/replacement")
    damage_category: DamageCategory
    severity_score: float = Field(..., ge=0.0, le=100.0, description="Severity metric from 0 (pristine) to 100 (catastrophic)")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in assessment from 0.0 to 1.0")
    affected_components: List[str] = Field(default_factory=list)
    findings: List[ComponentFinding] = Field(default_factory=list)
    analysis_summary: str = Field(..., description="Executive summary of condition delta")
    recommended_action: RecommendedAction
    wear_tolerance_factor: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Wear tolerance factor calculated from equipment category and lifetime rental days"
    )
    requires_human_verification: bool = Field(
        default=False,
        description="True if confidence is low, evidence is conflicting, or dispute is contested"
    )
