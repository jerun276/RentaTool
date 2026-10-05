import React, { useState } from "react"
import { CheckCircle, Edit3, XCircle, AlertCircle } from "lucide-react"
import { DamageClaim } from "../types/escrowTypes"
import { useEscrowStore } from "../store/useEscrowStore"
import { useAuthStore } from "@/shared/store/useAuthStore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"

interface AdjudicationModalProps {
  claim: DamageClaim
  isOpen: boolean
  onClose: () => void
}

export const AdjudicationModal: React.FC<AdjudicationModalProps> = ({
  claim,
  isOpen,
  onClose,
}) => {
  const { adjudicateClaim, isSubmitting } = useEscrowStore()
  const { user } = useAuthStore()

  const [decision, setDecision] = useState<"Approve" | "Revise" | "Reject">("Approve")
  const [revisedAmount, setRevisedAmount] = useState<string>(
    claim.proposedDeduction.toString()
  )
  const [notes, setNotes] = useState<string>("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setValidationError(null)

    let parsedRevised: number | undefined = undefined
    if (decision === "Revise") {
      const num = parseFloat(revisedAmount)
      if (isNaN(num) || num < 0) {
        setValidationError("Please enter a valid non-negative revised deduction amount.")
        return
      }
      parsedRevised = num
    }

    if (!notes.trim()) {
      setValidationError("Please provide staff reasoning notes for this adjudication decision.")
      return
    }

    const success = await adjudicateClaim(claim.claimId, {
      decision,
      revisedDeduction: parsedRevised,
      adjudicatorId: user?.id || "00000000-0000-0000-0000-000000000001",
      notes: notes.trim(),
    })

    if (success) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Staff Adjudication Action
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Adjudicate damage claim <span className="font-mono text-foreground font-semibold">{claim.claimId.slice(0, 8)}</span>.
            Your decision determines the final financial deduction before deposit disbursement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Decision Selection Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setDecision("Approve")
                setValidationError(null)
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-semibold gap-1.5 ${
                decision === "Approve"
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/20"
                  : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Approve AI
              <span className="text-[10px] font-normal text-muted-foreground">Rs. {claim.proposedDeduction.toLocaleString()}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDecision("Revise")
                setValidationError(null)
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-semibold gap-1.5 ${
                decision === "Revise"
                  ? "border-amber-500 bg-amber-500/15 text-amber-400 ring-2 ring-amber-500/20"
                  : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="h-5 w-5 text-amber-400" />
              Revise Amount
              <span className="text-[10px] font-normal text-muted-foreground">Custom Deduction</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDecision("Reject")
                setValidationError(null)
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-semibold gap-1.5 ${
                decision === "Reject"
                  ? "border-rose-500 bg-rose-500/15 text-rose-400 ring-2 ring-rose-500/20"
                  : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <XCircle className="h-5 w-5 text-rose-400" />
              Reject Claim
              <span className="text-[10px] font-normal text-muted-foreground">Rs. 0 (Full Refund)</span>
            </button>
          </div>

          {/* Revised Amount Input */}
          {decision === "Revise" && (
            <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <label className="text-xs font-semibold text-amber-300">
                Revised Staff Deduction (LKR)
              </label>
              <Input
                type="number"
                min="0"
                step="500"
                value={revisedAmount}
                onChange={(e) => setRevisedAmount(e.target.value)}
                placeholder="Enter revised deduction"
                className="font-mono bg-background border-amber-500/40 focus-visible:ring-amber-500"
              />
              <span className="text-[11px] text-muted-foreground block">
                Original AI proposed deduction: Rs. {claim.proposedDeduction.toLocaleString()}
              </span>
            </div>
          )}

          {/* Staff Reasoning Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Adjudication Justification & Audit Notes <span className="text-rose-400">*</span>
            </label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide clear rationale (e.g., 'Wear and tear allowance verified. Damage exceeds operational wear.')"
              className="resize-none text-sm bg-background border-border"
            />
          </div>

          {validationError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              {validationError}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={
              decision === "Approve"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : decision === "Revise"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-rose-600 hover:bg-rose-500 text-white"
            }
          >
            {isSubmitting ? "Submitting..." : `Confirm ${decision}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
