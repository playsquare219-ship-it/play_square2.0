"use client"

import { useEffect } from "react"
import { ArrowLeft, User, Bell, Lock, Globe, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/bottom-nav"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    })
    router.push("/auth")
  }

  const settingsItems = [
    { icon: User, label: "Profile Settings", onClick: () => {} },
    { icon: Bell, label: "Notifications", onClick: () => router.push('/notifications') },
    { icon: Lock, label: "Privacy & Security", onClick: () => {} },
    { icon: Globe, label: "Language", value: "English", onClick: () => {} },
    { icon: LogOut, label: "Logout", onClick: handleLogout, danger: true },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-[#2C2C2C]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#2C2C2C]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#FF3B3F] rounded-full flex items-center justify-center text-2xl font-bold">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-[#A0A0A0]">{user.phoneOrEmail}</p>
              <p className="text-xs text-[#A0A0A0]">
                {user.baladia}, {user.wilaya}
              </p>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-2">
          {settingsItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  item.danger
                    ? "bg-[#FF3B3F]/10 border-[#FF3B3F]/30 hover:bg-[#FF3B3F]/20"
                    : "bg-[#1E1E1E] border-[#2C2C2C] hover:border-[#FF3B3F]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${item.danger ? "text-[#FF3B3F]" : "text-white"}`} />
                  <span className={`font-medium ${item.danger ? "text-[#FF3B3F]" : "text-white"}`}>{item.label}</span>
                </div>
                {item.value && <span className="text-sm text-[#A0A0A0]">{item.value}</span>}
              </button>
            )
          })}
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-[#A0A0A0] pt-4">
          <p>Play Square v1.0.0</p>
          <p className="mt-1">Made with love in Algeria</p>
        </div>
      </div>

      <BottomNav active="settings" />
    </div>
  )
}
