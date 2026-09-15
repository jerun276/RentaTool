import axios from "axios"
import { axiosClient } from "@/shared/api/axiosClient"
import type { AuthResponse, LoginFormValues, RegistrationFormValues, TrustScoreResponse } from "../types/identityTypes"

export const apiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    return data?.message || Object.values(data?.errors || {}).flat()[0] || "We could not complete your request. Please try again."
  }
  return "We could not complete your request. Please try again."
}

export const identityApi = {
  register: (values: RegistrationFormValues) => axiosClient.post<AuthResponse>("/auth/register", {
    name: values.name.trim(), email: values.email.trim(), password: values.password,
    phoneNumber: values.phoneNumber.replace(/[\s-]/g, ""), role: values.role,
  }),
  login: (values: LoginFormValues) => axiosClient.post<AuthResponse>("/auth/login", { email: values.email.trim(), password: values.password }),
  submitKyc: (nic: string, document: File) => {
    const body = new FormData()
    body.append("documentType", "NIC")
    body.append("documentNumber", nic)
    body.append("nicDocument", document)
    return axiosClient.post("/users/kyc", body, { headers: { "Content-Type": "multipart/form-data" } })
  },
  reviewKyc: (userId: string, status: "Approved" | "Rejected", rejectionReason?: string) =>
    axiosClient.patch(`/users/${userId}/verification-status`, { status, rejectionReason }),
  getTrustScore: (userId: string) => axiosClient.get<TrustScoreResponse>(`/users/${userId}/trust-score`),
}
