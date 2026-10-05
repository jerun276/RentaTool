import React, { useState } from "react"
import { Calendar, AlertTriangle, TrendingUp, CheckCircle, Clock } from "lucide-react"
import { ActiveBookingSummaryDto, ExtendScheduleResponseDto } from "../types/bookingTypes"
import { useBookingStore } from "../store/useBookingStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"

interface ExtendScheduleModalProps {
  booking: ActiveBookingSummaryDto | null
  open: boolean
  onClose: () => void
}

export const ExtendScheduleModal: React.FC<ExtendScheduleModalProps> = ({ booking, open, onClose }) => {
  const { extendSchedule, isLoading } = useBookingStore()

  // Calculate default new end date (+2 days from current end date)
  const defaultNewDate = booking
    ? new Date(new Date(booking.endDate).getTime() + 86400000 * 2).toISOString().split("T")[0]
    : ""

  const [newEndDate, setNewEndDate] = useState<string>(defaultNewDate)
  const [extensionResult, setExtensionResult] = useState<ExtendScheduleResponseDto | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!booking) return null

  const currentEndDateStr = new Date(booking.endDate).toISOString().split("T")[0]
  const currentEndFormatted = new Date(booking.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Live client-side dynamic preview calculation
  const isDateValid = Boolean(newEndDate && newEndDate > currentEndDateStr)
  const extendedDays = isDateValid
    ? Math.ceil((new Date(newEndDate).getTime() - new Date(currentEndDateStr).getTime()) / (1000 * 3600 * 24))
    : 0

  // Estimated surge rate
  const hasWeekend = Boolean(
    newEndDate &&
      [5, 6, 0].some((dayIndex) => {
        const d = new Date(newEndDate).getDay()
        return d === dayIndex
      })
  )
  const estimatedSurgeMultiplier = hasWeekend ? 1.25 : 1.1
  const estimatedBaseDailyRate = 3500
  const estimatedAdditionalFee = Math.round(estimatedBaseDailyRate * estimatedSurgeMultiplier * extendedDays)

  const handleExtend = async () => {
    setErrorMessage(null)
    setExtensionResult(null)

    if (!isDateValid) {
      setErrorMessage("New end date must be strictly after the current scheduled end date.")
      return
    }

    const isoDate = new Date(newEndDate + "T23:59:59Z").toISOString()
    const result = await extendSchedule(booking.id, isoDate)

    if (result) {
      setExtensionResult(result)
    } else {
      setErrorMessage(
        "Cannot extend schedule: The equipment has a conflicting reservation or maintenance lockout during these dates."
      )
    }
  }

  const handleClose = () => {
    setExtensionResult(null)
    setErrorMessage(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] border-border/80 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Extend Rental Schedule & Dynamic Pricing
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Extending reservations dynamically verifies calendar conflict blocks and applies surge demand multipliers.
          </DialogDescription>
        </DialogHeader>

        {extensionResult ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                Schedule Successfully Extended!
              </div>
              <p className="text-xs text-emerald-300/80">
                The equipment calendar has been updated and your schedule extension is locked in.
              </p>
            </div>

            <div className="bg-muted/40 p-3 rounded-lg border border-border/50 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extended Period:</span>
                <span className="font-semibold text-foreground">+{extensionResult.extendedDays} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applied Surge Multiplier:</span>
                <span className="font-semibold text-emerald-400">{extensionResult.surgeMultiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Surge Adjustment Reason:</span>
                <span className="text-foreground">{extensionResult.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional Surcharge:</span>
                <span className="font-semibold text-foreground">LKR {extensionResult.additionalFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/40 text-sm font-bold text-foreground">
                <span>New Total Rental Fee:</span>
                <span className="text-emerald-400 font-mono">LKR {extensionResult.newTotalRentalFee.toLocaleString()}</span>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Current window details */}
            <div className="bg-muted/30 p-3 rounded-lg border border-border/40 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID:</span>
                <span className="font-mono text-foreground">{booking.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current End Date:</span>
                <span className="font-medium text-foreground">{currentEndFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Total Fee:</span>
                <span className="font-mono text-foreground">LKR {booking.totalRentalFee.toLocaleString()}</span>
              </div>
            </div>

            {/* New Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                Choose Desired New End Date
              </label>
              <Input
                type="date"
                min={currentEndDateStr}
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="bg-muted/40 border-border/60 text-sm"
              />
            </div>

            {/* Live Dynamic Pricing Preview Box */}
            {isDateValid && (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <Clock className="h-3.5 w-3.5" />
                  Dynamic Surge Pricing Preview
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Additional Duration:</span>
                  <span className="text-foreground font-medium">+{extendedDays} Days</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Multiplier:</span>
                  <span className="text-emerald-400 font-semibold">{estimatedSurgeMultiplier}x ({hasWeekend ? "Weekend Demand" : "Standard"})</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Additional Fee:</span>
                  <span className="text-foreground font-mono font-semibold">+LKR {estimatedAdditionalFee.toLocaleString()}</span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleExtend}
                disabled={isLoading || !isDateValid}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                {isLoading ? "Validating Conflicts..." : "Confirm & Extend Schedule"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
