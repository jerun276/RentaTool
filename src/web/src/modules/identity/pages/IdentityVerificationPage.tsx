import React, { useState } from "react"
import { CheckCircle2, FileImage, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { apiErrorMessage, identityApi } from "../api/identityApi"
import { AdminKycRegistry, type KycRegistryItem } from "../components/AdminKycRegistry"
import { LoginPanel } from "../components/LoginPanel"
import { TrustScoreCard } from "../components/TrustScoreCard"
import { normalizeNic, validateNic, validateNicDocument } from "../validation/identityValidation"

type Notice = { type: "success" | "error"; text: string } | null

const ErrorText = ({ text }: { text?: string }) => text ? <p className="mt-1 text-xs text-destructive" role="alert">{text}</p> : null


export const IdentityVerificationPage: React.FC = () => {
  const { user } = useAuthStore()
  const [nic, setNic] = useState("")
  const [document, setDocument] = useState<File>()
  const [kycErrors, setKycErrors] = useState<{ nic?: string; document?: string }>({})
  const [submittingKyc, setSubmittingKyc] = useState(false)
  const [kycNotice, setKycNotice] = useState<Notice>(null)
  const [reviewUserId, setReviewUserId] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [reviewing, setReviewing] = useState(false)
  const [reviewNotice, setReviewNotice] = useState<Notice>(null)

  const submitKyc = async (event: React.FormEvent) => {
    event.preventDefault(); const normalizedNic = normalizeNic(nic)
    const errors = { nic: validateNic(normalizedNic), document: await validateNicDocument(document) }; setKycErrors(errors)
    if (errors.nic || errors.document) return
    setSubmittingKyc(true); setKycNotice(null)
    try { await identityApi.submitKyc(normalizedNic, document!); setKycNotice({ type: "success", text: "Your KYC has been submitted and is pending review." }); setNic(""); setDocument(undefined) }
    catch (error) { setKycNotice({ type: "error", text: apiErrorMessage(error) }) }
    finally { setSubmittingKyc(false) }
  }
  const review = async (status: "Approved" | "Rejected") => {
    const reason = rejectionReason.trim()
    if (!reviewUserId.trim()) return setReviewNotice({ type: "error", text: "A user ID is required." })
    if (status === "Rejected" && !reason) return setReviewNotice({ type: "error", text: "Please provide a reason for rejecting this KYC." })
    if (reason.length > 500) return setReviewNotice({ type: "error", text: "Rejection reason must not exceed 500 characters." })
    setReviewing(true); setReviewNotice(null)
    try { await identityApi.reviewKyc(reviewUserId.trim(), status, reason || undefined); setReviewNotice({ type: "success", text: `KYC ${status.toLowerCase()} successfully.` }) }
    catch (error) { setReviewNotice({ type: "error", text: apiErrorMessage(error) }) }
    finally { setReviewing(false) }
  }
  const selectForReview = (record: KycRegistryItem) => {
    setReviewUserId(record.userId)
    setRejectionReason("")
    setReviewNotice(null)
    window.document.getElementById("kyc-decision")?.scrollIntoView({ behavior: "smooth", block: "center" })
  }
  return <div className="container max-w-7xl px-4 py-8 sm:px-8 space-y-8">
    <div><div className="mb-1 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-500"><ShieldCheck className="h-4 w-4" />Component 1 · Identity & trust</div><h1 className="text-3xl font-extrabold">Identity verification centre</h1><p className="mt-1 text-sm text-muted-foreground">Sri Lankan NIC compliance inspection, algorithmic trust score tracking, and controlled administrative KYC adjudication.</p></div>
    <TrustScoreCard />
    <div className="grid gap-6 lg:grid-cols-2">
      <form noValidate onSubmit={submitKyc} className="rounded-xl border bg-card p-6 space-y-4"><h2 className="flex items-center gap-2 text-lg font-bold"><FileImage className="h-5 w-5 text-emerald-500" />Submit NIC verification</h2>
        <label className="block text-sm font-medium">NIC number<Input value={nic} maxLength={12} onChange={e => { const value = e.target.value.toUpperCase(); setNic(value); setKycErrors(current => ({ ...current, nic: validateNic(value) })) }} onBlur={() => { setNic(normalizeNic(nic)); setKycErrors(current => ({ ...current, nic: validateNic(nic) })) }} className="mt-1" placeholder="123456789V or 200012345678" aria-invalid={!!kycErrors.nic} /><ErrorText text={kycErrors.nic} /></label>
        <label className="block text-sm font-medium">NIC document (JPG, JPEG, PNG; max 5 MB)<Input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="mt-1" onChange={async e => { const file = e.target.files?.[0]; const documentError = await validateNicDocument(file); setDocument(file); setKycErrors(current => ({ ...current, document: documentError })) }} aria-invalid={!!kycErrors.document} />{document && <p className="mt-1 text-xs text-muted-foreground">Selected: {document.name}</p>}<ErrorText text={kycErrors.document} /></label>
        {kycNotice && <NoticeMessage notice={kycNotice} />}<Button type="submit" disabled={!!validateNic(nic) || !document || !!kycErrors.document || submittingKyc} className="w-full">{submittingKyc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit KYC</Button></form>
      <LoginPanel />
    </div>
    {user?.role === "Admin" && <div className="space-y-6"><AdminKycRegistry onChooseRecord={selectForReview} /><section id="kyc-decision" className="max-w-2xl rounded-xl border border-amber-500/25 bg-amber-950/10 p-6 space-y-4"><h2 className="text-lg font-bold">Admin KYC decision</h2><p className="text-sm text-muted-foreground">Only the API's Admin authorization decides whether this action is permitted.</p><Input placeholder="User ID" value={reviewUserId} onChange={e => setReviewUserId(e.target.value)} /><textarea value={rejectionReason} maxLength={500} onChange={e => setRejectionReason(e.target.value)} placeholder="Required only when rejecting" className="flex min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm" /><div className="flex gap-3"><Button type="button" disabled={reviewing} onClick={() => review("Approved")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button><Button type="button" variant="destructive" disabled={reviewing} onClick={() => review("Rejected")}><XCircle className="mr-2 h-4 w-4" />Reject</Button></div>{reviewNotice && <NoticeMessage notice={reviewNotice} />}</section></div>}
  </div>
}

const NoticeMessage = ({ notice }: { notice: Exclude<Notice, null> }) => <p role="status" className={`rounded-md p-3 text-sm ${notice.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>{notice.text}</p>
