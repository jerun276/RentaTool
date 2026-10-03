import React, { useEffect, useState } from "react"
import { catalogApi } from "@/modules/catalog/api/catalogApi"
import { Calendar, Wrench, CheckCircle, AlertTriangle } from "lucide-react"
import { useBookingStore } from "../store/useBookingStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"

interface CreateBookingModalProps {
  open: boolean
  onClose: () => void
}

type ToolOption = { id: string; title: string; dailyRate: number; ownerId: string }

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ open, onClose }) => {
  const { createBooking, isLoading } = useBookingStore()

  const todayStr = new Date().toISOString().split("T")[0]
  const tomorrowStr = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]

  const [tools, setTools] = useState<ToolOption[]>([])
  const [selectedToolId, setSelectedToolId] = useState("")
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(tomorrowStr)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    catalogApi
      .getEquipmentList({ pageSize: 100 } as any)
      .then((res: any) => {
        const items = (res?.items ?? res ?? []) as any[]
        const opts = items.map((e) => ({ id: e.id, title: e.title, dailyRate: Number(e.dailyRate ?? 0), ownerId: e.ownerId }))
        setTools(opts)
        if (opts.length) setSelectedToolId((cur) => cur || opts[0].id)
      })
      .catch((e) => setErrorMessage(e?.message ?? "Failed to load equipment list."))
  }, [open])

  const selectedTool = tools.find((t) => t.id === selectedToolId) || tools[0]

  const days = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)))
  const totalFee = days * (selectedTool?.dailyRate ?? 0)

  const handleCreate = async () => {
    setErrorMessage(null)
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage("End date cannot be earlier than start date.")
      return
    }
    if (!selectedTool) {
      setErrorMessage("No equipment available to book.")
      return
    }

    const ok = await createBooking({
      equipmentId: selectedTool.id,
      ownerId: selectedTool.ownerId,
      startDate: new Date(startDate + "T00:00:00Z").toISOString(),
      endDate: new Date(endDate + "T23:59:59Z").toISOString(),
      dailyRate: selectedTool.dailyRate,
    })

    if (ok) {
      setSuccess(true)
    } else {
      setErrorMessage("Equipment is already reserved or unavailable for the selected date range.")
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setErrorMessage(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] border-border/80 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-emerald-400" />
            Book Equipment & Machinery
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Reserve machinery with automated schedule lockout and security escrow deposit protection.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                Booking Successfully Confirmed!
              </div>
              <p className="text-xs text-emerald-300/80">
                The equipment calendar has been blocked and your reservation is active.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                View Active Bookings
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-sm">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Select Equipment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Select Equipment Unit</label>
              <select
                value={selectedToolId}
                onChange={(e) => setSelectedToolId(e.target.value)}
                className="w-full h-9 rounded-md border border-border/60 bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {tools.length === 0 && <option value="">No equipment available</option>}
                {tools.map((t) => (
                  <option key={t.id} value={t.id} className="bg-background">
                    {t.title} (LKR {t.dailyRate}/day)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-emerald-400" /> Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted/40 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-emerald-400" /> End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted/40 text-xs"
                />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-semibold text-foreground">{days} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Rate:</span>
                <span className="font-mono text-foreground">
                  LKR {(selectedTool?.dailyRate ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-border/40 font-bold text-sm">
                <span>Total Rental Fee:</span>
                <span className="text-emerald-400 font-mono">LKR {totalFee.toLocaleString()}</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isLoading ? "Validating Schedule..." : "Confirm Reservation"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
