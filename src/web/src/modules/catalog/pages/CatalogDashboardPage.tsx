import React, { useState, useEffect } from "react"
import { Box, PlusCircle, Activity, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react"
import { EquipmentDto, CategoryDto, EquipmentStatus } from "../types/catalogTypes"
import { catalogApi, MOCK_CATEGORIES } from "../api/catalogApi"
import { EquipmentCard } from "../components/EquipmentCard"
import { EquipmentFilters } from "../components/EquipmentFilters"
import { InspectionTimelineModal } from "../components/InspectionTimelineModal"
import { CreateEquipmentModal } from "../components/CreateEquipmentModal"
import { BatchAvailabilityModal } from "../components/BatchAvailabilityModal"
import { Button } from "@/shared/components/ui/button"

export const CatalogDashboardPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<EquipmentDto[]>([])
  const [categories] = useState<CategoryDto[]>(MOCK_CATEGORIES)
  const [loading, setLoading] = useState(true)

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | undefined>()

  // Modals state
  const [selectedForHistory, setSelectedForHistory] = useState<EquipmentDto | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await catalogApi.getEquipmentList({
        searchTerm: searchTerm || undefined,
        categoryId: selectedCategoryId,
        status: selectedStatus,
      })
      setEquipmentList(res.items)
    } catch (err) {
      console.error("Failed to load equipment", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchTerm, selectedCategoryId, selectedStatus])

  // KPI calculations
  const totalCount = equipmentList.length
  const availableCount = equipmentList.filter((e) => e.status === "Available").length
  const maintenanceCount = equipmentList.filter(
    (e) => e.status === "UnderMaintenance" || e.accumulatedRentalDays >= 60
  ).length
  const rentedCount = equipmentList.filter((e) => e.status === "Rented").length

  const handleOpenHistory = (eq: EquipmentDto) => {
    setSelectedForHistory(eq)
    setIsHistoryModalOpen(true)
  }

  const handleOpenInspect = (eq: EquipmentDto) => {
    setSelectedForHistory(eq)
    setIsHistoryModalOpen(true)
  }

  const handleEquipmentCreated = (newEq: EquipmentDto) => {
    setEquipmentList((prev) => [newEq, ...prev])
  }

  return (
    <div className="container px-4 sm:px-8 py-8 space-y-8 max-w-7xl">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Component 2 – Student 2 Portfolio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Equipment Inventory & Condition Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Verified machinery catalog with multi-angle photographic condition verification,
            60-day wear limits, and dynamic maintenance lockouts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchModalOpen(true)}
            className="border-amber-500/30 text-amber-300 hover:bg-amber-950/20 text-xs h-9"
          >
            <Activity className="h-4 w-4 mr-1.5 text-amber-400" />
            Maintenance Audit
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs h-9"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            List Equipment
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            title="Refresh Fleet"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (21st.dev inspired metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-md space-y-1">
          <span className="text-[11px] uppercase font-mono text-muted-foreground flex items-center justify-between">
            <span>Total Fleet</span>
            <Box className="h-3.5 w-3.5 text-slate-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">{totalCount}</div>
          <span className="text-[11px] text-muted-foreground">Registered assets</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-md space-y-1">
          <span className="text-[11px] uppercase font-mono text-emerald-400 flex items-center justify-between">
            <span>Ready for Dispatch</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{availableCount}</div>
          <span className="text-[11px] text-emerald-400/70">Verified condition</span>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/10 backdrop-blur-md space-y-1">
          <span className="text-[11px] uppercase font-mono text-blue-400 flex items-center justify-between">
            <span>On Active Rental</span>
            <Activity className="h-3.5 w-3.5 text-blue-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-blue-400">{rentedCount}</div>
          <span className="text-[11px] text-blue-400/70">Accruing wear days</span>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 backdrop-blur-md space-y-1">
          <span className="text-[11px] uppercase font-mono text-amber-400 flex items-center justify-between">
            <span>Maintenance Alert</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">{maintenanceCount}</div>
          <span className="text-[11px] text-amber-400/70">&ge;60d or repair lock</span>
        </div>
      </div>

      {/* Filter Section */}
      <EquipmentFilters
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        onSelectCategory={setSelectedCategoryId}
        onSearchChange={setSearchTerm}
        onStatusChange={setSelectedStatus}
        onReset={() => {
          setSearchTerm("")
          setSelectedCategoryId(undefined)
          setSelectedStatus(undefined)
        }}
      />

      {/* Equipment Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
          Loading machinery catalog from PostgreSQL & EF Core...
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="py-20 text-center space-y-3 rounded-xl border border-dashed border-border p-8">
          <Box className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-foreground">No machinery found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No equipment matches your current search or category filter. Try clearing filters or list new machinery.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setSelectedCategoryId(undefined)
              setSelectedStatus(undefined)
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipmentList.map((eq) => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              onViewHistory={handleOpenHistory}
              onInspect={handleOpenInspect}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <InspectionTimelineModal
        equipment={selectedForHistory}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onInspectionAdded={loadData}
      />

      <CreateEquipmentModal
        isOpen={isCreateModalOpen}
        categories={categories}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleEquipmentCreated}
      />

      <BatchAvailabilityModal
        isOpen={isBatchModalOpen}
        equipmentList={equipmentList}
        onClose={() => setIsBatchModalOpen(false)}
      />
    </div>
  )
}
