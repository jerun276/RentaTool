import React from "react"
import { Search, Filter, X } from "lucide-react"
import { CategoryDto, EquipmentStatus } from "../types/catalogTypes"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"

interface EquipmentFiltersProps {
  categories: CategoryDto[]
  selectedCategoryId?: string
  searchTerm: string
  selectedStatus?: EquipmentStatus
  onSelectCategory: (id?: string) => void
  onSearchChange: (term: string) => void
  onStatusChange: (status?: EquipmentStatus) => void
  onReset: () => void
}

export const EquipmentFilters: React.FC<EquipmentFiltersProps> = ({
  categories,
  selectedCategoryId,
  searchTerm,
  selectedStatus,
  onSelectCategory,
  onSearchChange,
  onStatusChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(selectedCategoryId || searchTerm || selectedStatus)

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card/40 p-4 backdrop-blur-md">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search machinery by name, specs, brand..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background/50 border-border/80 focus-visible:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown & Reset */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus || ""}
            onChange={(e) => onStatusChange(e.target.value ? (e.target.value as EquipmentStatus) : undefined)}
            className="h-9 rounded-md border border-border/80 bg-background/80 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented Out</option>
            <option value="UnderMaintenance">Under Maintenance</option>
            <option value="Disputed">Disputed</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => onSelectCategory(undefined)}
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
            !selectedCategoryId
              ? "bg-emerald-500 text-slate-950 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategoryId === cat.id
                ? "bg-emerald-500 text-slate-950 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{cat.name}</span>
            {cat.toolCount !== undefined && (
              <span className="text-[10px] opacity-70">({cat.toolCount})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
