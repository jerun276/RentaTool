import React, { useState, useEffect } from "react"
import { Plus, RefreshCw, Calendar, QrCode, Search, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react"
import { useBookingStore } from "../store/useBookingStore"
import { ActiveBookingSummaryDto } from "../types/bookingTypes"
import { BookingCard } from "../components/BookingCard"
import { ExtendScheduleModal } from "../components/ExtendScheduleModal"
import { HandoverTokenModal } from "../components/HandoverTokenModal"
import { CreateBookingModal } from "../components/CreateBookingModal"
import { ScheduleCalendarConflictManager } from "../components/ScheduleCalendarConflictManager"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs"

export const BookingDashboardPage: React.FC = () => {
  const { bookings, isLoading, fetchBookings, activeTab, setActiveTab } = useBookingStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedForExtend, setSelectedForExtend] = useState<ActiveBookingSummaryDto | null>(null)
  const [selectedForHandover, setSelectedForHandover] = useState<ActiveBookingSummaryDto | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // KPI Calculations
  const totalActive = bookings.filter((b) => b.status === "Active" || b.status === "Confirmed").length
  const verifiedHandovers = bookings.filter((b) => b.pickupVerified || b.returnVerified).length
  const totalRentalVolume = bookings.reduce((sum, b) => sum + b.totalRentalFee, 0)

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.equipmentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="container px-4 sm:px-8 py-8 space-y-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Calendar className="h-3.5 w-3.5" />
              Component 3: Booking Engine & Handover Verification
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Rental Tracking & Schedule Conflict Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live peer-to-peer equipment rental tracking, cryptographic QR handovers, and dynamic schedule conflict prevention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBookings()}
              disabled={isLoading}
              className="gap-1.5 border-border/80 hover:border-emerald-500/40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-900/30"
            >
              <Plus className="h-4 w-4" />
              Book Equipment
            </Button>
          </div>
        </div>

        {/* Operational KPI Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Active Reservations
            </span>
            <div className="text-2xl font-black text-foreground font-mono">{totalActive}</div>
            <span className="text-[11px] text-emerald-400 font-medium">Currently in Progress</span>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-purple-400" /> Handover Verifications
            </span>
            <div className="text-2xl font-black text-foreground font-mono">{verifiedHandovers}</div>
            <span className="text-[11px] text-purple-400 font-medium">Verified via Cryptographic QR</span>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Conflict Protection
            </span>
            <div className="text-2xl font-black text-foreground font-mono">100%</div>
            <span className="text-[11px] text-blue-400 font-medium">Zero Overlap Guarantee</span>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> Total Rental Volume
            </span>
            <div className="text-2xl font-black text-foreground font-mono">
              LKR {totalRentalVolume.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-400 font-medium">Escrow Protected</span>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-border/60 rounded-xl">
            <TabsTrigger value="tracker" className="text-xs gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:text-emerald-400 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              Real-Time Rental Tracker ({filteredBookings.length})
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="text-xs gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              Schedule Calendar Conflict Manager
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Real-Time Rental Tracker */}
          <TabsContent value="tracker" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by Booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/40 text-xs border-border/60"
                />
              </div>

              {/* Status Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {["ALL", "Active", "Confirmed", "Completed", "Disputed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === st
                        ? "bg-emerald-600 text-white font-semibold shadow-sm"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Grid */}
            {filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onExtend={(booking) => setSelectedForExtend(booking)}
                    onHandover={(booking) => setSelectedForHandover(booking)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 p-8 rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-3">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-base text-foreground">No rentals matching criteria</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search terms or book new equipment using the button above.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Create First Booking
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Schedule Conflict Manager */}
          <TabsContent value="conflicts">
            <ScheduleCalendarConflictManager />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <CreateBookingModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <ExtendScheduleModal
          booking={selectedForExtend}
          open={Boolean(selectedForExtend)}
          onClose={() => setSelectedForExtend(null)}
        />
        <HandoverTokenModal
          booking={selectedForHandover}
          open={Boolean(selectedForHandover)}
          onClose={() => setSelectedForHandover(null)}
        />
      </div>
    </div>
  )
}
