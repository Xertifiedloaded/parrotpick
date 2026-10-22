"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, X } from "lucide-react";
import Football from "@/assets/images/football.jpg";
import { api, ApiError, errorMessage } from "@/lib/api";
import { ROUTES } from "@/stores/auth.store";

type Status = "checking" | "valid" | "invalid" | "done";

const inputClass =
  "h-12 w-full rounded-md border border-[#bcbcbc] bg-white px-3 pr-11 text-sm text-[#1f2937] caret-[#216e28] outline-none transition placeholder:text-sm placeholder:text-[#9ca3af] focus:border-[#287632] focus:ring-2 focus:ring-[#287632]/20 [color-scheme:light]";

const labelClass = "mb-1.5 block text-sm font-medium text-[#374151]";

const primaryButtonClass =
  "flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#216e28] px-4 text-sm font-semibold text-[#f3e83e] shadow-md transition hover:bg-[#185b20] focus:outline-none focus:ring-2 focus:ring-[#216e28]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-[calc(100vh-100px)] items-center justify-center overflow-hidden bg-[#edf3e9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-20">
        <img src={Football.src} alt="" className="h-full w-full object-cover object-center" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[#0f3d14]/45" />
      <section className="relative w-full max-w-xl rounded-2xl border-[3px] border-[#57945a] bg-white px-6 py-10 text-[#171717] shadow-2xl sm:px-10 sm:py-12">
        <Link
          href="/"
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-7">
      <div className="mb-4 h-1.5 w-12 rounded-full bg-[#216e28]" />
      <h1 className="text-3xl font-semibold tracking-tight text-[#111827]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#4b5563]">{text}</p>
    </div>
  );
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<Status>("checking");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setStatus("invalid");
        return;
      }
      try {
        await api(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        if (!cancelled) setStatus("valid");
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api("/api/auth/reset-password", { method: "POST", body: { token, password } });
      setStatus("done");
      setTimeout(() => router.replace(ROUTES.login), 2500);
    } catch (err) {
      if (err instanceof ApiError && (err.code === "INVALID_RESET_LINK" || err.fields?.token)) {
        setStatus("invalid");
      } else if (err instanceof ApiError && err.fields && Object.keys(err.fields).length > 0) {
        setError(Object.values(err.fields).join(" "));
      } else {
        setError(errorMessage(err, "Unable to reset password. Try again."));
      }
      setLoading(false);
    }
  }

  if (status === "checking") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#cfe5cb] border-t-[#216e28]" />
          <p className="text-sm font-medium text-[#374151]">Verifying your reset link...</p>
        </div>
      </Shell>
    );
  }

  if (status === "invalid") {
    return (
      <Shell>
        <Heading title="Link expired" text="This password reset link is invalid or has expired. Request a new one to continue." />

        <Link href="/auth/forgot-password" className={primaryButtonClass}>
          Request New Link
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <p className="mt-7 text-center text-sm text-[#4b5563]">
          Back to{" "}
          <Link href={ROUTES.login} className="font-semibold text-[#216e28] underline-offset-4 hover:underline">
            Login
          </Link>
        </p>
      </Shell>
    );
  }

  if (status === "done") {
    return (
      <Shell>
        <Heading title="Password updated" text="Your password has been reset successfully. Redirecting you to login..." />

        <Link href={ROUTES.login} className={primaryButtonClass}>
          Go to Login
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <Heading title="Reset Password" text="Choose a new password for your account." />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className={labelClass}>
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#6b7280] transition hover:text-[#216e28]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className={labelClass}>
            Confirm Password
          </label>
          <input
            id="confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-2`}>
          {loading ? "Resetting..." : "Reset Password"}
          {!loading && <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[#4b5563]">
        Back to{" "}
        <Link href={ROUTES.login} className="font-semibold text-[#216e28] underline-offset-4 hover:underline">
          Login
        </Link>
      </p>
    </Shell>
  );
}