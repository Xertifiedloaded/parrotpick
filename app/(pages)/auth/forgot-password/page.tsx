"use client";

import Link from "next/link";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api("/api/auth/forgot-password", { method: "POST", body: { email } });
      setMessage("If an account exists for that email, a password reset link has been sent. Check your inbox.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="mb-2 text-2xl font-semibold">Forgot password</h1>
      <p className="mb-6 text-sm text-neutral-500">Enter your email and we will send you a link to reset your password.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <Link href="/auth/login" className="mt-6 text-center text-sm text-neutral-600 underline">
        Back to login
      </Link>
    </main>
  );
}