export type EquipmentStatus = "Available" | "Rented" | "UnderMaintenance" | "Disputed"

export type InspectionType = "PreRental" | "PostRental"
export type InspectionSeverity = "None" | "MinorWear" | "ModerateDamage" | "StructuralDamage"

export interface ToolImageDto {
  id?: string
  imageUrl: string
  angle: "Casing" | "Cord" | "Motor" | "General" | string
  isPrimary: boolean
}

export interface EquipmentDto {
  id: string
  title: string
  description?: string
  categoryId: string
  categoryName: string
  dailyRate: number
  replacementValue: number
  status: EquipmentStatus
  location: string
  specificationsJson?: string
  ownerId: string
  accumulatedRentalDays: number
  requiresMandatoryServicing: boolean
  images: ToolImageDto[]
  createdAt: string
}

export interface CategoryDto {
  id: string
  name: string
  description?: string
  iconUrl?: string
  toolCount?: number
}

export interface InspectionPhotoDto {
  angle: string
  photoUrl: string
  caption?: string
  timestamp?: string
}

export interface InspectionLogDto {
  id: string
  equipmentId: string
  bookingId: string
  inspectorUserId: string
  type: InspectionType
  severity: InspectionSeverity
  conditionNotes: string
  photos: InspectionPhotoDto[]
  createdAt: string
}

export interface EquipmentFilterParams {
  searchTerm?: string
  categoryId?: string
  minDailyRate?: number
  maxDailyRate?: number
  status?: EquipmentStatus
  pageNumber?: number
  pageSize?: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface BatchAvailabilityItem {
  equipmentId: string
  title: string
  status: string
  isAvailable: boolean
  accumulatedRentalDays: number
  lockoutReason?: string
  actionRequired?: string
}

export interface BatchAvailabilityReport {
  startDate: string
  endDate: string
  requestedCount: number
  availableCount: number
  lockedOutCount: number
  items: BatchAvailabilityItem[]
}
