import { axiosClient } from "@/shared/api/axiosClient"
import {
  DamageClaim,
  EscrowHold,
  AdjudicateClaimRequest,
  PayoutClaimResponse
} from "../types/escrowTypes"

export const escrowApi = {
  // Claims
  getClaims: async (): Promise<DamageClaim[]> => {
    const response = await axiosClient.get<DamageClaim[]>("/claims")
    return response.data
  },

  getClaimById: async (id: string): Promise<DamageClaim> => {
    const response = await axiosClient.get<DamageClaim>(`/claims/${id}`)
    return response.data
  },

  fileClaim: async (request: {
    bookingId: string
    filedByUserId: string
    damageDescription: string
    evidencePhotos: string[]
  }): Promise<DamageClaim> => {
    const response = await axiosClient.post<DamageClaim>("/claims", request)
    return response.data
  },

  adjudicateClaim: async (
    claimId: string,
    request: AdjudicateClaimRequest
  ): Promise<DamageClaim> => {
    const response = await axiosClient.post<DamageClaim>(
      `/claims/${claimId}/adjudicate`,
      request
    )
    return response.data
  },

  processPayout: async (claimId: string): Promise<PayoutClaimResponse> => {
    const response = await axiosClient.post<PayoutClaimResponse>(
      `/claims/${claimId}/payout`
    )
    return response.data
  },

  // Escrow
  getEscrowByBooking: async (bookingId: string): Promise<EscrowHold> => {
    const response = await axiosClient.get<EscrowHold>(
      `/escrow/booking/${bookingId}`
    )
    return response.data
  },

  preAuthorizeDeposit: async (request: {
    bookingId: string
    renterId: string
    ownerId: string
    depositAmount: number
    paymentMethodToken?: string
  }): Promise<EscrowHold> => {
    const response = await axiosClient.post<EscrowHold>(
      "/escrow/pre-authorize",
      request
    )
    return response.data
  }
}
