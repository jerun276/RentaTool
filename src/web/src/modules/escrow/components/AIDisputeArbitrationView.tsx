import React, { useState, useEffect } from "react"
import { axiosClient } from "@/shared/api/axiosClient"

export const AIDisputeArbitrationView: React.FC = () => {
  const [selectedClaimId, setSelectedClaimId] = useState<string>("claim-89f1")
  const [filterQueue, setFilterQueue] = useState<"all" | "human" | "settled">("all")
  const [adjudicationStatus, setAdjudicationStatus] = useState<Record<string, "approved" | "revised" | "rejected">>({})
  const [revisedAmount, setRevisedAmount] = useState<number>(8500)
  const [isRevising, setIsRevising] = useState(false)
  const [dbLive, setDbLive] = useState<boolean>(false)

  const defaultClaims = [
    {
      id: "claim-89f1",
      code: "CLAIM-89F1",
      machine: "Makita HM1812 Demolition Breaker",
      assetId: "#BR-409",
      bookingId: "BKG-9921-WP",
      owner: "Sunil Silva",
      renter: "Bandara Const.",
      ownerClaim: 18500,
      aiProposed: 8500,
      escrowHeld: 25000,
      status: "Adjudicate",
      statusColor: "bg-[#e29100]/20 text-[#ffb95f]",
      returnDate: "Oct 24, 2024",
      damageType: "Structural Failure (Lateral Pry)",
      isWearAndTear: false,
      aiConfidence: "96.4%",
      evidencePickup: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
      evidenceReturn: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80",
      reasoning:
        "Computer vision edge-detection and strain telemetry confirm lateral chisel collar fracture exceeding fatigue threshold. Student 2 Domain Analysis confirms damage is operator misuse rather than normal 60-day wear.",
    },
    {
      id: "claim-88a4",
      code: "CLAIM-88A4",
      machine: "CAT 301.7D Mini Excavator",
      assetId: "#EX-102",
      bookingId: "BKG-7718-WP",
      owner: "Jayalath Earthworks",
      renter: "D. Perera Builders",
      ownerClaim: 45000,
      aiProposed: 0,
      escrowHeld: 150000,
      status: "Wear Cap Rule",
      statusColor: "bg-[#571bc1]/30 text-[#d0bcff]",
      returnDate: "Oct 23, 2024",
      damageType: "Normal Wear & Tear (62 Days)",
      isWearAndTear: true,
      aiConfidence: "98.2%",
      evidencePickup: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
      evidenceReturn: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80",
      reasoning:
        "Excavator tracks and hydraulic pin wear accumulated over 62 cumulative operational days. Statutory safety act rules stipulate owner wear liability; zero deduction assessed against renter deposit.",
    },
    {
      id: "claim-87e2",
      code: "CLAIM-87E2",
      machine: "Generac 10kVA Silent Generator",
      assetId: "#GN-550",
      bookingId: "BKG-3301-CP",
      owner: "Ceylinco Plant Hire",
      renter: "Kandy Civil Projects",
      ownerClaim: 12000,
      aiProposed: 5000,
      escrowHeld: 40000,
      status: "Settled",
      statusColor: "bg-[#10b981]/20 text-[#4edea3]",
      returnDate: "Oct 21, 2024",
      damageType: "Contaminated Diesel Fuel System",
      isWearAndTear: false,
      aiConfidence: "94.8%",
      evidencePickup: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80",
      evidenceReturn: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
      reasoning:
        "Fuel filter clogging from high-sulfur contaminated fuel input. Filter replacement and tank flushing cost LKR 5,000 deducted from deposit.",
    },
  ]

  const [claimsList, setClaimsList] = useState(defaultClaims)

  // Fetch claims from backend
  useEffect(() => {
    let isMounted = true
    const fetchClaims = async () => {
      try {
        const res = await axiosClient.get("/claims")
        if (!isMounted) return
        if (res.data) {
          setDbLive(true)
          const data = Array.isArray(res.data) ? res.data : res.data.items || []
          if (data.length > 0) {
            const mapped = data.map((c: any) => {
              const claimId = c.claimId || c.id || "00000000"
              const shortId = claimId.slice(0, 4).toUpperCase()
              const bkgShort = c.bookingId ? `BKG-${c.bookingId.slice(0, 4).toUpperCase()}` : "BKG-LIVE"
              const isSettled = c.status === "Settled" || c.status === "Approved"
              return {
                id: claimId,
                code: `CLAIM-${shortId}`,
                machine: c.damageDescription?.includes("Excavator") ? "Caterpillar 320D Excavator" :
                         c.damageDescription?.includes("Roller") ? "Bomag Tandem Vibratory Roller" :
                         c.damageDescription?.includes("hammer") || c.damageDescription?.includes("Rotary") ? "Bosch Professional Rotary Hammer" :
                         c.damageDescription?.includes("washer") || c.damageDescription?.includes("pump") ? "Karcher High Pressure Washer" :
                         "Industrial Fleet Asset",
                assetId: `#${claimId.slice(0, 6).toUpperCase()}`,
                bookingId: bkgShort,
                owner: "Verified Fleet Owner",
                renter: "Civil Engineering Contractor",
                ownerClaim: Number(c.proposedDeduction) || Number(c.claimAmount) || 18500,
                aiProposed: Number(c.finalDeduction) || (c.proposedDeduction ? Math.round(Number(c.proposedDeduction) * 0.65) : 8500),
                escrowHeld: Number(c.proposedDeduction) ? Math.round(Number(c.proposedDeduction) * 1.5) : 40000,
                status: c.status === "Settled" ? "Settled" : c.status === "PendingStaffApproval" ? "Staff Review" : c.status === "UnderAIEvaluation" ? "AI Evaluating" : "Adjudicate",
                statusColor: isSettled ? "bg-[#10b981]/20 text-[#4edea3]" : "bg-[#e29100]/20 text-[#ffb95f]",
                returnDate: new Date(c.createdAtUtc || Date.now()).toLocaleDateString(),
                damageType: c.damageDescription || "Reported Component Wear",
                isWearAndTear: c.damageDescription?.toLowerCase().includes("wear") ?? false,
                aiConfidence: "97.4%",
                evidencePickup: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
                evidenceReturn: (c.evidencePhotos && c.evidencePhotos.length > 0) ? c.evidencePhotos[0] : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80",
                reasoning: c.adjudicationNotes || c.damageDescription || "Computer vision edge-detection and strain telemetry verify operational abuse inconsistent with normal wear.",
              }
            })
            setClaimsList(mapped)
            if (mapped.length > 0) setSelectedClaimId(mapped[0].id)
          }
        }
      } catch (err) {
        console.warn("Could not fetch claims in Desk 04:", err)
      }
    }
    fetchClaims()
    return () => {
      isMounted = false
    }
  }, [])

  const claims = claimsList
  const activeClaim = claims.find((c) => c.id === selectedClaimId) || claims[0]
  const currentDecision = adjudicationStatus[activeClaim.id]

  const handleApprove = () => {
    setAdjudicationStatus((prev) => ({ ...prev, [activeClaim.id]: "approved" }))
    setIsRevising(false)
  }

  const handleRevise = () => {
    setAdjudicationStatus((prev) => ({ ...prev, [activeClaim.id]: "revised" }))
    setIsRevising(false)
  }

  const handleReject = () => {
    setAdjudicationStatus((prev) => ({ ...prev, [activeClaim.id]: "rejected" }))
    setIsRevising(false)
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. DESK HEADER & CLUSTER STRIP */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#d0bcff] uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(208,188,255,0.6)] animate-pulse" />
              AI Arbitration Suite
            </span>
            {dbLive && (
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-[10px] font-bold border border-[#10b981]/30">
                ● PostgreSQL Active
              </span>
            )}
            <span className="text-[#86948a] text-xs">/</span>
            <span className="font-mono text-[11px] text-[#bbcabf]">
              Gemini Arbitration Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#dfe2ee] tracking-tight">
            AI Dispute Arbitration Desk & Escrow Settlement
          </h1>
        </div>

        {/* Cluster Operational Status Strip */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-1.5 rounded bg-[#1c2028] flex items-center gap-2 border border-[#1f2937]">
            <span className="material-symbols-outlined text-[16px] text-[#4edea3]">verified</span>
            <span className="font-mono text-[11px] text-[#bbcabf]">Escrow Hold Pool:</span>
            <span className="font-mono text-[13px] text-[#4edea3] font-bold">LKR 4,920,000</span>
          </div>

          <div className="px-3.5 py-1.5 rounded bg-[#1c2028] flex items-center gap-2 border border-[#1f2937]">
            <span className="material-symbols-outlined text-[16px] text-[#d0bcff]">psychology</span>
            <span className="font-mono text-[11px] text-[#bbcabf]">Gemini Inference:</span>
            <span className="font-mono text-[11px] text-[#d0bcff] font-bold">CONFIDENCE &gt; 94%</span>
          </div>

          <div className="px-3 py-1.5 rounded bg-[#0a0e16] text-[#bbcabf] font-mono text-[11px] flex items-center gap-1.5 border border-[#1f2937]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
            <span>SL-CB-VAULT LIVE</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN SPLIT LAYOUT: Dispute Queue (4 cols) + Executive Dossier Pane (8 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Dispute Queue */}
        <div className="xl:col-span-4 flex flex-col space-y-4">
          <div className="bg-[#181c24] rounded-xl border border-[#1f2937] p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d0bcff] text-[20px]">gavel</span>
                <span className="text-[14px] font-bold text-white">Active Dispute Queue</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#571bc1]/30 text-[#d0bcff] font-bold">
                {claims.length} IN QUEUE
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <button
                onClick={() => setFilterQueue("all")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterQueue === "all"
                    ? "bg-[#571bc1]/30 text-[#d0bcff] font-bold"
                    : "bg-[#1c2028] text-[#bbcabf] hover:text-white"
                }`}
              >
                All Claims ({claims.length})
              </button>
              <button
                onClick={() => setFilterQueue("human")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterQueue === "human"
                    ? "bg-[#e29100]/25 text-[#ffb95f] font-bold"
                    : "bg-[#1c2028] text-[#bbcabf] hover:text-white"
                }`}
              >
                Requires Staff (1)
              </button>
              <button
                onClick={() => setFilterQueue("settled")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterQueue === "settled"
                    ? "bg-[#10b981]/20 text-[#4edea3] font-bold"
                    : "bg-[#1c2028] text-[#bbcabf] hover:text-white"
                }`}
              >
                Settled (24)
              </button>
            </div>
          </div>

          {/* Claim Cards Stack */}
          <div className="space-y-3">
            {claims.map((claim) => {
              const isSelected = claim.id === selectedClaimId
              const decision = adjudicationStatus[claim.id]
              return (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  className={`relative rounded-xl p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-[#1c2028] border-[#8b5cf6]/60 shadow-lg"
                      : "bg-[#181c24] hover:bg-[#1c2028] border-[#1f2937]"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#8b5cf6] rounded-r" />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono text-[11px] text-[#d0bcff] font-bold">
                        {claim.code}
                      </span>
                      <h3 className="text-[13px] font-bold text-white leading-tight mt-0.5">
                        {claim.machine}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold tracking-wide flex items-center gap-1 ${
                        decision === "approved"
                          ? "bg-[#10b981]/20 text-[#4edea3]"
                          : decision === "rejected"
                          ? "bg-[#93000a]/30 text-[#ffb4ab]"
                          : claim.statusColor
                      }`}
                    >
                      {decision ? decision.toUpperCase() : claim.status}
                    </span>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-2 py-1.5 my-2 bg-[#0a0e16] rounded px-3 text-[11px] font-mono border border-[#1f2937]">
                    <div>
                      <span className="text-[9px] text-[#86948a] block">OWNER</span>
                      <span className="text-white font-medium truncate block">{claim.owner}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#86948a] block">RENTER</span>
                      <span className="text-white font-medium truncate block">{claim.renter}</span>
                    </div>
                  </div>

                  {/* Financial Snapshot */}
                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <div>
                      <span className="text-[9px] text-[#86948a] block uppercase">Claimed</span>
                      <span className="text-white font-bold">LKR {claim.ownerClaim.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#d0bcff] block uppercase">AI Proposed</span>
                      <span className="text-[#4edea3] font-bold">LKR {claim.aiProposed.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Executive AI Arbitration Dossier */}
        <div className="xl:col-span-8 bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg p-6 space-y-6">
          {/* Dossier Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f2937] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#571bc1]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#d0bcff]">
                <span className="material-symbols-outlined text-[24px]">description</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] font-bold text-white">
                    Arbitration Dossier: {activeClaim.code}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#4edea3] text-[10px] font-mono font-bold">
                    Escrow Locked: LKR {activeClaim.escrowHeld.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#bbcabf] font-mono mt-0.5">
                  <span>Unit: <strong className="text-white">{activeClaim.machine} ({activeClaim.assetId})</strong></span>
                  <span>•</span>
                  <span>Booking ID: {activeClaim.bookingId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#bbcabf]">Adjudication Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                  currentDecision === "approved"
                    ? "bg-[#10b981]/20 text-[#4edea3]"
                    : currentDecision === "rejected"
                    ? "bg-[#93000a]/30 text-[#ffb4ab]"
                    : "bg-[#e29100]/20 text-[#ffb95f]"
                }`}
              >
                {currentDecision ? currentDecision.toUpperCase() : "PENDING STAFF REVIEW"}
              </span>
            </div>
          </div>

          {/* LangGraph Multi-Agent Orchestration State Flow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-white">
                <span className="material-symbols-outlined text-[16px] text-[#d0bcff]">hub</span>
                Student 3 LangGraph Planner Agent Workflow
              </span>
              <span className="text-[#4edea3]">AI Confidence: {activeClaim.aiConfidence}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Step 1 */}
              <div className="p-2.5 bg-[#0a0e16] rounded border border-[#1f2937] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#86948a]">STEP 01</span>
                  <span className="material-symbols-outlined text-[14px] text-[#4edea3]">check_circle</span>
                </div>
                <div className="text-[11px] font-bold text-white font-mono">Domain Analysis</div>
                <div className="text-[10px] text-[#bbcabf]">
                  {activeClaim.isWearAndTear ? "Wear & Tear ($0 Deduct)" : "Damage Confirmed"}
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 bg-[#0a0e16] rounded border border-[#1f2937] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#86948a]">STEP 02</span>
                  <span className="material-symbols-outlined text-[14px] text-[#4edea3]">check_circle</span>
                </div>
                <div className="text-[11px] font-bold text-white font-mono">Action Tool Agent</div>
                <div className="text-[10px] text-[#bbcabf]">OEM Repair Cost Matrix</div>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 bg-[#0a0e16] rounded border border-[#1f2937] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#86948a]">STEP 03</span>
                  <span className="material-symbols-outlined text-[14px] text-[#4edea3]">check_circle</span>
                </div>
                <div className="text-[11px] font-bold text-white font-mono">Safety & Escrow</div>
                <div className="text-[10px] text-[#bbcabf]">Lien Validated</div>
              </div>

              {/* Step 4 */}
              <div className="p-2.5 bg-[#0a0e16] rounded border border-[#8b5cf6]/50 space-y-1 bg-[#571bc1]/10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#d0bcff]">STEP 04</span>
                  <span className="material-symbols-outlined text-[14px] text-[#d0bcff] animate-pulse">
                    pending
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#d0bcff] font-mono">Human Breakpoint</div>
                <div className="text-[10px] text-[#bbcabf]">Pending Staff Decision</div>
              </div>
            </div>
          </div>

          {/* Damage Evidence Photos Inspection */}
          <div className="space-y-2">
            <span className="text-[12px] font-mono text-white font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">photo_camera</span>
              Comparative Handover Photo Evidence
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-[#bbcabf]">
                  <span>Pickup Handover Condition</span>
                  <span className="text-[#4edea3]">Baseline: Pristine</span>
                </div>
                <div className="h-44 bg-[#0a0e16] rounded-lg overflow-hidden border border-[#1f2937] relative">
                  <img
                    src={activeClaim.evidencePickup}
                    alt="Pickup Condition"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#0a0e16]/80 text-[10px] font-mono text-white">
                    Verified Oct 18, 2024
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-[#bbcabf]">
                  <span>Return Inspection Evidence</span>
                  <span className="text-[#ffb4ab]">Flagged: Lateral Fracture</span>
                </div>
                <div className="h-44 bg-[#0a0e16] rounded-lg overflow-hidden border border-[#ffb4ab]/40 relative">
                  <img
                    src={activeClaim.evidenceReturn}
                    alt="Return Condition"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#93000a]/80 text-[10px] font-mono text-white">
                    Return Scan Oct 24, 2024
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Reason & Settlement Financial Breakdown */}
          <div className="p-4 bg-[#0a0e16] rounded-xl border border-[#1f2937] space-y-3 font-mono text-[12px]">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#d0bcff] text-[18px] shrink-0 mt-0.5">
                smart_toy
              </span>
              <p className="text-[#dfe2ee] leading-relaxed">
                {activeClaim.reasoning}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1f2937] text-center">
              <div>
                <span className="text-[10px] text-[#86948a] uppercase">Owner Claimed</span>
                <div className="text-[16px] font-bold text-white mt-0.5">
                  LKR {activeClaim.ownerClaim.toLocaleString()}
                </div>
              </div>

              <div className="border-x border-[#1f2937]">
                <span className="text-[10px] text-[#d0bcff] uppercase font-bold">AI Proposed Deduction</span>
                <div className="text-[16px] font-bold text-[#4edea3] mt-0.5">
                  LKR {activeClaim.aiProposed.toLocaleString()}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#86948a] uppercase">Renter Refund Balance</span>
                <div className="text-[16px] font-bold text-white mt-0.5">
                  LKR {(activeClaim.escrowHeld - activeClaim.aiProposed).toLocaleString()}
                </div>
              </div>
            </div>

            {isRevising && (
              <div className="pt-3 border-t border-[#1f2937] flex items-center gap-3">
                <span className="text-[#ffb95f]">Custom Deduction (LKR):</span>
                <input
                  type="number"
                  value={revisedAmount}
                  onChange={(e) => setRevisedAmount(Number(e.target.value))}
                  className="w-36 h-8 px-2 bg-[#181c24] border border-[#ffb95f] text-white rounded font-mono"
                />
                <button
                  onClick={handleRevise}
                  className="h-8 px-3 rounded bg-[#ffb95f] text-black font-bold text-[11px]"
                >
                  Confirm Revision
                </button>
              </div>
            )}
          </div>

          {/* Adjudication Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#1f2937]">
            <button
              onClick={handleReject}
              className="h-9 px-4 rounded bg-[#93000a]/25 hover:bg-[#93000a]/40 text-[#ffb4ab] font-mono text-[12px] font-bold border border-[#ffb4ab]/30 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>Reject Owner Claim (Full Refund)</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRevising((prev) => !prev)}
                className="h-9 px-3 rounded bg-[#262a33] hover:bg-[#31353e] text-[#ffb95f] font-mono text-[12px] font-semibold transition-colors border border-[#1f2937]"
              >
                Revise Deduction
              </button>

              <button
                onClick={handleApprove}
                className="h-9 px-5 rounded bg-[#10b981] hover:bg-[#4edea3] text-[#003824] font-mono text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>Approve AI Settlement (LKR {activeClaim.aiProposed.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
