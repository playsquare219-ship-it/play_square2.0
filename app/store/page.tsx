"use client"

import { ArrowLeft, ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/bottom-nav"

export default function StorePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-[#2C2C2C]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold">Store</h1>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-4">
        <div className="w-20 h-20 bg-[#FF3B3F]/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-[#FF3B3F]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 text-center">Store Coming Soon</h2>
        <p className="text-[#A0A0A0] text-center max-w-sm">
          We're working on bringing you the best football gear and equipment. Stay tuned!
        </p>
      </div>

      <BottomNav active="store" />
    </div>
  )
}
