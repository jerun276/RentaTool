import { axiosClient } from "@/shared/api/axiosClient"
import {
  EquipmentDto,
  CategoryDto,
  InspectionLogDto,
  EquipmentFilterParams,
  PagedResult,
  BatchAvailabilityReport,
} from "../types/catalogTypes"

// Fallback mock categories matching PRD seed data
export const MOCK_CATEGORIES: CategoryDto[] = [
  { id: "cat-1111", name: "Power Tools", description: "Heavy-duty electric & cordless drilling, fastening, and cutting tools", toolCount: 14 },
  { id: "cat-2222", name: "Heavy Machinery", description: "Earthmoving, compaction, and civil construction equipment", toolCount: 8 },
  { id: "cat-3333", name: "Cleaning Equipment", description: "Industrial high-pressure washers, vacuum cleaners, and scrubbers", toolCount: 6 },
  { id: "cat-4444", name: "Generators & Power", description: "Silent diesel & petrol portable power generators", toolCount: 5 },
]

// Fallback mock equipment
export const MOCK_EQUIPMENT: EquipmentDto[] = [
  {
    id: "eq-001",
    title: "Karcher HD 5/15 C Pressure Washer",
    description: "Compact, commercial cold-water high pressure washer. Ideal for construction site cleaning.",
    categoryId: "cat-3333",
    categoryName: "Cleaning Equipment",
    dailyRate: 3500,
    replacementValue: 75000,
    status: "Available",
    location: "Colombo 03",
    ownerId: "99999999-9999-9999-9999-999999999999",
    accumulatedRentalDays: 24,
    requiresMandatoryServicing: false,
    images: [
      { imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80", angle: "General", isPrimary: true },
      { imageUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80", angle: "Casing", isPrimary: false },
      { imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", angle: "Cord", isPrimary: false },
    ],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "eq-002",
    title: "Bosch Professional GBH 8-45 D Rotary Hammer",
    description: "Heavy 1500W SDS-Max demolition hammer for concrete drilling and chiselling.",
    categoryId: "cat-1111",
    categoryName: "Power Tools",
    dailyRate: 4200,
    replacementValue: 120000,
    status: "Available",
    location: "Kandy",
    ownerId: "99999999-9999-9999-9999-999999999999",
    accumulatedRentalDays: 62,
    requiresMandatoryServicing: true,
    images: [
      { imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80", angle: "General", isPrimary: true },
      { imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80", angle: "Casing", isPrimary: false },
      { imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80", angle: "Motor", isPrimary: false },
    ],
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: "eq-003",
    title: "Mikasa Plate Compactor 90kg",
    description: "High-compaction forward plate compactor powered by Honda GX160 engine.",
    categoryId: "cat-2222",
    categoryName: "Heavy Machinery",
    dailyRate: 6500,
    replacementValue: 210000,
    status: "UnderMaintenance",
    location: "Gampaha",
    ownerId: "88888888-8888-8888-8888-888888888888",
    accumulatedRentalDays: 78,
    requiresMandatoryServicing: true,
    images: [
      { imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80", angle: "General", isPrimary: true },
    ],
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: "eq-004",
    title: "Honda EU30is Inverter Generator 3kVA",
    description: "Ultra-quiet portable inverter generator with clean power output for sensitive site electronics.",
    categoryId: "cat-4444",
    categoryName: "Generators & Power",
    dailyRate: 5000,
    replacementValue: 280000,
    status: "Rented",
    location: "Colombo 07",
    ownerId: "99999999-9999-9999-9999-999999999999",
    accumulatedRentalDays: 32,
    requiresMandatoryServicing: false,
    images: [
      { imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80", angle: "General", isPrimary: true },
    ],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
]

export const catalogApi = {
  // Fetch paginated equipment list
  async getEquipmentList(filter: EquipmentFilterParams = {}): Promise<PagedResult<EquipmentDto>> {
    try {
      const response = await axiosClient.get<PagedResult<EquipmentDto>>("/equipment", {
        params: filter,
      })
      return response.data
    } catch {
      // Mock filtering fallback
      let filtered = [...MOCK_EQUIPMENT]
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase()
        filtered = filtered.filter(
          (e) => e.title.toLowerCase().includes(term) || e.description?.toLowerCase().includes(term)
        )
      }
      if (filter.categoryId) {
        filtered = filtered.filter((e) => e.categoryId === filter.categoryId)
      }
      if (filter.status) {
        filtered = filtered.filter((e) => e.status === filter.status)
      }

      return {
        items: filtered,
        totalCount: filtered.length,
        pageNumber: filter.pageNumber || 1,
        pageSize: filter.pageSize || 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }
  },

  // Get single equipment by ID
  async getEquipmentById(id: string): Promise<EquipmentDto> {
    try {
      const response = await axiosClient.get<EquipmentDto>(`/equipment/${id}`)
      return response.data
    } catch {
      const found = MOCK_EQUIPMENT.find((e) => e.id === id)
      if (!found) throw new Error("Equipment not found")
      return found
    }
  },

  // Create new equipment listing
  async createEquipment(data: {
    title: string
    description?: string
    categoryId: string
    dailyRate: number
    replacementValue: number
    location: string
    specificationsJson?: string
    imageUrls?: { angle: string; photoUrl: string }[]
  }): Promise<EquipmentDto> {
    try {
      const response = await axiosClient.post<EquipmentDto>("/equipment", data)
      return response.data
    } catch {
      const newTool: EquipmentDto = {
        id: `eq-${Date.now()}`,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        categoryName: MOCK_CATEGORIES.find((c) => c.id === data.categoryId)?.name || "Power Tools",
        dailyRate: data.dailyRate,
        replacementValue: data.replacementValue,
        status: "Available",
        location: data.location,
        specificationsJson: data.specificationsJson,
        ownerId: "99999999-9999-9999-9999-999999999999",
        accumulatedRentalDays: 0,
        requiresMandatoryServicing: false,
        images: (data.imageUrls || []).map((img, idx) => ({
          imageUrl: img.photoUrl,
          angle: img.angle,
          isPrimary: idx === 0,
        })),
        createdAt: new Date().toISOString(),
      }
      MOCK_EQUIPMENT.unshift(newTool)
      return newTool
    }
  },

  // Get condition inspection history timeline
  async getEquipmentHistory(id: string): Promise<InspectionLogDto[]> {
    try {
      const response = await axiosClient.get<InspectionLogDto[]>(`/equipment/${id}/history`)
      return response.data
    } catch {
      return [
        {
          id: `log-post-${id}`,
          equipmentId: id,
          bookingId: "bkg-2026-001",
          inspectorUserId: "usr-insp-001",
          type: "PostRental",
          severity: "MinorWear",
          conditionNotes: "Post-rental return: Slight superficial scuff marks on outer casing. Motor runs smoothly. Power cord intact.",
          photos: [
            { angle: "Casing", photoUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80", caption: "Casing Inspection" },
            { angle: "Cord", photoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", caption: "Power Cord Test" },
          ],
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: `log-pre-${id}`,
          equipmentId: id,
          bookingId: "bkg-2026-001",
          inspectorUserId: "usr-insp-001",
          type: "PreRental",
          severity: "None",
          conditionNotes: "Pre-rental handover: Pristine condition. Clean casing, no scratches, power cord verified with multimeter.",
          photos: [
            { angle: "Casing", photoUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80", caption: "Pre-rental Handover" },
          ],
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ]
    }
  },

  // Record a new inspection log
  async createInspectionLog(
    equipmentId: string,
    data: {
      bookingId: string
      type: "PreRental" | "PostRental"
      severity: "None" | "MinorWear" | "ModerateDamage" | "StructuralDamage"
      conditionNotes: string
      photos: { angle: string; photoUrl: string; caption?: string }[]
    }
  ): Promise<InspectionLogDto> {
    const response = await axiosClient.post<InspectionLogDto>(`/equipment/${equipmentId}/inspection-logs`, data)
    return response.data
  },

  // Check batch availability & maintenance lockouts
  async checkBatchAvailability(data: {
    equipmentIds: string[]
    startDate: string
    endDate: string
  }): Promise<BatchAvailabilityReport> {
    try {
      const response = await axiosClient.post<BatchAvailabilityReport>("/equipment/batch-availability", data)
      return response.data
    } catch {
      const items = data.equipmentIds.map((id) => {
        const eq = MOCK_EQUIPMENT.find((e) => e.id === id) || {
          id,
          title: `Tool ${id}`,
          status: "Available",
          accumulatedRentalDays: 15,
          requiresMandatoryServicing: false,
        }

        const isLockedOut = eq.status === "UnderMaintenance" || eq.accumulatedRentalDays >= 60

        return {
          equipmentId: eq.id,
          title: eq.title,
          status: eq.status,
          isAvailable: !isLockedOut,
          accumulatedRentalDays: eq.accumulatedRentalDays,
          lockoutReason:
            eq.accumulatedRentalDays >= 60
              ? "Mandatory 60-day servicing maintenance limit reached"
              : eq.status === "UnderMaintenance"
              ? "Flagged for structural damage repair"
              : undefined,
          actionRequired: isLockedOut ? "Route to service depot for certified overhaul" : "Ready for deployment",
        }
      })

      return {
        startDate: data.startDate,
        endDate: data.endDate,
        requestedCount: items.length,
        availableCount: items.filter((i) => i.isAvailable).length,
        lockedOutCount: items.filter((i) => !i.isAvailable).length,
        items,
      }
    }
  },
}
