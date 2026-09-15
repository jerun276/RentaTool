import React, { useEffect, useState } from "react"
import {
  Scale,
  Coins,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Send
} from "lucide-react"
import { useEscrowStore } from "../store/useEscrowStore"
import { DamageClaim, ClaimStatus } from "../types/escrowTypes"
import { PhotoInspectionViewer } from "../components/PhotoInspectionViewer"
import { AdjudicationModal } from "../components/AdjudicationModal"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"

export const ClaimArbitrationDeskPage: React.FC = () => {
  const {
    claims,
    selectedClaim,
    currentEscrow,
    isSubmitting,
    error,
    successMessage,
    fetchClaims,
    selectClaim,
    processPayout,
    clearFeedback
  } = useEscrowStore()

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAdjudicateModalOpen, setIsAdjudicateModalOpen] = useState<boolean>(false)

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  const filteredClaims = claims.filter((claim) => {
    if (statusFilter === "all") return true
    return claim.status.toLowerCase() === statusFilter.toLowerCase()
  })

  // Mock demo data if DB claims list is currently empty
  const displayClaims: DamageClaim[] =
    filteredClaims.length > 0
      ? filteredClaims
      : [
          {
            claimId: "c18a94e2-89f1-4b72-9861-125039e1a8b1",
            bookingId: "b7720d2a-43cf-42bb-a94f-561b3420cc21",
            filedByUserId: "u1111111-2222-3333-4444-555555555555",
            damageDescription: "Safety guard assembly fractured and motor cover dented during operation.",
            evidencePhotos: [
              "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
            ],
            proposedDeduction: 8500,
            finalDeduction: null,
            status: "PendingStaffApproval",
            adjudicationNotes: null,
            adjudicatedByUserId: null,
            adjudicatedAtUtc: null,
            createdAtUtc: new Date(Date.now() - 3600000 * 4).toISOString(),
            baselinePhotoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
          },
          {
            claimId: "c29b12f4-71e3-4d89-b782-990142a7c4e2",
            bookingId: "b8831e3b-54de-43cc-b05e-672c4531dd32",
            filedByUserId: "u2222222-3333-4444-5555-666666666666",
            damageDescription: "Concrete residue hardened inside drum; required acid wash and pressure jetting.",
            evidencePhotos: [
              "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80"
            ],
            proposedDeduction: 4500,
            finalDeduction: 4500,
            status: "Approved",
            adjudicationNotes: "Cleaning fee verified against equipment return guidelines.",
            adjudicatedByUserId: "staff-jathu-01",
            adjudicatedAtUtc: new Date(Date.now() - 3600000 * 24).toISOString(),
            createdAtUtc: new Date(Date.now() - 3600000 * 48).toISOString()
          }
        ]

  const activeClaim = selectedClaim || displayClaims[0]

  const getStatusBadge = (status: ClaimStatus | string) => {
    switch (status) {
      case "PendingStaffApproval":
      case "UnderAIEvaluation":
      case "Filed":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Under Review</Badge>
      case "Approved":
      case "Revised":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Approved</Badge>
      case "Settled":
        return <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Settled</Badge>
      case "Rejected":
        return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const depositHeld = currentEscrow?.depositAmount || 20000
  const finalOrProposedDeduction =
    activeClaim?.finalDeduction !== null && activeClaim?.finalDeduction !== undefined
      ? activeClaim.finalDeduction
      : activeClaim?.proposedDeduction || 0

  const renterRefund = Math.max(0, depositHeld - finalOrProposedDeduction)

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header with Student Attribution */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Escrow Arbitration Desk
                <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400">
                  Component 4: Jathu
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-assisted damage adjudication, photographic verification, and pre-authorized deposit disbursements.
              </p>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
            <span className="text-[11px] uppercase font-mono text-muted-foreground block">Active Holds</span>
            <span className="text-lg font-bold text-foreground font-mono">14</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
            <span className="text-[11px] uppercase font-mono text-muted-foreground block">Pending Review</span>
            <span className="text-lg font-bold text-amber-400 font-mono">3</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
            <span className="text-[11px] uppercase font-mono text-muted-foreground block">Settled Total</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">Rs. 345,000</span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFeedback} className="text-xs text-rose-300">
            Dismiss
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFeedback} className="text-xs text-emerald-300">
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Arbitration Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Claims Inbox */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-foreground">Dispute Claims Inbox</h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-card/60 p-1 rounded-lg border border-border/60 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === "all" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("PendingStaffApproval")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === "PendingStaffApproval" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("Approved")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === "Approved" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Approved
              </button>
            </div>
          </div>

          {/* Claims List */}
          <div className="space-y-3">
            {displayClaims.map((claim) => {
              const isSelected = activeClaim?.claimId === claim.claimId
              return (
                <div
                  key={claim.claimId}
                  onClick={() => selectClaim(claim)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-sm ${
                    isSelected
                      ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30"
                      : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      CLAIM-{claim.claimId.slice(0, 8).toUpperCase()}
                    </span>
                    {getStatusBadge(claim.status)}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {claim.damageDescription}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-border/30">
                    <span className="font-mono text-amber-400 font-bold">
                      Proposed: Rs. {claim.proposedDeduction.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(claim.createdAtUtc).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Active Claim Arbitration Panel */}
        <div className="lg:col-span-7 space-y-6">
          {activeClaim ? (
            <>
              {/* Evidence & Photo Comparison */}
              <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        Inspection Dossier: CLAIM-{activeClaim.claimId.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Booking ID: <span className="font-mono">{activeClaim.bookingId}</span>
                      </CardDescription>
                    </div>
                    {getStatusBadge(activeClaim.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  {/* Photo Viewer */}
                  <PhotoInspectionViewer
                    damagePhotos={activeClaim.evidencePhotos}
                    baselinePhoto={activeClaim.baselinePhotoUrl}
                    damageDescription={activeClaim.damageDescription}
                  />

                  {/* Financial Deduction Breakdown */}
                  <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-amber-400" />
                      Escrow Settlement Projection
                    </h4>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-card/60 border border-border/40">
                        <span className="text-[11px] text-muted-foreground block">Held Deposit</span>
                        <span className="text-base font-bold font-mono text-foreground">
                          Rs. {depositHeld.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-card/60 border border-amber-500/30">
                        <span className="text-[11px] text-amber-400 block">Owner Payout</span>
                        <span className="text-base font-bold font-mono text-amber-400">
                          Rs. {finalOrProposedDeduction.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-card/60 border border-emerald-500/30">
                        <span className="text-[11px] text-emerald-400 block">Renter Refund</span>
                        <span className="text-base font-bold font-mono text-emerald-400">
                          Rs. {renterRefund.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Staff Notes if already adjudicated */}
                    {activeClaim.adjudicationNotes && (
                      <div className="mt-2 rounded-lg bg-card/80 border border-border/50 p-3 text-xs space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                          Staff Adjudication Notes:
                        </span>
                        <p className="text-muted-foreground italic">"{activeClaim.adjudicationNotes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="text-xs text-muted-foreground">
                      {activeClaim.status === "Settled" ? (
                        <span className="text-cyan-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Settlement Finalized & Disbursed
                        </span>
                      ) : activeClaim.status === "Approved" || activeClaim.status === "Revised" ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Ready for Payment Disbursement
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Requires Human Adjudication Decision
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeClaim.status !== "Settled" && activeClaim.status !== "Rejected" && (
                        <Button
                          onClick={() => setIsAdjudicateModalOpen(true)}
                          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                        >
                          <Scale className="h-3.5 w-3.5 mr-1.5" />
                          Adjudicate Claim
                        </Button>
                      )}

                      {(activeClaim.status === "Approved" || activeClaim.status === "Revised") && (
                        <Button
                          onClick={() => processPayout(activeClaim.claimId)}
                          disabled={isSubmitting}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          {isSubmitting ? "Disbursing..." : "Disburse Split Payout"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adjudication Modal */}
              <AdjudicationModal
                claim={activeClaim}
                isOpen={isAdjudicateModalOpen}
                onClose={() => setIsAdjudicateModalOpen(false)}
              />
            </>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/20 text-muted-foreground space-y-2">
              <Scale className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm">Select a damage dispute claim from the inbox to review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
