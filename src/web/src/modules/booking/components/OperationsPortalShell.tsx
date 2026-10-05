import React, { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { axiosClient } from "@/shared/api/axiosClient"


export type DeskTab = "desk01" | "desk02" | "desk03" | "catalog" | "desk04"

export interface AdminNotification {
  id: string
  desk: DeskTab
  title: string
  description: string
  timeAgo: string
  level: "critical" | "warning" | "info" | "success"
  icon: string
  isRead: boolean
}

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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "critical">("all")
  const notificationRef = useRef<HTMLDivElement>(null)

  const [deskCounts, setDeskCounts] = useState<{
    kycPending: number
    wearLocks: number
    activeClaims: number
    totalFleet: number
    loaded: boolean
  }>({
    kycPending: 0,
    wearLocks: 0,
    activeClaims: 0,
    totalFleet: 0,
    loaded: false,
  })

  // Poll real live counts from backend for sidebar notification badges
  useEffect(() => {
    let isMounted = true

    const fetchTelemetryCounts = async () => {
      try {
        const [kycRes, eqRes, claimsRes] = await Promise.allSettled([
          axiosClient.get("/users/kyc-submissions"),
          axiosClient.get("/equipment"),
          axiosClient.get("/claims"),
        ])

        if (!isMounted) return

        let kycPending = 0
        if (kycRes.status === "fulfilled" && Array.isArray(kycRes.value.data)) {
          kycPending = kycRes.value.data.filter((s: any) => s.status === "Pending").length
        }

        let wearLocks = 0
        let totalFleet = 0
        if (eqRes.status === "fulfilled" && eqRes.value.data) {
          const items = eqRes.value.data.items || (Array.isArray(eqRes.value.data) ? eqRes.value.data : [])
          totalFleet = items.length
          wearLocks = items.filter(
            (eq: any) =>
              eq.requiresMaintenanceCheck ||
              eq.status === "UnderMaintenance" ||
              (eq.totalRentalDaysAccumulated || 0) >= 60
          ).length
        }

        let activeClaims = 0
        if (claimsRes.status === "fulfilled" && claimsRes.value.data) {
          const claims = Array.isArray(claimsRes.value.data)
            ? claimsRes.value.data
            : claimsRes.value.data.items || []
          activeClaims = claims.filter(
            (c: any) => c.status !== "Settled" && c.status !== "Approved"
          ).length
        }

        setDeskCounts({
          kycPending,
          wearLocks,
          activeClaims,
          totalFleet,
          loaded: true,
        })

        // Synchronize notification messages with live values
        setNotificationsList((prev) => {
          return prev.map((item) => {
            if (item.id === "notif-1") {
              return {
                ...item,
                title: `${kycPending} KYC Submission${kycPending === 1 ? "" : "s"} Pending Review`,
                description:
                  kycPending > 0
                    ? `${kycPending} Sri Lankan NIC identity document${kycPending === 1 ? "" : "s"} require biometric verification and clearance.`
                    : "All identity submissions have been verified and processed.",
                level: kycPending > 0 ? "warning" : "info",
              }
            }
            if (item.id === "notif-2") {
              return {
                ...item,
                title: `${wearLocks} Machinery Asset${wearLocks === 1 ? "" : "s"} Locked`,
                description:
                  wearLocks > 0
                    ? `${wearLocks} fleet assets triggered mandatory lockout due to 60-day threshold or maintenance check.`
                    : "All fleet equipment within safe operating parameters.",
                level: wearLocks > 0 ? "critical" : "success",
              }
            }
            if (item.id === "notif-3") {
              return {
                ...item,
                title: `${activeClaims} Active AI Escrow Dispute${activeClaims === 1 ? "" : "s"}`,
                description:
                  activeClaims > 0
                    ? `${activeClaims} claim${activeClaims === 1 ? "" : "s"} currently in AI evaluation or staff review queue.`
                    : "No active dispute claims pending arbitration.",
                level: activeClaims > 0 ? "warning" : "success",
              }
            }
            return item
          })
        })
      } catch (err) {
        console.warn("Failed to fetch sidebar telemetry counts:", err)
      }
    }

    fetchTelemetryCounts()
    const pollInterval = setInterval(fetchTelemetryCounts, 30000)
    return () => {
      isMounted = false
      clearInterval(pollInterval)
    }
  }, [])

  const [notificationsList, setNotificationsList] = useState<AdminNotification[]>([
    {
      id: "notif-1",
      desk: "desk02",
      title: "KYC Submissions Pending Review",
      description: "4 Sri Lankan NIC identity documents require biometric verification and clearance.",
      timeAgo: "4m ago",
      level: "warning",
      icon: "verified_user",
      isRead: false,
    },
    {
      id: "notif-2",
      desk: "desk03",
      title: "Fleet Equipment Exceeded 60-Day Limit",
      description: "12 machinery assets triggered mandatory mechanical lockout until dye-penetrant inspection.",
      timeAgo: "15m ago",
      level: "critical",
      icon: "build_circle",
      isRead: false,
    },
    {
      id: "notif-3",
      desk: "desk04",
      title: "AI Escrow Dispute Awaiting Decision",
      description: "Caterpillar 320D damage claim evidence analyzed by Gemini Arbiter. Staff sign-off pending.",
      timeAgo: "35m ago",
      level: "warning",
      icon: "gavel",
      isRead: false,
    },
    {
      id: "notif-4",
      desk: "desk01",
      title: "Cluster Geofence Heartbeat Active",
      description: "42 GPS telematics nodes online across Western Province. 0 breaches recorded.",
      timeAgo: "1h ago",
      level: "success",
      icon: "radar",
      isRead: true,
    },
    {
      id: "notif-5",
      desk: "catalog",
      title: "Dynamic Machinery Specs Synchronized",
      description: "Category schemas and attribute validator rules synced with PostgreSQL cluster.",
      timeAgo: "2h ago",
      level: "info",
      icon: "category",
      isRead: true,
    },
  ])

  const unreadCount = notificationsList.filter((n) => !n.isRead).length

  const filteredNotifs = useMemo(() => {
    return notificationsList.filter((n) => {
      if (notifFilter === "unread") return !n.isRead
      if (notifFilter === "critical") return n.level === "critical"
      return true
    })
  }, [notificationsList, notifFilter])

  const handleNotificationClick = (notif: AdminNotification) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    )
    onSelectDesk(notif.desk)
    setNotificationsOpen(false)
  }

  const handleMarkAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotificationsList((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClearAll = () => {
    setNotificationsList([])
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false)
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [notificationsOpen])

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
              Operations & Modules
            </div>
            <nav className="space-y-1">
              {/* Operations Command Center */}
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
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Live
                </span>
              </button>

              {/* User Governance & KYC */}
              <button
                onClick={() => onSelectDesk("desk02")}
                className={`w-full group flex items-center justify-between px-3 py-2 rounded text-left transition-all ${
                  activeDesk === "desk02"
                    ? "bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#10b981]"
                    : "text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                  <span className="text-[13px]">User Governance & KYC</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold transition-colors ${
                    deskCounts.kycPending > 0
                      ? "bg-[#e29100]/20 text-[#ffb95f]"
                      : "bg-[#10b981]/20 text-[#4edea3]"
                  }`}
                >
                  {deskCounts.loaded
                    ? deskCounts.kycPending > 0
                      ? `${deskCounts.kycPending} Pending`
                      : "Verified"
                    : "4 Pending"}
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
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold transition-colors ${
                    deskCounts.wearLocks > 0
                      ? "bg-[#93000a]/40 text-[#ffb4ab]"
                      : "bg-[#10b981]/20 text-[#4edea3]"
                  }`}
                >
                  {deskCounts.loaded
                    ? deskCounts.wearLocks > 0
                      ? `${deskCounts.wearLocks} Locks`
                      : "Healthy"
                    : "2 Locks"}
                </span>
              </button>

              {/* Equipment Catalog (Under Fleet & Wear Hub) */}
              <button
                onClick={() => onSelectDesk("catalog")}
                className={`w-full group flex items-center justify-between px-3 py-2 rounded text-left transition-all ${
                  activeDesk === "catalog"
                    ? "bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#10b981]"
                    : "text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  <span className="text-[13px]">Equipment Catalog</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold">
                  {deskCounts.loaded && deskCounts.totalFleet > 0
                    ? `${deskCounts.totalFleet} Fleet`
                    : "Fleet"}
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
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold transition-colors ${
                    deskCounts.activeClaims > 0
                      ? "bg-[#571bc1]/40 text-[#d0bcff]"
                      : "bg-[#10b981]/20 text-[#4edea3]"
                  }`}
                >
                  {deskCounts.loaded
                    ? deskCounts.activeClaims > 0
                      ? `${deskCounts.activeClaims} Claims`
                      : "Settled"
                    : "3 Claims"}
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

            {/* Notification Bell & Center */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                  notificationsOpen
                    ? "bg-[#262a33] border-[#10b981]/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    : "border-transparent text-[#bbcabf] hover:text-[#dfe2ee] hover:bg-[#181c24]"
                }`}
                title="Operations Notifications Center"
                aria-label="Operations Notifications"
              >
                <span className="material-symbols-outlined text-[20px] block">
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#e29100] text-[#000] font-mono text-[9px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#181c24] border border-[#1f2937] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Header */}
                  <div className="p-3 bg-[#0a0e16] border-b border-[#1f2937] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
                        notifications_active
                      </span>
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                        Operations Alerts
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#e29100]/20 text-[#ffb95f] font-mono text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[#4edea3] hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      {notificationsList.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-[#86948a] hover:text-[#ffb4ab] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-[#12161f] border-b border-[#1f2937] text-[11px] font-mono">
                    <button
                      onClick={() => setNotifFilter("all")}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        notifFilter === "all"
                          ? "bg-[#262a33] text-[#4edea3] font-bold"
                          : "text-[#86948a] hover:text-white"
                      }`}
                    >
                      All ({notificationsList.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter("unread")}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        notifFilter === "unread"
                          ? "bg-[#262a33] text-[#ffb95f] font-bold"
                          : "text-[#86948a] hover:text-white"
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      onClick={() => setNotifFilter("critical")}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        notifFilter === "critical"
                          ? "bg-[#262a33] text-[#ffb4ab] font-bold"
                          : "text-[#86948a] hover:text-white"
                      }`}
                    >
                      Critical ({notificationsList.filter((n) => n.level === "critical").length})
                    </button>
                  </div>

                  {/* Notifications list */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#1f2937]/50">
                    {filteredNotifs.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <span className="material-symbols-outlined text-[32px] text-[#86948a] block mb-1">
                          done_all
                        </span>
                        <p className="text-xs text-[#86948a] font-mono">
                          All systems nominal. No pending alerts.
                        </p>
                      </div>
                    ) : (
                      filteredNotifs.map((notif) => {
                        const levelStyles = {
                          critical: {
                            iconColor: "text-[#ffb4ab]",
                            bg: "bg-[#93000a]/15",
                          },
                          warning: {
                            iconColor: "text-[#ffb95f]",
                            bg: "bg-[#e29100]/10",
                          },
                          info: {
                            iconColor: "text-[#93c5fd]",
                            bg: "bg-[#1d4ed8]/10",
                          },
                          success: {
                            iconColor: "text-[#4edea3]",
                            bg: "bg-[#10b981]/10",
                          },
                        }[notif.level]

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 flex items-start gap-3 hover:bg-[#1c2028] transition-colors cursor-pointer group ${
                              !notif.isRead ? "bg-[#151922]" : ""
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${levelStyles.bg} shrink-0 mt-0.5`}>
                              <span className={`material-symbols-outlined text-[16px] ${levelStyles.iconColor}`}>
                                {notif.icon}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[12px] font-bold text-white truncate">
                                  {notif.title}
                                </span>
                                <span className="text-[9px] font-mono text-[#86948a] shrink-0">
                                  {notif.timeAgo}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#bbcabf] line-clamp-2 leading-relaxed">
                                {notif.description}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[9px] font-mono text-[#4edea3] group-hover:underline flex items-center gap-0.5">
                                  Jump to Desk →
                                </span>
                                {!notif.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDismissNotification(notif.id, e)}
                              className="text-[#86948a] hover:text-[#ffb4ab] text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Dismiss alert"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-[#0a0e16] border-t border-[#1f2937] text-center">
                    <span className="text-[10px] font-mono text-[#86948a]">
                      RentaTool LK • High-Consequence Industrial Operations Telemetry
                    </span>
                  </div>
                </div>
              )}
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
