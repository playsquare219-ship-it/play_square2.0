import Link from "next/link"
import RegisterForm from "@/components/auth/RegisterForm"
import AuthCard from "@/components/auth/AuthCard"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 animate-fade-in">
      <AuthCard>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-[#FF3B3F] rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            Play <span className="text-[#FF3B3F]">Square</span>
          </h1>
        </div>

        <RegisterForm />

        <div className="mt-6 text-center text-sm text-[#A0A0A0]">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#FF3B3F] hover:text-white transition-colors">
            Login
          </Link>
        </div>
      </AuthCard>
    </div>
  )
}

