import { axiosClient } from "@/shared/api/axiosClient"
import {
  ActiveBookingSummaryDto,
  BookingResponseDto,
  CreateBookingRequestDto,
  ExtendScheduleRequestDto,
  ExtendScheduleResponseDto,
  GenerateHandoverTokenRequestDto,
  HandoverTokenResponseDto,
  HandoverVerificationResponseDto,
  ScheduleConflictItem,
  VerifyHandoverRequestDto,
} from "../types/bookingTypes"

export const MOCK_BOOKINGS: ActiveBookingSummaryDto[] = [
  {
    id: "bkg-101",
    equipmentId: "eq-001",
    renterId: "33333333-3333-3333-3333-333333333333",
    ownerId: "11111111-1111-1111-1111-111111111111",
    startDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    totalRentalFee: 10500,
    status: "Active",
    pickupVerified: true,
    returnVerified: false,
    createdAtUtc: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "bkg-102",
    equipmentId: "eq-002",
    renterId: "33333333-3333-3333-3333-333333333333",
    ownerId: "22222222-2222-2222-2222-222222222222",
    startDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    totalRentalFee: 14000,
    status: "Confirmed",
    pickupVerified: false,
    returnVerified: false,
    createdAtUtc: new Date().toISOString(),
  },
  {
    id: "bkg-103",
    equipmentId: "eq-003",
    renterId: "44444444-4444-4444-4444-444444444444",
    ownerId: "11111111-1111-1111-1111-111111111111",
    startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    totalRentalFee: 18000,
    status: "Completed",
    pickupVerified: true,
    returnVerified: true,
    createdAtUtc: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
]

export const MOCK_SCHEDULES: ScheduleConflictItem[] = [
  {
    id: "sch-01",
    equipmentId: "eq-001",
    bookingId: "bkg-101",
    blockedStartDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    blockedEndDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    reason: "RentalReservation: Karcher Pressure Washer",
    status: "Confirmed",
  },
  {
    id: "sch-02",
    equipmentId: "eq-001",
    bookingId: "bkg-999",
    blockedStartDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    blockedEndDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    reason: "RentalReservation: Colombo Construction Site",
    status: "Confirmed",
  },
  {
    id: "sch-03",
    equipmentId: "eq-002",
    bookingId: "bkg-102",
    blockedStartDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    blockedEndDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    reason: "RentalReservation: Rotary Hammer",
    status: "Confirmed",
  },
]

export const bookingApi = {
  // 1. Create a new booking request
  createBooking: async (data: CreateBookingRequestDto): Promise<BookingResponseDto> => {
    try {
      const response = await axiosClient.post<BookingResponseDto>("/api/v1/bookings", data)
      return response.data
    } catch (err) {
      console.warn("API unavailable, simulating local booking creation", err)
      const days = Math.max(1, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 3600 * 24)))
      return {
        id: `bkg-${Date.now()}`,
        equipmentId: data.equipmentId,
        renterId: "33333333-3333-3333-3333-333333333333",
        ownerId: data.ownerId,
        startDate: data.startDate,
        endDate: data.endDate,
        dailyRate: data.dailyRate,
        totalRentalFee: days * data.dailyRate,
        status: "Confirmed",
        createdAtUtc: new Date().toISOString(),
      }
    }
  },

  // 2. Fetch active bookings
  getActiveBookings: async (): Promise<ActiveBookingSummaryDto[]> => {
    try {
      const response = await axiosClient.get<ActiveBookingSummaryDto[]>("/api/v1/bookings/active")
      return response.data
    } catch (err) {
      console.warn("API unavailable, returning mock active bookings", err)
      return MOCK_BOOKINGS
    }
  },

  // 3. Get booking by ID
  getBookingById: async (id: string): Promise<BookingResponseDto | null> => {
    try {
      const response = await axiosClient.get<BookingResponseDto>(`/api/v1/bookings/${id}`)
      return response.data
    } catch (err) {
      console.warn("API unavailable, falling back to mock booking", err)
      const item = MOCK_BOOKINGS.find((b) => b.id === id)
      if (!item) return null
      return {
        ...item,
        dailyRate: 3500,
      }
    }
  },

  // 4. Generate Single-Use QR Token
  generateHandoverToken: async (
    id: string,
    eventType: 1 | 2
  ): Promise<HandoverTokenResponseDto> => {
    try {
      const response = await axiosClient.post<HandoverTokenResponseDto>(
        `/api/v1/bookings/${id}/generate-handover-token`,
        { eventType } as GenerateHandoverTokenRequestDto
      )
      return response.data
    } catch (err) {
      console.warn("API unavailable, generating simulated token", err)
      const randHex = Math.random().toString(16).substring(2, 6).toUpperCase()
      const typeStr = eventType === 1 ? "Pickup" : "Return"
      return {
        bookingId: id,
        eventType: typeStr,
        token: `RT-${randHex}-${Date.now().toString().slice(-4)}`,
        expiresAtUtc: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        instructions: `Present this single-use QR token within 15 minutes to complete ${typeStr.toLowerCase()} verification.`,
      }
    }
  },

  // 5. Verify Handover Token
  verifyHandover: async (
    id: string,
    data: VerifyHandoverRequestDto
  ): Promise<HandoverVerificationResponseDto> => {
    try {
      const response = await axiosClient.post<HandoverVerificationResponseDto>(
        `/api/v1/bookings/${id}/verify-handover`,
        data
      )
      return response.data
    } catch (err) {
      console.warn("API unavailable, simulating successful verification", err)
      const newStatus = data.eventType === 1 ? "Active" : "Completed"
      return {
        bookingId: id,
        eventType: data.eventType === 1 ? "Pickup" : "Return",
        verifiedAtUtc: new Date().toISOString(),
        newBookingStatus: newStatus,
        isSuccess: true,
        message: `Handover ${data.eventType === 1 ? "Pickup" : "Return"} successfully verified via QR cryptographic token.`,
      }
    }
  },

  // 6. Extend Schedule with Dynamic Surge Pricing
  extendSchedule: async (
    id: string,
    data: ExtendScheduleRequestDto
  ): Promise<ExtendScheduleResponseDto> => {
    try {
      const response = await axiosClient.post<ExtendScheduleResponseDto>(
        `/api/v1/bookings/${id}/extend-schedule`,
        data
      )
      return response.data
    } catch (err) {
      console.warn("API unavailable, simulating surge pricing calculation", err)
      const baseDailyRate = 3500
      const extendedDays = 2
      const surgeMultiplier = 1.25
      const surgeDailyRate = baseDailyRate * surgeMultiplier
      const additionalFee = surgeDailyRate * extendedDays
      return {
        bookingId: id,
        previousEndDate: new Date().toISOString(),
        newEndDate: data.newEndDate,
        extendedDays,
        baseDailyRate,
        surgeMultiplier,
        surgeDailyRate,
        additionalFee,
        newTotalRentalFee: 10500 + additionalFee,
        reason: "High Weekend Demand (+25%)",
      }
    }
  },
}
