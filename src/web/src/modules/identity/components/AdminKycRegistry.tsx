import React, { useMemo, useState } from "react"
import { Eye, Search, ShieldAlert } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"

export type KycStatus = "Pending" | "Approved" | "Rejected"
export interface KycRegistryItem { userId: string; name: string; email: string; role: "Renter" | "Owner"; nic: string; status: KycStatus; submittedAt: string; documentName: string }

// Temporary presentation data until the API exposes an Admin KYC list/document endpoint.
const sampleRecords: KycRegistryItem[] = [
  { userId: "4e21c23f-b03c-4b82-a763-7ed9188c1211", name: "Nimali Perera", email: "nimali@example.lk", role: "Renter", nic: "199845612345", status: "Pending", submittedAt: "2026-09-14", documentName: "nimali-nic.jpg" },
  { userId: "f7d3c2e1-20d7-452d-8c92-1bf58c3dc224", name: "Kasun Silva", email: "kasun@example.lk", role: "Owner", nic: "876543210V", status: "Approved", submittedAt: "2026-09-12", documentName: "kasun-nic.png" },
  { userId: "9c20a566-7643-4ece-aafc-1a5f02b9ea18", name: "Tharushi Fernando", email: "tharushi@example.lk", role: "Renter", nic: "923456789X", status: "Rejected", submittedAt: "2026-09-10", documentName: "tharushi-nic.jpeg" },
]

const statusStyle: Record<KycStatus, string> = { Pending: "bg-amber-500/10 text-amber-600", Approved: "bg-emerald-500/10 text-emerald-600", Rejected: "bg-destructive/10 text-destructive" }

export const AdminKycRegistry: React.FC<{ onChooseRecord: (record: KycRegistryItem) => void }> = ({ onChooseRecord }) => {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"All" | KycStatus>("All")
  const [documentRecord, setDocumentRecord] = useState<KycRegistryItem | null>(null)
  const records = useMemo(() => sampleRecords.filter(record => {
    const matchQuery = `${record.name} ${record.email} ${record.nic}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchQuery && (status === "All" || record.status === status)
  }), [query, status])

  return <section className="rounded-xl border bg-card p-6 space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-bold">KYC review registry</h2><p className="text-sm text-muted-foreground">Filter applicants, inspect the submitted document, then select a record to review.</p></div><span className="text-xs text-muted-foreground">Demo data until the Admin list API is available</span></div>
    <div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email or NIC" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" /></label><select value={status} onChange={e => setStatus(e.target.value as "All" | KycStatus)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="p-3">Applicant</th><th className="p-3">Role</th><th className="p-3">NIC</th><th className="p-3">Status</th><th className="p-3">Submitted</th><th className="p-3" /></tr></thead><tbody>{records.map(record => <tr key={record.userId} className="border-b border-border/60"><td className="p-3"><div className="font-medium">{record.name}</div><div className="text-xs text-muted-foreground">{record.email}</div></td><td className="p-3">{record.role}</td><td className="p-3 font-mono text-xs">{record.nic}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[record.status]}`}>{record.status}</span></td><td className="p-3 text-muted-foreground">{record.submittedAt}</td><td className="p-3"><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setDocumentRecord(record)}><Eye className="mr-1 h-3.5 w-3.5" />Document</Button><Button type="button" size="sm" disabled={record.status !== "Pending"} onClick={() => onChooseRecord(record)}>Review</Button></div></td></tr>)}</tbody></table>{!records.length && <p className="py-8 text-center text-sm text-muted-foreground">No KYC records match these filters.</p>}</div>
    <Dialog open={!!documentRecord} onOpenChange={open => !open && setDocumentRecord(null)}><DialogContent><DialogHeader><DialogTitle>NIC document inspection</DialogTitle></DialogHeader>{documentRecord && <div className="space-y-3 text-sm"><div className="rounded-lg border border-dashed p-8 text-center"><ShieldAlert className="mx-auto mb-2 h-8 w-8 text-amber-500" /><p className="font-medium">{documentRecord.documentName}</p><p className="mt-1 text-xs text-muted-foreground">The document preview will be served from the protected Admin document endpoint. Do not expose NIC files through a public URL.</p></div><dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Applicant</dt><dd>{documentRecord.name}</dd></div><div><dt className="text-muted-foreground">NIC</dt><dd className="font-mono">{documentRecord.nic}</dd></div></dl></div>}</DialogContent></Dialog>
  </section>
}
