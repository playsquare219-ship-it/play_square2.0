"use client"

import { Home, Store, Trophy, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface BottomNavProps {
  active: "home" | "store" | "tournaments" | "settings"
}

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter()

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "store", label: "Store", icon: Store, path: "/store" },
    { id: "tournaments", label: "Tournaments", icon: Trophy, path: "/tournaments" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#2C2C2C] z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${
                isActive ? "text-[#FF3B3F]" : "text-[#A0A0A0] hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
