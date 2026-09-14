import React, { useState } from "react"
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react"
import { EquipmentDto, BatchAvailabilityReport } from "../types/catalogTypes"
import { catalogApi } from "../api/catalogApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"

interface BatchAvailabilityModalProps {
  isOpen: boolean
  equipmentList: EquipmentDto[]
  onClose: () => void
}

export const BatchAvailabilityModal: React.FC<BatchAvailabilityModalProps> = ({
  isOpen,
  equipmentList,
  onClose,
}) => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0]
  )
  const [report, setReport] = useState<BatchAvailabilityReport | null>(null)
  const [evaluating, setEvaluating] = useState(false)

  const handleEvaluate = async () => {
    setEvaluating(true)
    try {
      const ids = equipmentList.map((e) => e.id)
      const res = await catalogApi.checkBatchAvailability({
        equipmentIds: ids,
        startDate,
        endDate,
      })
      setReport(res)
    } catch (err) {
      console.error("Evaluation failed", err)
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            <DialogTitle className="text-lg font-bold text-foreground">
              Dynamic Maintenance & Availability Simulator
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Business operation: Evaluates active machinery against the{" "}
            <span className="text-amber-400 font-semibold">60-day servicing limit</span> and active maintenance flags.
          </DialogDescription>
        </DialogHeader>

        {/* Date Selector */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-muted/20">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Rental Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Rental End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleEvaluate}
            disabled={evaluating}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs"
          >
            {evaluating ? "Evaluating Wear Factors..." : "Run Availability & Wear Audit"}
          </Button>
        </div>

        {/* Report Results */}
        {report && (
          <div className="space-y-4 pt-2 border-t border-border/60">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Audited Tools</span>
                <span className="text-xl font-bold text-foreground font-mono">{report.requestedCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-center">
                <span className="text-[10px] uppercase font-mono text-emerald-400 block">Deployable</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{report.availableCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-center">
                <span className="text-[10px] uppercase font-mono text-amber-400 block">Locked Out</span>
                <span className="text-xl font-bold text-amber-400 font-mono">{report.lockedOutCount}</span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Machinery Health Breakdown
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {report.items.map((item) => (
                  <div
                    key={item.equipmentId}
                    className={`flex items-start justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      item.isAvailable
                        ? "border-emerald-500/20 bg-emerald-950/5 hover:bg-emerald-950/10"
                        : "border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/15"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{item.title}</span>
                        {item.isAvailable ? (
                          <Badge variant="available" className="text-[10px] py-0">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            Eligible
                          </Badge>
                        ) : (
                          <Badge variant="maintenance" className="text-[10px] py-0">
                            <ShieldAlert className="h-2.5 w-2.5 mr-1" />
                            Locked Out
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        Usage: {item.accumulatedRentalDays} / 60 days
                      </span>
                      {item.lockoutReason && (
                        <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {item.lockoutReason}
                        </p>
                      )}
                    </div>

                    <span className="text-[11px] text-muted-foreground text-right italic">
                      {item.actionRequired}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
