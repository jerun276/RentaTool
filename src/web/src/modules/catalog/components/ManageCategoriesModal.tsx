import React, { useState } from "react"
import { Layers, Plus, Trash2, CheckCircle2, AlertCircle, X, FolderPlus, Tag } from "lucide-react"
import { CategoryDto, CategorySpecFieldDto } from "../types/catalogTypes"
import { catalogApi } from "../api/catalogApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"

interface ManageCategoriesModalProps {
  isOpen: boolean
  categories: CategoryDto[]
  onClose: () => void
  onCategoriesUpdated: () => void
}

interface DraftField {
  label: string
  key: string
  unit: string
  fieldType: "text" | "number" | "select"
  isRequired: boolean
  options: string
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  categories,
  onClose,
  onCategoriesUpdated,
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [draftFields, setDraftFields] = useState<DraftField[]>([
    { label: "Engine Power", key: "enginePower", unit: "HP / kW", fieldType: "text", isRequired: true, options: "" },
    { label: "Operating Weight", key: "operatingWeight", unit: "kg", fieldType: "number", isRequired: true, options: "" },
  ])

  const handleAddField = () => {
    setDraftFields((prev) => [
      ...prev,
      { label: "", key: "", unit: "", fieldType: "text", isRequired: false, options: "" },
    ])
  }

  const handleRemoveField = (idx: number) => {
    setDraftFields((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateField = (idx: number, patch: Partial<DraftField>) => {
    setDraftFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    )
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Please provide a category name")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const schema: CategorySpecFieldDto[] = draftFields
        .filter((d) => d.label.trim().length > 0)
        .map((d) => {
          let key = d.key.trim()
          if (!key) {
            key = d.label
              .trim()
              .replace(/[^a-zA-Z0-9\s]/g, "")
              .split(/\s+/)
              .map((w, idx) => (idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
              .join("")
          }

          const options = d.options
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)

          return {
            key: key || `field_${Date.now()}`,
            label: d.label.trim(),
            unit: d.unit.trim(),
            fieldType: d.fieldType,
            isRequired: d.isRequired,
            options,
          }
        })

      await catalogApi.createCategory({
        name: name.trim(),
        description: description.trim(),
        iconUrl: iconUrl.trim(),
        specificationSchema: schema,
      })

      setSuccessMsg(`Category "${name}" created with ${schema.length} dynamic specification fields!`)
      setName("")
      setDescription("")
      setIconUrl("")
      setIsCreating(false)
      onCategoriesUpdated()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create category")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#181c24] border-[#1f2937] text-[#dfe2ee]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Machinery Categories & Dynamic Specifications
                </DialogTitle>
                <DialogDescription className="text-xs text-[#86948a]">
                  Configure categories and customize dynamic technical attributes for equipment onboarding.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant={isCreating ? "outline" : "glow"}
              size="sm"
              onClick={() => {
                setIsCreating(!isCreating)
                setError(null)
                setSuccessMsg(null)
              }}
              className="text-xs h-8"
            >
              {isCreating ? (
                <>
                  <X className="h-3.5 w-3.5 mr-1" /> View Categories
                </>
              ) : (
                <>
                  <FolderPlus className="h-3.5 w-3.5 mr-1" /> + New Category
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {isCreating ? (
          /* Create Form */
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-[#0f131c] border border-[#1f2937] space-y-3">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
                1. Category Identity
              </span>
              <div>
                <label className="text-xs font-semibold text-[#dfe2ee] block mb-1">
                  Category Name *
                </label>
                <Input
                  placeholder="e.g. Earthmoving & Excavation / Aerial Work Platforms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#181c24] border-[#1f2937] text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#dfe2ee] block mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="Describe machine family, intended operational tasks, and power requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="bg-[#181c24] border-[#1f2937] text-sm text-white"
                />
              </div>
            </div>

            {/* Dynamic Specification Fields Builder */}
            <div className="p-4 rounded-xl bg-[#0f131c] border border-[#1f2937] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
                    2. Dynamic Technical Specification Schema
                  </span>
                  <span className="text-[11px] text-[#86948a]">
                    These fields will automatically appear in Section 3 when listing machinery under this category.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  className="text-xs h-7 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Field
                </Button>
              </div>

              <div className="space-y-2.5 pt-1">
                {draftFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#181c24] border border-[#1f2937] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-400 font-bold text-[10px]">
                        Field #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="text-red-400 hover:text-red-300 p-0.5 rounded transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-[#86948a] block mb-0.5">Field Label *</label>
                        <Input
                          placeholder="e.g. Max Dig Depth / Rated Capacity"
                          value={field.label}
                          onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                          className="h-8 bg-[#0f131c] border-[#1f2937] text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#86948a] block mb-0.5">Unit (optional)</label>
                        <Input
                          placeholder="e.g. meters / kg / kW"
                          value={field.unit}
                          onChange={(e) => handleUpdateField(idx, { unit: e.target.value })}
                          className="h-8 bg-[#0f131c] border-[#1f2937] text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-[#86948a] block mb-0.5">Type</label>
                        <select
                          value={field.fieldType}
                          onChange={(e) =>
                            handleUpdateField(idx, { fieldType: e.target.value as any })
                          }
                          className="w-full h-8 px-2 rounded bg-[#0f131c] border border-[#1f2937] text-xs text-white"
                        >
                          <option value="text">Text Input</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown (Select)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id={`req-${idx}`}
                          checked={field.isRequired}
                          onChange={(e) => handleUpdateField(idx, { isRequired: e.target.checked })}
                          className="rounded border-[#1f2937] bg-[#0f131c] text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        />
                        <label htmlFor={`req-${idx}`} className="text-xs text-[#dfe2ee]">
                          Mandatory Requirement
                        </label>
                      </div>

                      {field.fieldType === "select" && (
                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-[#86948a] block mb-0.5">
                            Dropdown Options (Comma separated)
                          </label>
                          <Input
                            placeholder="e.g. Diesel, Petrol, 230V Electric, Hybrid"
                            value={field.options}
                            onChange={(e) => handleUpdateField(idx, { options: e.target.value })}
                            className="h-8 bg-[#0f131c] border-[#1f2937] text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
                className="text-xs text-[#86948a]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="glow"
                size="sm"
                disabled={submitting}
                className="text-xs font-semibold"
              >
                {submitting ? "Saving Category..." : "Save & Publish Category"}
              </Button>
            </div>
          </form>
        ) : (
          /* Categories List View */
          <div className="space-y-3 pt-2">
            <div className="text-xs text-[#86948a]">
              Active machinery categories configured in PostgreSQL database ({categories.length} total):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const schema = cat.specificationSchema || []
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl bg-[#0f131c] border border-[#1f2937] space-y-2 hover:border-[#10b981]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Tag className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                          <span className="text-[10px] font-mono text-[#86948a] truncate block max-w-[180px]">
                            {cat.id}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                        {schema.length} Specs
                      </span>
                    </div>

                    {cat.description && (
                      <p className="text-xs text-[#86948a] line-clamp-2">{cat.description}</p>
                    )}

                    {schema.length > 0 && (
                      <div className="pt-1.5 border-t border-[#1f2937]/80">
                        <span className="text-[10px] font-mono text-[#86948a] uppercase block mb-1">
                          Dynamic Schema Attributes:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {schema.map((f, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181c24] border border-[#1f2937] text-[#dfe2ee]"
                            >
                              {f.label} {f.unit ? `(${f.unit})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
