import React from "react"
import { ShieldAlert, History, MapPin, Eye, AlertTriangle } from "lucide-react"
import { EquipmentDto } from "../types/catalogTypes"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

interface EquipmentCardProps {
  equipment: EquipmentDto
  onViewHistory: (equipment: EquipmentDto) => void
  onInspect: (equipment: EquipmentDto) => void
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onViewHistory,
  onInspect,
}) => {
  const primaryImage =
    equipment.images.find((img) => img.isPrimary)?.imageUrl ||
    equipment.images[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"

  // 60-day wear limit calculation
  const wearPercentage = Math.min(100, Math.round((equipment.accumulatedRentalDays / 60) * 100))
  const isOverThreshold = equipment.accumulatedRentalDays >= 60

  const getStatusBadge = () => {
    switch (equipment.status) {
      case "Available":
        return <Badge variant="available">Available</Badge>
      case "Rented":
        return <Badge variant="rented">Rented Out</Badge>
      case "UnderMaintenance":
        return <Badge variant="maintenance">Under Maintenance</Badge>
      case "Disputed":
        return <Badge variant="disputed">Disputed Claim</Badge>
      default:
        return <Badge>{equipment.status}</Badge>
    }
  }

  return (
    <div className="group relative rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1">
      {/* Photo Preview Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
        <img
          src={primaryImage}
          alt={equipment.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {getStatusBadge()}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
            {equipment.categoryName}
          </span>
        </div>

        {/* Location pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-white/90 font-medium">
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
          <span>{equipment.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-base text-foreground leading-snug tracking-tight group-hover:text-emerald-400 transition-colors line-clamp-1">
            {equipment.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {equipment.description || "Commercial grade equipment verified for peer-to-peer jobsite rental."}
          </p>
        </div>

        {/* Rate & Replacement Value */}
        <div className="flex items-baseline justify-between border-y border-border/60 py-2.5 text-sm">
          <div>
            <span className="text-[10px] uppercase font-mono text-muted-foreground block">Daily Rate</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              LKR {equipment.dailyRate.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">/day</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-muted-foreground block">Deposit Value</span>
            <span className="text-xs text-foreground/80 font-mono">
              LKR {equipment.replacementValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Cumulative Rental Wear Tracker (60-Day Limit) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              {isOverThreshold && <AlertTriangle className="h-3 w-3 text-amber-400" />}
              Cumulative Usage
            </span>
            <span
              className={`font-mono font-medium ${
                isOverThreshold ? "text-amber-400 font-bold" : "text-slate-300"
              }`}
            >
              {equipment.accumulatedRentalDays} / 60 days
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverThreshold
                  ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  : wearPercentage > 70
                  ? "bg-emerald-400/80"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${wearPercentage}%` }}
            />
          </div>
          {isOverThreshold && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium bg-amber-950/30 px-2 py-1 rounded border border-amber-500/20">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span>Mandatory servicing lockout active</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewHistory(equipment)}
            className="flex items-center gap-1.5 text-xs text-slate-300 border-border/80 hover:border-emerald-500/40"
          >
            <History className="h-3.5 w-3.5 text-emerald-400" />
            Inspection Log
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onInspect(equipment)}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Eye className="h-3.5 w-3.5" />
            Inspect Condition
          </Button>
        </div>
      </div>
    </div>
  )
}
