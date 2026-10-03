import React, { useEffect, useMemo, useState } from "react"
import { Eye, Search, ShieldAlert } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { identityApi, apiErrorMessage } from "../api/identityApi"

export type KycStatus = "Pending" | "Approved" | "Rejected"
export interface KycRegistryItem { userId: string; name: string; email: string; role: "Renter" | "Owner"; nic: string; status: KycStatus; submittedAt: string; documentName: string; documentUrl?: string }

const statusStyle: Record<KycStatus, string> = { Pending: "bg-amber-500/10 text-amber-600", Approved: "bg-emerald-500/10 text-emerald-600", Rejected: "bg-destructive/10 text-destructive" }

export const AdminKycRegistry: React.FC<{ onChooseRecord: (record: KycRegistryItem) => void }> = ({ onChooseRecord }) => {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"All" | KycStatus>("All")
  const [documentRecord, setDocumentRecord] = useState<KycRegistryItem | null>(null)
  const [allRecords, setAllRecords] = useState<KycRegistryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    identityApi.getKycSubmissions()
      .then(({ data }) => setAllRecords(data.map(d => ({
        userId: d.userId, name: d.name, email: d.email, role: (d.role === "Owner" ? "Owner" : "Renter"),
        nic: d.documentNumber, status: d.status, submittedAt: d.submittedAtUtc?.split("T")[0] ?? "",
        documentName: d.frontImageUrl?.split("/").pop() || d.documentType, documentUrl: d.frontImageUrl,
      }))))
      .catch(e => setLoadError(apiErrorMessage(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const records = useMemo(() => allRecords.filter(record => {
    const matchQuery = `${record.name} ${record.email} ${record.nic}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchQuery && (status === "All" || record.status === status)
  }), [allRecords, query, status])

  return <section className="rounded-xl border bg-card p-6 space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-bold">KYC review registry</h2><p className="text-sm text-muted-foreground">Filter applicants, inspect the submitted document, then select a record to review.</p></div><Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button></div>
    {loadError && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-between"><span>{loadError}</span><Button type="button" size="sm" variant="outline" onClick={load}>Retry</Button></div>}
    <div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email or NIC" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" /></label><select value={status} onChange={e => setStatus(e.target.value as "All" | KycStatus)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="p-3">Applicant</th><th className="p-3">Role</th><th className="p-3">NIC</th><th className="p-3">Status</th><th className="p-3">Submitted</th><th className="p-3" /></tr></thead><tbody>{records.map(record => <tr key={record.userId} className="border-b border-border/60"><td className="p-3"><div className="font-medium">{record.name}</div><div className="text-xs text-muted-foreground">{record.email}</div></td><td className="p-3">{record.role}</td><td className="p-3 font-mono text-xs">{record.nic}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[record.status]}`}>{record.status}</span></td><td className="p-3 text-muted-foreground">{record.submittedAt}</td><td className="p-3"><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setDocumentRecord(record)}><Eye className="mr-1 h-3.5 w-3.5" />Document</Button><Button type="button" size="sm" disabled={record.status !== "Pending"} onClick={() => onChooseRecord(record)}>Review</Button></div></td></tr>)}</tbody></table>{!records.length && !loading && <p className="py-8 text-center text-sm text-muted-foreground">No KYC records match these filters.</p>}</div>
    <Dialog open={!!documentRecord} onOpenChange={open => !open && setDocumentRecord(null)}><DialogContent><DialogHeader><DialogTitle>NIC document inspection</DialogTitle></DialogHeader>{documentRecord && <div className="space-y-3 text-sm"><div className="rounded-lg border border-dashed p-4 text-center">{documentRecord.documentUrl ? <img src={documentRecord.documentUrl} alt="Submitted NIC document" className="mx-auto max-h-80 rounded" /> : <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-amber-500" />}<p className="mt-2 font-medium">{documentRecord.documentName}</p></div><dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Applicant</dt><dd>{documentRecord.name}</dd></div><div><dt className="text-muted-foreground">NIC</dt><dd className="font-mono">{documentRecord.nic}</dd></div></dl></div>}</DialogContent></Dialog>
  </section>
}
