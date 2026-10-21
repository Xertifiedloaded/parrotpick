"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, X } from "lucide-react";
import Football from '@/assets/images/football.jpg'

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.39-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}

function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.02-.9.9-2 1.42-3.1 1.33-.02-1.1.45-2.2 1.24-3 .9-.9 2.1-1.4 3.11-1.35zM20.5 17.1c-.55 1.27-.82 1.84-1.52 2.96-.98 1.57-2.37 3.53-4.09 3.54-1.53.02-1.93-1-4.01-.99-2.08.01-2.52 1.01-4.05.99-1.72-.02-3.04-1.78-4.02-3.35C.04 15.9-.25 11.3 1.5 8.6c1.24-1.92 3.2-3.04 5.04-3.04 1.87 0 3.04 1.02 4.58 1.02 1.5 0 2.41-1.03 4.57-1.03 1.64 0 3.37.9 4.6 2.44-4.04 2.21-3.38 7.98.21 9.11z" />
    </svg>
  );
}

const inputClass =
  "h-12 w-full rounded-md border border-[#bcbcbc] bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-sm placeholder:text-gray-400 focus:border-[#287632] focus:ring-2 focus:ring-[#287632]/15";

const labelClass = "mb-1.5 block text-sm font-medium text-[#555]";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    surname: "",
    firstname: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (
      !form.surname.trim() ||
      !form.firstname.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // Connect your actual signup API here.
      // Example:
      // const response = await fetch("/api/auth/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(form),
      // });
      //
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || "Sign up failed.");
      // window.location.href = "/dashboard";

      setError("Connect your authentication API to enable sign up.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign up. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100vh-100px)] items-center justify-center overflow-hidden bg-[#edf3e9] px-4 py-12 sm:px-6 lg:px-8">
      {/* Football background */}
      <div className="absolute inset-0 -z-20">
        <img
          src={Football.src}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Background overlay */}
      <div className="absolute inset-0 -z-10 bg-white/35 backdrop-blur-[1px]" />

      {/* Signup panel */}
      <section className="relative w-full max-w-3xl rounded-xl border-[3px] border-[#57945a] bg-white px-5 py-10 shadow-xl sm:px-10 sm:py-12 lg:px-16 lg:py-14">
        {/* Close button */}
        <Link
          href="/"
          aria-label="Close sign up"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </Link>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-7">
            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Welcome to 9ja Parrot picks.
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Get started on the best free Prediction Platform. Predict
              football match results like never before.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            <div>
              <label htmlFor="surname" className={labelClass}>
                Surname
              </label>
              <input
                id="surname"
                name="surname"
                type="text"
                autoComplete="family-name"
                placeholder="Enter your Surname"
                value={form.surname}
                onChange={update("surname")}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="firstname" className={labelClass}>
                Firstname
              </label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                autoComplete="given-name"
                placeholder="Enter your Firstname"
                value={form.firstname}
                onChange={update("firstname")}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your Email"
                value={form.email}
                onChange={update("email")}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your Password"
                  value={form.password}
                  onChange={update("password")}
                  className={`${inputClass} pr-11`}
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 transition hover:text-[#287632]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#216e28] px-4 text-sm font-semibold text-[#f3e83e] shadow-md transition hover:bg-[#185b20] focus:outline-none focus:ring-2 focus:ring-[#216e28]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign Up"}
              {!loading && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-medium text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/google";
            }}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#b9d3b8] bg-white text-sm text-gray-600 transition hover:border-[#7ca87d] hover:bg-gray-50"
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
            className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#b9d3b8] bg-white text-sm text-gray-600 transition hover:border-[#7ca87d] hover:bg-gray-50"
          >
            <AppleIcon className="h-5 w-5 text-black" />
            Continue with Apple
          </button>

          {/* Login link */}
          <p className="mt-7 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#216e28] underline-offset-4 transition hover:underline"
            >
              Login
            </Link>
          </p>

          {/* Legal */}
          <p className="mt-5 text-center text-xs leading-5 text-gray-500">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold text-[#216e28] hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-[#216e28] hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}