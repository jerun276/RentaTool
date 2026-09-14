export type BookingStatus =
  | "Requested"
  | "Confirmed"
  | "Active"
  | "Completed"
  | "Cancelled"
  | "Disputed"

export type HandoverEventType = 1 | 2 // 1 = Pickup, 2 = Return

export interface BookingResponseDto {
  id: string
  equipmentId: string
  renterId: string
  ownerId: string
  startDate: string
  endDate: string
  dailyRate: number
  totalRentalFee: number
  status: BookingStatus
  cancellationReason?: string
  createdAtUtc: string
  updatedAtUtc?: string
}

export interface ActiveBookingSummaryDto {
  id: string
  equipmentId: string
  renterId: string
  ownerId: string
  startDate: string
  endDate: string
  totalRentalFee: number
  status: BookingStatus
  pickupVerified: boolean
  returnVerified: boolean
  createdAtUtc: string
}

export interface CreateBookingRequestDto {
  equipmentId: string
  ownerId: string
  startDate: string
  endDate: string
  dailyRate: number
}

export interface GenerateHandoverTokenRequestDto {
  eventType: HandoverEventType
}

export interface HandoverTokenResponseDto {
  bookingId: string
  eventType: "Pickup" | "Return" | string
  token: string
  expiresAtUtc: string
  instructions: string
}

export interface VerifyHandoverRequestDto {
  token: string
  eventType: HandoverEventType
  latitude: number
  longitude: number
  addressLine?: string
  city?: string
  postalCode?: string
}

export interface HandoverVerificationResponseDto {
  bookingId: string
  eventType: string
  verifiedAtUtc: string
  newBookingStatus: BookingStatus
  isSuccess: boolean
  message: string
}

export interface ExtendScheduleRequestDto {
  newEndDate: string
}

export interface ExtendScheduleResponseDto {
  bookingId: string
  previousEndDate: string
  newEndDate: string
  extendedDays: number
  baseDailyRate: number
  surgeMultiplier: number
  surgeDailyRate: number
  additionalFee: number
  newTotalRentalFee: number
  reason: string
}

export interface ScheduleConflictItem {
  id: string
  equipmentId: string
  bookingId: string
  blockedStartDate: string
  blockedEndDate: string
  reason: string
  status: "Conflict" | "Confirmed" | "Extended"
}
