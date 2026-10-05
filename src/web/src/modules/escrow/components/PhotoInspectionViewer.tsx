import React, { useState } from "react"
import { ShieldCheck, AlertTriangle, Eye, ZoomIn } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"

interface PhotoInspectionViewerProps {
  damagePhotos: string[]
  baselinePhoto?: string
  damageDescription: string
}

export const PhotoInspectionViewer: React.FC<PhotoInspectionViewerProps> = ({
  damagePhotos,
  baselinePhoto,
  damageDescription,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    damagePhotos[0] || "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80"
  )

  const defaultBaseline =
    baselinePhoto ||
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-emerald-400" />
          Side-by-Side Photographic Verification
        </h3>
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
          Multimodal Evidence Audit
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pre-Rental Baseline Photo */}
        <div className="flex flex-col rounded-xl border border-border/60 bg-card/40 p-3 overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pre-Rental Baseline (Handover)
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">Original State</span>
          </div>
          <div className="relative mt-2.5 aspect-video w-full overflow-hidden rounded-lg bg-black/40 flex items-center justify-center border border-border/40 group">
            <img
              src={defaultBaseline}
              alt="Pre-rental baseline"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono text-emerald-300 backdrop-blur-sm">
              Verified Clean Condition
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Authoritative pre-dispatch timestamp and token inspection photograph.
          </p>
        </div>

        {/* Post-Rental Return Photo */}
        <div className="flex flex-col rounded-xl border border-border/60 bg-card/40 p-3 overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Post-Rental Return (Claim Evidence)
            </span>
            <span className="text-[11px] font-mono text-rose-300/80">Reported Damage</span>
          </div>
          <div className="relative mt-2.5 aspect-video w-full overflow-hidden rounded-lg bg-black/40 flex items-center justify-center border border-rose-500/30 group">
            <img
              src={selectedPhoto}
              alt="Post-rental damage evidence"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-2 left-2 rounded bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono text-rose-300 backdrop-blur-sm flex items-center gap-1">
              <ZoomIn className="h-3 w-3" />
              Damage Identified
            </div>
          </div>
          <p className="mt-2 text-xs text-rose-300/90 font-medium line-clamp-2">
            {damageDescription}
          </p>
        </div>
      </div>

      {/* Thumbnails if multiple photos */}
      {damagePhotos.length > 1 && (
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
          {damagePhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedPhoto(photo)}
              className={`h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border transition-all ${
                selectedPhoto === photo
                  ? "border-rose-500 ring-2 ring-rose-500/20"
                  : "border-border/60 opacity-60 hover:opacity-100"
              }`}
            >
              <img src={photo} alt={`Evidence ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
