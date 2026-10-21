"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Football from "@/assets/images/football.jpg";
import { ApiError, errorMessage } from "@/lib/api";
import { ROUTES, useAuthStore } from "@/stores/auth.store";

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  const router = useRouter();
  const verification = useAuthStore((s) => s.verification);
  const fetchVerificationStatus = useAuthStore((s) => s.fetchVerificationStatus);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const resendCode = useAuthStore((s) => s.resendCode);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [ready, setReady] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const pending = verification && !verification.verified ? verification : null;
  const resendsLeft = pending?.resendsLeft ?? 0;
  const email = verification?.email ?? "";

  useEffect(() => {
    let cancelled = false;

    fetchVerificationStatus()
      .then((status) => {
        if (cancelled) return;
        if (status.verified) {
          router.replace(ROUTES.dashboard);
          return;
        }
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        // No pending cookie / expired: send them back to log in
        if (err instanceof ApiError && err.status === 401) {
          router.replace(ROUTES.login);
          return;
        }
        setError(errorMessage(err, "Unable to load verification status."));
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchVerificationStatus, router]);

  // Sync countdown whenever the server tells us a new value
  useEffect(() => {
    if (pending) setSecondsLeft(pending.secondsUntilResend);
  }, [pending?.secondsUntilResend]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown for "Send Again"
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (ready) inputs.current[0]?.focus();
  }, [ready]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setError("");

    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);

    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => (next[i] = char));
    setDigits(next);
    setError("");

    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleResend() {
    if (secondsLeft > 0 || resendsLeft <= 0 || resending) return;

    setError("");
    setInfo("");
    setResending(true);

    try {
      await resendCode();
      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(ROUTES.login);
        return;
      }
      if (err instanceof ApiError && err.code === "RESEND_COOLDOWN" && err.retryAfter) {
        setSecondsLeft(err.retryAfter);
      }
      setError(errorMessage(err, "Unable to resend the code. Try again."));
      // Re-sync counters with the server
      fetchVerificationStatus().catch(() => {});
    } finally {
      setResending(false);
    }
  }

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");

    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Enter the 6-digit code we sent to your email.");
      return;
    }

    setLoading(true);

    try {
      await verifyEmail(code);
      router.replace(ROUTES.dashboard);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(ROUTES.login);
        return;
      }
      setError(errorMessage(err, "Unable to verify. Try again."));

      // Code is dead (expired / too many attempts): clear the boxes
      if (err instanceof ApiError && ["TOO_MANY_ATTEMPTS", "CODE_EXPIRED", "CODE_NOT_FOUND"].includes(err.code)) {
        setDigits(Array(CODE_LENGTH).fill(""));
        fetchVerificationStatus().catch(() => {});
      } else {
        inputs.current[0]?.focus();
      }
      setLoading(false);
    }
  }

  const canResend = secondsLeft <= 0 && resendsLeft > 0;

  return (
    <main className="relative isolate flex min-h-[calc(100vh-100px)] items-center justify-center overflow-hidden bg-[#edf3e9] px-4 py-12 sm:px-6 lg:px-8">
      {/* Football background */}
      <div className="absolute inset-0 -z-20">
        <img src={Football.src} alt="" className="h-full w-full object-cover object-center" />
      </div>

      {/* Background overlay */}
      <div className="absolute inset-0 -z-10 bg-white/35 backdrop-blur-[1px]" />

      {/* Verify panel */}
      <section className="relative w-full max-w-3xl overflow-hidden rounded-xl border-[3px] border-[#57945a] bg-[#f1f1f1] shadow-xl">
        {/* Close button */}
        <Link
          href={ROUTES.register}
          aria-label="Close verification"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </Link>

        {/* Title bar */}
        <div className="bg-white px-6 py-8 text-center sm:py-10">
          <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">Verify Email Address</h1>
        </div>

        {/* Body */}
        <form onSubmit={handleConfirm} className="px-5 pb-8 pt-10 text-center sm:px-10">
          {!ready ? (
            <p className="py-16 text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              <p className="mx-auto max-w-md text-sm leading-6 text-gray-500 sm:max-w-none">
                We&apos;ve sent a 6-digit code
                {email ? (
                  <>
                    {" "}
                    to <span className="font-medium text-gray-700">{email}</span>
                  </>
                ) : null}
                . Check your mail and complete your registration
              </p>

              {pending?.codeExpired && <p className="mt-3 text-xs text-amber-700">Your last code has expired. Request a new one below.</p>}

              {/* Code boxes */}
              <div className="mt-8 flex justify-center gap-2 sm:gap-3">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${index + 1}`}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    className="h-12 w-11 rounded-xl border border-gray-400 bg-[#e8f0e7] text-center text-lg font-bold text-black shadow-[0_3px_5px_rgba(0,0,0,0.18)] outline-none transition focus:border-[#287632] focus:ring-2 focus:ring-[#287632]/25 sm:h-14 sm:w-14 sm:text-xl"
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="mt-8 text-sm text-gray-500">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="font-semibold text-[#216e28] hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending..." : "Send Again"}
                  </button>
                ) : (
                  <p>
                    Send Again <span className="ml-1 font-semibold text-gray-700">{resendsLeft > 0 ? `${secondsLeft}s left` : "unavailable"}</span>
                  </p>
                )}
              </div>

              <p className="mt-6 text-sm text-gray-400">
                {resendsLeft > 0
                  ? `You have ${resendsLeft} ${resendsLeft === 1 ? "time" : "times"} left to request another code`
                  : "You have no more code requests left"}
              </p>

              {/* Info */}
              {info && !error && (
                <p role="status" className="mx-auto mt-5 max-w-sm rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs leading-5 text-green-700">
                  {info}
                </p>
              )}

              {/* Error */}
              {error && (
                <p role="alert" className="mx-auto mt-5 max-w-sm rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
                  {error}
                </p>
              )}

              {/* Confirm */}
              <button
                type="submit"
                disabled={loading}
                className="mt-8 h-11 w-full max-w-[220px] rounded-md bg-[#26771f] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6218] focus:outline-none focus:ring-2 focus:ring-[#26771f]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Confirming..." : "Confirm"}
              </button>

              <div className="mx-auto mt-10 h-px w-full bg-gray-300/80" />

              <p className="mt-8 text-sm text-gray-400">
                Haven&apos;t you received the code?{" "}
                <Link href="/support" className="font-medium text-[#216e28] hover:underline">
                  Contact Customer Support
                </Link>
              </p>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
