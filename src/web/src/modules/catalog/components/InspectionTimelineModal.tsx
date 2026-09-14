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
}

export const InspectionTimelineModal: React.FC<InspectionTimelineModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onInspectionAdded,
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
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (equipment && isOpen) {
      loadHistory(equipment.id)
    }
  }, [equipment, isOpen])

  const loadHistory = async (id: string) => {
    setLoading(true)
    try {
      const logs = await catalogApi.getEquipmentHistory(id)
      setHistory(logs)
    } catch (err) {
      console.error("Failed to load history", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipment || !newNotes.trim()) return

    setSubmitting(true)
    try {
      await catalogApi.createInspectionLog(equipment.id, {
        bookingId: "bkg-manual-001",
        type: newType,
        severity: newSeverity,
        conditionNotes: newNotes,
        photos: newPhotoUrl ? [{ angle: newPhotoAngle, photoUrl: newPhotoUrl }] : [],
      })
      await loadHistory(equipment.id)
      setIsAddingLog(false)
      setNewNotes("")
      setNewPhotoUrl("")
      if (onInspectionAdded) onInspectionAdded()
    } catch (err) {
      console.error("Failed to record inspection log", err)
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
                Condition Inspection Timeline
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Inspection Phase</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as InspectionType)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="PostRental">Post-Rental Return</option>
                  <option value="PreRental">Pre-Rental Dispatch</option>
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

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Photo Angle</label>
                <select
                  value={newPhotoAngle}
                  onChange={(e) => setNewPhotoAngle(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="Casing">Casing</option>
                  <option value="Cord">Power Cord</option>
                  <option value="Motor">Motor / Engine</option>
                  <option value="General">General Body</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Photo Reference URL</label>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
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
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading photographic timeline...
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
                      {log.type === "PreRental" ? "Pre-Rental Handover Dispatch" : "Post-Rental Return Inspection"}
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
                      Angle-Tagged Photographic Evidence
                    </span>
                    <Tabs defaultValue={log.photos[0]?.angle || "Casing"} className="w-full">
                      <TabsList className="h-7 p-0.5 bg-muted/60">
                        {log.photos.map((p, idx) => (
                          <TabsTrigger key={idx} value={p.angle} className="text-[11px] py-1 px-2.5">
                            {p.angle}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {log.photos.map((p, idx) => (
                        <TabsContent key={idx} value={p.angle} className="pt-2">
                          <div className="relative rounded-lg overflow-hidden border border-border max-w-sm aspect-[4/3] bg-muted/40">
                            <img
                              src={p.photoUrl}
                              alt={`${p.angle} inspection`}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white">
                              Angle: {p.angle}
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
      </DialogContent>
    </Dialog>
  )
}
