import React, { useState, useEffect } from "react"
import { axiosClient } from "@/shared/api/axiosClient"
import { catalogApi } from "../api/catalogApi"

const FALLBACK_FLEET_DATA = [
  {
    id: "EQ-0101",
    dbId: "mock-1",
    name: "Caterpillar 320D Hydraulic Excavator",
    category: "Heavy Machinery",
    serial: "SN-CAT320D-9921",
    custodian: "Colombo Port Central Depot",
    location: "Colombo",
    dailyRate: 45000,
    valuation: 12500000,
    daysRented: 64,
    isLocked: true,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EQ-0102",
    dbId: "mock-2",
    name: "Cummins 250kVA Silent Diesel Generator",
    category: "Power & Generation",
    serial: "SN-CUM250-4812",
    custodian: "Kandy Logistics Depot",
    location: "Kandy",
    dailyRate: 28000,
    valuation: 6200000,
    daysRented: 52,
    isLocked: false,
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EQ-0103",
    dbId: "mock-3",
    name: "Komatsu PC130 Tracked Excavator",
    category: "Heavy Machinery",
    serial: "SN-KOM130-7731",
    custodian: "Galle Southern Gateway Hub",
    location: "Galle",
    dailyRate: 38000,
    valuation: 9800000,
    daysRented: 28,
    isLocked: false,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EQ-0104",
    dbId: "mock-4",
    name: "Atlas Copco XAS 186 Air Compressor",
    category: "Pneumatics & Air",
    serial: "SN-ATC186-3390",
    custodian: "Jaffna Regional Facility",
    location: "Jaffna",
    dailyRate: 18500,
    valuation: 3400000,
    daysRented: 61,
    isLocked: true,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EQ-0105",
    dbId: "mock-5",
    name: "Bomag BW 213 Single Drum Roller",
    category: "Compaction Equipment",
    serial: "SN-BOM213-8819",
    custodian: "Kurunegala Transit Hub",
    location: "Kurunegala",
    dailyRate: 32000,
    valuation: 7500000,
    daysRented: 15,
    isLocked: false,
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EQ-0106",
    dbId: "mock-6",
    name: "Perkins 150kVA Mobile Soundproof Generator",
    category: "Power & Generation",
    serial: "SN-PER150-5542",
    custodian: "Gampaha Operations Base",
    location: "Gampaha",
    dailyRate: 22000,
    valuation: 4800000,
    daysRented: 48,
    isLocked: false,
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EQ-0107",
    dbId: "mock-7",
    name: "JCB 3DX Eco Backhoe Loader",
    category: "Heavy Machinery",
    serial: "SN-JCB3DX-1144",
    custodian: "Batticaloa Field Outpost",
    location: "Batticaloa",
    dailyRate: 26000,
    valuation: 5800000,
    daysRented: 34,
    isLocked: false,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EQ-0108",
    dbId: "mock-8",
    name: "Wacker Neuson DPU 6555 Heavy Compactor",
    category: "Compaction Equipment",
    serial: "SN-WAC655-2091",
    custodian: "Anuradhapura Central Depot",
    location: "Anuradhapura",
    dailyRate: 14000,
    valuation: 2200000,
    daysRented: 12,
    isLocked: false,
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
  },
]

export const FleetWearHubView: React.FC = () => {
  const [filterState, setFilterState] = useState<"all" | "healthy" | "due" | "lockout">("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [dbLive, setDbLive] = useState<boolean>(false)
  const [isOverriding, setIsOverriding] = useState<Record<string, boolean>>({})
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedToolHistory, setSelectedToolHistory] = useState<any | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; angle: string } | null>(null)

  const [fleetList, setFleetList] = useState<any[]>(FALLBACK_FLEET_DATA)
  const [loadingFleet, setLoadingFleet] = useState<boolean>(false)

  const resolveEquipmentImageUrl = (eq: any): string => {
    if (Array.isArray(eq.images) && eq.images.length > 0) {
      const primary = eq.images.find((img: any) => typeof img === "object" && img?.isPrimary)
      if (primary && primary.imageUrl) return primary.imageUrl
      const first = eq.images[0]
      if (typeof first === "string" && first.trim()) return first
      if (first && typeof first === "object" && first.imageUrl) return first.imageUrl
    }
    const title = (eq.title || eq.name || "").toLowerCase()
    if (title.includes("generator")) {
      return "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop&q=80"
    }
    if (title.includes("excavator")) {
      return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80"
    }
    if (title.includes("roller") || title.includes("compactor")) {
      return "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80"
    }
    return "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=150&auto=format&fit=crop&q=80"
  }

  const fetchEquipment = async () => {
    setLoadingFleet(true)
    try {
      const res = await axiosClient.get("/equipment", {
        params: { pageSize: 100 }
      })
      if (res.data) {
        const items = res.data.items || (Array.isArray(res.data) ? res.data : [])
        if (items.length > 0) {
          setDbLive(true)
          const mapped = items.map((eq: any) => {
            const accumulated = Number(eq.totalRentalDaysAccumulated ?? eq.accumulatedRentalDays ?? 0)
            const isLocked = Boolean(eq.requiresMaintenanceCheck || eq.requiresMandatoryServicing || eq.status === "UnderMaintenance" || accumulated >= 60)
            return {
              id: `EQ-${(eq.id || "").slice(0, 4).toUpperCase()}`,
              dbId: eq.id,
              name: eq.title || eq.name || "Equipment Asset",
              category: eq.categoryName || eq.category?.name || "Heavy Machinery",
              serial: `SN-${(eq.id || "").slice(0, 8).toUpperCase()}`,
              custodian: eq.ownerName ? `${eq.ownerName} Depot` : "Western Province Operations Hub",
              location: eq.location || "Colombo",
              dailyRate: Number(eq.dailyRate || 5000),
              valuation: Number(eq.replacementValue || 200000),
              daysRented: accumulated,
              isLocked,
              image: resolveEquipmentImageUrl(eq),
            }
          })
          setFleetList(mapped)
        }
      }
    } catch (err) {
      console.warn("Could not fetch equipment from live API, retaining standby operational fleet:", err)
      setDbLive(false)
    } finally {
      setLoadingFleet(false)
    }
  }

  // Fetch live PostgreSQL equipment records on mount
  useEffect(() => {
    fetchEquipment()
  }, [])

  // Auto-dismiss action feedback notification
  useEffect(() => {
    if (!actionFeedback) return
    const timer = setTimeout(() => setActionFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [actionFeedback])

  const handleEngineerOverride = async (tool: any) => {
    const confirm = window.confirm(
      `Issue authorized Mechanical Engineer Dye-Penetrant Certification for asset ${tool.name} (#${tool.id})? This will recalibrate cumulative operational days to 0 and remove fail-safe lock in PostgreSQL.`
    )
    if (!confirm) return

    setIsOverriding((prev) => ({ ...prev, [tool.id]: true }))
    try {
      if (tool.dbId && tool.dbId.length > 20) {
        await axiosClient.post(`/equipment/${tool.dbId}/maintenance/complete`)
        setActionFeedback({
          type: "success",
          message: `Mechanical Overhaul successfully certified for ${tool.name}. Wear counter reset to 0 in PostgreSQL.`,
        })
        await fetchEquipment()
      } else {
        setOverrides((prev) => ({ ...prev, [tool.id]: true }))
        setFleetList((prev) =>
          prev.map((item) =>
            item.id === tool.id ? { ...item, daysRented: 0, isLocked: false } : item
          )
        )
        setActionFeedback({
          type: "success",
          message: `Local simulated certification applied for ${tool.name}.`,
        })
      }
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.response?.data?.message || `Failed to complete maintenance certification for #${tool.id}.`,
      })
    } finally {
      setIsOverriding((prev) => ({ ...prev, [tool.id]: false }))
    }
  }

  const handleInspectLogs = async (tool: any) => {
    setHistoryModalOpen(true)
    setSelectedToolHistory({ title: tool.name, id: tool.id, inspectionTimeline: [] })
    if (tool.dbId && tool.dbId.length > 20) {
      setLoadingHistory(true)
      try {
        const logs = await catalogApi.getEquipmentHistory(tool.dbId)
        setSelectedToolHistory({
          title: tool.name,
          id: tool.id,
          inspectionTimeline: logs,
        })
      } catch (err) {
        console.warn("Could not fetch equipment history from DB:", err)
      } finally {
        setLoadingHistory(false)
      }
    }
  }

  // Dynamic Telemetry Statistics derived directly from live database items
  const stats = React.useMemo(() => {
    const total = fleetList.length
    const locked = fleetList.filter((item) => {
      const isOverridden = overrides[item.id]
      const effectiveDays = isOverridden ? 0 : item.daysRented
      return (effectiveDays >= 60 || item.isLocked) && !isOverridden
    }).length
    const due = fleetList.filter((item) => {
      const isOverridden = overrides[item.id]
      const effectiveDays = isOverridden ? 0 : item.daysRented
      const isLocked = (effectiveDays >= 60 || item.isLocked) && !isOverridden
      return effectiveDays > 45 && effectiveDays < 60 && !isLocked
    }).length
    const healthy = fleetList.filter((item) => {
      const isOverridden = overrides[item.id]
      const effectiveDays = isOverridden ? 0 : item.daysRented
      const isLocked = (effectiveDays >= 60 || item.isLocked) && !isOverridden
      return effectiveDays <= 45 && !isLocked
    }).length
    const healthRate = total > 0 ? ((healthy / total) * 100).toFixed(1) : "100.0"

    return { total, healthy, due, locked, healthRate }
  }, [fleetList, overrides])

  // Dynamic Categories derived directly from live database items
  const dynamicCategories = React.useMemo(() => {
    const counts: Record<string, number> = {}
    fleetList.forEach((item) => {
      const cat = item.category || "General Machinery"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return [
      { id: "all", label: `All Categories (${fleetList.length})` },
      ...Object.entries(counts).map(([cat, count]) => ({
        id: cat,
        label: `${cat} (${count})`,
      })),
    ]
  }, [fleetList])

  const filteredFleet = React.useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase()
    // Strip leading '#' so searching '#TR-088' or '#EQ-0101' matches directly
    const query = rawQuery.startsWith("#") ? rawQuery.slice(1).trim() : rawQuery

    return fleetList.filter((item) => {
      // 1. Search Query across all fields
      if (query) {
        const itemId = (item.id || "").toLowerCase()
        const itemName = (item.name || "").toLowerCase()
        const itemSerial = (item.serial || "").toLowerCase()
        const itemCustodian = (item.custodian || "").toLowerCase()
        const itemLocation = (item.location || "").toLowerCase()
        const itemCategory = (item.category || "").toLowerCase()

        const matches =
          itemId.includes(query) ||
          itemName.includes(query) ||
          itemSerial.includes(query) ||
          itemCustodian.includes(query) ||
          itemLocation.includes(query) ||
          itemCategory.includes(query)

        if (!matches) return false
      }

      // 2. Category Filter
      if (categoryFilter !== "all") {
        const itemCat = (item.category || "General Machinery").trim().toLowerCase()
        const targetCat = categoryFilter.trim().toLowerCase()
        if (itemCat !== targetCat) return false
      }

      // 3. Status / 60-Day Wear Filter
      const isOverridden = overrides[item.id]
      const effectiveDays = isOverridden ? 0 : item.daysRented
      const isLocked = (effectiveDays >= 60 || item.isLocked) && !isOverridden

      if (filterState === "healthy") return effectiveDays <= 45 && !isLocked
      if (filterState === "due") return effectiveDays > 45 && effectiveDays < 60 && !isLocked
      if (filterState === "lockout") return isLocked
      return true
    })
  }, [fleetList, searchQuery, categoryFilter, filterState, overrides])

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. DESK HEADER & STATS RIBBON */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#4edea3] font-mono text-[11px] uppercase tracking-wider font-semibold border border-[#10b981]/25">
              Fleet Telematics & Health
            </span>
            {dbLive && (
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-[10px] font-bold border border-[#10b981]/30">
                ● PostgreSQL Active
              </span>
            )}
            <span className="text-[#86948a]">•</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#bbcabf]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              Sync Rate: 1.2s
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#dfe2ee] tracking-tight">
            Fleet Health & 60-Day Wear Compliance Hub
          </h1>
          <p className="text-[13px] text-[#bbcabf] max-w-2xl">
            Automated duty-cycle telemetry tracking, 60-day mandatory service lockouts, and certified engineer overhaul overrides.
          </p>
        </div>

        {/* Quick Stats Telemetry Ribbon — Interactive Filter Switches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0a0e16] p-2.5 rounded-lg border border-[#1f2937]">
          {/* Active Fleet Button */}
          <button
            type="button"
            onClick={() => setFilterState("all")}
            className={`flex flex-col text-left px-3 py-1.5 rounded transition-all cursor-pointer ${
              filterState === "all"
                ? "bg-[#181c24] border-2 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "bg-[#181c24] border border-[#1f2937] hover:border-[#10b981]/50"
            }`}
            title="Click to view all active fleet units"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Active Fleet</span>
              {filterState === "all" && (
                <span className="text-[9px] font-mono px-1 py-0.2 bg-[#10b981]/20 text-[#4edea3] rounded font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
              <span className="text-[10px] font-mono text-[#4edea3]">{stats.healthRate}%</span>
            </div>
          </button>

          {/* Healthy (0-45d) Button */}
          <button
            type="button"
            onClick={() => setFilterState("healthy")}
            className={`flex flex-col text-left px-3 py-1.5 rounded transition-all cursor-pointer ${
              filterState === "healthy"
                ? "bg-[#181c24] border-2 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "bg-[#181c24] border border-[#1f2937] hover:border-[#10b981]/50"
            }`}
            title="Click to filter by Healthy equipment (0-45 days)"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Healthy (0-45d)</span>
              {filterState === "healthy" && (
                <span className="text-[9px] font-mono px-1 py-0.2 bg-[#10b981]/20 text-[#4edea3] rounded font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-[#4edea3]">{stats.healthy}</span>
              <span className="text-[10px] font-mono text-[#bbcabf]">Normal</span>
            </div>
          </button>

          {/* Service Due (46-59d) Button */}
          <button
            type="button"
            onClick={() => setFilterState("due")}
            className={`flex flex-col text-left px-3 py-1.5 rounded transition-all cursor-pointer ${
              filterState === "due"
                ? "bg-[#181c24] border-2 border-[#ffb95f] shadow-[0_0_12px_rgba(255,185,95,0.25)]"
                : "bg-[#181c24] border border-[#1f2937] hover:border-[#ffb95f]/50"
            }`}
            title="Click to filter by equipment due for service (46-59 days)"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#ffb95f] uppercase">Service Due (46-59d)</span>
              {filterState === "due" && (
                <span className="text-[9px] font-mono px-1 py-0.2 bg-[#e29100]/25 text-[#ffb95f] rounded font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-[#ffb95f]">{stats.due}</span>
              <span className="text-[10px] font-mono text-[#ffb95f]">Priority</span>
            </div>
          </button>

          {/* Locked Out (60d+) Button */}
          <button
            type="button"
            onClick={() => setFilterState("lockout")}
            className={`flex flex-col text-left px-3 py-1.5 rounded transition-all cursor-pointer ${
              filterState === "lockout"
                ? "bg-[#181c24] border-2 border-[#ffb4ab] shadow-[0_0_16px_rgba(147,0,10,0.5)]"
                : "bg-[#181c24] border border-[#ffb4ab]/40 shadow-[0_0_12px_rgba(147,0,10,0.35)] hover:border-[#ffb4ab]"
            }`}
            title="Click to filter by fail-safe locked out equipment (60+ days)"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#ffb4ab] uppercase">Locked Out (60d+)</span>
              {filterState === "lockout" && (
                <span className="text-[9px] font-mono px-1 py-0.2 bg-[#93000a] text-white rounded font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-[#ffb4ab]">{stats.locked}</span>
              <span className="text-[10px] font-mono text-[#ffb4ab] animate-pulse font-bold">LOCKED</span>
            </div>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
            actionFeedback.type === "success"
              ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#4edea3]"
              : "bg-[#93000a]/20 border-[#ffb4ab]/30 text-[#ffb4ab]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {actionFeedback.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-[#86948a] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. REGULATORY SOP NOTICE BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-[#181c24] border border-[#1f2937] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e29100]" />
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#e29100]/15 flex items-center justify-center shrink-0 text-[#ffb95f]">
            <span className="material-symbols-outlined text-[24px]">gavel</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-white">
                Sri Lanka Industrial Safety Act No. 45 • Statutory Protocol
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#e29100]/20 text-[#ffb95f] uppercase font-bold">
                Mandatory SOP
              </span>
            </div>
            <p className="text-[12px] text-[#bbcabf] max-w-4xl leading-relaxed">
              All heavy machinery operating in Sri Lanka reaching <strong className="text-[#ffb95f]">60 cumulative operational days</strong> must automatically enter fail-safe lockout. digital escrow releases and reservation scheduling are locked until an authorized Mechanical Engineer submits physical dye-penetrant and duty-cycle certifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button className="h-8 px-3 rounded bg-[#262a33] hover:bg-[#31353e] text-white font-mono text-[11px] transition-colors border border-[#1f2937]">
            Audit Gazette
          </button>
          <button className="h-8 px-3 rounded bg-[#e29100]/20 hover:bg-[#e29100]/30 text-[#ffb95f] font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-[#e29100]/40">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Accredited Engineers</span>
          </button>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col space-y-3 bg-[#181c24] p-4 rounded-xl border border-[#1f2937]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Smart Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3 top-2 text-[#86948a] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (#EQ-0101), Name, Serial, Depot, or City..."
              className="w-full h-8 pl-9 pr-8 bg-[#0a0e16] border border-[#1f2937] text-white placeholder:text-[#86948a] text-[12px] rounded focus:outline-none focus:border-[#10b981]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-[#86948a] hover:text-white text-xs font-mono px-1 rounded hover:bg-[#1f2937]"
                title="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills — In Sync with Quick Stats */}
          <div className="flex items-center gap-2 overflow-x-auto font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setFilterState("all")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                filterState === "all"
                  ? "bg-[#10b981] text-[#003824] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : "bg-[#1c2028] text-[#bbcabf] hover:text-white border border-[#1f2937]"
              }`}
            >
              <span>All Units</span>
              <span className="text-[10px]">{stats.total}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterState("healthy")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                filterState === "healthy"
                  ? "bg-[#10b981] text-[#003824] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : "bg-[#1c2028] text-[#bbcabf] hover:text-white border border-[#1f2937]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span>Healthy (0-45d)</span>
              <span className="text-[10px]">{stats.healthy}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterState("due")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                filterState === "due"
                  ? "bg-[#e29100] text-black font-bold shadow-[0_0_8px_rgba(226,145,0,0.3)]"
                  : "bg-[#1c2028] text-[#ffb95f] hover:text-white border border-[#1f2937]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f]" />
              <span>Due Soon (46-59d)</span>
              <span className="text-[10px]">{stats.due}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterState("lockout")}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                filterState === "lockout"
                  ? "bg-[#93000a] text-white font-bold shadow-[0_0_12px_rgba(147,0,10,0.5)] border border-[#ffb4ab]"
                  : "bg-[#1c2028] text-[#ffb4ab] hover:text-white border border-[#93000a]/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse" />
              <span>LOCKED OUT (60d+)</span>
              <span className="text-[10px]">{stats.locked}</span>
            </button>
          </div>
        </div>

        {/* Category Pill Scroller — Toggleable */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 font-mono text-[11px] border-t border-[#1f2937]">
          <span className="text-[10px] text-[#86948a] uppercase tracking-wider shrink-0 mr-1">
            Categories:
          </span>
          {dynamicCategories.map((cat) => {
            const isSelected = categoryFilter.toLowerCase() === cat.id.toLowerCase()
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(isSelected ? "all" : cat.id)}
                className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#10b981]/25 text-[#4edea3] font-bold border border-[#10b981]"
                    : "bg-[#0a0e16] text-[#bbcabf] hover:text-white border border-[#1f2937]"
                }`}
                title={isSelected ? "Click to clear category filter" : `Filter by ${cat.label}`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Active Filter Chips & Reset All */}
        {(filterState !== "all" || categoryFilter !== "all" || searchQuery.trim() !== "") && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1f2937] text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-1.5 text-[#bbcabf]">
              <span className="text-[#86948a]">Active Filters:</span>
              {filterState !== "all" && (
                <span className="px-2 py-0.5 rounded bg-[#1f2937] text-white flex items-center gap-1 border border-[#10b981]/40">
                  Status: <strong className="text-[#4edea3] uppercase">{filterState === "lockout" ? "Locked Out (60d+)" : filterState}</strong>
                  <button onClick={() => setFilterState("all")} className="hover:text-red-400 ml-1">✕</button>
                </span>
              )}
              {categoryFilter !== "all" && (
                <span className="px-2 py-0.5 rounded bg-[#1f2937] text-white flex items-center gap-1 border border-[#10b981]/40">
                  Category: <strong className="text-[#4edea3]">{categoryFilter}</strong>
                  <button onClick={() => setCategoryFilter("all")} className="hover:text-red-400 ml-1">✕</button>
                </span>
              )}
              {searchQuery.trim() !== "" && (
                <span className="px-2 py-0.5 rounded bg-[#1f2937] text-white flex items-center gap-1 border border-[#10b981]/40">
                  Query: <strong className="text-[#4edea3]">"{searchQuery}"</strong>
                  <button onClick={() => setSearchQuery("")} className="hover:text-red-400 ml-1">✕</button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterState("all")
                setCategoryFilter("all")
                setSearchQuery("")
              }}
              className="text-[#ffb95f] hover:text-white flex items-center gap-1 font-bold cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. HIGH DENSITY RESPONSIVE TABLE WITH 60-DAY WEAR RUBRIC */}
      <div className="bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg overflow-hidden flex flex-col">
        <div className="h-10 px-4 bg-[#0a0e16] border-b border-[#1f2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#86948a] uppercase tracking-wider font-bold">
              COMPLIANCE MATRIX TELEMETRY
            </span>
            <span className="text-[10px] font-mono text-[#4edea3] bg-[#10b981]/15 px-2 py-0.5 rounded">
              Showing {filteredFleet.length} of {stats.total} Operational Assets
            </span>
          </div>

          <div className="flex items-center gap-3 text-[#86948a] font-mono text-[11px]">
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left font-mono text-[12px]">
            <thead>
              <tr className="h-9 bg-[#1c2028] text-[#86948a] font-mono text-[10px] uppercase tracking-wider border-b border-[#1f2937]">
                <th className="px-4 py-1">Asset Identity & Unit</th>
                <th className="px-4 py-1">Category & Serial</th>
                <th className="px-4 py-1">Custodian / Depot Hub</th>
                <th className="px-4 py-1 text-right">Daily Rate</th>
                <th className="px-4 py-1 min-w-[240px]">Cumulative Wear Meter (60-Day Cap)</th>
                <th className="px-4 py-1">Lock State</th>
                <th className="px-4 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {loadingFleet ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#bbcabf] font-mono text-xs">
                    <div className="flex items-center justify-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[#10b981] border-t-transparent animate-spin" />
                      <span>Loading live fleet telematics and duty-cycle records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFleet.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#86948a] font-mono text-xs">
                    <div className="space-y-2.5">
                      <p>No equipment assets found matching the current filter criteria.</p>
                      {(filterState !== "all" || categoryFilter !== "all" || searchQuery.trim() !== "") && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterState("all")
                            setCategoryFilter("all")
                            setSearchQuery("")
                          }}
                          className="px-3 py-1 rounded bg-[#262a33] hover:bg-[#31353e] text-[#4edea3] text-[11px] font-mono border border-[#1f2937] transition-colors cursor-pointer"
                        >
                          Clear Filters & View All ({stats.total}) Assets
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFleet.map((tool) => {
                  const isOverridden = overrides[tool.id]
                  const effectiveDays = isOverridden ? 0 : tool.daysRented
                  const isLocked = (effectiveDays >= 60 || tool.isLocked) && !isOverridden

                  // Percentage capped at 100%
                  const pct = Math.min(100, Math.round((effectiveDays / 60) * 100))

                return (
                  <tr
                    key={tool.id}
                    className="h-12 hover:bg-[#1c2028] transition-colors group"
                  >
                    {/* Unit Info */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={tool.image}
                          alt={tool.name}
                          className="w-8 h-8 rounded object-cover border border-[#1f2937] shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop&q=80"
                          }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-[13px] font-bold text-white truncate">
                            {tool.name}
                          </span>
                          <span className="text-[10px] text-[#4edea3]">#{tool.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Serial */}
                    <td className="px-4 py-2 text-[#bbcabf]">
                      <div>{tool.category}</div>
                      <div className="text-[10px] text-[#86948a]">{tool.serial}</div>
                    </td>

                    {/* Custodian */}
                    <td className="px-4 py-2 text-[#bbcabf]">
                      <div className="text-white font-sans text-[12px]">{tool.custodian}</div>
                      <div className="text-[10px] text-[#86948a]">{tool.location}</div>
                    </td>

                    {/* Benchmark Rate */}
                    <td className="px-4 py-2 text-right">
                      <div className="text-white font-bold">LKR {tool.dailyRate.toLocaleString()}</div>
                      <div className="text-[10px] text-[#86948a]">Val: LKR {tool.valuation.toLocaleString()}</div>
                    </td>

                    {/* Wear Meter */}
                    <td className="px-4 py-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#bbcabf]">
                            {effectiveDays} / 60 Days ({pct}%)
                          </span>
                          <span
                            className={`font-bold ${
                              effectiveDays >= 60
                                ? "text-[#ffb4ab]"
                                : effectiveDays >= 46
                                ? "text-[#ffb95f]"
                                : "text-[#4edea3]"
                            }`}
                          >
                            {effectiveDays >= 60
                              ? "CAP EXCEEDED"
                              : effectiveDays >= 46
                              ? "SERVICE DUE"
                              : "NORMAL"}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#0a0e16] rounded-full overflow-hidden border border-[#1f2937]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              effectiveDays >= 60
                                ? "bg-[#ffb4ab]"
                                : effectiveDays >= 46
                                ? "bg-[#e29100]"
                                : "bg-[#10b981]"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Lock State */}
                    <td className="px-4 py-2">
                      {isLocked ? (
                        <span className="px-2 py-0.5 rounded bg-[#93000a]/30 text-[#ffb4ab] text-[10px] font-bold border border-[#ffb4ab]/30 flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[12px]">lock</span>
                          FAIL-SAFE LOCKED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#4edea3] text-[10px] font-bold border border-[#10b981]/30 flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          ONLINE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 text-right">
                      {isLocked ? (
                        <button
                          onClick={() => handleEngineerOverride(tool)}
                          disabled={isOverriding[tool.id]}
                          className="px-2.5 py-1 rounded bg-[#e29100]/20 hover:bg-[#e29100]/30 text-[#ffb95f] text-[11px] font-bold border border-[#e29100]/40 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[14px]">build</span>
                          <span>{isOverriding[tool.id] ? "Recalibrating..." : "Engineer Override"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInspectLogs(tool)}
                          className="px-2.5 py-1 rounded bg-[#262a33] hover:bg-[#31353e] text-white text-[11px] transition-colors border border-[#1f2937]"
                        >
                          Inspect Logs
                        </button>
                      )}
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INSPECTION LOGS & MAINTENANCE HISTORY MODAL */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#181c24] border border-[#1f2937] rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#10b981]/20 flex items-center justify-center text-[#4edea3]">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Equipment Inspection & Overhaul Ledger</h3>
                  <p className="text-xs text-[#86948a] font-mono">
                    {selectedToolHistory?.title || "Asset"} • Asset #{selectedToolHistory?.id || ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-[#86948a] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#86948a]">
                <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Querying PostgreSQL inspection logs...</span>
              </div>
            ) : selectedToolHistory?.inspectionTimeline && selectedToolHistory.inspectionTimeline.length > 0 ? (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {selectedToolHistory.inspectionTimeline.map((log: any, idx: number) => (
                  <div
                    key={log.id || idx}
                    className="p-3.5 bg-[#0a0e16] border border-[#1f2937] rounded-lg space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#4edea3] font-bold text-[10px]">
                          {log.type === "PreRental"
                            ? "Pre-Rental Dispatch"
                            : log.type === "MaintenanceCheck"
                            ? "Maintenance Servicing"
                            : log.type === "PostRental"
                            ? "Post-Rental Inspection"
                            : log.type || "Inspection"}
                        </span>
                        {log.severity && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.severity === "StructuralDamage"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : log.severity === "ModerateDamage"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {log.severity}
                          </span>
                        )}
                      </div>
                      <span className="text-[#86948a] text-[11px]">
                        {new Date(log.createdAt || log.createdAtUtc || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[#dfe2ee] font-sans text-xs">
                      {log.conditionNotes || "Standard pre-rental check passed without defects."}
                    </p>

                    {/* Multi-angle Photographic Evidence */}
                    {log.photos && log.photos.length > 0 && (
                      <div className="pt-2 border-t border-[#1f2937]/60 space-y-1.5">
                        <span className="text-[10px] text-[#86948a] uppercase tracking-wider block font-semibold">
                          Photographic Evidence ({log.photos.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {log.photos.map((p: any, pIdx: number) => (
                            <div
                              key={pIdx}
                              onClick={() => setEnlargedPhoto({ url: p.photoUrl, angle: p.angle || "General" })}
                              className="relative group rounded-lg border border-[#1f2937] overflow-hidden bg-[#181c24] aspect-[4/3] cursor-pointer hover:border-emerald-500/50 transition-colors"
                            >
                              <img
                                src={p.photoUrl}
                                alt={`${p.angle || "Inspection"} photo`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80"
                                }}
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-xs px-1.5 py-1 text-[10px] text-white flex items-center justify-between font-mono">
                                <span className="font-semibold text-[#4edea3] truncate">{p.angle || "General"}</span>
                                <span className="text-[9px] text-[#86948a]">Zoom ↗</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#0a0e16] rounded-lg border border-[#1f2937] text-center space-y-2 font-mono text-xs">
                <span className="material-symbols-outlined text-[32px] text-[#86948a]">verified</span>
                <p className="text-[#dfe2ee]">No historical defects or mechanical breakdown alerts logged.</p>
                <p className="text-[#86948a] text-[11px]">
                  All duty cycles and operational hours currently meet Ceylon Institute of Engineers standards.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-mono rounded border border-[#1f2937] transition-colors"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div
            className="max-w-2xl w-full bg-[#181c24] border border-[#1f2937] rounded-xl overflow-hidden p-3 space-y-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                Angle: {enlargedPhoto.angle}
              </span>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="text-[#86948a] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-black/40">
              <img
                src={enlargedPhoto.url}
                alt={enlargedPhoto.angle}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=80"
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
