"use client";

import { create } from "zustand";
import { api, ApiError } from "@/lib/api";

export const ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  verifyEmail: "/auth/verify-email",
  dashboard: "/dashboard",
} as const;

const ENDPOINTS = {
  login: "/api/auth/login",
  signup: "/api/auth/register",
  verifyEmail: "/api/auth/verify-email",
  resendCode: "/api/auth/resend-code",
  verificationStatus: "/api/auth/verification-status",
  logout: "/api/auth/logout",
  me: "/api/auth/me",
} as const;

export type PublicUser = {
  id: string;
  surname: string;
  firstname: string;
  username: string;
  email: string;
  emailVerified: boolean;
  profilePicture?: string | null;
};

export type VerificationState =
  | { verified: true; email: string }
  | {
      verified: false;
      email: string;
      secondsUntilResend: number;
      resendsLeft: number;
      codeExpired: boolean;
    };

type Status = "idle" | "loading" | "authenticated" | "unauthenticated";

export type LoginInput = { identifier: string; password: string };
export type SignupInput = {
  surname: string;
  firstname: string;
  email: string;
  password: string;
};

type AuthState = {
  user: PublicUser | null;
  status: Status;
  verification: VerificationState | null;

  fetchMe: () => Promise<void>;
  login: (input: LoginInput) => Promise<"authenticated" | "needs-verification">;
  signup: (input: SignupInput) => Promise<void>;
  fetchVerificationStatus: () => Promise<VerificationState>;
  verifyEmail: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  verification: null,

  async fetchMe() {
    set({ status: "loading" });
    try {
      const { user } = await api<{ user: PublicUser }>(ENDPOINTS.me);
      set({ user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  async login(input) {
    try {
      const { user } = await api<{ user: PublicUser }>(ENDPOINTS.login, {
        method: "POST",
        body: { identifier: input.identifier.trim(), password: input.password },
      });
      set({ user, status: "authenticated", verification: null });
      return "authenticated";
    } catch (err) {
      // Credentials were right but the email isn't verified yet.
      // The server has set the pending cookie and (re)sent a code if needed.
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        set({ user: null, status: "unauthenticated", verification: null });
        return "needs-verification";
      }
      throw err;
    }
  },

  async signup(input) {
    const { user } = await api<{ user: PublicUser }>(ENDPOINTS.signup, {
      method: "POST",
      body: {
        surname: input.surname.trim(),
        firstname: input.firstname.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    });
    // Account exists but is unverified: not logged in yet.
    set({ user, status: "unauthenticated", verification: null });
  },

  async fetchVerificationStatus() {
    const verification = await api<VerificationState>(ENDPOINTS.verificationStatus);
    set({ verification });
    return verification;
  },

  async verifyEmail(code) {
    const { user } = await api<{ user: PublicUser }>(ENDPOINTS.verifyEmail, {
      method: "POST",
      body: { code },
    });
    set({ user, status: "authenticated", verification: null });
  },

  async resendCode() {
    const result = await api<{ resendsLeft: number; secondsUntilResend: number }>(ENDPOINTS.resendCode, { method: "POST" });
    const current = get().verification;
    set({
      verification: {
        verified: false,
        email: current?.email ?? "",
        secondsUntilResend: result.secondsUntilResend,
        resendsLeft: result.resendsLeft,
        codeExpired: false,
      },
    });
  },

  async logout() {
    try {
      await api(ENDPOINTS.logout, { method: "POST" });
    } finally {
      set({ user: null, status: "unauthenticated", verification: null });
    }
  },
}));
