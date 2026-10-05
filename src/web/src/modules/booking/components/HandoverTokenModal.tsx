import React, { useState, useEffect } from "react"
import { QrCode, ShieldCheck, MapPin, CheckCircle, RefreshCw, Smartphone, KeyRound } from "lucide-react"
import { ActiveBookingSummaryDto, HandoverTokenResponseDto } from "../types/bookingTypes"
import { bookingApi } from "../api/bookingApi"
import { useBookingStore } from "../store/useBookingStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"

interface HandoverTokenModalProps {
  booking: ActiveBookingSummaryDto | null
  open: boolean
  onClose: () => void
}

export const HandoverTokenModal: React.FC<HandoverTokenModalProps> = ({ booking, open, onClose }) => {
  const { verifyHandover, isLoading } = useBookingStore()

  const [eventType, setEventType] = useState<1 | 2>(1)
  const [tokenData, setTokenData] = useState<HandoverTokenResponseDto | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900) // 15 mins
  const [simulateScanMode, setSimulateScanMode] = useState(false)

  // Simulation inputs
  const [latitude, setLatitude] = useState(6.9271)
  const [longitude, setLongitude] = useState(79.8612)
  const city = "Colombo 03"

  useEffect(() => {
    if (booking) {
      // Auto-select Pickup if not verified, else Return
      setEventType(booking.pickupVerified ? 2 : 1)
      setTokenData(null)
      setVerificationSuccess(null)
      setSimulateScanMode(false)
    }
  }, [booking])

  // Timer countdown
  useEffect(() => {
    if (!tokenData) return
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [tokenData])

  if (!booking) return null

  const handleGenerateToken = async () => {
    setIsGenerating(true)
    setVerificationSuccess(null)
    try {
      const data = await bookingApi.generateHandoverToken(booking.id, eventType)
      setTokenData(data)
      setSecondsRemaining(900)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSimulateVerification = async () => {
    if (!tokenData) return
    const result = await verifyHandover(booking.id, tokenData.token, eventType, latitude, longitude)
    if (result && result.isSuccess) {
      setVerificationSuccess(result.message)
      setSimulateScanMode(false)
    }
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-border/80 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5 text-emerald-400" />
            Equipment Handover & Cryptographic QR Verification
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Single-use cryptographic token authentication paired with GPS coordinates upon equipment pickup or return.
          </DialogDescription>
        </DialogHeader>

        {verificationSuccess ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                Handover Successfully Verified!
              </div>
              <p className="text-xs text-emerald-300/80">{verificationSuccess}</p>
            </div>
            <DialogFooter>
              <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Handover Event Type Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEventType(1)
                  setTokenData(null)
                }}
                className={`py-1.5 font-medium rounded-md transition-all ${
                  eventType === 1
                    ? "bg-emerald-600 text-white shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Pickup Handover
              </button>
              <button
                type="button"
                onClick={() => {
                  setEventType(2)
                  setTokenData(null)
                }}
                className={`py-1.5 font-medium rounded-md transition-all ${
                  eventType === 2
                    ? "bg-purple-600 text-white shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Return Handover
              </button>
            </div>

            {tokenData ? (
              <div className="space-y-3">
                {/* QR Code Graphic Box */}
                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-slate-900 shadow-xl border-4 border-emerald-500/30">
                  <div className="relative flex items-center justify-center w-40 h-40 bg-slate-100 rounded-xl border border-slate-300 p-2">
                    {/* Stylized QR Matrix Pattern */}
                    <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-1 p-1 bg-white border border-slate-400">
                      <div className="bg-slate-900 rounded-sm col-span-2 row-span-2" />
                      <div className="bg-slate-200" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-900 rounded-sm col-span-2 row-span-2" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-200" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-200" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-900 rounded-sm col-span-2 row-span-2" />
                      <div className="bg-slate-200" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-200" />
                      <div className="bg-slate-900" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white p-1 rounded-md shadow-md border border-slate-300">
                        <KeyRound className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">
                      Single-Use Security Token
                    </span>
                    <span className="font-mono text-lg font-black tracking-wider text-slate-900">
                      {tokenData.token}
                    </span>
                  </div>
                </div>

                {/* Expiration Timer Banner */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-4 w-4" /> Single-Use Valid Window:
                  </span>
                  <span className="font-mono font-bold">{formatTimer(secondsRemaining)}</span>
                </div>

                {/* Simulated Mobile Scan (Viva Demonstration Feature) */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-emerald-400" />
                      Viva Simulation: Mobile QR Scan & GPS Verification
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300 p-1"
                      onClick={() => setSimulateScanMode(!simulateScanMode)}
                    >
                      {simulateScanMode ? "Hide Details" : "Simulate Scan"}
                    </Button>
                  </div>

                  {simulateScanMode && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Latitude</label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={latitude}
                            onChange={(e) => setLatitude(parseFloat(e.target.value))}
                            className="h-7 text-xs bg-muted/60"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Longitude</label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={longitude}
                            onChange={(e) => setLongitude(parseFloat(e.target.value))}
                            className="h-7 text-xs bg-muted/60"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span>Location: {city}, Sri Lanka</span>
                      </div>

                      <Button
                        onClick={handleSimulateVerification}
                        disabled={isLoading}
                        className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        {isLoading ? "Verifying Token Hash..." : "Confirm & Execute Verification"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="inline-flex p-4 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-emerald-400">
                  <QrCode className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    Ready to generate {eventType === 1 ? "Pickup" : "Return"} token
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Generates a cryptographically secure token hash stored in PostgreSQL with a 15-minute expiration.
                  </p>
                </div>
                <Button
                  onClick={handleGenerateToken}
                  disabled={isGenerating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <QrCode className="h-3.5 w-3.5" />
                  )}
                  Generate Handover QR Token
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
