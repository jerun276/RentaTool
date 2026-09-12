# RentaTool LK – Internal Agentic AI Subsystem (LangGraph)

This internal microservice provides the multi-agent AI dispute triage workflow required by SE3090 Assignment 1.

> **System Boundary Rule**: 
> This service is strictly private. It is invoked solely by the ASP.NET Core backend and cannot be called directly by the React or Flutter client applications.

## Specialized Agents & Ownership
1. **`validation_agent.py` (Student 1)**: Validates identity data inputs, checks blacklists, verifies deposit caps, and guards against prompt injection.
2. **`domain_analysis_agent.py` (Student 2)**: Classifies visual & textual condition deltas to distinguish standard wear-and-tear from structural damage.
3. **`planner_agent.py` (Student 3)**: Orchestrates dispute resolution plans, sequences verification steps, and manages workflow state.
4. **`action_agent.py` (Student 4)**: Executes allow-listed database and calculation tools (`GetEquipmentReplacementCost`, `CalculateRentalWearFactor`) to compute fair deductions.

## Human-in-the-Loop Workflow
The LangGraph `StateGraph` pauses execution at `PendingStaffApproval` using persistent checkpoints (`interrupt_before`), awaiting an admin review decision from the React Web portal before resuming final settlement in ASP.NET Core.
