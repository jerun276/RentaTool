from __future__ import annotations

from typing import Dict, Tuple


class EquipmentWearToleranceTool:
    """
    Domain Tool: Computes expected operational wear tolerance factors based on
    equipment category, lifetime rental days, and the specific inspected component.
    Enforces a strict zero-tolerance invariant on safety-critical components.
    """

    # Baseline wear allowance by equipment category
    CATEGORY_WEAR_BASELINES: Dict[str, float] = {
        "heavy machinery": 0.30,
        "earthmoving": 0.35,
        "power tools": 0.15,
        "drilling & fastening": 0.15,
        "cutting & grinding": 0.20,
        "cleaning": 0.10,
        "landscaping": 0.20,
        "generators & power": 0.25,
        "precision & surveying": 0.05,
    }

    # Safety-critical components that have ZERO wear tolerance (any fracture/breach is structural damage)
    SAFETY_CRITICAL_KEYWORDS = [
        "cord", "cable", "wiring", "plug",
        "pressure hose", "pressure tank", "valve",
        "blade guard", "safety guard", "shield",
        "housing fracture", "casing crack", "motor crack", "hydraulic seal"
    ]

    @classmethod
    def is_safety_critical(cls, component_or_defect: str) -> bool:
        """Determines if a component or defect description constitutes a zero-tolerance safety hazard."""
        lowered = component_or_defect.lower()
        return any(keyword in lowered for keyword in cls.SAFETY_CRITICAL_KEYWORDS)

    @classmethod
    def calculate_wear_tolerance(
        cls,
        category_name: str,
        accumulated_rental_days: int,
        component_name: str = "General"
    ) -> Tuple[float, bool, str]:
        """
        Calculates the wear tolerance factor (0.0 to 1.0) and indicates if the component is safety-critical.
        
        Returns:
            (tolerance_factor, is_safety_critical, explanation)
        """
        is_critical = cls.is_safety_critical(component_name)
        if is_critical:
            return (
                0.0,
                True,
                f"Component '{component_name}' is classified as SAFETY-CRITICAL. Zero cosmetic wear tolerance applies."
            )

        # Determine category baseline
        category_key = category_name.lower().strip()
        baseline = 0.15  # default fallback
        for key, val in cls.CATEGORY_WEAR_BASELINES.items():
            if key in category_key or category_key in key:
                baseline = val
                break

        # Adjust for lifetime rental days (PRD 60-day servicing lifecycle)
        if accumulated_rental_days >= 60:
            age_factor = 0.15  # High cumulative wear expected on non-critical parts
            age_desc = "High cumulative usage (>= 60 days, pending servicing threshold)"
        elif accumulated_rental_days >= 30:
            age_factor = 0.08
            age_desc = "Moderate cumulative usage (30-59 days)"
        elif accumulated_rental_days >= 10:
            age_factor = 0.03
            age_desc = "Standard usage (10-29 days)"
        else:
            age_factor = 0.0
            age_desc = "Near-new / low usage (< 10 days)"

        total_tolerance = min(1.0, baseline + age_factor)
        explanation = (
            f"Category '{category_name}' baseline tolerance: {baseline:.2f}. "
            f"{age_desc}: +{age_factor:.2f}. Total allowable wear factor: {total_tolerance:.2f}."
        )

        return (total_tolerance, False, explanation)
