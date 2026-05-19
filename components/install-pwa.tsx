"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"

export default function InstallPWA() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Check if iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt' as any, handleBeforeInstallPrompt)
    window.addEventListener('appinstalled' as any, handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt' as any, handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled' as any, handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled) return null

  if (isIOS) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#1E1E1E] border border-[#2C2C2C] text-white p-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 max-w-[90vw] w-[300px]">
        <p className="text-sm text-center">لتثبيت التطبيق، اضغط على زر المشاركة ثم اختر <br /> <strong className="text-[#FF3B3F]">Add to Home Screen</strong></p>
        <button onClick={() => setIsIOS(false)} className="text-xs text-gray-400 mt-2">إغلاق</button>
      </div>
    )
  }

  if (!isInstallable) return null

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-24 right-4 z-[100] flex items-center justify-center gap-2 rounded-full bg-[#FF3B3F] px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 animate-in slide-in-from-bottom"
      aria-label="تثبيت التطبيق"
    >
      <Download className="h-5 w-5" />
      <span>Download App</span>
    </button >
  )
}
