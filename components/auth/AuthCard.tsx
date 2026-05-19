import type { ReactNode } from "react"

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-[#2C2C2C] bg-[#1E1E1E]/40 backdrop-blur px-6 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
      {children}
    </div>
  )
}

