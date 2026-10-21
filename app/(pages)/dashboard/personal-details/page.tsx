
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";
import { api, errorMessage, ApiError } from "@/lib/api";
import type { ProfileResponse, UserProfile } from "@/types/profile";

type FormValues = {
  firstname: string;
  surname: string;
  username: string;
};

const EMPTY_FORM: FormValues = {
  firstname: "",
  surname: "",
  username: "",
};

export default function PersonalDetailsPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api<ProfileResponse>("/api/profile");
      setUser(result.user);
      setForm({
        firstname: result.user.firstname,
        surname: result.user.surname,
        username: result.user.username,
      });
    } catch (err) {
      setError(errorMessage(err, "Could not load your details."));

      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function updateField(field: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setFieldErrors({});

    const firstname = form.firstname.trim();
    const surname = form.surname.trim();
    const username = form.username.trim().toLowerCase();

    const errors: Partial<Record<keyof FormValues, string>> = {};

    if (!firstname) errors.firstname = "First name is required.";
    else if (firstname.length > 50) {
      errors.firstname = "First name cannot exceed 50 characters.";
    }

    if (!surname) errors.surname = "Surname is required.";
    else if (surname.length > 50) {
      errors.surname = "Surname cannot exceed 50 characters.";
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      errors.username =
        "Use 3–30 letters, numbers, or underscores for your username.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);

    try {
      const result = await api<ProfileResponse>("/api/profile", {
        method: "PATCH",
        body: { firstname, surname, username },
      });

      setUser(result.user);
      setForm({
        firstname: result.user.firstname,
        surname: result.user.surname,
        username: result.user.username,
      });
      setSuccess("Your personal details have been updated.");
    } catch (err) {
      setError(errorMessage(err, "Could not update your details."));

      if (err instanceof ApiError && err.fields) {
        setFieldErrors(
          err.fields as Partial<Record<keyof FormValues, string>>,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (field: keyof FormValues) =>
    `mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#57945a] focus:ring-2 focus:ring-[#57945a]/15 ${
      fieldErrors[field] ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <main className="min-h-screen bg-[#f5f7f4] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#267b32]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[#e8f1e7] px-5 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#267b32]">
                <UserRound className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Personal Details
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your Parrot Picks account information.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {loading ? (
              <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-gray-500">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading your details...
              </div>
            ) : (
              <>
                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
                    <button
                      type="button"
                      onClick={() => void loadProfile()}
                      className="ml-2 font-semibold underline"
                    >
                      Reload
                    </button>
                  </div>
                )}

                {success && (
                  <div
                    role="status"
                    className="mb-5 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    {success}
                  </div>
                )}

                {user && (
                  <div className="mb-6 rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Account email
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-gray-800">
                      {user.email}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Email changes must use a separate email-verification
                      flow.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="firstname"
                        className="text-sm font-semibold text-gray-700"
                      >
                        First name
                      </label>
                      <input
                        id="firstname"
                        name="firstname"
                        autoComplete="given-name"
                        maxLength={50}
                        value={form.firstname}
                        onChange={(e) =>
                          updateField("firstname", e.target.value)
                        }
                        className={inputClass("firstname")}
                        placeholder="Enter your first name"
                        aria-invalid={Boolean(fieldErrors.firstname)}
                        aria-describedby={
                          fieldErrors.firstname
                            ? "firstname-error"
                            : undefined
                        }
                      />
                      {fieldErrors.firstname && (
                        <p
                          id="firstname-error"
                          className="mt-1 text-xs text-red-600"
                        >
                          {fieldErrors.firstname}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="surname"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Surname
                      </label>
                      <input
                        id="surname"
                        name="surname"
                        autoComplete="family-name"
                        maxLength={50}
                        value={form.surname}
                        onChange={(e) =>
                          updateField("surname", e.target.value)
                        }
                        className={inputClass("surname")}
                        placeholder="Enter your surname"
                        aria-invalid={Boolean(fieldErrors.surname)}
                        aria-describedby={
                          fieldErrors.surname ? "surname-error" : undefined
                        }
                      />
                      {fieldErrors.surname && (
                        <p
                          id="surname-error"
                          className="mt-1 text-xs text-red-600"
                        >
                          {fieldErrors.surname}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="username"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        autoComplete="username"
                        minLength={3}
                        maxLength={30}
                        value={form.username}
                        onChange={(e) =>
                          updateField("username", e.target.value)
                        }
                        className={inputClass("username")}
                        placeholder="Choose a username"
                        aria-invalid={Boolean(fieldErrors.username)}
                        aria-describedby={
                          fieldErrors.username
                            ? "username-error"
                            : "username-hint"
                        }
                      />
                      {fieldErrors.username ? (
                        <p
                          id="username-error"
                          className="mt-1 text-xs text-red-600"
                        >
                          {fieldErrors.username}
                        </p>
                      ) : (
                        <p
                          id="username-hint"
                          className="mt-1 text-xs text-gray-500"
                        >
                          3–30 characters. Letters, numbers, and underscores
                          only.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link
                      href="/dashboard"
                      className="flex h-12 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#267b32] px-6 text-sm font-semibold text-white transition hover:bg-[#1d6027] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? "Saving changes..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
