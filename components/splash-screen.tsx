"use client"

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#121212]">
      <div className="animate-fade-in">
        {/* Play Square Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-32 h-32 flex items-center justify-center">
              <img src="/logo.png" alt="PlaySquare Logo" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,59,63,0.5)]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Play <span className="text-[#FF3B3F]">Square</span>
          </h1>
          <p className="text-[#A0A0A0] text-sm">Football Team Management</p>
        </div>
      </div>
    </div>
  )
}
