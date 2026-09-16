import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { OperationsPortalShell, DeskTab } from "../components/OperationsPortalShell"
import { OperationsCommandCenterView } from "../components/OperationsCommandCenterView"
import { KycTrustComplianceView } from "@/modules/identity/components/KycTrustComplianceView"
import { FleetWearHubView } from "@/modules/catalog/components/FleetWearHubView"
import { AIDisputeArbitrationView } from "@/modules/escrow/components/AIDisputeArbitrationView"

export const OperationsPortalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const deskParam = searchParams.get("desk") as DeskTab | null

  const [activeDesk, setActiveDesk] = useState<DeskTab>(
    deskParam && ["desk01", "desk02", "desk03", "desk04"].includes(deskParam)
      ? deskParam
      : "desk01"
  )

  useEffect(() => {
    if (deskParam && ["desk01", "desk02", "desk03", "desk04"].includes(deskParam)) {
      setActiveDesk(deskParam)
    }
  }, [deskParam])

  const handleSelectDesk = (desk: DeskTab) => {
    setActiveDesk(desk)
    setSearchParams({ desk })
  }

  return (
    <OperationsPortalShell
      activeDesk={activeDesk}
      onSelectDesk={handleSelectDesk}
      onIncidentLogClick={() => alert("Incident Log: All telemetry links healthy. 0 cluster breaches.")}
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

      {activeDesk === "desk04" && <AIDisputeArbitrationView />}
    </OperationsPortalShell>
  )
}
