import type { RegistrationFormValues } from "../types/identityTypes"

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export const NIC_ERROR = "Please enter a valid Sri Lankan NIC number (9 digits + V/X or 12 digits)."
const NIC_PATTERN = /^(?:\d{9}[VX]|\d{12})$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/
const IMAGE_TYPES = new Set(["image/jpeg", "image/png"])
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024

export const normalizeNic = (nic: string) => nic.trim().toUpperCase()
export const validateNic = (nic: string) => NIC_PATTERN.test(normalizeNic(nic)) ? undefined : NIC_ERROR

export const validateNicDocument = async (file?: File): Promise<string | undefined> => {
  if (!file) return "NIC document is required."
  if (file.size === 0) return "NIC document cannot be empty."
  if (file.size > MAX_DOCUMENT_BYTES) return "NIC document must be smaller than 5 MB."
  if (!IMAGE_TYPES.has(file.type)) return "Only JPG, JPEG, or PNG files are allowed."

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  if (!isJpeg && !isPng) return "The selected NIC document is unreadable or is not a valid JPG or PNG image."

  // A matching header is not enough: ask the browser to decode the image too.
  const objectUrl = URL.createObjectURL(file)
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("Unreadable image"))
      image.src = objectUrl
    })
    return undefined
  } catch {
    return "The selected NIC document is unreadable or corrupted."
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export type RegistrationValues = RegistrationFormValues
export const validateRegistration = (values: RegistrationFormValues): FieldErrors<keyof RegistrationFormValues> => {
  const errors: FieldErrors<keyof RegistrationFormValues> = {}
  const name = values.name.trim()
  if (!name) errors.name = "Full name is required."
  else if (!/\p{L}/u.test(name)) errors.name = "Full name must contain letters."
  if (!values.email.trim()) errors.email = "Email is required."
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Please enter a valid email address."
  if (!values.password) errors.password = "Password is required."
  else if (values.password.length < 8) errors.password = "Password must be at least 8 characters."
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match."
  if (!values.phoneNumber.trim()) errors.phoneNumber = "Phone number is required."
  else if (!PHONE_PATTERN.test(values.phoneNumber.replace(/[\s-]/g, ""))) errors.phoneNumber = "Enter a valid Sri Lankan mobile number."
  if (values.role !== "Renter" && values.role !== "Owner") errors.role = "Please select Renter or Owner."
  return errors
}
