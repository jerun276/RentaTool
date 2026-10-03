import React, { useState, useEffect, useMemo } from "react"
import { axiosClient } from "@/shared/api/axiosClient"
import { identityApi, apiErrorMessage } from "../api/identityApi"
import { UserManagementDirectoryView } from "./UserManagementDirectoryView"

export const KycTrustComplianceView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "kyc">("users")
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const [filterTab, setFilterTab] = useState<"pending" | "all" | "verified" | "flagged">("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [approvalStatus] = useState<Record<string, "approved" | "rejected" | "pending">>({})
  const [dbLive, setDbLive] = useState<boolean>(false)
  const [dbCandidates, setDbCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false)
  const [rejectionReasonText, setRejectionReasonText] = useState<string>("Document illegible or failed biometric threshold")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  const tierFor = (score?: number) =>
    score == null ? "No score" : score >= 90 ? "Trust A+" : score >= 75 ? "Trust A" : score >= 50 ? "Trust B" : "Trust C"

  // Fetch real submissions from ASP.NET Core Backend
  const fetchKycQueue = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await axiosClient.get("/users/kyc-submissions")
      const subs: any[] = Array.isArray(res.data) ? res.data : []
      setDbLive(true)
      const scores = await Promise.allSettled(subs.map((s) => identityApi.getTrustScore(s.userId)))
      const mapped = subs.map((sub: any, i) => {
        const sr = scores[i]
        const score = sr.status === "fulfilled" ? (sr.value.data.trustScore ?? sr.value.data.score) : undefined
        return {
          id: sub.kycRecordId || sub.userId,
          userId: sub.userId,
          name: sub.name,
          company: sub.email,
          phone: sub.phoneNumber,
          province: sub.documentType,
          role: (sub.role || "RENTER").toUpperCase(),
          nic: sub.documentNumber,
          trustScore: score ?? "â€”",
          trustTier: tierFor(score),
          status: sub.status === "Approved" ? "VERIFIED" : sub.status === "Pending" ? "IN DRAWER" : "FLAGGED",
          statusColor:
            sub.status === "Approved" ? "text-[#4edea3] bg-[#10b981]/20" : sub.status === "Pending" ? "text-[#ffb95f] bg-[#e29100]/20" : "text-[#ffb4ab] bg-[#93000a]/30",
          submittedAt: sub.submittedAtUtc ? new Date(sub.submittedAtUtc).toLocaleString() : "â€”",
          rejectionReason: sub.rejectionReason,
          docFront: sub.frontImageUrl,
          docBack: sub.backImageUrl,
          avatar: `https://ui-avatars.com/api/?background=10b981&color=fff&name=${encodeURIComponent(sub.name || "U")}`,
        }
      })
      setDbCandidates(mapped)
      if (mapped.length > 0 && !mapped.some((m) => m.id === selectedCandidateId)) {
        setSelectedCandidateId(mapped[0].id)
      }
    } catch (err) {
      setDbLive(false)
      setLoadError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKycQueue()
  }, [])

  // Auto-dismiss feedback notification
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  const candidates = dbCandidates

  // Filtering by search & tab
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchesSearch) return false

      const currentStatus = approvalStatus[c.id] || (c.status === "VERIFIED" ? "approved" : c.status === "FLAGGED" ? "rejected" : "pending")

      if (filterTab === "pending") return currentStatus === "pending" || c.status === "IN DRAWER" || c.status === "DOC BLURRY"
      if (filterTab === "verified") return currentStatus === "approved" || c.status === "VERIFIED"
      if (filterTab === "flagged") return currentStatus === "rejected" || c.status === "FLAGGED" || c.status === "HIGH FRAUD RISK"

      return true
    })
  }, [candidates, searchQuery, filterTab, approvalStatus])

  // Dynamic counts for tabs
  const tabCounts = useMemo(() => {
    let pending = 0
    let verified = 0
    let flagged = 0
    candidates.forEach((c) => {
      const s = approvalStatus[c.id] || (c.status === "VERIFIED" ? "approved" : c.status === "FLAGGED" || c.status === "HIGH FRAUD RISK" ? "rejected" : "pending")
      if (s === "approved") verified++
      else if (s === "rejected") flagged++
      else pending++
    })
    return { all: candidates.length, pending, verified, flagged }
  }, [candidates, approvalStatus])

  const activeCandidate = filteredCandidates.find((c) => c.id === selectedCandidateId) || filteredCandidates[0] || candidates[0]
  const currentApproval = activeCandidate ? approvalStatus[activeCandidate.id] : undefined

  const handleApprove = async () => {
    if (!activeCandidate) return
    setIsProcessing(true)
    try {
      await identityApi.reviewKyc(activeCandidate.userId, "Approved")
      setFeedback({
        type: "success",
        message: `KYC credential for ${activeCandidate.name} approved.`,
      })
      await fetchKycQueue()
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: apiErrorMessage(err),
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!activeCandidate) return
    setIsProcessing(true)
    try {
      await identityApi.reviewKyc(activeCandidate.userId, "Rejected", rejectionReasonText)
      setFeedback({
        type: "success",
        message: `KYC submission for ${activeCandidate.name} was rejected.`,
      })
      setRejectModalOpen(false)
      await fetchKycQueue()
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: apiErrorMessage(err),
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRequestReupload = async () => {
    setRejectionReasonText("Document quality insufficient or blurry - please re-upload clear photographs of your NIC.")
    setRejectModalOpen(true)
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. DESK HEADER & RAPID TELEMETRY COUNTERS */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded bg-[#262a33] border border-[#10b981]/30 flex items-center justify-center text-[#4edea3] shadow-inner">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#dfe2ee] tracking-tight">
                KYC & Trust Compliance Desk
              </h1>
              {dbLive && (
                <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-[10px] font-bold border border-[#10b981]/30">
                  â— PostgreSQL Active
                </span>
              )}
              {loading && (
                <span className="px-2 py-0.5 rounded bg-[#31353e] text-[#bbcabf] font-mono text-[10px] animate-pulse">
                  Syncing...
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-[#31353e] text-[#bbcabf] font-mono text-[10px]">
                REGISTRY DESK-02
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#e29100]/20 text-[#ffb95f] font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f] animate-pulse" />
                {tabCounts.pending} In Queue
              </span>
            </div>
            <p className="text-[13px] text-[#bbcabf] max-w-2xl">
              Sri Lankan National Identity Card (NIC) biometric OCR parsing, safety agent fraud scans, and live algorithmic contractor trust scoring.
            </p>
          </div>
        </div>

        {/* Rapid Telemetry Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col px-4 py-2 bg-[#1c2028] rounded border border-[#1f2937] min-w-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Pending</span>
              <span className="material-symbols-outlined text-[14px] text-[#ffb95f]">hourglass_top</span>
            </div>
            <span className="text-xl font-bold font-mono text-[#ffb95f]">{tabCounts.pending}</span>
            <span className="text-[10px] text-[#bbcabf] font-mono">Awaiting review</span>
          </div>

          <div className="flex flex-col px-4 py-2 bg-[#1c2028] rounded border border-[#1f2937] min-w-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Rejected</span>
              <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">shield</span>
            </div>
            <span className="text-xl font-bold font-mono text-[#ffb4ab]">{tabCounts.flagged}</span>
            <span className="text-[10px] text-[#bbcabf] font-mono">Submissions declined</span>
          </div>

          <div className="flex flex-col px-4 py-2 bg-[#1c2028] rounded border border-[#1f2937] min-w-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Pass Ratio</span>
              <span className="material-symbols-outlined text-[14px] text-[#d0bcff]">analytics</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">
              {tabCounts.verified + tabCounts.flagged > 0
                ? `${((tabCounts.verified / (tabCounts.verified + tabCounts.flagged)) * 100).toFixed(1)}%`
                : "â€”"}
            </span>
            <span className="text-[10px] text-[#bbcabf] font-mono">{tabCounts.verified} verified</span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl border bg-[#93000a]/20 border-[#ffb4ab]/30 text-[#ffb4ab] flex items-center justify-between text-xs font-mono">
          <span>Could not load KYC submissions: {loadError}</span>
          <button onClick={fetchKycQueue} className="px-3 py-1 rounded border border-[#ffb4ab]/40 hover:bg-[#93000a]/30">Retry</button>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
            feedback.type === "success"
              ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#4edea3]"
              : "bg-[#93000a]/20 border-[#ffb4ab]/30 text-[#ffb4ab]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedback.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[#86948a] hover:text-white"
          >
            âœ•
          </button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#1f2937] pb-3">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === "users"
              ? "bg-[#10b981] text-[#003824] shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "bg-[#181c24] text-[#86948a] hover:text-[#dfe2ee] border border-[#1f2937]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          <span>User Directory & Account Governance</span>
        </button>

        <button
          onClick={() => setActiveSubTab("kyc")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === "kyc"
              ? "bg-[#10b981] text-[#003824] shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "bg-[#181c24] text-[#86948a] hover:text-[#dfe2ee] border border-[#1f2937]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">document_scanner</span>
          <span>KYC Document Inspection & Biometrics</span>
        </button>
      </div>

      {activeSubTab === "users" ? (
        <UserManagementDirectoryView />
      ) : (
        <>
          {/* 2. FILTER & CONTROLS TOOLBAR */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#181c24] p-3 rounded-lg border border-[#1f2937]">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "pending", label: "Pending Verification", count: tabCounts.pending, badgeBg: "bg-[#e29100]/25 text-[#ffb95f]" },
            { id: "all", label: "All Registrations", count: tabCounts.all, badgeBg: "bg-[#31353e] text-[#bbcabf]" },
            { id: "verified", label: "Verified Members", count: tabCounts.verified, badgeBg: "bg-[#10b981]/20 text-[#4edea3]" },
            { id: "flagged", label: "Flagged & Suspended", count: tabCounts.flagged, badgeBg: "bg-[#93000a]/30 text-[#ffb4ab]" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
                filterTab === tab.id
                  ? "bg-[#262a33] text-[#4edea3] font-semibold border border-[#10b981]/40"
                  : "text-[#bbcabf] hover:bg-[#1c2028] hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${tab.badgeBg}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#86948a] text-[16px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Name, NIC, Mobile..."
            className="w-full h-8 pl-8 pr-3 bg-[#0a0e16] border border-[#1f2937] text-white placeholder:text-[#86948a] text-[12px] rounded focus:outline-none focus:border-[#10b981]"
          />
        </div>
      </div>

      {/* 3. MAIN SPLIT WORKSPACE: Registry List (5 cols) + Document Inspection Drawer (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Candidate List */}
        <div className="xl:col-span-5 bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#0a0e16] border-b border-[#1f2937] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#86948a] uppercase tracking-wider font-bold">
              REGISTRY CANDIDATES ({filteredCandidates.length} DISPLAYED)
            </span>
            <span className="text-[10px] font-mono text-[#4edea3] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              LIVE SYNC
            </span>
          </div>

          <div className="divide-y divide-[#1f2937]">
            {!loading && filteredCandidates.length === 0 && (
              <p className="p-8 text-center text-[12px] text-[#86948a]">No KYC submissions in this view.</p>
            )}
            {filteredCandidates.map((candidate) => {
              const isSelected = candidate.id === selectedCandidateId
              const status = approvalStatus[candidate.id]
              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  className={`p-4 cursor-pointer transition-all relative ${
                    isSelected ? "bg-[#262a33]" : "bg-[#181c24] hover:bg-[#1c2028]"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10b981]" />}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={candidate.avatar}
                        alt={candidate.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#1f2937] shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white truncate">
                            {candidate.name}
                          </span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#0a0e16] text-[#86948a]">
                            {candidate.province}
                          </span>
                        </div>
                        <span className="text-[12px] text-[#bbcabf] truncate">{candidate.company}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0a0e16] text-[#4edea3]">
                            {candidate.role}
                          </span>
                          <span className="text-[10px] font-mono text-[#86948a]">
                            NIC: {candidate.nic}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[15px] font-mono font-bold text-[#4edea3]">
                          {candidate.trustScore}
                        </span>
                        <span className="text-[10px] font-mono text-[#86948a]">/100</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#4edea3] uppercase font-semibold">
                        {candidate.trustTier}
                      </span>
                      <span
                        className={`mt-1.5 px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                          status === "approved"
                            ? "bg-[#10b981]/20 text-[#4edea3]"
                            : status === "rejected"
                            ? "bg-[#93000a]/30 text-[#ffb4ab]"
                            : candidate.statusColor
                        }`}
                      >
                        {status ? status.toUpperCase() : candidate.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Document Inspection & Verification Drawer */}
        {!activeCandidate ? (
          <div className="xl:col-span-7 bg-[#181c24] rounded-xl border border-[#1f2937] p-10 text-center text-[13px] text-[#86948a]">
            {loading ? "Loading submissionsâ€¦" : "Select a KYC submission to inspect."}
          </div>
        ) : (
        <div className="xl:col-span-7 bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#4edea3]">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-white">{activeCandidate.name}</h3>
                <span className="text-[12px] text-[#bbcabf] font-mono">
                  {activeCandidate.company} â€¢ NIC: {activeCandidate.nic}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#bbcabf]">Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                  currentApproval === "approved"
                    ? "bg-[#10b981]/20 text-[#4edea3]"
                    : currentApproval === "rejected"
                    ? "bg-[#93000a]/30 text-[#ffb4ab]"
                    : activeCandidate.statusColor
                }`}
              >
                {currentApproval ? currentApproval.toUpperCase() : activeCandidate.status}
              </span>
            </div>
          </div>

          {/* Biometrics & OCR Confidence Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#1c2028] rounded-lg border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Document</span>
              <div className="text-[18px] font-bold font-mono text-[#4edea3] mt-0.5">
                {activeCandidate.province}
              </div>
              <span className="text-[10px] text-[#bbcabf]">Submitted type</span>
            </div>

            <div className="p-3 bg-[#1c2028] rounded-lg border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Role</span>
              <div className="text-[18px] font-bold font-mono text-[#4edea3] mt-0.5">
                {activeCandidate.role}
              </div>
              <span className="text-[10px] text-[#bbcabf]">Account type</span>
            </div>

            <div className="p-3 bg-[#1c2028] rounded-lg border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Trust Score</span>
              <div className="text-[18px] font-bold font-mono text-[#d0bcff] mt-0.5">
                {activeCandidate.trustScore} / 100
              </div>
              <span className="text-[10px] text-[#bbcabf]">{activeCandidate.trustTier}</span>
            </div>

            <div className="p-3 bg-[#1c2028] rounded-lg border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Submitted</span>
              <div className="text-[12px] font-bold font-mono text-[#4edea3] mt-1">{activeCandidate.submittedAt}</div>
              <span className="text-[10px] text-[#bbcabf]">Upload time</span>
            </div>
          </div>

          {/* Sri Lanka National Identity Card Preview - Front & Back */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12px] font-mono text-[#bbcabf]">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <span className="material-symbols-outlined text-[16px] text-[#4edea3]">document_scanner</span>
                National Identity Card Document Verification (Front & Back)
              </span>
              <span className="text-[11px] text-[#86948a]">
                Click any image to enlarge inspection
              </span>
            </div>

            {/* Applicant Summary */}
            <div className="p-3.5 bg-[#0a0e16] rounded-xl border border-[#1f2937] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] font-mono text-[#bbcabf]">
              <div>
                <span className="text-[10px] text-[#86948a] uppercase block">Full Name</span>
                <strong className="text-white truncate block">{activeCandidate.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#86948a] uppercase block">NIC Number</span>
                <strong className="text-[#4edea3] block">{activeCandidate.nic}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#86948a] uppercase block">Phone</span>
                <strong className="text-white block">{activeCandidate.phone || "—"}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#86948a] uppercase block">Email</span>
                <span className="text-[#86948a] truncate block">{activeCandidate.company}</span>
              </div>
            </div>

            {/* Dual Images (Front & Back) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Side Card */}
              <div className="p-3.5 bg-[#0a0e16] rounded-xl border border-[#1f2937] flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#dfe2ee]">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    Front Side (Photo & Info)
                  </span>
                  {activeCandidate.docFront ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: activeCandidate.docFront, title: `NIC Front Side — ${activeCandidate.name} (${activeCandidate.nic})` })}
                        className="text-[11px] text-[#4edea3] hover:underline flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                        Enlarge
                      </button>
                      <a
                        href={activeCandidate.docFront}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#86948a] hover:text-white flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="w-full h-48 bg-[#1c2028] rounded-lg overflow-hidden border border-[#10b981]/30 relative flex items-center justify-center p-2 group cursor-pointer"
                  onClick={() => activeCandidate.docFront && setPreviewImage({ url: activeCandidate.docFront, title: `NIC Front Side — ${activeCandidate.name} (${activeCandidate.nic})` })}
                >
                  {activeCandidate.docFront ? (
                    <>
                      <img
                        src={activeCandidate.docFront}
                        alt={`NIC Front of ${activeCandidate.name}`}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono gap-1">
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        Click to inspect
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <span className="material-symbols-outlined text-[36px] text-[#86948a]">badge</span>
                      <div className="text-[11px] font-mono text-[#bbcabf] mt-1 font-semibold">Front Side Missing</div>
                      <div className="text-[10px] text-[#86948a]">No front image uploaded</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Side Card */}
              <div className="p-3.5 bg-[#0a0e16] rounded-xl border border-[#1f2937] flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#dfe2ee]">
                    <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                    Back Side (Barcode & Address)
                  </span>
                  {activeCandidate.docBack ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: activeCandidate.docBack, title: `NIC Back Side — ${activeCandidate.name} (${activeCandidate.nic})` })}
                        className="text-[11px] text-[#4edea3] hover:underline flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                        Enlarge
                      </button>
                      <a
                        href={activeCandidate.docBack}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#86948a] hover:text-white flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="w-full h-48 bg-[#1c2028] rounded-lg overflow-hidden border border-[#10b981]/30 relative flex items-center justify-center p-2 group cursor-pointer"
                  onClick={() => activeCandidate.docBack && setPreviewImage({ url: activeCandidate.docBack, title: `NIC Back Side — ${activeCandidate.name} (${activeCandidate.nic})` })}
                >
                  {activeCandidate.docBack ? (
                    <>
                      <img
                        src={activeCandidate.docBack}
                        alt={`NIC Back of ${activeCandidate.name}`}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono gap-1">
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        Click to inspect
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <span className="material-symbols-outlined text-[36px] text-[#86948a]">contact_page</span>
                      <div className="text-[11px] font-mono text-[#bbcabf] mt-1 font-semibold">Back Side Missing</div>
                      <div className="text-[10px] text-[#86948a]">No back image uploaded</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Approval Bar */}
          <div className="pt-3 border-t border-[#1f2937] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                setRejectionReasonText("Document illegible or failed biometric threshold")
                setRejectModalOpen(true)
              }}
              disabled={isProcessing}
              className="h-9 px-4 rounded bg-[#93000a]/25 hover:bg-[#93000a]/40 text-[#ffb4ab] font-mono text-[12px] font-semibold border border-[#ffb4ab]/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>Flag Suspicious / Reject</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRequestReupload}
                disabled={isProcessing}
                className="h-9 px-3 rounded bg-[#262a33] hover:bg-[#31353e] text-white font-mono text-[12px] transition-colors border border-[#1f2937] disabled:opacity-50"
              >
                Request Re-upload
              </button>

              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="h-9 px-5 rounded bg-[#10b981] hover:bg-[#4edea3] text-[#003824] font-mono text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{isProcessing ? "Saving..." : "Approve & Issue Trust Credential"}</span>
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
        </>
      )}

      {/* KYC REJECTION / FLAG MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#181c24] border border-[#ffb4ab]/30 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
              <div className="flex items-center gap-2 text-[#ffb4ab]">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <h3 className="text-base font-bold text-white">Reject KYC Verification</h3>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-[#86948a] hover:text-white transition-colors"
              >
                âœ•
              </button>
            </div>

            <p className="text-xs text-[#bbcabf] font-mono">
              Rejecting KYC for <strong className="text-white">{activeCandidate.name}</strong> (NIC: {activeCandidate.nic}). Please document the audit reason for compliance.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-[#86948a] uppercase tracking-wider block">
                Standard Rejection Templates
              </label>
              <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
                {[
                  "Document illegible or failed biometric threshold",
                  "Photo does not match registered contractor profile",
                  "Document expired or damaged beyond verification standards",
                  "Document quality insufficient or blurry - please re-upload clear photographs of your NIC.",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReasonText(reason)}
                    className={`p-2 rounded text-left text-[11px] transition-colors border ${
                      rejectionReasonText === reason
                        ? "bg-[#93000a]/20 border-[#ffb4ab]/50 text-white font-semibold"
                        : "bg-[#0a0e16] border-[#1f2937] text-[#bbcabf] hover:text-white"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#86948a] uppercase tracking-wider block">
                Custom Audit Note / Feedback
              </label>
              <textarea
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="Enter rejection explanation to be recorded in trust audit ledger..."
                className="w-full p-2.5 bg-[#0a0e16] border border-[#1f2937] rounded text-white text-xs font-mono focus:outline-none focus:border-[#ffb4ab]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-mono rounded border border-[#1f2937] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing || !rejectionReasonText.trim()}
                className="px-4 py-2 bg-[#93000a] hover:bg-[#b00020] text-white text-xs font-mono font-bold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>{isProcessing ? "Persisting..." : "Confirm & Log Rejection"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 5. IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-[#181c24] border border-[#1f2937] rounded-xl max-w-4xl w-full p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-2">
              <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#4edea3]">zoom_in</span>
                {previewImage.title}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#4edea3] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  Open original tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-[#86948a] hover:text-white text-base leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center max-h-[75vh] overflow-hidden bg-[#0a0e16] rounded-lg p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
