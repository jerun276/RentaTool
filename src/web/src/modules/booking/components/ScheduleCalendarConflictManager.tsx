import React, { useState } from "react"
import { Calendar, AlertCircle, CheckCircle, Clock, Zap, ShieldAlert, Sparkles, Filter } from "lucide-react"
import { MOCK_SCHEDULES } from "../api/bookingApi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"

export const ScheduleCalendarConflictManager: React.FC = () => {
  const today = new Date()
  const [selectedEquipment, setSelectedEquipment] = useState("eq-001")
  const [testStartDate, setTestStartDate] = useState(today.toISOString().split("T")[0])
  const [testEndDate, setTestEndDate] = useState(
    new Date(today.getTime() + 86400000 * 3).toISOString().split("T")[0]
  )
  const [conflictResult, setConflictResult] = useState<{
    hasConflict: boolean
    message: string
    collidingSchedule?: any
  } | null>(null)

  // Equipment list
  const equipmentOptions = [
    { id: "eq-001", name: "Karcher HD 5/15 C High Pressure Washer", dailyRate: 3500 },
    { id: "eq-002", name: "Bosch Professional Rotary Hammer Drill", dailyRate: 2500 },
    { id: "eq-003", name: "Honda Silent Portable Petrol Generator", dailyRate: 5000 },
  ]

  const currentTool = equipmentOptions.find((e) => e.id === selectedEquipment) || equipmentOptions[0]

  // Filter schedules for the selected equipment
  const equipmentSchedules = MOCK_SCHEDULES.filter((s) => s.equipmentId === selectedEquipment)

  // Timeline days for the upcoming 10 days
  const timelineDays = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today.getTime() + 86400000 * (i - 1))
    return {
      date: d,
      dateStr: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6 || d.getDay() === 5,
    }
  })

  // Conflict detection simulator
  const handleCheckConflict = () => {
    const start = new Date(testStartDate).getTime()
    const end = new Date(testEndDate).getTime()

    if (end < start) {
      setConflictResult({
        hasConflict: true,
        message: "End date must be strictly after start date.",
      })
      return
    }

    const collision = equipmentSchedules.find((s) => {
      const bStart = new Date(s.blockedStartDate).getTime()
      const bEnd = new Date(s.blockedEndDate).getTime()
      return bStart <= end && bEnd >= start
    })

    if (collision) {
      setConflictResult({
        hasConflict: true,
        message: `Direct Conflict Detected! Overlaps with existing schedule '${collision.reason}' (${new Date(
          collision.blockedStartDate
        ).toLocaleDateString()} - ${new Date(collision.blockedEndDate).toLocaleDateString()}).`,
        collidingSchedule: collision,
      })
    } else {
      setConflictResult({
        hasConflict: false,
        message: `Date range available! No schedule conflict exists for ${currentTool.name}.`,
      })
    }
  }

  // Dynamic surge calculation
  const testDays = Math.max(
    1,
    Math.ceil((new Date(testEndDate).getTime() - new Date(testStartDate).getTime()) / (1000 * 3600 * 24))
  )
  const includesWeekend = timelineDays.some(
    (td) => td.dateStr >= testStartDate && td.dateStr <= testEndDate && td.isWeekend
  )
  const surgeMultiplier = includesWeekend ? 1.25 : 1.1
  const surgeDailyRate = currentTool.dailyRate * surgeMultiplier
  const estimatedTotal = surgeDailyRate * testDays

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-background to-background border border-emerald-500/30">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Component 3 Business-Specific Operation
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Schedule Calendar Conflict Manager & Surge Pricing Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Monitors equipment calendar blocks, prevents double-booking overlaps in real time, and dynamically computes
            surge pricing adjustments for peak periods and last-minute extensions.
          </p>
        </div>

        {/* Equipment Selector */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-400 shrink-0" />
          <select
            value={selectedEquipment}
            onChange={(e) => {
              setSelectedEquipment(e.target.value)
              setConflictResult(null)
            }}
            className="h-10 rounded-lg border border-border/80 bg-muted/60 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {equipmentOptions.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-background">
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Timeline Matrix */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            10-Day Equipment Availability & Reservation Timeline
          </CardTitle>
          <CardDescription className="text-xs">
            Live schedule blocks for <span className="text-foreground font-medium">{currentTool.name}</span>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Days Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {timelineDays.map((td) => {
              const isBlocked = equipmentSchedules.some((s) => {
                const bStart = s.blockedStartDate.split("T")[0]
                const bEnd = s.blockedEndDate.split("T")[0]
                return td.dateStr >= bStart && td.dateStr <= bEnd
              })

              return (
                <div
                  key={td.dateStr}
                  className={`flex flex-col items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                    isBlocked
                      ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                      : td.isWeekend
                      ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                      : "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">
                    {td.dayName}
                  </span>
                  <span className="text-base font-bold my-1">{td.dayNum}</span>
                  <Badge
                    variant={isBlocked ? "destructive" : "outline"}
                    className={`text-[9px] py-0 px-1 font-mono ${
                      isBlocked
                        ? "bg-rose-600 text-white"
                        : td.isWeekend
                        ? "text-amber-400 border-amber-500/40"
                        : "text-emerald-400 border-emerald-500/40"
                    }`}
                  >
                    {isBlocked ? "Reserved" : td.isWeekend ? "Surge" : "Free"}
                  </Badge>
                </div>
              )
            })}
          </div>

          {/* Timeline Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500/30 border border-emerald-500" />
              <span>Available Window</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500/30 border border-rose-500" />
              <span>Blocked / Confirmed Reservation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500/30 border border-amber-500" />
              <span>High Weekend Demand Window (+25% Surge)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Conflict Detector & Surge Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conflict Detector Simulator */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
              Interactive Schedule Conflict Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Test reservation or extension dates to evaluate schedule conflict locks.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
                <Input
                  type="date"
                  value={testStartDate}
                  onChange={(e) => setTestStartDate(e.target.value)}
                  className="bg-muted/40 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">End Date</label>
                <Input
                  type="date"
                  value={testEndDate}
                  onChange={(e) => setTestEndDate(e.target.value)}
                  className="bg-muted/40 text-xs"
                />
              </div>
            </div>

            <Button
              onClick={handleCheckConflict}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Verify Schedule Conflicts
            </Button>

            {conflictResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  conflictResult.hasConflict
                    ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                }`}
              >
                {conflictResult.hasConflict ? (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">
                    {conflictResult.hasConflict ? "Schedule Collision Triggered" : "Schedule Available"}
                  </span>
                  <p className="mt-0.5 text-muted-foreground">{conflictResult.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Surge Pricing Calculator */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Dynamic Surge Pricing Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Live algorithmic calculation based on test dates and demand factors.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Daily Rate:</span>
                <span className="font-mono text-foreground font-medium">LKR {currentTool.dailyRate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="text-foreground font-medium">{testDays} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Demand Classification:</span>
                <span className="text-amber-400 font-semibold">
                  {includesWeekend ? "High Weekend Demand (+25%)" : "Standard Weekday (+10%)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Effective Surge Daily Rate:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  LKR {surgeDailyRate.toLocaleString()} / day
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/40 text-sm font-bold">
                <span className="text-foreground">Total Estimated Rental Fee:</span>
                <span className="text-emerald-400 font-mono">LKR {estimatedTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Surge multipliers protect owners against weekend equipment scarcity and rush turnarounds.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
