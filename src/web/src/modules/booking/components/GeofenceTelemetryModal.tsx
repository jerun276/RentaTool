import React, { useState } from "react"

interface GeofenceTelemetryModalProps {
  isOpen: boolean
  onClose: () => void
  unitId?: string
  unitName?: string
}

export const GeofenceTelemetryModal: React.FC<GeofenceTelemetryModalProps> = ({
  isOpen,
  onClose,
  unitId = "#EX-409",
  unitName = "Komatsu PC200 Heavy Excavator",
}) => {
  const [isLocked, setIsLocked] = useState(false)
  const [isPinging, setIsPinging] = useState(false)
  const [pingSuccess, setPingSuccess] = useState(false)

  if (!isOpen) return null

  const handlePing = () => {
    setIsPinging(true)
    setTimeout(() => {
      setIsPinging(false)
      setPingSuccess(true)
      setTimeout(() => setPingSuccess(false), 2500)
    }, 800)
  }

  const handleToggleLock = () => {
    setIsLocked((prev) => !prev)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0f131c] border border-[#10b981]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white mx-auto my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0a0e16]/95 border-b border-[#10b981]/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#4edea3]">
              <span className="material-symbols-outlined text-[22px]">location_searching</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-[#dfe2ee]">
                  Western Province GPS Geofence & Engine Telemetry Inspector
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#4edea3] text-[10px] font-mono font-semibold border border-[#10b981]/30">
                  LIVE RTK STREAM
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#bbcabf] mt-0.5 font-mono">
                <span>Unit: <strong className="text-white">{unitName} ({unitId})</strong></span>
                <span>•</span>
                <span>Depot: Colombo Port City Reclamation Hub</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1c2028] hover:bg-[#262a33] text-[#bbcabf] hover:text-white flex items-center justify-center transition-colors border border-[#1f2937]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Status Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#181c24] rounded-lg border border-[#1f2937]">
              <div className="text-[10px] font-mono text-[#86948a] uppercase">RTK Accuracy</div>
              <div className="text-[18px] font-bold font-mono text-[#4edea3] mt-0.5">±1.8 cm</div>
              <div className="text-[11px] text-[#bbcabf]">Dual-band L1/L5</div>
            </div>

            <div className="p-3 bg-[#181c24] rounded-lg border border-[#1f2937]">
              <div className="text-[10px] font-mono text-[#86948a] uppercase">Geofence Status</div>
              <div className="text-[18px] font-bold font-mono text-[#4edea3] mt-0.5">IN BOUNDS</div>
              <div className="text-[11px] text-[#bbcabf]">Buffer radius 5.2 km</div>
            </div>

            <div className="p-3 bg-[#181c24] rounded-lg border border-[#1f2937]">
              <div className="text-[10px] font-mono text-[#86948a] uppercase">CAN-Bus Sync</div>
              <div className="text-[18px] font-bold font-mono text-[#d0bcff] mt-0.5">100 Hz</div>
              <div className="text-[11px] text-[#bbcabf]">J1939 Protocol Active</div>
            </div>

            <div className="p-3 bg-[#181c24] rounded-lg border border-[#1f2937]">
              <div className="text-[10px] font-mono text-[#86948a] uppercase">Ignition Interlock</div>
              <div className={`text-[18px] font-bold font-mono mt-0.5 ${isLocked ? "text-[#ffb4ab]" : "text-[#4edea3]"}`}>
                {isLocked ? "DISABLED (LOCKED)" : "ENABLED (ONLINE)"}
              </div>
              <div className="text-[11px] text-[#bbcabf]">{isLocked ? "CAN Lock Active" : "Remote Relay Ready"}</div>
            </div>
          </div>

          {/* Radar Satellite Map & CAN-Bus Gauges Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Interactive Radar Map Representation */}
            <div className="lg:col-span-7 bg-[#181c24] p-4 rounded-xl border border-[#1f2937] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-[20px]">radar</span>
                  <span className="text-[14px] font-bold text-[#dfe2ee]">
                    Geofence Polygon & RTK Vector Stream
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#4edea3]">
                  GPS: 6.9271° N, 79.8612° E
                </span>
              </div>

              {/* Simulated Map Radar Visualizer */}
              <div className="relative w-full h-64 bg-[#0a0e16] rounded-lg border border-[#1f2937] overflow-hidden flex items-center justify-center">
                {/* Radar Grid Circles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-56 h-56 rounded-full border border-[#4edea3]" />
                  <div className="w-40 h-40 rounded-full border border-[#4edea3]" />
                  <div className="w-24 h-24 rounded-full border border-[#4edea3]" />
                  <div className="w-full h-px bg-[#4edea3]" />
                  <div className="h-full w-px bg-[#4edea3]" />
                </div>

                {/* Sweeping radar scanner */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-transparent via-[#10b981]/10 to-transparent animate-spin duration-700" />
                </div>

                {/* Unit Anchor Marker */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-[#003824] shadow-[0_0_15px_#10b981] animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">precision_manufacturing</span>
                  </div>
                  <div className="mt-1 px-2 py-0.5 bg-[#0f131c]/90 rounded border border-[#10b981]/40 text-[10px] font-mono text-[#4edea3] font-semibold">
                    {unitId} • 0 km/h (Stationary)
                  </div>
                </div>

                {/* Standby Unit Marker */}
                <div className="absolute top-10 right-14 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white shadow-[0_0_10px_#8b5cf6]">
                    <span className="material-symbols-outlined text-[10px]">local_shipping</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#d0bcff] bg-[#0a0e16]/80 px-1 rounded mt-0.5">
                    Standby #EX-512 (Kelaniya 14km)
                  </span>
                </div>

                {/* Geofence Perimeter Tag */}
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-[#0a0e16]/90 backdrop-blur-md rounded border border-[#1f2937] text-[10px] font-mono text-[#bbcabf]">
                  Geofence Polygon: <span className="text-[#4edea3]">WP-PORTCITY-TIER1</span> (Active)
                </div>
              </div>

              {/* Coordinates List */}
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-[#bbcabf] bg-[#0a0e16] p-2.5 rounded border border-[#1f2937]">
                <div>Latitude: <strong className="text-white">6.9271° N</strong></div>
                <div>Longitude: <strong className="text-white">79.8612° E</strong></div>
                <div>Altitude: <strong className="text-white">+8.4m MSL</strong></div>
              </div>
            </div>

            {/* Right 5 Cols: CAN-Bus Engine Diagnostics */}
            <div className="lg:col-span-5 bg-[#181c24] p-4 rounded-xl border border-[#1f2937] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#dfe2ee] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">speed</span>
                  CAN-Bus Diagnostics
                </span>
                <span className="text-[10px] font-mono text-[#4edea3] bg-[#10b981]/15 px-2 py-0.5 rounded">
                  J1939 HEALTHY
                </span>
              </div>

              {/* Gauges */}
              <div className="space-y-3 font-mono text-[12px]">
                {/* Main Hydraulic Pressure */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[#bbcabf]">
                    <span>Hydraulic Pressure</span>
                    <span className="text-[#4edea3] font-bold">320 bar / 350 max</span>
                  </div>
                  <div className="w-full h-2 bg-[#0a0e16] rounded-full overflow-hidden border border-[#1f2937]">
                    <div className="h-full bg-[#10b981] rounded-full" style={{ width: "91%" }} />
                  </div>
                </div>

                {/* Engine Coolant Temp */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[#bbcabf]">
                    <span>Coolant Temperature</span>
                    <span className="text-[#4edea3] font-bold">88°C (Optimum)</span>
                  </div>
                  <div className="w-full h-2 bg-[#0a0e16] rounded-full overflow-hidden border border-[#1f2937]">
                    <div className="h-full bg-[#10b981] rounded-full" style={{ width: "68%" }} />
                  </div>
                </div>

                {/* Fuel Rate */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[#bbcabf]">
                    <span>Fuel Burn Rate</span>
                    <span className="text-[#ffb95f] font-bold">14.2 L/hr</span>
                  </div>
                  <div className="w-full h-2 bg-[#0a0e16] rounded-full overflow-hidden border border-[#1f2937]">
                    <div className="h-full bg-[#ffb95f] rounded-full" style={{ width: "55%" }} />
                  </div>
                </div>

                {/* Vibration Telemetry */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[#bbcabf]">
                    <span>Chassis Vibration</span>
                    <span className="text-[#4edea3] font-bold">1.2 mm/s (Safe &lt; 2.5)</span>
                  </div>
                  <div className="w-full h-2 bg-[#0a0e16] rounded-full overflow-hidden border border-[#1f2937]">
                    <div className="h-full bg-[#4edea3] rounded-full" style={{ width: "48%" }} />
                  </div>
                </div>
              </div>

              {/* Total Hours */}
              <div className="p-3 bg-[#0a0e16] rounded border border-[#1f2937] flex items-center justify-between">
                <span className="text-[12px] text-[#bbcabf]">Lifetime Engine Hours</span>
                <span className="font-mono text-[16px] text-white font-bold">1,842.4 hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#0a0e16]/95 border-t border-[#1f2937] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="h-8 px-3 rounded bg-[#1c2028] hover:bg-[#262a33] text-[#dfe2ee] font-semibold text-[12px] flex items-center gap-1.5 transition-colors border border-[#1f2937]"
            >
              <span className={`material-symbols-outlined text-[16px] ${isPinging ? "animate-spin text-[#4edea3]" : "text-[#4edea3]"}`}>
                sync
              </span>
              <span>{isPinging ? "Pinging RTK..." : "Ping Remote Unit"}</span>
            </button>
            {pingSuccess && (
              <span className="text-[11px] font-mono text-[#4edea3] animate-in fade-in">
                ✓ Ack received in 18ms
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleLock}
              className={`h-8 px-4 rounded font-bold text-[12px] flex items-center gap-1.5 transition-all shadow-md ${
                isLocked
                  ? "bg-[#10b981] text-[#003824] hover:bg-[#4edea3]"
                  : "bg-[#93000a]/30 hover:bg-[#93000a]/50 text-[#ffb4ab] border border-[#ffb4ab]/30"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isLocked ? "lock_open" : "lock"}
              </span>
              <span>{isLocked ? "Unlock Remote Ignition" : "Remote Ignition Lockout"}</span>
            </button>

            <button
              onClick={onClose}
              className="h-8 px-4 rounded bg-[#1c2028] hover:bg-[#262a33] text-white font-medium text-[12px] transition-colors border border-[#1f2937]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
