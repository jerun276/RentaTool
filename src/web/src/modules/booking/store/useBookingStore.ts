import { create } from "zustand"
import {
  ActiveBookingSummaryDto,
  CreateBookingRequestDto,
  ExtendScheduleResponseDto,
  HandoverVerificationResponseDto,
} from "../types/bookingTypes"
import { bookingApi } from "../api/bookingApi"

interface BookingState {
  bookings: ActiveBookingSummaryDto[]
  selectedBooking: ActiveBookingSummaryDto | null
  isLoading: boolean
  error: string | null
  activeTab: "tracker" | "conflicts" | "dossier"

  // Actions
  fetchBookings: () => Promise<void>
  setSelectedBooking: (booking: ActiveBookingSummaryDto | null) => void
  setActiveTab: (tab: "tracker" | "conflicts" | "dossier") => void
  createBooking: (dto: CreateBookingRequestDto) => Promise<boolean>
  extendSchedule: (id: string, newEndDate: string) => Promise<ExtendScheduleResponseDto | null>
  verifyHandover: (
    id: string,
    token: string,
    eventType: 1 | 2,
    lat?: number,
    lng?: number
  ) => Promise<HandoverVerificationResponseDto | null>
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  selectedBooking: null,
  isLoading: false,
  error: null,
  activeTab: "tracker",

  fetchBookings: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await bookingApi.getActiveBookings()
      set({ bookings: data, isLoading: false })
    } catch (err: any) {
      set({ error: err?.message || "Failed to load bookings", isLoading: false })
    }
  },

  setSelectedBooking: (booking) => {
    set({ selectedBooking: booking })
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab })
  },

  createBooking: async (dto) => {
    set({ isLoading: true, error: null })
    try {
      await bookingApi.createBooking(dto)
      await get().fetchBookings()
      return true
    } catch (err: any) {
      set({ error: err?.message || "Failed to create booking", isLoading: false })
      return false
    }
  },

  extendSchedule: async (id, newEndDate) => {
    set({ isLoading: true, error: null })
    try {
      const result = await bookingApi.extendSchedule(id, { newEndDate })
      // Update local state
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id
            ? { ...b, endDate: newEndDate, totalRentalFee: result.newTotalRentalFee }
            : b
        ),
        isLoading: false,
      }))
      return result
    } catch (err: any) {
      set({ error: err?.message || "Schedule extension conflict", isLoading: false })
      return null
    }
  },

  verifyHandover: async (id, token, eventType, lat = 6.9271, lng = 79.8612) => {
    set({ isLoading: true, error: null })
    try {
      const result = await bookingApi.verifyHandover(id, {
        token,
        eventType,
        latitude: lat,
        longitude: lng,
        city: "Colombo",
      })
      // Update local state
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id
            ? {
                ...b,
                status: result.newBookingStatus,
                pickupVerified: eventType === 1 ? true : b.pickupVerified,
                returnVerified: eventType === 2 ? true : b.returnVerified,
              }
            : b
        ),
        isLoading: false,
      }))
      return result
    } catch (err: any) {
      set({ error: err?.message || "Handover verification failed", isLoading: false })
      return null
    }
  },
}))
