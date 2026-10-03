import { axiosClient } from "@/shared/api/axiosClient"
import {
  EquipmentDto,
  CategoryDto,
  InspectionLogDto,
  EquipmentFilterParams,
  PagedResult,
  BatchAvailabilityReport,
} from "../types/catalogTypes"

/**
 * Catalog API client — all calls hit the live ASP.NET Core API.
 * Errors propagate to the caller so the UI can render an explicit error state
 * instead of silently substituting fabricated records.
 */
export const catalogApi = {
  // Fetch paginated equipment list
  async getEquipmentList(filter: EquipmentFilterParams = {}): Promise<PagedResult<EquipmentDto>> {
    const response = await axiosClient.get<PagedResult<EquipmentDto>>("/equipment", {
      params: filter,
    })
    return response.data
  },

  // Get single equipment by ID
  async getEquipmentById(id: string): Promise<EquipmentDto> {
    const response = await axiosClient.get<EquipmentDto>(`/equipment/${id}`)
    return response.data
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
    const response = await axiosClient.post<EquipmentDto>("/equipment", data)
    return response.data
  },

  // Get condition inspection history timeline
  async getEquipmentHistory(id: string): Promise<InspectionLogDto[]> {
    const response = await axiosClient.get<InspectionLogDto[]>(`/equipment/${id}/history`)
    return response.data
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
    const response = await axiosClient.post<BatchAvailabilityReport>("/equipment/batch-availability", data)
    return response.data
  },

  // Fetch active categories with dynamic specification schemas
  async getCategories(): Promise<CategoryDto[]> {
    const response = await axiosClient.get<CategoryDto[]>("/categories")
    return response.data
  },

  // Create a new category with dynamic specification schema
  async createCategory(data: {
    name: string
    description?: string
    iconUrl?: string
    specificationSchema?: any[]
  }): Promise<CategoryDto> {
    const response = await axiosClient.post<CategoryDto>("/categories", data)
    return response.data
  },
}
