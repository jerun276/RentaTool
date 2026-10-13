import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, beforeAll } from "vitest"
import { server } from "./server"

const storage = new Map<string, string>()
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
})

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(async () => {
  cleanup()
  server.resetHandlers()
  window.localStorage.clear()
  window.history.replaceState({}, "", "/")
  const { useAuthStore } = await import("@/shared/store/useAuthStore")
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
})
afterAll(() => server.close())
