import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore, type UserRole } from "@/shared/store/useAuthStore"
import { apiErrorMessage, identityApi } from "../api/identityApi"

const DEMO_ACCOUNTS = [
  {
    role: "Admin" as UserRole,
    title: "Super Admin",
    email: "admin@rentatool.lk",
    pass: "Admin@123",
    badge: "DESK 01-04 ALL ACCESS",
    badgeClass: "bg-[#10b981]/20 text-[#4edea3] border-[#10b981]/30",
  },
  {
    role: "Owner" as UserRole,
    title: "Fleet Owner",
    email: "owner@rentatool.lk",
    pass: "Owner@123",
    badge: "FLEET & WEAR HUB",
    badgeClass: "bg-[#8b5cf6]/20 text-[#d0bcff] border-[#8b5cf6]/30",
  },
  {
    role: "Renter" as UserRole,
    title: "Machinery Renter",
    email: "renter@rentatool.lk",
    pass: "Renter@123",
    badge: "ESCROW & BOOKINGS",
    badgeClass: "bg-[#38bdf8]/20 text-[#7dd3fc] border-[#38bdf8]/30",
  },
]

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Quick fill demo user
  const handleQuickFill = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email)
    setPassword(acc.pass)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email address and password.")
      return
    }

    setLoading(true)
    try {
      const response = await identityApi.login({
        email: email.trim(),
        password,
      })

      const data = response.data
      setAuth(data.accessToken, {
        id: data.userId,
        name: data.name,
        email: email.trim(),
        role: data.role as UserRole,
        trustScore: 92,
      })

      setSuccessMessage(`Authenticated as ${data.name} (${data.role}). Access granted.`)

      // Redirect after brief visual feedback
      setTimeout(() => {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/operations"
        navigate(from, { replace: true })
      }, 400)
    } catch (err: unknown) {
      setErrorMessage(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] font-sans flex flex-col justify-between selection:bg-[#10b981]/20 selection:text-[#4edea3] relative overflow-hidden">
      {/* Background Cyber-Industrial Grid Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#10b981]/10 via-[#0f131c]/80 to-[#0a0e16] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top Telemetry Header */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-[#1f2937]/80 bg-[#181c24]/50 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981]/30 to-[#00422b]/50 border border-[#10b981]/40 flex items-center justify-center text-[#4edea3] shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]">hardware</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] text-[#dfe2ee] tracking-tight leading-tight">
              RentaTool <span className="text-[#4edea3]">LK</span>
            </span>
            <span className="text-[9px] text-[#86948a] font-mono tracking-widest uppercase font-semibold">
              Heavy Equipment P2P Protocol
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-xs font-mono text-[#86948a]">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#1c2028] border border-[#1f2937]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span className="text-[#bbcabf]">NODE: COLOMBO-01</span>
            <span className="text-[#4edea3]">[18ms]</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c2028] border border-[#1f2937]">
            <span className="material-symbols-outlined text-[14px] text-[#10b981]">lock</span>
            <span className="text-[#bbcabf]">TLS 1.3 / AES-256</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-[#181c24] border border-[#1f2937] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Card Header Strip */}
            <div className="bg-[#141820] px-6 py-4 border-b border-[#1f2937] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#4edea3]">passkey</span>
                <span className="font-mono text-xs text-[#bbcabf] uppercase tracking-wider font-semibold">
                  Secure Access Terminal
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30">
                ACTIVE
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-xl font-bold text-[#dfe2ee] tracking-tight">
                  Admin Operations Sign In
                </h1>
                <p className="text-xs text-[#86948a] mt-1">
                  Authenticate with authorized operator credentials to access operational desks.
                </p>
              </div>

              {/* One-Click Quick-Fill Demo Buttons */}
              <div className="p-3 bg-[#0f131c] rounded-lg border border-[#1f2937] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#86948a] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-[#f59e0b]">bolt</span>
                    1-Click Staff Logins:
                  </span>
                  <span className="text-[9px] font-mono text-[#86948a]">Select credential</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left transition-all hover:scale-[1.02] flex flex-col gap-0.5 ${
                        email === acc.email
                          ? "bg-[#262a33] border-[#10b981] text-[#4edea3] shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                          : "bg-[#181c24] border-[#1f2937] text-[#bbcabf] hover:border-[#374151]"
                      }`}
                    >
                      <span className="font-semibold text-[11px] leading-tight truncate">{acc.title}</span>
                      <span className="text-[9px] font-mono opacity-80">{acc.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[#93000a]/25 border border-[#93000a]/50 text-[#ffb4ab] text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#ffb4ab] shrink-0 mt-0.5">
                    error
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-[11px] uppercase tracking-wider font-mono">
                      Authentication Failed
                    </div>
                    <div className="mt-0.5 text-[#ffdad6]">{errorMessage}</div>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {successMessage && (
                <div
                  role="status"
                  className="p-3 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 text-[#4edea3] text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#4edea3] shrink-0">
                    check_circle
                  </span>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#bbcabf] mb-1.5 tracking-wider">
                    Operator Email <span className="text-[#10b981]">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#86948a] text-[18px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@rentatool.lk"
                      className="w-full h-10 pl-10 pr-3 bg-[#0f131c] border border-[#1f2937] rounded-lg text-sm text-[#dfe2ee] placeholder:text-[#6b7280] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/50 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono uppercase text-[#bbcabf] tracking-wider">
                      Password <span className="text-[#10b981]">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#86948a] hover:text-[#4edea3] cursor-pointer transition-colors">
                      Need reset?
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#86948a] text-[18px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-10 pl-10 pr-10 bg-[#0f131c] border border-[#1f2937] rounded-lg text-sm text-[#dfe2ee] placeholder:text-[#6b7280] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/50 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-[#86948a] hover:text-[#dfe2ee] transition-colors p-0.5"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me & Session Security */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#bbcabf]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#1f2937] bg-[#0f131c] text-[#10b981] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[11px] font-mono">Keep session active</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#86948a]">JWT Bearer Auth</span>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 rounded-lg bg-[#10b981] text-[#003824] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#4edea3] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Sign In to Portal</span>
                    </>
                  )}
                </button>
              </form>

              {/* Authorized Personnel Notice (Replaced Register) */}
              <div className="pt-4 border-t border-[#1f2937] text-center space-y-1">
                <p className="text-[11px] font-mono text-[#bbcabf] flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#e29100]">shield</span>
                  <span>Restricted Access: Authorized Admin Personnel Only</span>
                </p>
                <p className="text-[10px] text-[#6b7280]">
                  Public accounts are registered via mobile. Web portal is restricted to authorized operators.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Telemetry Footer Info */}
          <div className="mt-6 text-center space-y-1 text-[11px] font-mono text-[#86948a]">
            <div>Sri Lanka Heavy Machinery & Power Tool P2P Rental System</div>
            <div className="text-[10px] text-[#6b7280]">
              Secured by cryptographic token validation & multi-party escrow contracts.
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-[#1f2937]/80 bg-[#181c24]/30 backdrop-blur-sm text-center text-[10px] font-mono text-[#86948a]">
        © 2026 RentaTool LK · All rights reserved · Colombo Infrastructure Node
      </footer>
    </div>
  )
}
