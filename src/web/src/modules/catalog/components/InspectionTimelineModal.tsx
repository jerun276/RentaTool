import React, { useState, useEffect } from "react"
import { ShieldCheck, AlertTriangle, Camera, CheckCircle2, Clock, Calendar } from "lucide-react"
import { EquipmentDto, InspectionLogDto, InspectionSeverity, InspectionType } from "../types/catalogTypes"
import { catalogApi } from "../api/catalogApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { Input } from "@/shared/components/ui/input"

interface InspectionTimelineModalProps {
  equipment: EquipmentDto | null
  isOpen: boolean
  onClose: () => void
  onInspectionAdded?: () => void
  /** "log" = read-only history; "inspect" = opens the record-new-inspection form */
  mode?: "log" | "inspect"
}

export const InspectionTimelineModal: React.FC<InspectionTimelineModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onInspectionAdded,
  mode = "log",
}) => {
  const [history, setHistory] = useState<InspectionLogDto[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddingLog, setIsAddingLog] = useState(false)

  // New log form state
  const [newType, setNewType] = useState<InspectionType>("PostRental")
  const [newSeverity, setNewSeverity] = useState<InspectionSeverity>("None")
  const [newNotes, setNewNotes] = useState("")
  const [newPhotoAngle, setNewPhotoAngle] = useState("Casing")
  const [newPhotoUrl, setNewPhotoUrl] = useState("")
  const [photoList, setPhotoList] = useState<{ angle: string; photoUrl: string }[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; angle: string } | null>(null)

  useEffect(() => {
    if (equipment && isOpen) {
      loadHistory(equipment.id)
      setIsAddingLog(mode === "inspect")
      setSubmitError(null)
      setPhotoList([])
    }
  }, [equipment, isOpen, mode])

  const loadHistory = async (id: string) => {
    setLoading(true)
    try {
      const logs = await catalogApi.getEquipmentHistory(id)
      setHistory(Array.isArray(logs) ? logs : [])
    } catch (err) {
      console.error("Failed to load history", err)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddPhotoToList = () => {
    if (!newPhotoUrl.trim()) return
    setPhotoList((prev) => [...prev, { angle: newPhotoAngle, photoUrl: newPhotoUrl.trim() }])
    setNewPhotoUrl("")
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoList((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipment || !newNotes.trim()) return

    const photosToSend = [...photoList]
    if (newPhotoUrl.trim()) {
      photosToSend.push({ angle: newPhotoAngle, photoUrl: newPhotoUrl.trim() })
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await catalogApi.createInspectionLog(equipment.id, {
        bookingId: null,
        type: newType,
        severity: newSeverity,
        conditionNotes: newNotes,
        photos: photosToSend,
      })
      await loadHistory(equipment.id)
      setIsAddingLog(false)
      setNewNotes("")
      setNewPhotoUrl("")
      setPhotoList([])
      if (onInspectionAdded) onInspectionAdded()
    } catch (err: any) {
      console.error("Failed to record inspection log", err)
      setSubmitError(err.response?.data?.message || err.message || "Failed to record inspection log")
    } finally {
      setSubmitting(false)
    }
  }

  const getSeverityBadge = (severity: InspectionSeverity) => {
    switch (severity) {
      case "None":
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pristine / No Defect
          </Badge>
        )
      case "MinorWear":
        return (
          <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10">
            <Clock className="h-3 w-3 mr-1" />
            Standard Wear-and-Tear
          </Badge>
        )
      case "ModerateDamage":
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Moderate Damage
          </Badge>
        )
      case "StructuralDamage":
        return (
          <Badge variant="destructive" className="bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Structural Damage (Lockout)
          </Badge>
        )
    }
  }

  if (!equipment) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border/80">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <DialogTitle className="text-lg font-bold text-foreground">
                {mode === "inspect" ? "Inspect Condition" : "Inspection Log"}
              </DialogTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {equipment.categoryName}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Forensic photographic log for <span className="text-foreground font-semibold">{equipment.title}</span> (Cumulative wear: {equipment.accumulatedRentalDays} days).
          </DialogDescription>
        </DialogHeader>

        {/* Action button to record inspection */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <span className="text-xs text-muted-foreground font-mono">
            {history.length} Inspection Event{history.length !== 1 ? "s" : ""} Recorded
          </span>
          <Button
            size="sm"
            variant={isAddingLog ? "secondary" : "outline"}
            onClick={() => setIsAddingLog(!isAddingLog)}
            className="text-xs h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            <Camera className="h-3.5 w-3.5 mr-1" />
            {isAddingLog ? "Cancel Entry" : "Record New Inspection"}
          </Button>
        </div>

        {/* Add Inspection Log Form */}
        {isAddingLog && (
          <form onSubmit={handleAddLog} className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              New Inspection Handover Record
            </h4>

            {submitError && (
              <div className="p-2.5 rounded-md bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Inspection Phase</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as InspectionType)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="PreRental">Pre-Rental Dispatch</option>
                  <option value="PostRental">Post-Rental Return</option>
                  <option value="MaintenanceCheck">Periodic Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Severity Rating</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as InspectionSeverity)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-medium"
                >
                  <option value="None">None (Pristine condition)</option>
                  <option value="MinorWear">MinorWear (Normal scuffs)</option>
                  <option value="ModerateDamage">ModerateDamage (Chipped paint, cracked knob)</option>
                  <option value="StructuralDamage">StructuralDamage (Casing crack, severed cord)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Condition Notes</label>
              <Textarea
                placeholder="Log physical observations across Casing, Power Cord, and Motor..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Photo Angle</label>
                  <select
                    value={newPhotoAngle}
                    onChange={(e) => setNewPhotoAngle(e.target.value)}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="Casing">Casing / Exterior</option>
                    <option value="Cord">Power Cord / Cables</option>
                    <option value="Motor">Motor / Engine</option>
                    <option value="General">General Overview</option>
                    <option value="Controls">Controls / Switch</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Photo Reference URL</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/photo.jpg"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPhotoToList}
                      disabled={!newPhotoUrl.trim()}
                      className="h-8 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                    >
                      + Add Angle
                    </Button>
                  </div>
                </div>
              </div>

              {photoList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {photoList.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    >
                      <span className="font-semibold text-emerald-400">{p.angle}:</span>
                      <span className="truncate max-w-[140px] text-[10px] text-muted-foreground">{p.photoUrl}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(pIdx)}
                        className="hover:text-rose-400 font-bold ml-1 text-xs"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8">
                {submitting ? "Saving..." : "Submit Inspection Log"}
              </Button>
            </div>
          </form>
        )}

        {/* Inspection History Timeline */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center text-sm text-muted-foreground">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading photographic timeline...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            No inspection logs recorded for this machinery yet.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60 pl-8">
            {history.map((log) => (
              <div key={log.id} className="relative space-y-3">
                {/* Timeline bullet */}
                <div
                  className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                    log.severity === "StructuralDamage"
                      ? "bg-rose-500"
                      : log.severity === "ModerateDamage"
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                />

                {/* Log Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {log.type === "PreRental"
                        ? "Pre-Rental Handover Dispatch"
                        : log.type === "MaintenanceCheck"
                        ? "Periodic Maintenance Servicing"
                        : "Post-Rental Return Inspection"}
                    </span>
                    {getSeverityBadge(log.severity)}
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Notes */}
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/40 leading-relaxed">
                  {log.conditionNotes}
                </p>

                {/* Multi-angle Photos with Tabs */}
                {log.photos && log.photos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground block">
                      Angle-Tagged Photographic Evidence ({log.photos.length})
                    </span>
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList className="h-7 p-0.5 bg-muted/60">
                        {log.photos.map((p, idx) => (
                          <TabsTrigger key={idx} value={String(idx)} className="text-[11px] py-1 px-2.5">
                            {p.angle || `Photo ${idx + 1}`}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {log.photos.map((p, idx) => (
                        <TabsContent key={idx} value={String(idx)} className="pt-2">
                          <div
                            onClick={() => setEnlargedPhoto({ url: p.photoUrl, angle: p.angle || "General" })}
                            className="relative rounded-lg overflow-hidden border border-border max-w-sm aspect-[4/3] bg-muted/40 group cursor-pointer"
                          >
                            <img
                              src={p.photoUrl}
                              alt={`${p.angle} inspection`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"
                              }}
                            />
                            <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white flex items-center justify-between">
                              <span>Angle: {p.angle}{p.caption ? ` • ${p.caption}` : ""}</span>
                              <span className="text-emerald-400 text-[9px]">Click to Zoom ↗</span>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Enlarged Photo Lightbox Modal */}
        {enlargedPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setEnlargedPhoto(null)}
          >
            <div
              className="max-w-2xl w-full bg-card border border-border rounded-xl overflow-hidden p-3 space-y-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                  Photo Angle: {enlargedPhoto.angle}
                </span>
                <button
                  onClick={() => setEnlargedPhoto(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
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
      </DialogContent>
    </Dialog>
  )
}

