import React, { useState, useEffect, useMemo } from "react"
import { identityApi, apiErrorMessage } from "../api/identityApi"
import type { ManagedUser } from "../types/identityTypes"
import type { AdminKycReviewDto } from "../api/identityApi"
import { useAuthStore } from "@/shared/store/useAuthStore"

export const UserManagementDirectoryView: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Modals state
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [actionReason, setActionReason] = useState("")
  const [newRole, setNewRole] = useState<"Admin" | "Owner" | "Renter">("Renter")
  const [submitting, setSubmitting] = useState(false)

  // Detailed User Inspection state
  const [userKycSubmission, setUserKycSubmission] = useState<AdminKycReviewDto | null>(null)
  const [userTrustScore, setUserTrustScore] = useState<number | null>(null)
  const [loadingKyc, setLoadingKyc] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await identityApi.getUsers()
      setUsers(res.data ?? [])
    } catch (err) {
      setError(apiErrorMessage(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  // Auto-dismiss error notification
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 6000)
    return () => clearTimeout(timer)
  }, [error])

  // Fetch complete details when inspecting a user
  useEffect(() => {
    if (!detailModalOpen || !selectedUser) {
      setUserKycSubmission(null)
      setUserTrustScore(null)
      setPreviewImage(null)
      setCopiedId(false)
      return
    }

    let isMounted = true
    setLoadingKyc(true)

    Promise.allSettled([
      identityApi.getKycSubmission(selectedUser.id),
      identityApi.getTrustScore(selectedUser.id),
    ]).then(([kycRes, trustRes]) => {
      if (!isMounted) return
      if (kycRes.status === "fulfilled" && kycRes.value.data) {
        setUserKycSubmission(kycRes.value.data)
      } else {
        setUserKycSubmission(null)
      }
      if (trustRes.status === "fulfilled" && trustRes.value.data) {
        setUserTrustScore(
          trustRes.value.data.score ??
          trustRes.value.data.trustScore ??
          selectedUser.trustScore
        )
      } else {
        setUserTrustScore(selectedUser.trustScore)
      }
      setLoadingKyc(false)
    })

    return () => {
      isMounted = false
    }
  }, [detailModalOpen, selectedUser])

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phoneNumber.includes(searchQuery)

      const matchesRole =
        roleFilter === "ALL" || u.role.toUpperCase() === roleFilter

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "SUSPENDED" && !u.isActive) ||
        (statusFilter === "VERIFIED" && u.isVerified) ||
        (statusFilter === "UNVERIFIED" && !u.isVerified)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length
    const owners = users.filter((u) => u.role === "Owner").length
    const renters = users.filter((u) => u.role === "Renter").length
    const suspended = users.filter((u) => !u.isActive).length
    const avgTrust =
      total > 0
        ? Math.round(users.reduce((acc, u) => acc + (u.trustScore || 50), 0) / total)
        : 50

    return { total, owners, renters, suspended, avgTrust }
  }, [users])

  // Status Action handler (Suspend / Reactivate)
  const handleToggleStatus = async () => {
    if (!selectedUser) return
    const willBeActive = !selectedUser.isActive
    try {
      setSubmitting(true)
      await identityApi.updateUserStatus(selectedUser.id, {
        isActive: willBeActive,
        reason: willBeActive ? undefined : actionReason || "Administrative suspension",
      })

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                isActive: willBeActive,
                suspensionReason: willBeActive ? null : actionReason || "Administrative suspension",
              }
            : u
        )
      )
      setSuccessMessage(
        `User ${selectedUser.name} has been ${willBeActive ? "reactivated" : "suspended"}.`
      )
      setStatusModalOpen(false)
      setSelectedUser(null)
      setActionReason("")
    } catch (err) {
      setError(apiErrorMessage(err))
      setStatusModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Role Action handler
  const handleUpdateRole = async () => {
    if (!selectedUser) return
    try {
      setSubmitting(true)
      await identityApi.updateUserRole(selectedUser.id, { role: newRole })
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
      )
      setSuccessMessage(`User ${selectedUser.name} role changed to ${newRole}.`)
      setRoleModalOpen(false)
      setSelectedUser(null)
    } catch (err) {
      setError(apiErrorMessage(err))
      setRoleModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/50 text-[#4edea3] rounded-lg text-sm flex items-center justify-between animate-in fade-in duration-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[#4edea3] hover:text-white text-xs font-mono"
          >
            âœ•
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/50 text-[#ffb4ab] rounded-lg text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[#ffb4ab] hover:text-white text-xs font-mono"
          >
            âœ•
          </button>
        </div>
      )}

      {/* 1. TOP METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[#181c24] border border-[#1f2937] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] text-xs font-mono">
            <span>TOTAL USERS</span>
            <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">
              groups
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#dfe2ee] font-mono">
            {metrics.total}
          </div>
        </div>

        <div className="p-3.5 bg-[#181c24] border border-[#1f2937] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] text-xs font-mono">
            <span>EQUIPMENT OWNERS</span>
            <span className="material-symbols-outlined text-[18px] text-[#10b981]">
              agriculture
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#4edea3] font-mono">
            {metrics.owners}
          </div>
        </div>

        <div className="p-3.5 bg-[#181c24] border border-[#1f2937] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] text-xs font-mono">
            <span>ACTIVE RENTERS</span>
            <span className="material-symbols-outlined text-[18px] text-[#ffb95f]">
              engineering
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#ffb95f] font-mono">
            {metrics.renters}
          </div>
        </div>

        <div className="p-3.5 bg-[#181c24] border border-[#1f2937] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] text-xs font-mono">
            <span>SUSPENDED</span>
            <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">
              block
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#ffb4ab] font-mono">
            {metrics.suspended}
          </div>
        </div>

        <div className="p-3.5 bg-[#181c24] border border-[#1f2937] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] text-xs font-mono">
            <span>AVG TRUST SCORE</span>
            <span className="material-symbols-outlined text-[18px] text-[#c084fc]">
              verified
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#d0bcff] font-mono">
            {metrics.avgTrust}
            <span className="text-xs text-[#86948a] font-normal"> / 100</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="p-4 bg-[#181c24] border border-[#1f2937] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#86948a] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full h-9 pl-9 pr-3 bg-[#0a0e16] border border-[#1f2937] text-[#dfe2ee] placeholder:text-[#86948a] text-xs rounded-lg focus:outline-none focus:border-[#10b981] transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center bg-[#0a0e16] p-1 rounded-lg border border-[#1f2937] text-xs font-mono">
            <span className="px-2 text-[#86948a] text-[11px]">ROLE:</span>
            {(["ALL", "OWNER", "RENTER", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  roleFilter === r
                    ? "bg-[#262a33] text-[#4edea3] font-bold shadow-sm"
                    : "text-[#86948a] hover:text-[#dfe2ee]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#0a0e16] p-1 rounded-lg border border-[#1f2937] text-xs font-mono">
            <span className="px-2 text-[#86948a] text-[11px]">STATUS:</span>
            {(["ALL", "ACTIVE", "SUSPENDED", "VERIFIED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === s
                    ? "bg-[#262a33] text-[#4edea3] font-bold shadow-sm"
                    : "text-[#86948a] hover:text-[#dfe2ee]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchUsers}
            title="Refresh Users"
            className="h-9 px-3 bg-[#262a33] hover:bg-[#31353e] text-[#bbcabf] hover:text-[#dfe2ee] border border-[#1f2937] rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                loading ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. USER MANAGEMENT DATA TABLE */}
      <div className="bg-[#181c24] border border-[#1f2937] rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-[#1f2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
              manage_accounts
            </span>
            <h3 className="text-sm font-bold text-[#dfe2ee]">
              Registered System Accounts
            </h3>
            <span className="text-xs font-mono text-[#86948a] bg-[#0a0e16] px-2 py-0.5 rounded border border-[#1f2937]">
              {filteredUsers.length} records
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#86948a]">
            Identity Module â€¢ Component 1
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f2937] bg-[#11151e] text-[11px] font-mono text-[#86948a] uppercase tracking-wider">
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">KYC Verification</th>
                <th className="py-3 px-4">Trust Score</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937] text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#86948a]">
                    No users found matching current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.email === u.email
                  const roleBadgeColor =
                    u.role === "Admin"
                      ? "bg-[#571bc1]/25 text-[#d0bcff] border-[#571bc1]/40"
                      : u.role === "Owner"
                      ? "bg-[#10b981]/20 text-[#4edea3] border-[#10b981]/30"
                      : "bg-[#38bdf8]/20 text-[#7dd3fc] border-[#38bdf8]/30"

                  const trustColor =
                    u.trustScore >= 80
                      ? "text-[#4edea3] bg-[#10b981]"
                      : u.trustScore >= 60
                      ? "text-[#ffb95f] bg-[#e29100]"
                      : "text-[#ffb4ab] bg-[#93000a]"

                  const trustTier =
                    u.trustScore >= 90
                      ? "Tier A+"
                      : u.trustScore >= 75
                      ? "Tier A"
                      : u.trustScore >= 60
                      ? "Tier B"
                      : "Tier C"

                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#1c2028]/80 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer group/user"
                          onClick={() => {
                            setSelectedUser(u)
                            setDetailModalOpen(true)
                          }}
                          title="Click to inspect complete user details"
                        >
                          {u.profilePhotoUrl ? (
                            <img
                              src={u.profilePhotoUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#10b981]/40 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#262a33] border border-[#1f2937] text-[#dfe2ee] font-bold font-mono text-xs flex items-center justify-center shrink-0 group-hover/user:border-[#10b981]/50 transition-colors">
                              {initials}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[#dfe2ee] group-hover/user:text-[#4edea3] transition-colors flex items-center gap-1.5 truncate">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#10b981]/30 text-[#4edea3]">
                                  YOU
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] font-mono text-[#86948a] truncate">
                              {u.email}
                            </span>
                            <span className="text-[10px] font-mono text-[#6b7280]">
                              📞 {u.phoneNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleBadgeColor}`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      {/* KYC Verification */}
                      <td className="py-3 px-4">
                        {u.isVerified ? (
                          <div className="flex items-center gap-1 text-[#4edea3]">
                            <span className="material-symbols-outlined text-[16px]">
                              verified
                            </span>
                            <span className="font-medium text-[11px]">NIC Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[#ffb95f]">
                            <span className="material-symbols-outlined text-[16px]">
                              pending
                            </span>
                            <span className="font-medium text-[11px]">Unverified</span>
                          </div>
                        )}
                      </td>

                      {/* Trust Score */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 w-28">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className={trustColor.split(" ")[0]}>
                              {u.trustScore}/100
                            </span>
                            <span className="text-[#86948a]">{trustTier}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#262a33] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${trustColor.split(" ")[1]}`}
                              style={{ width: `${Math.min(100, u.trustScore)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#4edea3] font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#ffb4ab] font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#93000a]"></span>
                              Suspended
                            </span>
                            {u.suspensionReason && (
                              <span
                                className="text-[10px] text-[#86948a] truncate max-w-[140px]"
                                title={u.suspensionReason}
                              >
                                {u.suspensionReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#86948a]">
                        {new Date(u.createdAtUtc).toLocaleDateString("en-CA")}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setDetailModalOpen(true)
                            }}
                            title="Inspect Profile"
                            className="p-1 rounded bg-[#262a33] hover:bg-[#31353e] text-[#bbcabf] hover:text-[#dfe2ee] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              visibility
                            </span>
                          </button>

                          {/* Role Changer Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setNewRole(u.role)
                              setRoleModalOpen(true)
                            }}
                            title="Reassign Role"
                            disabled={isCurrent}
                            className={`p-1 rounded transition-colors ${
                              isCurrent
                                ? "opacity-30 cursor-not-allowed bg-[#262a33] text-[#86948a]"
                                : "bg-[#262a33] hover:bg-[#31353e] text-[#bbcabf] hover:text-[#38bdf8]"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              manage_accounts
                            </span>
                          </button>

                          {/* Suspend / Activate Toggle Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setActionReason(u.suspensionReason || "")
                              setStatusModalOpen(true)
                            }}
                            title={u.isActive ? "Suspend Account" : "Reactivate Account"}
                            disabled={isCurrent}
                            className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                              isCurrent
                                ? "opacity-30 cursor-not-allowed bg-[#262a33] text-[#86948a]"
                                : u.isActive
                                ? "bg-[#93000a]/20 hover:bg-[#93000a]/40 text-[#ffb4ab] border border-[#93000a]/40"
                                : "bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#4edea3] border border-[#10b981]/40"
                            }`}
                          >
                            {u.isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SUSPENSION / REACTIVATION MODAL */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#181c24] border border-[#1f2937] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedUser.isActive
                    ? "bg-[#93000a]/30 text-[#ffb4ab]"
                    : "bg-[#10b981]/30 text-[#4edea3]"
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {selectedUser.isActive ? "warning" : "check_circle"}
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-[#dfe2ee]">
                  {selectedUser.isActive
                    ? `Suspend ${selectedUser.name}`
                    : `Reactivate ${selectedUser.name}`}
                </h4>
                <p className="text-xs text-[#86948a]">
                  {selectedUser.isActive
                    ? "Suspending this user will immediately revoke login access and lock escrow actions."
                    : "Reactivating this account will restore marketplace and rental platform access."}
                </p>
              </div>
            </div>

            {selectedUser.isActive && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#bbcabf]">
                  REASON FOR SUSPENSION (REQUIRED FOR AUDIT LOG):
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Failure to return heavy machinery, falsified KYC documents..."
                  className="w-full p-2 bg-[#0a0e16] border border-[#1f2937] rounded-lg text-xs text-[#dfe2ee] placeholder:text-[#86948a] focus:outline-none focus:border-[#ffb4ab]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f2937]">
              <button
                type="button"
                onClick={() => {
                  setStatusModalOpen(false)
                  setSelectedUser(null)
                  setActionReason("")
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#86948a] hover:text-[#dfe2ee] hover:bg-[#262a33] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={submitting}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedUser.isActive
                    ? "bg-[#93000a] hover:bg-[#ba1a1a] text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                    : "bg-[#10b981] hover:bg-[#4edea3] text-[#003824] shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : selectedUser.isActive
                  ? "Confirm Suspension"
                  : "Confirm Reactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ROLE REASSIGNMENT MODAL */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#181c24] border border-[#1f2937] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#571bc1]/30 text-[#d0bcff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">
                  admin_panel_settings
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-[#dfe2ee]">
                  Change User Role
                </h4>
                <p className="text-xs text-[#86948a]">
                  Modify access permissions for {selectedUser.name}.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-[#bbcabf]">
                SELECT SYSTEM ROLE:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Renter", "Owner", "Admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRole(r)}
                    className={`py-2 px-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      newRole === r
                        ? "bg-[#10b981]/20 border-[#10b981] text-[#4edea3]"
                        : "bg-[#0a0e16] border-[#1f2937] text-[#86948a] hover:text-[#dfe2ee]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f2937]">
              <button
                type="button"
                onClick={() => {
                  setRoleModalOpen(false)
                  setSelectedUser(null)
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#86948a] hover:text-[#dfe2ee] hover:bg-[#262a33] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#10b981] hover:bg-[#4edea3] text-[#003824] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                {submitting ? "Updating..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EXTENSIVE USER DETAILS FORENSIC INSPECTOR MODAL */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141820] border border-[#262f3f] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#1f2937] bg-gradient-to-r from-[#181c24] to-[#12161f] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                {selectedUser.profilePhotoUrl ? (
                  <img
                    src={selectedUser.profilePhotoUrl}
                    alt={selectedUser.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#10b981]/50 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#262a33] border-2 border-[#10b981]/40 text-[#4edea3] font-bold font-mono text-xl flex items-center justify-center shadow-lg">
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#dfe2ee]">
                      {selectedUser.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                        selectedUser.role === "Admin"
                          ? "bg-[#571bc1]/20 border-[#571bc1]/50 text-[#d0bcff]"
                          : selectedUser.role === "Owner"
                          ? "bg-[#38bdf8]/15 border-[#38bdf8]/40 text-[#7dd3fc]"
                          : "bg-[#10b981]/15 border-[#10b981]/40 text-[#4edea3]"
                      }`}
                    >
                      {selectedUser.role.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        selectedUser.isActive
                          ? "bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/30"
                          : "bg-[#93000a]/20 text-[#ffb4ab] border-[#93000a]/40"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedUser.isActive ? "bg-[#10b981] animate-pulse" : "bg-[#ef4444]"
                        }`}
                      />
                      {selectedUser.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-[#86948a] flex items-center gap-1">
                      UUID: {selectedUser.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.id)
                        setCopiedId(true)
                        setTimeout(() => setCopiedId(false), 2000)
                      }}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#262a33] hover:bg-[#31353e] text-[#bbcabf] hover:text-[#dfe2ee] transition-colors"
                      title="Copy User UUID"
                    >
                      {copiedId ? "Copied! ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  setSelectedUser(null)
                }}
                className="w-8 h-8 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-[#86948a] hover:text-[#dfe2ee] flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Trust Score & Compliance Header Card */}
              {(() => {
                const score = userTrustScore ?? selectedUser.trustScore
                const tier =
                  score >= 90
                    ? "Tier A+ (Exceptional)"
                    : score >= 75
                    ? "Tier A (High Trust)"
                    : score >= 50
                    ? "Tier B (Standard)"
                    : "Tier C (High Risk)"
                const scoreColor =
                  score >= 75
                    ? "text-[#4edea3]"
                    : score >= 50
                    ? "text-[#ffb95f]"
                    : "text-[#ffb4ab]"
                const barColor =
                  score >= 75
                    ? "bg-[#10b981]"
                    : score >= 50
                    ? "bg-[#f59e0b]"
                    : "bg-[#ef4444]"

                return (
                  <div className="bg-[#0a0e16] border border-[#1f2937] p-5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#86948a] uppercase tracking-wider">
                            Algorithmic Trust Score & Risk Status
                          </span>
                          {score >= 75 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30">
                              VERIFIED TRUST
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-3xl font-black font-mono ${scoreColor}`}>
                            {score}
                          </span>
                          <span className="text-xs text-[#86948a] font-mono">/ 100 points</span>
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#1f2937] text-[#dfe2ee] ml-2">
                            {tier}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#86948a] font-mono block">
                          Escrow Clearance:
                        </span>
                        <span className="text-xs font-bold text-[#4edea3]">
                          {score >= 75 ? "Automated Clearance ✓" : "Standard Escrow Hold"}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#1f2937] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#86948a] leading-relaxed">
                      {score >= 75
                        ? "Account maintains high integrity score. Eligible for reduced escrow deposit pre-authorizations, instant contractor bookings, and high-value fleet rentals."
                        : "Account is operating under standard compliance rules with mandatory pre-authorized escrow deposit security requirements."}
                    </p>
                  </div>
                )
              })()}

              {/* Identity & Account Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0a0e16] p-4 rounded-xl border border-[#1f2937]">
                <div>
                  <span className="text-[10px] font-mono text-[#86948a] block">EMAIL ADDRESS</span>
                  <a
                    href={`mailto:${selectedUser.email}`}
                    className="text-xs font-medium text-[#38bdf8] hover:underline truncate block"
                    title={selectedUser.email}
                  >
                    {selectedUser.email}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#86948a] block">PHONE NUMBER</span>
                  <a
                    href={`tel:${selectedUser.phoneNumber}`}
                    className="text-xs font-mono font-medium text-[#dfe2ee] hover:text-[#4edea3] transition-colors block"
                  >
                    📞 {selectedUser.phoneNumber}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#86948a] block">REGISTERED DATE</span>
                  <p className="text-xs font-mono text-[#dfe2ee]">
                    {new Date(selectedUser.createdAtUtc).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#86948a] block">LAST UPDATED</span>
                  <p className="text-xs font-mono text-[#dfe2ee]">
                    {selectedUser.updatedAtUtc
                      ? new Date(selectedUser.updatedAtUtc).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Never Updated"}
                  </p>
                </div>
              </div>

              {/* KYC Compliance & Government Documents Section */}
              <div className="bg-[#0a0e16] border border-[#1f2937] p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2937]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">
                      badge
                    </span>
                    <h4 className="text-sm font-bold text-[#dfe2ee]">
                      National Identity & KYC Verification Dossier
                    </h4>
                  </div>
                  <div>
                    {selectedUser.isVerified || userKycSubmission?.status === "Approved" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/40">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        APPROVED & VERIFIED
                      </span>
                    ) : userKycSubmission?.status === "Pending" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#f59e0b]/20 text-[#ffb95f] border border-[#f59e0b]/40">
                        <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                        IN REVIEW QUEUE
                      </span>
                    ) : userKycSubmission?.status === "Rejected" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#93000a]/20 text-[#ffb4ab] border border-[#93000a]/40">
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        DECLINED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#1f2937] text-[#86948a] border border-[#374151]">
                        NO SUBMISSION
                      </span>
                    )}
                  </div>
                </div>

                {loadingKyc ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#86948a]">
                    <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono">Retrieving encrypted KYC dossier...</span>
                  </div>
                ) : userKycSubmission ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#141820] p-3 rounded-lg border border-[#1f2937] text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-[#86948a] block">DOCUMENT TYPE</span>
                        <span className="font-bold text-[#dfe2ee]">
                          {userKycSubmission.documentType || "National Identity Card (NIC)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#86948a] block">DOCUMENT NUMBER</span>
                        <span className="font-mono font-bold text-[#4edea3]">
                          {userKycSubmission.documentNumber || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#86948a] block">SUBMISSION DATE</span>
                        <span className="font-mono text-[#dfe2ee]">
                          {new Date(userKycSubmission.submittedAtUtc).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      {userKycSubmission.verifiedAtUtc && (
                        <div>
                          <span className="text-[10px] font-mono text-[#86948a] block">VERIFICATION DATE</span>
                          <span className="font-mono text-[#dfe2ee]">
                            {new Date(userKycSubmission.verifiedAtUtc).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      )}
                      {userKycSubmission.verifiedByAdminId && (
                        <div>
                          <span className="text-[10px] font-mono text-[#86948a] block">VERIFIED BY ADMIN</span>
                          <span className="font-mono text-[#86948a] truncate block" title={userKycSubmission.verifiedByAdminId}>
                            {userKycSubmission.verifiedByAdminId.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                      {userKycSubmission.rejectionReason && (
                        <div className="col-span-2 md:col-span-3 p-2 bg-[#93000a]/20 border border-[#93000a]/30 rounded text-[#ffb4ab]">
                          <span className="font-mono font-bold block text-[10px]">REJECTION REASON:</span>
                          <span>{userKycSubmission.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Document Photographs */}
                    <div>
                      <span className="text-xs font-mono font-bold text-[#bbcabf] block mb-2">
                        DOCUMENT PHOTOGRAPHS & IDENTITY EVIDENCE:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Front Image */}
                        <div className="bg-[#141820] border border-[#1f2937] rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[#86948a]">Front Side (NIC / ID)</span>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(userKycSubmission.frontImageUrl)}
                              className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1 font-mono"
                            >
                              <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                              Enlarge
                            </button>
                          </div>
                          <div
                            onClick={() => setPreviewImage(userKycSubmission.frontImageUrl)}
                            className="h-44 bg-[#0a0e16] rounded-lg border border-[#1f2937] overflow-hidden cursor-pointer group relative flex items-center justify-center"
                          >
                            <img
                              src={userKycSubmission.frontImageUrl}
                              alt="Front Document"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                              Click to inspect
                            </div>
                          </div>
                        </div>

                        {/* Back Image */}
                        <div className="bg-[#141820] border border-[#1f2937] rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[#86948a]">Back Side (Address / Barcode)</span>
                            {userKycSubmission.backImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(userKycSubmission.backImageUrl!)}
                                className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1 font-mono"
                              >
                                <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                                Enlarge
                              </button>
                            ) : null}
                          </div>
                          {userKycSubmission.backImageUrl ? (
                            <div
                              onClick={() => setPreviewImage(userKycSubmission.backImageUrl!)}
                              className="h-44 bg-[#0a0e16] rounded-lg border border-[#1f2937] overflow-hidden cursor-pointer group relative flex items-center justify-center"
                            >
                              <img
                                src={userKycSubmission.backImageUrl}
                                alt="Back Document"
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                                Click to inspect
                              </div>
                            </div>
                          ) : (
                            <div className="h-44 bg-[#0a0e16] rounded-lg border border-[#1f2937] border-dashed flex flex-col items-center justify-center text-[#6b7280] text-xs">
                              <span className="material-symbols-outlined text-[28px] mb-1">image_not_supported</span>
                              <span>No back image provided</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#141820] border border-[#1f2937] rounded-xl flex items-center gap-3 text-[#86948a]">
                    <span className="material-symbols-outlined text-[24px] text-[#f59e0b]">
                      info
                    </span>
                    <div className="text-xs">
                      <span className="font-bold text-[#dfe2ee] block">
                        No Government ID Document Records Found
                      </span>
                      <span>
                        This customer has not completed the identity verification workflow yet. The account is subject to unverified safety escrow parameters.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suspension Reason Audit (if suspended) */}
              {selectedUser.suspensionReason && (
                <div className="p-4 bg-[#93000a]/20 border border-[#93000a]/40 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-[#ffb4ab]">
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span className="font-mono text-xs font-bold uppercase">
                      Active Account Suspension Record
                    </span>
                  </div>
                  <p className="text-xs text-[#dfe2ee] leading-relaxed">
                    {selectedUser.suspensionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-[#1f2937] bg-[#10141c] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewRole(selectedUser.role)
                    setRoleModalOpen(true)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] border border-[#1f2937] flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                  Change Role
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionReason(selectedUser.suspensionReason || "")
                    setStatusModalOpen(true)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                    selectedUser.isActive
                      ? "bg-[#93000a]/20 hover:bg-[#93000a]/40 text-[#ffb4ab] border border-[#93000a]/40"
                      : "bg-[#10b981]/20 hover:bg-[#10b981]/40 text-[#4edea3] border border-[#10b981]/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {selectedUser.isActive ? "block" : "check_circle"}
                  </span>
                  {selectedUser.isActive ? "Suspend Account" : "Reactivate Account"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false)
                  setSelectedUser(null)
                }}
                className="px-5 py-2 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded-xl text-xs font-bold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ENLARGED DOCUMENT LIGHTBOX PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#141820] border border-[#262f3f] rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <img
              src={previewImage}
              alt="Government ID Full Resolution"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
