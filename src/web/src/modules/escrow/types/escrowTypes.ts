export type ClaimStatus =
  | "Filed"
  | "UnderAIEvaluation"
  | "PendingStaffApproval"
  | "Approved"
  | "Revised"
  | "Rejected"
  | "Settled"

export type EscrowStatus = "Held" | "Disbursed" | "Refunded" | "Disputed"

export interface EscrowHold {
  id: string
  bookingId: string
  renterId: string
  ownerId: string
  depositAmount: number
  preAuthTransactionId: string
  status: EscrowStatus
  heldAtUtc: string
  settledAtUtc?: string
}

export interface DamageClaim {
  claimId: string
  bookingId: string
  filedByUserId: string
  damageDescription: string
  evidencePhotos: string[]
  proposedDeduction: number
  finalDeduction: number | null
  status: ClaimStatus
  adjudicationNotes: string | null
  adjudicatedByUserId: string | null
  adjudicatedAtUtc: string | null
  createdAtUtc: string
  // Optional pre-rental baseline photo for side-by-side inspection
  baselinePhotoUrl?: string
}

export interface AdjudicateClaimRequest {
  decision: "Approve" | "Revise" | "Reject"
  revisedDeduction?: number
  adjudicatorId: string
  notes?: string
}

export interface PayoutClaimResponse {
  claimId: string
  bookingId: string
  ownerPayoutAmount: number
  renterRefundAmount: number
  status: string
  settlementReference: string
  settledAtUtc: string
}
