"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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

const MIN_AGE = 18;

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
];

type FormValues = {
  firstname: string;
  surname: string;
  username: string;
  bio: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address: string;
  dateOfBirth: string;
  notificationsEnabled: boolean;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  firstname: "",
  surname: "",
  username: "",
  bio: "",
  phone: "",
  country: "NG",
  state: "",
  city: "",
  address: "",
  dateOfBirth: "",
  notificationsEnabled: true,
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

function toForm(user: UserProfile): FormValues {
  return {
    firstname: user.firstname,
    surname: user.surname,
    username: user.username,
    bio: user.bio ?? "",
    phone: user.phone ?? "",
    country: user.country ?? "NG",
    state: user.state ?? "",
    city: user.city ?? "",
    address: user.address ?? "",
    dateOfBirth: user.dateOfBirth ?? "",
    notificationsEnabled: user.notificationsEnabled,
  };
}

function normalize(values: FormValues): FormValues {
  return {
    firstname: values.firstname.trim(),
    surname: values.surname.trim(),
    username: values.username.trim().toLowerCase(),
    bio: values.bio.trim(),
    phone: values.phone.replace(/[\s\-()]/g, ""),
    country: values.country,
    state: values.state.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
    dateOfBirth: values.dateOfBirth,
    notificationsEnabled: values.notificationsEnabled,
  };
}

/** Latest allowed birth date (today minus MIN_AGE years) as YYYY-MM-DD. */
function latestBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().slice(0, 10);
}

function validate(v: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!v.firstname) errors.firstname = "First name is required.";
  else if (v.firstname.length > 50) {
    errors.firstname = "First name cannot exceed 50 characters.";
  }

  if (!v.surname) errors.surname = "Surname is required.";
  else if (v.surname.length > 50) {
    errors.surname = "Surname cannot exceed 50 characters.";
  }

  if (!USERNAME_PATTERN.test(v.username)) {
    errors.username =
      "Use 3–30 letters, numbers, or underscores for your username.";
  }

  if (v.bio.length > 300) errors.bio = "Bio cannot exceed 300 characters.";

  if (v.phone && !/^\+?[0-9]{7,15}$/.test(v.phone)) {
    errors.phone = "Enter a valid phone number, e.g. +2348012345678.";
  }

  if (v.state.length > 60) errors.state = "State cannot exceed 60 characters.";
  if (v.city.length > 60) errors.city = "City cannot exceed 60 characters.";
  if (v.address.length > 200) {
    errors.address = "Address cannot exceed 200 characters.";
  }

  if (v.dateOfBirth) {
    if (v.dateOfBirth > latestBirthDate()) {
      errors.dateOfBirth = `You must be at least ${MIN_AGE} years old.`;
    } else if (v.dateOfBirth < "1900-01-01") {
      errors.dateOfBirth = "Enter a valid date of birth.";
    }
  }

  return errors;
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

function Field({ id, label, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function PersonalDetailsPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const result = await api<ProfileResponse>("/api/profile");
      setUser(result.user);
      setForm(toForm(result.user));
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        router.replace("/login");
        return;
      }
      setLoadError(errorMessage(err, "Could not load your details."));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const isDirty = useMemo(() => {
    if (!user) return false;
    const current = normalize(form);
    const saved = normalize(toForm(user));
    return (Object.keys(current) as (keyof FormValues)[]).some(
      (key) => current[key] !== saved[key],
    );
  }, [form, user]);

  const countryOptions = useMemo(() => {
    const code = form.country;
    return COUNTRIES.some((c) => c.code === code) || !code
      ? COUNTRIES
      : [...COUNTRIES, { code, name: code }];
  }, [form.country]);

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !isDirty) return;

    setError("");
    setSuccess("");
    setFieldErrors({});

    const values = normalize(form);
    const errors = validate(values);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);

    try {
      // Empty strings are sent on purpose: the server stores them as null (cleared).
      const result = await api<ProfileResponse>("/api/profile", {
        method: "PATCH",
        body: values,
      });

      setUser(result.user);
      setForm(toForm(result.user));
      setSuccess("Your personal details have been updated.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }

      setError(errorMessage(err, "Could not update your details."));

      if (err instanceof ApiError && err.fields) {
        setFieldErrors(err.fields as FieldErrors);
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (field: keyof FormValues) =>
    `mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#57945a] focus:ring-2 focus:ring-[#57945a]/15 ${
      fieldErrors[field] ? "border-red-400" : "border-gray-200"
    }`;

  const describedBy = (field: keyof FormValues, hasHint = false) =>
    fieldErrors[field]
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined;

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
              <div
                role="status"
                className="flex min-h-48 items-center justify-center gap-3 text-sm text-gray-500"
              >
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading your details...
              </div>
            ) : !user ? (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
              >
                {loadError || "Could not load your details."}
                <button
                  type="button"
                  onClick={() => void loadProfile()}
                  className="ml-2 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
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

                <div className="mb-6 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Account email
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-gray-800">
                    {user.email}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Email changes must use a separate email-verification flow.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      id="firstname"
                      label="First name"
                      error={fieldErrors.firstname}
                    >
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
                        aria-describedby={describedBy("firstname")}
                      />
                    </Field>

                    <Field
                      id="surname"
                      label="Surname"
                      error={fieldErrors.surname}
                    >
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
                        aria-describedby={describedBy("surname")}
                      />
                    </Field>

                    <Field
                      id="username"
                      label="Username"
                      className="sm:col-span-2"
                      error={fieldErrors.username}
                      hint="3–30 characters. Letters, numbers, and underscores only. Usernames are saved in lowercase."
                    >
                      <input
                        id="username"
                        name="username"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={30}
                        value={form.username}
                        onChange={(e) =>
                          updateField("username", e.target.value)
                        }
                        className={inputClass("username")}
                        placeholder="Choose a username"
                        aria-invalid={Boolean(fieldErrors.username)}
                        aria-describedby={describedBy("username", true)}
                      />
                    </Field>

                    <Field
                      id="bio"
                      label="Bio"
                      className="sm:col-span-2"
                      error={fieldErrors.bio}
                      hint={`${form.bio.length}/300 characters`}
                    >
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        maxLength={300}
                        value={form.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        className={`${inputClass("bio")} resize-none`}
                        placeholder="Tell us a little about yourself"
                        aria-invalid={Boolean(fieldErrors.bio)}
                        aria-describedby={describedBy("bio", true)}
                      />
                    </Field>

                    <Field
                      id="phone"
                      label="Phone number"
                      error={fieldErrors.phone}
                      hint="Include the country code, e.g. +2348012345678."
                    >
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={24}
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={inputClass("phone")}
                        placeholder="+234 801 234 5678"
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={describedBy("phone", true)}
                      />
                    </Field>

                    <Field
                      id="dateOfBirth"
                      label="Date of birth"
                      error={fieldErrors.dateOfBirth}
                      hint={`You must be at least ${MIN_AGE}.`}
                    >
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        autoComplete="bday"
                        min="1900-01-01"
                        max={latestBirthDate()}
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          updateField("dateOfBirth", e.target.value)
                        }
                        className={inputClass("dateOfBirth")}
                        aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                        aria-describedby={describedBy("dateOfBirth", true)}
                      />
                    </Field>

                    <Field
                      id="country"
                      label="Country"
                      error={fieldErrors.country}
                    >
                      <select
                        id="country"
                        name="country"
                        autoComplete="country"
                        value={form.country}
                        onChange={(e) =>
                          updateField("country", e.target.value)
                        }
                        className={inputClass("country")}
                        aria-invalid={Boolean(fieldErrors.country)}
                        aria-describedby={describedBy("country")}
                      >
                        {countryOptions.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field id="state" label="State" error={fieldErrors.state}>
                      <input
                        id="state"
                        name="state"
                        autoComplete="address-level1"
                        maxLength={60}
                        value={form.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        className={inputClass("state")}
                        placeholder="e.g. Lagos"
                        aria-invalid={Boolean(fieldErrors.state)}
                        aria-describedby={describedBy("state")}
                      />
                    </Field>

                    <Field id="city" label="City" error={fieldErrors.city}>
                      <input
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        maxLength={60}
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        className={inputClass("city")}
                        placeholder="e.g. Ikeja"
                        aria-invalid={Boolean(fieldErrors.city)}
                        aria-describedby={describedBy("city")}
                      />
                    </Field>

                    <Field
                      id="address"
                      label="Address"
                      className="sm:col-span-2"
                      error={fieldErrors.address}
                    >
                      <input
                        id="address"
                        name="address"
                        autoComplete="street-address"
                        maxLength={200}
                        value={form.address}
                        onChange={(e) =>
                          updateField("address", e.target.value)
                        }
                        className={inputClass("address")}
                        placeholder="Street address"
                        aria-invalid={Boolean(fieldErrors.address)}
                        aria-describedby={describedBy("address")}
                      />
                    </Field>

                    <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4 sm:col-span-2">
                      <div>
                        <p
                          id="notifications-label"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Notifications
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Receive updates about your predictions and account.
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.notificationsEnabled}
                        aria-labelledby="notifications-label"
                        onClick={() =>
                          updateField(
                            "notificationsEnabled",
                            !form.notificationsEnabled,
                          )
                        }
                        className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#57945a]/40 ${
                          form.notificationsEnabled
                            ? "bg-[#267b32]"
                            : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            form.notificationsEnabled
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
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
                      disabled={saving || !isDirty}
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