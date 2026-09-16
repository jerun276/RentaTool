import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"

export type DeskTab = "desk01" | "desk02" | "desk03" | "desk04"

interface OperationsPortalShellProps {
  activeDesk: DeskTab
  onSelectDesk: (desk: DeskTab) => void
  children: React.ReactNode
  onOpenCreateBooking?: () => void
  onIncidentLogClick?: () => void
}

export const OperationsPortalShell: React.FC<OperationsPortalShellProps> = ({
  activeDesk,
  onSelectDesk,
  children,
  onIncidentLogClick,
}) => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  // Live Clock UTC+5:30 (Sri Lanka Standard Time)
  const [timeStr, setTimeStr] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "OP"


  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Adjust to Sri Lanka Time (UTC + 5.5)
      const slTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000))
      const hours = String(slTime.getHours()).padStart(2, "0")
      const minutes = String(slTime.getMinutes()).padStart(2, "0")
      const seconds = String(slTime.getSeconds()).padStart(2, "0")
      setTimeStr(`${hours}:${minutes}:${seconds}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] font-sans antialiased flex selection:bg-[#10b981]/20 selection:text-[#4edea3]">
      {/* 1. FIXED INDUSTRIAL SIDEBAR (w-[260px]) */}
      <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#181c24] flex flex-col z-50 select-none shadow-[0_1px_8px_rgba(0,0,0,0.5)] border-r border-[#1f2937]">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between bg-[#0a0e16]/80 backdrop-blur-md border-b border-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981]/30 to-[#00422b]/50 border border-[#10b981]/40 flex items-center justify-center text-[#4edea3] shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <span className="material-symbols-outlined text-[20px]">hardware</span>
              </div>
              <div className="absolute inset-0 bg-[#4edea3]/20 blur-md rounded-full -z-10 pointer-events-none" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-[#dfe2ee] tracking-tight leading-tight">
                RentaTool <span className="text-[#4edea3]">LK</span>
              </span>
              <span className="text-[9px] text-[#4edea3] font-mono tracking-widest uppercase font-semibold">
                ADMIN OPERATIONS
              </span>
            </div>
          </div>
        </div>

        {/* Operational Desks Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono text-[#86948a] uppercase tracking-wider">
              Operational Desks
            </div>
            <nav className="space-y-1">
              {/* Desk 01: Operations Command Center (Component 3) */}
              <button
                onClick={() => onSelectDesk("desk01")}
                className={`w-full group flex items-center justify-between px-3 py-2 rounded text-left transition-all ${
                  activeDesk === "desk01"
                    ? "bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#10b981]"
                    : "text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  <span className="text-[13px]">Command Center</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    activeDesk === "desk01"
                      ? "bg-[#10b981]/20 text-[#4edea3]"
                      : "bg-[#31353e] text-[#bbcabf]"
                  }`}
                >
                  DESK 01
                </span>
              </button>

              {/* Desk 02: KYC & Compliance (Component 1) */}
              <button
                onClick={() => onSelectDesk("desk02")}
                className={`w-full group flex items-center justify-between px-3 py-2 rounded text-left transition-all ${
                  activeDesk === "desk02"
                    ? "bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#10b981]"
                    : "text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="text-[13px]">KYC & Compliance</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#e29100]/20 text-[#ffb95f] font-bold">
                  4 Pending
                </span>
              </button>

              {/* Desk 03: Fleet & Wear Hub (Component 2) */}
              <button
                onClick={() => onSelectDesk("desk03")}
                className={`w-full group flex items-center justify-between px-3 py-2 rounded text-left transition-all ${
                  activeDesk === "desk03"
                    ? "bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#10b981]"
                    : "text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">build_circle</span>
                  <span className="text-[13px]">Fleet & Wear Hub</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] font-bold">
                  2 Locks
                </span>
              </button>

              {/* Desk 04: AI Arbitration (Component 4 / Planner Agent) */}
              <button
                onClick={() => onSelectDesk("desk04")}
                className={`w-full group flex items-center justify-between px-3 py-2 rounded text-left transition-all ${
                  activeDesk === "desk04"
                    ? "bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#10b981]"
                    : "text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span className="text-[13px]">AI Arbitration</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#571bc1]/40 text-[#d0bcff] font-bold">
                  3 Claims
                </span>
              </button>
            </nav>
          </div>

          {/* Infrastructure & Ledger Links */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono text-[#86948a] uppercase tracking-wider">
              Infrastructure & Ledger
            </div>
            <nav className="space-y-1 text-[#bbcabf]">
              <div
                onClick={() => onSelectDesk("desk04")}
                className="cursor-pointer group flex items-center gap-2.5 px-3 py-2 rounded text-[13px] hover:bg-[#1c2028] hover:text-[#dfe2ee] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                <span>Escrow Vault</span>
              </div>
              <div
                onClick={() => onSelectDesk("desk01")}
                className="cursor-pointer group flex items-center gap-2.5 px-3 py-2 rounded text-[13px] hover:bg-[#1c2028] hover:text-[#dfe2ee] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Audit Trail</span>
              </div>
              <div
                onClick={() => onSelectDesk("desk01")}
                className="cursor-pointer group flex items-center gap-2.5 px-3 py-2 rounded text-[13px] hover:bg-[#1c2028] hover:text-[#dfe2ee] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">insights</span>
                <span>API Telemetry</span>
              </div>
            </nav>
          </div>
        </div>

        {/* System Telematics Pod & Admin Profile */}
        <div className="p-3 bg-[#0a0e16]/80 border-t border-[#1f2937] space-y-3">
          <div className="p-2 bg-[#1c2028] rounded border border-[#1f2937]/70 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                <span>PGSQL Live</span>
              </div>
              <span className="text-[#4edea3] font-mono text-[10px]">4ms</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"></span>
                <span>Gemini Arbiter</span>
              </div>
              <span className="text-[#d0bcff] font-mono text-[10px]">99.9%</span>
            </div>
          </div>

          {/* Live User Session Pod */}
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 shrink-0 rounded-full bg-[#262a33] border border-[#10b981]/40 flex items-center justify-center text-[#4edea3] font-bold text-[11px]">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold leading-tight text-[#dfe2ee] truncate">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-[#4edea3] font-mono tracking-wider truncate">
                    {user.role.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate("/login")
                }}
                title="Sign Out"
                className="material-symbols-outlined text-[#86948a] hover:text-[#ffb4ab] transition-colors text-[18px] p-1 rounded hover:bg-[#262a33]"
              >
                logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-1.5 px-2 rounded bg-[#10b981]/15 border border-[#10b981]/30 text-[#4edea3] text-xs font-mono font-semibold hover:bg-[#10b981]/25 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Operator Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTAINER & TOP NAVIGATION BAR (Offset left 260px) */}
      <div className="pl-[260px] flex-1 flex flex-col min-w-0">
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-[#181c24]/95 backdrop-blur-md z-40 px-6 flex items-center justify-between border-b border-[#1f2937] shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
          {/* Left: Quick Search with ⌘K & Cluster Pill */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-[#86948a] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Press ⌘K to search claims, equipment, or users..."
                className="w-[200px] md:w-[260px] lg:w-[320px] h-8 pl-9 pr-12 bg-[#0a0e16] border border-[#1f2937] text-[#dfe2ee] placeholder:text-[#86948a] text-[13px] rounded focus:outline-none focus:border-[#10b981] transition-colors"
              />
              <div className="absolute right-2 px-1.5 py-0.5 rounded bg-[#31353e] text-[#86948a] font-mono text-[10px]">
                ⌘K
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c2028] border border-[#1f2937] font-mono text-[11px] text-[#bbcabf]">
              <span className="text-[14px]">🇱🇰</span>
              <span>Colombo Cluster</span>
              <span className="w-1 h-1 rounded-full bg-[#10b981]"></span>
              <span className="text-[#4edea3]">18ms</span>
            </div>
          </div>

          {/* Right: Telemetry Escrow, Clock, Incident Button & User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-[#0a0e16] border border-[#1f2937]">
              <span className="text-[10px] font-mono text-[#86948a] uppercase tracking-wider">
                Secured Escrow
              </span>
              <span className="font-mono text-[11px] text-[#86948a]">LKR</span>
              <span className="font-mono text-[14px] text-[#4edea3] font-bold tracking-tight">
                1,845,000
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[13px] text-[#bbcabf]">
              <span className="material-symbols-outlined text-[16px] text-[#86948a]">
                schedule
              </span>
              <span>{timeStr || "08:45:12"}</span>
              <span className="text-[9px] text-[#86948a] font-mono">UTC+5:30</span>
            </div>

            <button
              onClick={onIncidentLogClick}
              className="h-8 px-3 rounded bg-[#10b981] text-[#003824] font-bold text-[12px] flex items-center gap-1.5 hover:bg-[#4edea3] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add_alert</span>
              <span className="hidden sm:inline">Incident Log</span>
            </button>

            <div className="relative cursor-pointer p-1">
              <span className="material-symbols-outlined text-[#bbcabf] hover:text-[#dfe2ee] text-[20px]">
                notifications
              </span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e29100] text-[#000] font-mono text-[9px] font-bold flex items-center justify-center">
                5
              </span>
            </div>

            {/* Top Bar User Avatar & Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 rounded-full bg-[#10b981] text-[#003824] font-bold text-xs flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform"
                  title={`${user.name} (${user.role})`}
                >
                  {userInitials}
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#181c24] border border-[#1f2937] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 pb-2 border-b border-[#1f2937]">
                      <div className="w-9 h-9 rounded-full bg-[#10b981] text-[#003824] font-bold flex items-center justify-center text-sm">
                        {userInitials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#dfe2ee] truncate">
                          {user.name}
                        </span>
                        <span className="text-[10px] text-[#86948a] font-mono truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#86948a]">Role</span>
                      <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold border border-[#10b981]/30">
                        {user.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#86948a]">Trust Score</span>
                      <span className="text-[#4edea3] font-bold">
                        {user.trustScore ?? 92}/100
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#1f2937] space-y-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate("/login")
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#bbcabf] hover:bg-[#262a33] hover:text-[#dfe2ee] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
                          switch_account
                        </span>
                        <span>Switch Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                          navigate("/login")
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#ffb4ab] hover:bg-[#93000a]/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          logout
                        </span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="h-8 px-3 rounded bg-[#10b981]/15 border border-[#10b981]/40 text-[#4edea3] text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-[#10b981]/25 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </header>

        {/* 3. DESK VIEW VIEWPORT */}
        <main className="pt-16 min-h-screen bg-[#0f131c] w-full p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
