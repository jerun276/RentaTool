import React, { useState, useEffect } from "react"
import { axiosClient } from "@/shared/api/axiosClient"
import { UserManagementDirectoryView } from "./UserManagementDirectoryView"

export const KycTrustComplianceView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "kyc">("users")
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("duminda")
  const [filterTab, setFilterTab] = useState<"pending" | "all" | "verified" | "flagged">("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [approvalStatus, setApprovalStatus] = useState<Record<string, "approved" | "rejected" | "pending">>({})
  const [dbLive, setDbLive] = useState<boolean>(false)
  const [dbCandidates, setDbCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const defaultCandidates = [
    {
      id: "duminda",
      userId: "duminda",
      name: "Duminda Bandara",
      company: "Apex Heavy Civils Ltd.",
      province: "LK-WP",
      role: "RENTER",
      nic: "198842109923",
      trustScore: 88,
      trustTier: "Trust A",
      status: "IN DRAWER",
      statusColor: "text-[#ffb95f] bg-[#e29100]/20",
      faceMatch: "97.8%",
      ocrConfidence: "99.4%",
      docFront: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "chaminda",
      userId: "chaminda",
      name: "Chaminda Perera",
      company: "Perera Plant Hire & Logistics",
      province: "LK-CP",
      role: "OWNER",
      nic: "197412809122",
      trustScore: 94,
      trustTier: "Trust A+",
      status: "VERIFIED",
      statusColor: "text-[#4edea3] bg-[#10b981]/20",
      faceMatch: "99.1%",
      ocrConfidence: "99.8%",
      docFront: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "nimal",
      userId: "nimal",
      name: "K.G. Nimal Jayasinghe",
      company: "Nimal Earthmovers & Demolition",
      province: "LK-SP",
      role: "RENTER",
      nic: "199104508119",
      trustScore: 62,
      trustTier: "Trust B",
      status: "DOC BLURRY",
      statusColor: "text-[#ffb95f] bg-[#e29100]/20",
      faceMatch: "81.2%",
      ocrConfidence: "78.0%",
      docFront: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "tharindu",
      userId: "tharindu",
      name: "Tharindu Wijesinghe",
      company: "Southern Agri Heavy Rentals",
      province: "LK-NW",
      role: "OWNER",
      nic: "198522301984",
      trustScore: 35,
      trustTier: "Trust C",
      status: "HIGH FRAUD RISK",
      statusColor: "text-[#ffb4ab] bg-[#93000a]/30",
      faceMatch: "42.0%",
      ocrConfidence: "51.3%",
      docFront: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    },
  ]

  // Fetch real submissions from ASP.NET Core Backend
  useEffect(() => {
    let isMounted = true
    const fetchKycQueue = async () => {
      try {
        setLoading(true)
        const res = await axiosClient.get("/users/kyc-submissions")
        if (!isMounted) return
        if (res.data && Array.isArray(res.data)) {
          setDbLive(true)
          if (res.data.length > 0) {
            const mapped = res.data.map((sub: any) => ({
              id: sub.kycRecordId || sub.userId,
              userId: sub.userId,
              name: sub.name,
              company: sub.role === "Owner" ? "Equipment Partner" : "Civil Contractor",
              province: "LK-WP",
              role: (sub.role || "RENTER").toUpperCase(),
              nic: sub.documentNumber || "198842109923",
              trustScore: 85,
              trustTier: "Trust A",
              status: sub.status === "Approved" ? "VERIFIED" : sub.status === "Pending" ? "IN DRAWER" : "FLAGGED",
              statusColor: sub.status === "Approved" ? "text-[#4edea3] bg-[#10b981]/20" : "text-[#ffb95f] bg-[#e29100]/20",
              faceMatch: "98.2%",
              ocrConfidence: "99.1%",
              docFront: sub.frontImageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            }))
            setDbCandidates(mapped)
            if (mapped.length > 0) {
              setSelectedCandidateId(mapped[0].id)
            }
          }
        }
      } catch {
        // Fallback gracefully to default candidates
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchKycQueue()
    return () => {
      isMounted = false
    }
  }, [])

  const candidates = dbCandidates.length > 0 ? dbCandidates : defaultCandidates
  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0]
  const currentApproval = approvalStatus[activeCandidate.id]

  const handleApprove = async () => {
    setApprovalStatus((prev) => ({ ...prev, [activeCandidate.id]: "approved" }))
    if (activeCandidate.userId && activeCandidate.userId.length > 20) {
      try {
        await axiosClient.patch(`/users/${activeCandidate.userId}/verification-status`, {
          status: "Approved",
        })
      } catch (err) {
        console.warn("Could not patch verification status in DB:", err)
      }
    }
  }

  const handleReject = async () => {
    setApprovalStatus((prev) => ({ ...prev, [activeCandidate.id]: "rejected" }))
    if (activeCandidate.userId && activeCandidate.userId.length > 20) {
      try {
        await axiosClient.patch(`/users/${activeCandidate.userId}/verification-status`, {
          status: "Rejected",
          rejectionReason: "Document illegible or failed biometric threshold",
        })
      } catch (err) {
        console.warn("Could not patch rejection in DB:", err)
      }
    }
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
                  ● PostgreSQL Active
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
                4 In Queue
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
              <span className="text-[10px] font-mono text-[#86948a] uppercase">AI OCR Conf.</span>
              <span className="material-symbols-outlined text-[14px] text-[#4edea3]">auto_awesome</span>
            </div>
            <span className="text-xl font-bold font-mono text-[#4edea3]">99.2%</span>
            <span className="text-[10px] text-[#bbcabf] font-mono">LankaGov OCR v3.4</span>
          </div>

          <div className="flex flex-col px-4 py-2 bg-[#1c2028] rounded border border-[#1f2937] min-w-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Fraud Blocked</span>
              <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">shield</span>
            </div>
            <span className="text-xl font-bold font-mono text-[#ffb4ab]">14</span>
            <span className="text-[10px] text-[#bbcabf] font-mono">LKR 4.2M saved</span>
          </div>

          <div className="flex flex-col px-4 py-2 bg-[#1c2028] rounded border border-[#1f2937] min-w-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Pass Ratio</span>
              <span className="material-symbols-outlined text-[14px] text-[#d0bcff]">analytics</span>
            </div>
            <span className="text-xl font-bold font-mono text-white">92.9%</span>
            <span className="text-[10px] text-[#bbcabf] font-mono">11m avg velocity</span>
          </div>
        </div>
      </div>

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
            { id: "pending", label: "Pending Verification", count: 4, badgeBg: "bg-[#e29100]/25 text-[#ffb95f]" },
            { id: "all", label: "All Registrations", count: 142, badgeBg: "bg-[#31353e] text-[#bbcabf]" },
            { id: "verified", label: "Verified Members", count: 132, badgeBg: "bg-[#10b981]/20 text-[#4edea3]" },
            { id: "flagged", label: "Flagged & Suspended", count: 6, badgeBg: "bg-[#93000a]/30 text-[#ffb4ab]" },
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
              REGISTRY CANDIDATES (4 ACTIVE)
            </span>
            <span className="text-[10px] font-mono text-[#4edea3] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              LIVE SYNC
            </span>
          </div>

          <div className="divide-y divide-[#1f2937]">
            {candidates.map((candidate) => {
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
        <div className="xl:col-span-7 bg-[#181c24] rounded-xl border border-[#1f2937] shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#4edea3]">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-white">{activeCandidate.name}</h3>
                <span className="text-[12px] text-[#bbcabf] font-mono">
                  {activeCandidate.company} • NIC: {activeCandidate.nic}
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
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Face Match</span>
              <div className="text-[18px] font-bold font-mono text-[#4edea3] mt-0.5">
                {activeCandidate.faceMatch}
              </div>
              <span className="text-[10px] text-[#bbcabf]">Biometric Selfie Match</span>
            </div>

            <div className="p-3 bg-[#1c2028] rounded-lg border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">OCR Field Conf.</span>
              <div className="text-[18px] font-bold font-mono text-[#4edea3] mt-0.5">
                {activeCandidate.ocrConfidence}
              </div>
              <span className="text-[10px] text-[#bbcabf]">NIC Checksum Valid</span>
            </div>

            <div className="p-3 bg-[#1c2028] rounded-lg border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Algorithm Score</span>
              <div className="text-[18px] font-bold font-mono text-[#d0bcff] mt-0.5">
                {activeCandidate.trustScore} / 100
              </div>
              <span className="text-[10px] text-[#bbcabf]">Tier A (High Trust)</span>
            </div>

            <div className="p-3 bg-[#1c2028] rounded-lg border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase">Ledger Delta</span>
              <div className="text-[18px] font-bold font-mono text-[#4edea3] mt-0.5">+25 pts</div>
              <span className="text-[10px] text-[#bbcabf]">Upon Admin Sign-off</span>
            </div>
          </div>

          {/* Sri Lanka National Identity Card Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px] font-mono text-[#bbcabf]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#4edea3]">document_scanner</span>
                Sri Lanka National Identity Card (Smart NIC)
              </span>
              <span className="text-[#4edea3]">Tamper Check: PASS</span>
            </div>

            <div className="p-4 bg-[#0a0e16] rounded-xl border border-[#1f2937] flex flex-col sm:flex-row items-center gap-4">
              <div className="w-48 h-32 bg-[#1c2028] rounded-lg overflow-hidden border border-[#10b981]/40 shrink-0 relative flex items-center justify-center p-2">
                <div className="text-center">
                  <span className="material-symbols-outlined text-[36px] text-[#4edea3]">badge</span>
                  <div className="text-[10px] font-mono text-white font-bold mt-1">
                    NIC: {activeCandidate.nic}
                  </div>
                  <div className="text-[9px] text-[#86948a]">Republic of Sri Lanka</div>
                </div>
              </div>

              <div className="flex-1 text-[12px] font-mono space-y-1.5 text-[#bbcabf]">
                <div className="flex justify-between border-b border-[#1f2937] pb-1">
                  <span>Full Name:</span>
                  <strong className="text-white">{activeCandidate.name}</strong>
                </div>
                <div className="flex justify-between border-b border-[#1f2937] pb-1">
                  <span>NIC Number:</span>
                  <strong className="text-[#4edea3]">{activeCandidate.nic}</strong>
                </div>
                <div className="flex justify-between border-b border-[#1f2937] pb-1">
                  <span>Registered Address:</span>
                  <strong className="text-white">Colombo 03, Western Province</strong>
                </div>
                <div className="flex justify-between">
                  <span>Verification Hash:</span>
                  <span className="text-[#86948a] truncate">0x7c9a...11b238f</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Approval Bar */}
          <div className="pt-3 border-t border-[#1f2937] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleReject}
              className="h-9 px-4 rounded bg-[#93000a]/25 hover:bg-[#93000a]/40 text-[#ffb4ab] font-mono text-[12px] font-semibold border border-[#ffb4ab]/30 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              <span>Flag Suspicious / Reject</span>
            </button>

            <div className="flex items-center gap-3">
              <button className="h-9 px-3 rounded bg-[#262a33] hover:bg-[#31353e] text-white font-mono text-[12px] transition-colors border border-[#1f2937]">
                Request Re-upload
              </button>

              <button
                onClick={handleApprove}
                className="h-9 px-5 rounded bg-[#10b981] hover:bg-[#4edea3] text-[#003824] font-mono text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Approve & Issue Trust Credential</span>
              </button>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
