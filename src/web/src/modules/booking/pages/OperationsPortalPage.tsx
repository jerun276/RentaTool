import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { OperationsPortalShell, DeskTab } from "../components/OperationsPortalShell"
import { OperationsCommandCenterView } from "../components/OperationsCommandCenterView"
import { KycTrustComplianceView } from "@/modules/identity/components/KycTrustComplianceView"
import { FleetWearHubView } from "@/modules/catalog/components/FleetWearHubView"
import { CatalogDashboardPage } from "@/modules/catalog/pages/CatalogDashboardPage"
import { AIDisputeArbitrationView } from "@/modules/escrow/components/AIDisputeArbitrationView"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog"
import { ShieldCheck, Wifi, CheckCircle2, AlertTriangle } from "lucide-react"

export const OperationsPortalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const deskParam = searchParams.get("desk") as DeskTab | null
  const [isIncidentLogOpen, setIsIncidentLogOpen] = useState(false)

  const [activeDesk, setActiveDesk] = useState<DeskTab>(
    deskParam && ["desk01", "desk02", "desk03", "catalog", "desk04"].includes(deskParam)
      ? deskParam
      : "desk01"
  )

  useEffect(() => {
    if (deskParam && ["desk01", "desk02", "desk03", "catalog", "desk04"].includes(deskParam)) {
      setActiveDesk(deskParam)
    }
  }, [deskParam])

  const handleSelectDesk = (desk: DeskTab) => {
    setActiveDesk(desk)
    setSearchParams({ desk })
  }

  return (
    <>
      <OperationsPortalShell
        activeDesk={activeDesk}
        onSelectDesk={handleSelectDesk}
        onIncidentLogClick={() => setIsIncidentLogOpen(true)}
      >
        {activeDesk === "desk01" && (
          <OperationsCommandCenterView
            onNavigateToDesk04={() => handleSelectDesk("desk04")}
            onNavigateToDesk02={() => handleSelectDesk("desk02")}
            onNavigateToDesk03={() => handleSelectDesk("desk03")}
          />
        )}

        {activeDesk === "desk02" && <KycTrustComplianceView />}

        {activeDesk === "desk03" && <FleetWearHubView />}

        {activeDesk === "catalog" && <CatalogDashboardPage />}

        {activeDesk === "desk04" && <AIDisputeArbitrationView />}
      </OperationsPortalShell>

      {/* Incident Log & Telemetry Health Modal */}
      <Dialog open={isIncidentLogOpen} onOpenChange={setIsIncidentLogOpen}>
        <DialogContent className="max-w-md bg-[#181c24] border-[#1f2937] text-[#dfe2ee]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Real-Time Cluster Telemetry</span>
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Operational Incident Log & Fleet Audit
            </DialogTitle>
            <DialogDescription className="text-xs text-[#86948a]">
              Western Province cluster telemetry node link metrics & security monitor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#0f131c] border border-[#1f2937] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-emerald-400" />
                <span>Node Communication</span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Healthy (18ms)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0f131c] border border-[#1f2937] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>CAN-Bus Telemetry Breaches</span>
              </div>
              <span className="text-emerald-400 font-bold">0 Detected</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0f131c] border border-[#1f2937] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Active Geofence Dispatches</span>
              </div>
              <span className="text-white font-bold">42 Anchors Active</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
