import { axiosClient } from "@/shared/api/axiosClient"
import {
  EquipmentDto,
  CategoryDto,
  InspectionLogDto,
  InspectionPhotoDto,
  EquipmentFilterParams,
  PagedResult,
  BatchAvailabilityReport,
  EquipmentStatus,
  InspectionType,
  InspectionSeverity,
} from "../types/catalogTypes"

function mapEquipmentDto(raw: any): EquipmentDto {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    categoryId: raw.categoryId,
    categoryName: raw.categoryName || "Machinery",
    dailyRate: Number(raw.dailyRate ?? 0),
    replacementValue: Number(raw.replacementValue ?? 0),
    status: (raw.status as EquipmentStatus) || "Available",
    location: raw.location || "Colombo",
    specificationsJson: raw.specificationsJson,
    ownerId: raw.ownerId,
    accumulatedRentalDays: Number(raw.totalRentalDaysAccumulated ?? raw.accumulatedRentalDays ?? 0),
    requiresMandatoryServicing: Boolean(raw.requiresMaintenanceCheck ?? raw.requiresMandatoryServicing ?? false),
    images: Array.isArray(raw.images) ? raw.images : [],
    createdAt: raw.createdAtUtc || raw.createdAt || new Date().toISOString(),
  }
}

/**
 * Catalog API client — all calls hit the live ASP.NET Core API.
 * Maps live PostgreSQL records to UI models seamlessly.
 */
export const catalogApi = {
  // Fetch paginated equipment list
  async getEquipmentList(filter: EquipmentFilterParams = {}): Promise<PagedResult<EquipmentDto>> {
    const response = await axiosClient.get<any>("/equipment", {
      params: {
        searchTerm: filter.searchTerm,
        categoryId: filter.categoryId,
        minPrice: filter.minDailyRate,
        maxPrice: filter.maxDailyRate,
        status: filter.status,
        page: filter.pageNumber || 1,
        pageSize: filter.pageSize || 20,
      },
    })

    const rawData = response.data
    const rawItems: any[] = rawData?.items || (Array.isArray(rawData) ? rawData : [])
    const mappedItems: EquipmentDto[] = rawItems.map(mapEquipmentDto)

    const totalCount = rawData?.totalCount ?? mappedItems.length
    const pageNumber = rawData?.pageNumber ?? rawData?.page ?? 1
    const pageSize = rawData?.pageSize ?? mappedItems.length
    const totalPages = rawData?.totalPages ?? Math.max(1, Math.ceil(totalCount / (pageSize || 1)))

    return {
      items: mappedItems,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber < totalPages,
    }
  },

  // Get single equipment by ID
  async getEquipmentById(id: string): Promise<EquipmentDto> {
    const response = await axiosClient.get<any>(`/equipment/${id}`)
    return mapEquipmentDto(response.data)
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
    const payload = {
      title: data.title,
      description: data.description || "",
      categoryId: data.categoryId,
      dailyRate: data.dailyRate,
      replacementValue: data.replacementValue,
      location: data.location,
      specificationsJson: data.specificationsJson || "{}",
      images: (data.imageUrls || []).map((img, idx) => ({
        imageUrl: img.photoUrl,
        angle: img.angle,
        isPrimary: idx === 0,
      })),
    }

    const response = await axiosClient.post<any>("/equipment", payload)
    return mapEquipmentDto(response.data)
  },

  // Get condition inspection history timeline
  async getEquipmentHistory(id: string): Promise<InspectionLogDto[]> {
    const response = await axiosClient.get<any>(`/equipment/${id}/history`)
    const data = response.data
    const timeline: any[] = Array.isArray(data)
      ? data
      : data?.inspectionTimeline || []

    return timeline.map((l: any) => {
      let rawPhotos: any[] = []
      if (Array.isArray(l.photos)) {
        rawPhotos = l.photos
      } else if (Array.isArray(l.Photos)) {
        rawPhotos = l.Photos
      } else if (typeof l.photosJson === "string" && l.photosJson.trim().length > 0) {
        try {
          rawPhotos = JSON.parse(l.photosJson)
        } catch {
          rawPhotos = []
        }
      } else if (typeof l.PhotosJson === "string" && l.PhotosJson.trim().length > 0) {
        try {
          rawPhotos = JSON.parse(l.PhotosJson)
        } catch {
          rawPhotos = []
        }
      } else if (Array.isArray(l.photoUrls)) {
        rawPhotos = l.photoUrls
      } else if (Array.isArray(l.PhotoUrls)) {
        rawPhotos = l.PhotoUrls
      }

      const photos: InspectionPhotoDto[] = rawPhotos.map((p: any) => {
        if (typeof p === "string") {
          return { angle: "General", photoUrl: p }
        }
        return {
          angle: p.angle || p.Angle || "General",
          photoUrl: p.photoUrl || p.PhotoUrl || p.url || p.Url || "",
          caption: p.observationNote || p.ObservationNote || p.caption || undefined,
        }
      })

      return {
        id: l.id,
        equipmentId: l.equipmentId,
        bookingId: l.bookingId || "",
        inspectorUserId: l.inspectorUserId,
        type: (l.type as InspectionType) || "PostRental",
        severity: (l.severity as InspectionSeverity) || "None",
        conditionNotes: l.conditionNotes || "",
        photos,
        createdAt: l.createdAtUtc || l.createdAt || new Date().toISOString(),
      }
    })
  },

  // Record a new inspection log
  async createInspectionLog(
    equipmentId: string,
    data: {
      bookingId?: string | null
      type: InspectionType
      severity: InspectionSeverity
      conditionNotes: string
      photos: { angle: string; photoUrl: string; caption?: string }[]
    }
  ): Promise<InspectionLogDto> {
    const isGuid = data.bookingId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(data.bookingId)

    const typeMap: Record<string, number> = {
      PreRental: 1,
      PostRental: 2,
      MaintenanceCheck: 3,
    }

    const severityMap: Record<string, number> = {
      None: 0,
      MinorWear: 1,
      ModerateDamage: 2,
      StructuralDamage: 3,
    }

    const payload = {
      bookingId: isGuid ? data.bookingId : null,
      type: typeMap[data.type] ?? 1,
      severity: severityMap[data.severity] ?? 0,
      conditionNotes: data.conditionNotes,
      photos: data.photos.map((p) => ({
        angle: p.angle,
        photoUrl: p.photoUrl,
        observationNote: p.caption,
      })),
    }

    const response = await axiosClient.post<any>(`/equipment/${equipmentId}/inspection-logs`, payload)
    const l = response.data

    let rawPhotos: any[] = []
    if (Array.isArray(l.photos)) {
      rawPhotos = l.photos
    } else if (Array.isArray(l.Photos)) {
      rawPhotos = l.Photos
    } else if (typeof l.photosJson === "string" && l.photosJson.trim().length > 0) {
      try {
        rawPhotos = JSON.parse(l.photosJson)
      } catch {
        rawPhotos = []
      }
    } else if (typeof l.PhotosJson === "string" && l.PhotosJson.trim().length > 0) {
      try {
        rawPhotos = JSON.parse(l.PhotosJson)
      } catch {
        rawPhotos = []
      }
    }

    const photos: InspectionPhotoDto[] = rawPhotos.map((p: any) => {
      if (typeof p === "string") {
        return { angle: "General", photoUrl: p }
      }
      return {
        angle: p.angle || p.Angle || "General",
        photoUrl: p.photoUrl || p.PhotoUrl || p.url || p.Url || "",
        caption: p.observationNote || p.ObservationNote || p.caption || undefined,
      }
    })

    return {
      id: l.id,
      equipmentId: l.equipmentId,
      bookingId: l.bookingId || "",
      inspectorUserId: l.inspectorUserId,
      type: (l.type as InspectionType) || data.type,
      severity: (l.severity as InspectionSeverity) || data.severity,
      conditionNotes: l.conditionNotes || data.conditionNotes,
      photos,
      createdAt: l.createdAtUtc || l.createdAt || new Date().toISOString(),
    }
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
