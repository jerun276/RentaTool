import React from "react"
import { Calendar, Clock, QrCode, ArrowRightCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { ActiveBookingSummaryDto } from "../types/bookingTypes"
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

interface BookingCardProps {
  booking: ActiveBookingSummaryDto
  onExtend: (booking: ActiveBookingSummaryDto) => void
  onHandover: (booking: ActiveBookingSummaryDto) => void
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onExtend, onHandover }) => {
  const startDate = new Date(booking.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const endDate = new Date(booking.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Days remaining
  const daysRemaining = Math.ceil(
    (new Date(booking.endDate).getTime() - Date.now()) / (1000 * 3600 * 24)
  )

  const getStatusBadge = () => {
    switch (booking.status) {
      case "Active":
        return <Badge variant="rented" className="animate-pulse">Active Rental</Badge>
      case "Confirmed":
        return <Badge variant="available">Confirmed</Badge>
      case "Completed":
        return <Badge variant="outline" className="bg-purple-950/40 text-purple-400 border-purple-800">Completed</Badge>
      case "Disputed":
        return <Badge variant="maintenance">Disputed</Badge>
      default:
        return <Badge variant="outline">{booking.status}</Badge>
    }
  }

  return (
    <Card className="flex flex-col justify-between border-border/70 bg-card/60 backdrop-blur-sm hover:border-emerald-500/40 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase">
              ID: {booking.id.slice(0, 10)}
            </span>
            <h3 className="font-semibold text-base text-foreground mt-0.5">
              Rental Reservation
            </h3>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3 text-sm">
        {/* Date window */}
        <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/40">
          <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span>{startDate}</span>
            <span>&rarr;</span>
            <span className="text-foreground">{endDate}</span>
          </div>
        </div>

        {/* Days left indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Schedule Window
          </span>
          <span className={`font-medium ${daysRemaining < 2 ? "text-amber-400 font-semibold" : "text-emerald-400"}`}>
            {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Due for Return"}
          </span>
        </div>

        {/* Handover verification milestones */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className={`flex items-center gap-1.5 p-1.5 rounded-md text-xs border ${
            booking.pickupVerified
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
              : "bg-muted/40 border-border/40 text-muted-foreground"
          }`}>
            {booking.pickupVerified ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            )}
            <span className="truncate">Pickup {booking.pickupVerified ? "Verified" : "Pending"}</span>
          </div>

          <div className={`flex items-center gap-1.5 p-1.5 rounded-md text-xs border ${
            booking.returnVerified
              ? "bg-purple-950/30 border-purple-500/30 text-purple-400"
              : "bg-muted/40 border-border/40 text-muted-foreground"
          }`}>
            {booking.returnVerified ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
            <span className="truncate">Return {booking.returnVerified ? "Verified" : "Pending"}</span>
          </div>
        </div>

        {/* Financial summary */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Total Rental Fee</span>
          <span className="font-bold text-foreground text-sm font-mono">
            LKR {booking.totalRentalFee.toLocaleString()}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex gap-2 border-t border-border/40 bg-muted/20">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs hover:border-emerald-500/40"
          onClick={() => onHandover(booking)}
        >
          <QrCode className="h-3.5 w-3.5 text-emerald-400" />
          Handover QR
        </Button>

        {booking.status !== "Completed" && booking.status !== "Cancelled" && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={() => onExtend(booking)}
          >
            <ArrowRightCircle className="h-3.5 w-3.5" />
            Extend Schedule
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
