import React, { useState } from "react"
import { Loader2, LogIn } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { useAuthStore, type UserRole } from "@/shared/store/useAuthStore"
import { apiErrorMessage, identityApi } from "../api/identityApi"
import type { LoginFormValues } from "../types/identityTypes"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const LoginPanel: React.FC = () => {
  const setAuth = useAuthStore(state => state.setAuth)
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const invalid = !emailPattern.test(values.email.trim()) || !values.password
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (invalid) return setError("Enter a valid email address and password.")
    setLoading(true); setError("")
    try {
      const { data } = await identityApi.login(values)
      setAuth(data.accessToken, { id: data.userId, name: data.name, email: values.email.trim(), role: data.role as UserRole, trustScore: 50 })
    } catch (requestError) { setError(apiErrorMessage(requestError)) } finally { setLoading(false) }
  }
  return <form noValidate onSubmit={submit} className="rounded-xl border bg-card p-6 space-y-4"><h2 className="flex items-center gap-2 text-lg font-bold"><LogIn className="h-5 w-5 text-emerald-500" />Sign in</h2><label className="block text-sm font-medium">Email address<Input type="email" value={values.email} onChange={e => setValues(current => ({ ...current, email: e.target.value }))} className="mt-1" /></label><label className="block text-sm font-medium">Password<Input type="password" value={values.password} onChange={e => setValues(current => ({ ...current, password: e.target.value }))} className="mt-1" /></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<Button type="submit" disabled={invalid || loading} className="w-full">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button></form>
}
