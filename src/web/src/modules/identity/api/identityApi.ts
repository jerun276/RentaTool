import axios from "axios"
import { axiosClient } from "@/shared/api/axiosClient"
import type {
  AuthResponse,
  LoginFormValues,
  RegistrationFormValues,
  TrustScoreResponse,
  ManagedUser,
  UpdateUserStatusPayload,
  UpdateUserRolePayload,
} from "../types/identityTypes"

export const apiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      const data = error.response.data as { message?: string } | undefined
      return data?.message || "Invalid email address or password. Please verify your credentials."
    }
    if (error.response?.status === 403) {
      const data = error.response.data as { message?: string } | undefined
      return data?.message || "Access forbidden. Your account may be suspended or lack necessary permissions."
    }
    const data = error.response?.data as { message?: string; title?: string; errors?: Record<string, string[]> } | undefined
    if (data?.message) return data.message
    if (data?.errors) {
      const flatErrors = Object.values(data.errors).flat()
      if (flatErrors.length > 0) return flatErrors.join(", ")
    }
    if (data?.title) return data.title
    return error.message || "We could not complete your request. Please try again."
  }
  if (error instanceof Error) {
    return error.message
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
  
  // User Management
  getUsers: (params?: { search?: string; role?: string; isActive?: boolean }) =>
    axiosClient.get<ManagedUser[]>("/users", { params }),
  getUserById: (id: string) =>
    axiosClient.get<ManagedUser>(`/users/${id}`),
  updateUserStatus: (id: string, payload: UpdateUserStatusPayload) =>
    axiosClient.patch<ManagedUser>(`/users/${id}/status`, payload),
  updateUserRole: (id: string, payload: UpdateUserRolePayload) =>
    axiosClient.patch<ManagedUser>(`/users/${id}/role`, payload),
}
