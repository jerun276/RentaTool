"""Component 1 validation and safety controls for internal RentaTool workflows.

This module is deliberately deterministic: it is used to validate untrusted input
before an LLM or financial action is allowed to consume it.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, Iterable, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="RentaTool Validation Safety API", version="1.0.0")


@dataclass(frozen=True)
class ValidationResult:
    approved: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


class ValidationRequest(BaseModel):
    """Untrusted workflow input accepted by the private validation endpoint."""

    document_type: str = Field(..., max_length=30)
    document_number: str = Field(..., max_length=30)
    name: str = Field(..., max_length=120)
    proposed_deduction: float = Field(..., ge=0)
    held_deposit: float = Field(..., ge=0)
    free_text: str = Field(default="", max_length=10_000)


class ValidationResponse(BaseModel):
    approved: bool
    errors: list[str]
    warnings: list[str]


class ValidationSafetyAgent:
    """Validates Component 1 identity data and safety constraints.

    The blacklist is injected by trusted server configuration; clients must never
    be able to supply it. Deposit claims are rejected when they exceed the held
    deposit rather than being silently capped.
    """

    PROMPT_INJECTION_PATTERNS = (
        r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
        r"reveal\s+(the\s+)?(system|developer)\s+(prompt|instructions?)",
        r"(?:system\s+prompt|jailbreak|developer\s+message)",
        r"\bdo\s+not\s+follow\b",
    )
    NIC_PATTERN = re.compile(r"^(?:\d{9}[VvXx]|\d{12})$")
    LICENCE_PATTERN = re.compile(r"^[A-Za-z0-9/-]{5,30}$")

    def __init__(self, blacklisted_document_numbers: Optional[Iterable[str]] = None):
        self._blacklist = {value.strip().upper() for value in (blacklisted_document_numbers or [])}

    def validate_identity(self, document_type: str, document_number: str, name: str = "") -> ValidationResult:
        errors: list[str] = []
        normalized_number = document_number.strip().upper()
        if not name.strip():
            errors.append("Name is required.")
        if document_type == "NIC":
            valid_format = bool(self.NIC_PATTERN.fullmatch(normalized_number))
        elif document_type == "DrivingLicense":
            valid_format = bool(self.LICENCE_PATTERN.fullmatch(normalized_number))
        else:
            valid_format = False
        if not valid_format:
            errors.append("Document type or number format is invalid.")
        if normalized_number in self._blacklist:
            errors.append("Identity document is blacklisted and requires manual review.")
        return ValidationResult(not errors, errors)

    def validate_deposit_cap(self, proposed_deduction: float, held_deposit: float) -> ValidationResult:
        errors: list[str] = []
        if held_deposit < 0 or proposed_deduction < 0:
            errors.append("Deposit values cannot be negative.")
        elif proposed_deduction > held_deposit:
            errors.append("Proposed deduction exceeds the held deposit cap.")
        return ValidationResult(not errors, errors)

    def validate_prompt_safety(self, text: str) -> ValidationResult:
        if len(text) > 10_000:
            return ValidationResult(False, ["Input exceeds the 10,000 character safety limit."])
        if any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in self.PROMPT_INJECTION_PATTERNS):
            return ValidationResult(False, ["Potential prompt-injection content detected."])
        return ValidationResult(True)

    def validate_workflow_input(
        self,
        document_type: str,
        document_number: str,
        name: str,
        proposed_deduction: float,
        held_deposit: float,
        free_text: str,
    ) -> ValidationResult:
        checks = (
            self.validate_identity(document_type, document_number, name),
            self.validate_deposit_cap(proposed_deduction, held_deposit),
            self.validate_prompt_safety(free_text),
        )
        errors = [error for check in checks for error in check.errors]
        warnings = [warning for check in checks for warning in check.warnings]
        return ValidationResult(not errors, errors, warnings)


def validation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph-compatible node; never forwards rejected input downstream."""
    data = state.get("validation_request") or {}
    agent = ValidationSafetyAgent(state.get("blacklisted_document_numbers"))
    result = agent.validate_workflow_input(
        document_type=str(data.get("document_type", "")),
        document_number=str(data.get("document_number", "")),
        name=str(data.get("name", "")),
        proposed_deduction=float(data.get("proposed_deduction", 0)),
        held_deposit=float(data.get("held_deposit", 0)),
        free_text=str(data.get("free_text", "")),
    )
    return {**state, "validation": asdict(result), "validation_passed": result.approved}


@app.post("/api/v1/ai/validate", response_model=ValidationResponse)
def validate(request: ValidationRequest) -> ValidationResponse:
    """Validate identity, deposit-cap, and prompt-safety rules in one request.

    The blacklist intentionally remains server-controlled: this public contract does
    not accept blacklist entries from a caller.
    """
    result = ValidationSafetyAgent().validate_workflow_input(
        document_type=request.document_type,
        document_number=request.document_number,
        name=request.name,
        proposed_deduction=request.proposed_deduction,
        held_deposit=request.held_deposit,
        free_text=request.free_text,
    )
    return ValidationResponse(**asdict(result))
