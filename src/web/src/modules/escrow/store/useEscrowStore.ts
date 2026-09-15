import { create } from "zustand"
import { DamageClaim, EscrowHold, AdjudicateClaimRequest } from "../types/escrowTypes"
import { escrowApi } from "../api/escrowApi"

interface EscrowState {
  claims: DamageClaim[]
  selectedClaim: DamageClaim | null
  currentEscrow: EscrowHold | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  successMessage: string | null

  // Actions
  fetchClaims: () => Promise<void>
  selectClaim: (claim: DamageClaim | null) => void
  fetchClaimDetails: (claimId: string) => Promise<void>
  adjudicateClaim: (
    claimId: string,
    request: AdjudicateClaimRequest
  ) => Promise<boolean>
  processPayout: (claimId: string) => Promise<boolean>
  clearFeedback: () => void
}

export const useEscrowStore = create<EscrowState>((set, get) => ({
  claims: [],
  selectedClaim: null,
  currentEscrow: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,

  fetchClaims: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await escrowApi.getClaims()
      set({ claims: data, isLoading: false })
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || "Failed to load claims",
        isLoading: false
      })
    }
  },

  selectClaim: (claim) => {
    set({ selectedClaim: claim })
    if (claim) {
      get().fetchClaimDetails(claim.claimId)
    }
  },

  fetchClaimDetails: async (claimId: string) => {
    set({ isLoading: true, error: null })
    try {
      const claim = await escrowApi.getClaimById(claimId)
      let escrow: EscrowHold | null = null
      try {
        escrow = await escrowApi.getEscrowByBooking(claim.bookingId)
      } catch {
        // May not have escrow record in mock mode
      }
      set({ selectedClaim: claim, currentEscrow: escrow, isLoading: false })
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || "Failed to fetch claim details",
        isLoading: false
      })
    }
  },

  adjudicateClaim: async (claimId: string, request: AdjudicateClaimRequest) => {
    set({ isSubmitting: true, error: null, successMessage: null })
    try {
      const updatedClaim = await escrowApi.adjudicateClaim(claimId, request)
      set((state) => ({
        selectedClaim: updatedClaim,
        claims: state.claims.map((c) => (c.claimId === claimId ? updatedClaim : c)),
        isSubmitting: false,
        successMessage: `Claim adjudication (${request.decision}) recorded successfully!`
      }))
      return true
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || "Failed to adjudicate claim",
        isSubmitting: false
      })
      return false
    }
  },

  processPayout: async (claimId: string) => {
    set({ isSubmitting: true, error: null, successMessage: null })
    try {
      const payoutResult = await escrowApi.processPayout(claimId)
      // Refresh claim
      const updatedClaim = await escrowApi.getClaimById(claimId)
      set((state) => ({
        selectedClaim: updatedClaim,
        claims: state.claims.map((c) => (c.claimId === claimId ? updatedClaim : c)),
        isSubmitting: false,
        successMessage: `Settlement disbursed: Owner Rs. ${payoutResult.ownerPayoutAmount.toLocaleString()} | Renter Refund Rs. ${payoutResult.renterRefundAmount.toLocaleString()}`
      }))
      return true
    } catch (err: any) {
      set({
        error: err?.response?.data?.error || err?.message || "Failed to process settlement payout",
        isSubmitting: false
      })
      return false
    }
  },

  clearFeedback: () => {
    set({ error: null, successMessage: null })
  }
}))
