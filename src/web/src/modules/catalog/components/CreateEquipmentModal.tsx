import React, { useState } from "react"
import { PlusCircle, Wrench, DollarSign, MapPin, Image as ImageIcon } from "lucide-react"
import { CategoryDto, EquipmentDto } from "../types/catalogTypes"
import { catalogApi } from "../api/catalogApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"

interface CreateEquipmentModalProps {
  isOpen: boolean
  categories: CategoryDto[]
  onClose: () => void
  onSuccess: (equipment: EquipmentDto) => void
}

export const CreateEquipmentModal: React.FC<CreateEquipmentModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "")
  const [dailyRate, setDailyRate] = useState<number>(3500)
  const [replacementValue, setReplacementValue] = useState<number>(65000)
  const [location, setLocation] = useState("Colombo")
  const [generalImageUrl, setGeneralImageUrl] = useState("https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80")
  const [casingImageUrl, setCasingImageUrl] = useState("https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Please provide an equipment title")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const photos = []
      if (generalImageUrl) photos.push({ angle: "General", photoUrl: generalImageUrl })
      if (casingImageUrl) photos.push({ angle: "Casing", photoUrl: casingImageUrl })

      const newEquipment = await catalogApi.createEquipment({
        title,
        description,
        categoryId: categoryId || categories[0]?.id || "cat-1111",
        dailyRate: Number(dailyRate),
        replacementValue: Number(replacementValue),
        location,
        imageUrls: photos,
      })

      onSuccess(newEquipment)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to list equipment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-400" />
            <DialogTitle className="text-lg font-bold text-foreground">
              List New Machinery & Equipment
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Onboard heavy machinery or power tools with verified baseline inspection photographs.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-destructive/15 border border-destructive/30 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Equipment Title & Model *
            </label>
            <Input
              placeholder="e.g. Caterpillar 301.5 Mini Excavator / Makita DHR242"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/50 px-3 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                Yard / Depot Location *
              </label>
              <Input
                placeholder="e.g. Colombo 03, Kandy, Galle"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-400" />
                Daily Rental Rate (LKR) *
              </label>
              <Input
                type="number"
                min={500}
                value={dailyRate}
                onChange={(e) => setDailyRate(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                <Wrench className="h-3 w-3 text-muted-foreground" />
                Replacement Value / Deposit (LKR) *
              </label>
              <Input
                type="number"
                min={5000}
                value={replacementValue}
                onChange={(e) => setReplacementValue(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Description & Specifications
            </label>
            <Textarea
              placeholder="Include operating voltage, power rating, weight, and safety precautions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
              Multi-Angle Baseline Photos
            </h4>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-0.5">Primary / General Photo URL</label>
              <Input
                placeholder="https://..."
                value={generalImageUrl}
                onChange={(e) => setGeneralImageUrl(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-0.5">Casing Angle Photo URL</label>
              <Input
                placeholder="https://..."
                value={casingImageUrl}
                onChange={(e) => setCasingImageUrl(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {submitting ? "Publishing Listing..." : "Publish Tool Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
