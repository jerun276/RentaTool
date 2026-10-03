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

/**
 * Booking API client — all calls hit the live ASP.NET Core API.
 * Failures propagate so the UI never reports a fabricated booking,
 * token, verification, or surge quote as if it were real.
 */
export const bookingApi = {
  // 1. Create a new booking request
  createBooking: async (data: CreateBookingRequestDto): Promise<BookingResponseDto> => {
    const response = await axiosClient.post<BookingResponseDto>("/bookings", data)
    return response.data
  },

  // 2. Fetch active bookings
  getActiveBookings: async (): Promise<ActiveBookingSummaryDto[]> => {
    const response = await axiosClient.get<ActiveBookingSummaryDto[]>("/bookings/active")
    return response.data
  },

  // 3. Get booking by ID
  getBookingById: async (id: string): Promise<BookingResponseDto> => {
    const response = await axiosClient.get<BookingResponseDto>(`/bookings/${id}`)
    return response.data
  },

  // 4. Generate Single-Use QR Token
  generateHandoverToken: async (id: string, eventType: 1 | 2): Promise<HandoverTokenResponseDto> => {
    const response = await axiosClient.post<HandoverTokenResponseDto>(
      `/bookings/${id}/generate-handover-token`,
      { eventType } as GenerateHandoverTokenRequestDto
    )
    return response.data
  },

  // 5. Verify Handover Token
  verifyHandover: async (id: string, data: VerifyHandoverRequestDto): Promise<HandoverVerificationResponseDto> => {
    const response = await axiosClient.post<HandoverVerificationResponseDto>(`/bookings/${id}/verify-handover`, data)
    return response.data
  },

  // 6. Extend Schedule with Dynamic Surge Pricing
  extendSchedule: async (id: string, data: ExtendScheduleRequestDto): Promise<ExtendScheduleResponseDto> => {
    const response = await axiosClient.post<ExtendScheduleResponseDto>(`/bookings/${id}/extend-schedule`, data)
    return response.data
  },

  // 7. Derive per-equipment blocked schedule windows from live bookings
  getScheduleBlocks: async (): Promise<ScheduleConflictItem[]> => {
    const bookings = await bookingApi.getActiveBookings()
    return bookings
      .filter((b) => b.status !== "Cancelled")
      .map((b) => ({
        id: `sch-${b.id}`,
        equipmentId: b.equipmentId,
        bookingId: b.id,
        blockedStartDate: b.startDate,
        blockedEndDate: b.endDate,
        reason: `RentalReservation: ${b.id.slice(0, 8).toUpperCase()} (${b.status})`,
        status: "Confirmed" as const,
      }))
  },
}
