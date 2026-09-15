export type RegistrationRole = "Renter" | "Owner"
export type KycStatus = "Pending" | "Approved" | "Rejected"

export interface RegistrationFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  role: "" | RegistrationRole
}

export interface LoginFormValues { email: string; password: string }

export interface AuthResponse {
  userId: string
  name: string
  role: RegistrationRole | "Admin"
  accessToken: string
  refreshToken: string
  accessTokenExpiresAtUtc: string
}

export interface TrustScoreResponse { userId: string; score: number; trustScore?: number; lastUpdatedUtc?: string }
