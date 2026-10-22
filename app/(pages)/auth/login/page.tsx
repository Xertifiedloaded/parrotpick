"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Trophy } from "lucide-react";
import Football from "@/assets/images/football.jpg";
import { errorMessage } from "@/lib/api";
import { ROUTES, useAuthStore } from "@/stores/auth.store";

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.39-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
    </svg>
  );
}

function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.02-.9.9-2 1.42-3.1 1.33-.02-1.1.45-2.2 1.24-3 .9-.9 2.1-1.4 3.11-1.35zM20.5 17.1c-.55 1.27-.82 1.84-1.52 2.96-.98 1.57-2.37 3.53-4.09 3.54-1.53.02-1.93-1-4.01-.99-2.08.01-2.52 1.01-4.05.99-1.72-.02-3.04-1.78-4.02-3.35C.04 15.9-.25 11.3 1.5 8.6c1.24-1.92 3.2-3.04 5.04-3.04 1.87 0 3.04 1.02 4.58 1.02 1.5 0 2.41-1.03 4.57-1.03 1.64 0 3.37.9 4.6 2.44-4.04 2.21-3.38 7.98.21 9.11z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email/username and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await login({ identifier, password });
      router.replace(result === "needs-verification" ? ROUTES.verifyEmail : ROUTES.dashboard);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Unable to log in. Try again."));
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex  items-center justify-center overflow-hidden bg-[#edf3e9] px-4 py-12 sm:px-6 lg:min-h-[calc(100vh-100px)] lg:px-8">
      <div className="absolute inset-0 -z-20">
        <img src={Football.src} alt="football" className="h-full w-full object-cover object-center" />
      </div>
      <div className="absolute inset-0 -z-10 bg-white/35 backdrop-blur-[1px]" />
      <section className="relative w-full max-w-5xl rounded-xl border-[3px] border-[#57945a] bg-white px-5 py-10 shadow-xl sm:px-10 sm:py-12 lg:min-h-[690px] lg:px-20 lg:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Form column */}
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7">
              <h1 className="text-3xl font-medium tracking-tight text-[#171717]">Login</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">Welcome back, Let&apos;s get you predicting and winning</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
  
              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-[#686868]">
                  Email / Username
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your Email / Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 w-full rounded-md border border-[#bcbcbc] bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-[11px] placeholder:text-gray-400 focus:border-[#287632] focus:ring-2 focus:ring-[#287632]/15"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#686868]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-md border border-[#bcbcbc] bg-white px-3 pr-11 text-sm text-gray-800 outline-none transition placeholder:text-[11px] placeholder:text-gray-400 focus:border-[#287632] focus:ring-2 focus:ring-[#287632]/15"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 transition hover:text-[#287632]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-1.5 text-right">
                  <Link href="/auth/forgot-password" className="text-[11px] text-gray-500 transition hover:text-[#287632] hover:underline">
                    Forgot Password
                  </Link>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#216e28] px-4 text-sm font-semibold text-[#f3e83e] transition hover:bg-[#185b20] focus:outline-none focus:ring-2 focus:ring-[#216e28]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
                {!loading && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] font-medium text-gray-400">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/google";
              }}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#bdbdbd] bg-white text-sm text-gray-600 transition hover:border-[#7ca87d] hover:bg-gray-50"
            >
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/apple";
              }}
              className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#bdbdbd] bg-white text-sm text-gray-600 transition hover:border-[#7ca87d] hover:bg-gray-50"
            >
              <AppleIcon className="h-5 w-5 text-black" />
              Continue with Apple
            </button>

            {/* Signup */}
            <p className="mt-7 text-center text-sm text-gray-500">
              You don&apos;t have an account yet?{" "}
              <Link href={ROUTES.register} className="font-semibold text-[#267b32] transition hover:underline">
                Register
              </Link>
            </p>

            {/* Legal */}
            <p className="mt-7 text-center text-[10px] leading-5 text-gray-500">
              By logging in, you agree to our{" "}
              <Link href="/terms" className="font-semibold text-[#287632] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-[#287632] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Illustration column */}
          <div className="hidden items-center justify-center lg:flex">
            <div className="relative w-full max-w-sm">
              <div className="relative mx-auto grid h-72 w-72 place-items-center">
                <div className="absolute inset-0 rounded-full bg-[#e8f2e5]" />
                <div className="absolute inset-8 rounded-full border-[14px] border-[#cfe5cb]" />
                <Trophy className="relative h-28 w-28 text-[#287d38]" strokeWidth={1.5} />
              </div>

              <div className="relative z-20 mx-auto mt-4 flex max-w-xs items-center gap-3 rounded-xl border border-[#e1eadf] bg-white/90 p-4 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3f1df] text-[#267632]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Your next win starts here</p>
                  <p className="mt-1 text-xs text-gray-500">Sign in and get back to the game.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
