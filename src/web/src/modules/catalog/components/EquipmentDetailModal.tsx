import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  AlertTriangle,
  User,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Layers,
  Copy,
  Check,
  History,
  Eye,
  CheckCircle2,
  Wrench,
  Camera,
} from "lucide-react"
import { EquipmentDto } from "../types/catalogTypes"

interface EquipmentDetailModalProps {
  equipment: EquipmentDto | null
  isOpen: boolean
  onClose: () => void
  onViewHistory: (equipment: EquipmentDto) => void
  onInspect: (equipment: EquipmentDto) => void
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onViewHistory,
  onInspect,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!equipment) return null

  const images = equipment.images && equipment.images.length > 0
    ? equipment.images
    : [
      {
        imageUrl:
          "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
        angle: "General",
        isPrimary: true,
      },
    ]

  const activeImage = images[activeImageIndex] || images[0]

  // Safe spec parser
  let parsedSpecs: Record<string, any> = {}
  if (equipment.specificationsJson) {
    try {
      const parsed = typeof equipment.specificationsJson === "string"
        ? JSON.parse(equipment.specificationsJson)
        : equipment.specificationsJson
      if (typeof parsed === "object" && parsed !== null) {
        parsedSpecs = parsed
      }
    } catch {
      parsedSpecs = {}
    }
  }

  const specKeys = Object.keys(parsedSpecs)

  // 60-day wear limit calculation
  const wearPercentage = Math.min(100, Math.round((equipment.accumulatedRentalDays / 60) * 100))
  const isOverThreshold = equipment.accumulatedRentalDays >= 60

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2500)
  }

  const getStatusBadge = () => {
    switch (equipment.status) {
      case "Available":
        return <Badge variant="available">Available for Rental</Badge>
      case "Rented":
        return <Badge variant="rented">Active Rental</Badge>
      case "UnderMaintenance":
        return <Badge variant="maintenance">Under Maintenance</Badge>
      case "Disputed":
        return <Badge variant="disputed">Disputed Claim</Badge>
      default:
        return <Badge>{equipment.status}</Badge>
    }
  }

  const trustScore = equipment.ownerTrustScore ?? 75
  const getTrustBadgeColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-950/40 border-emerald-500/30"
    if (score >= 60) return "text-blue-400 bg-blue-950/40 border-blue-500/30"
    return "text-amber-400 bg-amber-950/40 border-amber-500/30"
  }

  const formattedMemberSince = equipment.ownerMemberSinceUtc
    ? new Date(equipment.ownerMemberSinceUtc).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : null

  const formattedListedDate = equipment.createdAt
    ? new Date(equipment.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-0">
        {/* Top Header Banner */}
        <div className="p-6 pb-4 border-b border-border/60 bg-gradient-to-r from-emerald-950/20 via-card to-background">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                {equipment.categoryName}
              </span>
              {isOverThreshold && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Lockout Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>ID: {equipment.id.slice(0, 8)}...</span>
              <button
                onClick={() => handleCopy(equipment.id, "equipmentId")}
                className="hover:text-emerald-400 transition-colors p-1"
                title="Copy full Equipment ID"
              >
                {copiedField === "equipmentId" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {equipment.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Fleet Asset ID: {equipment.id} &bull; Complete technical specifications and verified owner dossier.
          </DialogDescription>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {equipment.location}
            </span>
            {formattedListedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Listed on {formattedListedDate}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Content Grid: Left Visual Gallery + Right Key Fleet Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Visual Photographic Gallery (7 Cols) */}
            <div className="md:col-span-7 space-y-3">
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-border/80 bg-black/40 group">
                <img
                  src={activeImage.imageUrl}
                  alt={`${equipment.title} - ${activeImage.angle}`}
                  className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-black/75 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    Angle: {activeImage.angle}
                  </span>
                  {activeImage.isPrimary && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Primary Display Photo
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails row */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx
                          ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-105"
                          : "border-border/60 opacity-70 hover:opacity-100 hover:border-emerald-500/50"
                        }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Angle ${img.angle}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 text-[9px] font-semibold bg-black/80 text-white text-center py-0.5 truncate px-0.5">
                        {img.angle}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Key Financials & Cumulative Wear Tracker (5 Cols) */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Financial Rates */}
                <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                    Rental Financials & Escrow Lock
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                        Daily Rate
                      </span>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        LKR {equipment.dailyRate.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-muted-foreground">per 24-hr cycle</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                        Replacement Value
                      </span>
                      <div className="text-xl font-bold font-mono text-foreground">
                        LKR {equipment.replacementValue.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-muted-foreground">Full escrow cap</span>
                    </div>
                  </div>
                </div>

                {/* 60-Day Cumulative Wear Tracker */}
                <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Cumulative Rental Wear
                    </span>
                    <span
                      className={`font-mono text-xs font-bold ${isOverThreshold ? "text-amber-400" : "text-emerald-400"
                        }`}
                    >
                      {equipment.accumulatedRentalDays} / 60 days
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOverThreshold
                          ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                          : wearPercentage > 75
                            ? "bg-emerald-400/80"
                            : "bg-emerald-500"
                        }`}
                      style={{ width: `${wearPercentage}%` }}
                    />
                  </div>

                  {isOverThreshold ? (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        <strong>Mandatory Servicing Required:</strong> Equipment exceeded 60
                        cumulative rental days. Automatic dispatch lock active until inspected.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Fleet safety wear rating is within normal operating tolerance.</span>
                    </div>
                  )}

                  {equipment.lastMaintenanceDateUtc && (
                    <div className="pt-1 text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Wrench className="h-3 w-3 text-slate-400" />
                      Last serviced:{" "}
                      {new Date(equipment.lastMaintenanceDateUtc).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewHistory(equipment)}
                  className="flex items-center justify-center gap-1.5 text-xs border-border/80 hover:border-emerald-500/50"
                >
                  <History className="h-4 w-4 text-emerald-400" />
                  Inspection Logs
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onInspect(equipment)}
                  className="flex items-center justify-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Eye className="h-4 w-4" />
                  Log Condition
                </Button>
              </div>
            </div>
          </div>

          {/* Dedicated Equipment Owner Dossier Card */}
          <div className="p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card to-card backdrop-blur-md shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-sm text-foreground">
                  Equipment Owner Dossier & Verification
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Peer-to-Peer Machinery Asset
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Owner Avatar & Identity */}
              <div className="flex items-center gap-3.5">
                {equipment.ownerProfilePhotoUrl ? (
                  <img
                    src={equipment.ownerProfilePhotoUrl}
                    alt={equipment.ownerName || "Owner"}
                    className="h-14 w-14 rounded-full object-cover border-2 border-emerald-500/40 shadow-md"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner">
                    {(equipment.ownerName || "O").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-foreground">
                      {equipment.ownerName || "Registered Equipment Owner"}
                    </h4>
                    {equipment.ownerIsVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        Verified Partner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/40 text-amber-300 border border-amber-500/30">
                        Pending KYC
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {equipment.ownerPhoneNumber ? (
                      <a
                        href={`tel:${equipment.ownerPhoneNumber}`}
                        className="flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                      >
                        <Phone className="h-3 w-3" />
                        {equipment.ownerPhoneNumber}
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground font-mono">
                        <Phone className="h-3 w-3 text-slate-500" />
                        Contact on record
                      </span>
                    )}

                    {formattedMemberSince && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        Member since {formattedMemberSince}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner Trust Score & Actions */}
              <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                    Owner Trust Score
                  </span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-sm border ${getTrustBadgeColor(
                        trustScore
                      )}`}
                    >
                      {trustScore} / 100
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {trustScore >= 80
                      ? "High Reliability Tier"
                      : trustScore >= 60
                        ? "Standard Verified"
                        : "Needs Review"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(equipment.ownerId, "ownerId")}
                    className="h-8 text-xs border-border/80 hover:border-emerald-500/50 flex items-center gap-1 font-mono"
                    title="Copy Owner ID"
                  >
                    {copiedField === "ownerId" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copied ID
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Owner ID
                      </>
                    )}
                  </Button>
                  {equipment.ownerPhoneNumber && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(equipment.ownerPhoneNumber!, "ownerPhone")}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono"
                    >
                      {copiedField === "ownerPhone" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Phone className="h-3 w-3" />
                          Copy Phone
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Technical Specifications */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Asset Overview & Capabilities
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/60">
                {equipment.description ||
                  "Verified industrial-grade equipment configured for peer-to-peer jobsite lending. Pre-inspected for electrical safety and structural integrity."}
              </p>
            </div>

            {/* Dynamic Specifications Grid */}
            {specKeys.length > 0 && (
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-emerald-400" />
                  Technical Specifications Schema
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {specKeys.map((key) => {
                    const value = parsedSpecs[key]
                    return (
                      <div
                        key={key}
                        className="p-3 rounded-lg border border-border/70 bg-card/40 backdrop-blur-sm space-y-0.5"
                      >
                        <span className="text-[10px] uppercase font-mono text-muted-foreground block truncate">
                          {key}
                        </span>
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : String(value ?? "N/A")}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-mono">
            Full audit log recorded under Escrow & Fleet Protocol
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}