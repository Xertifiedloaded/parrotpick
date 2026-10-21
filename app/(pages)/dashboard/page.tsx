"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  Copy,
  Gift,
  History,
  LoaderCircle,
  LogOut,
  SquarePen,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import Football from "@/assets/images/football.jpg";
import { api, errorMessage, ApiError } from "@/lib/api";
import type { ProfileResponse, UserProfile } from "@/types/profile";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const COPIED_RESET_MS = 2000;

type Icon = ComponentType<LucideProps>;
type PhotoBusy = "upload" | "remove" | null;

const ACCOUNT_ITEMS: ReadonlyArray<{ title: string; icon: Icon; href: string }> = [
  { title: "Personal Details", icon: User, href: "/dashboard/personal-details" },
  { title: "Withdrawal Details", icon: Wallet, href: "/dashboard/withdrawal-details" },
  { title: "Total Points", icon: CirclePlus, href: "/dashboard/points" },
  { title: "Prediction History", icon: History, href: "/dashboard/prediction-history" },
];

const rowClasses =
  "group flex min-h-[54px] w-full items-center gap-3 rounded-xl bg-white px-3 py-3 text-left transition hover:shadow-sm sm:min-h-[58px] sm:px-4";

/** Asks Cloudinary for a 320px face-cropped, auto-format, auto-quality image. */
function avatarSrc(url: string): string {
  const marker = "/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  return url.replace(marker, `${marker}c_fill,g_face,w_320,h_320,f_auto,q_auto/`);
}

function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts or denied clipboard permission.
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(el);
      return copied;
    } catch {
      return false;
    }
  }
}

function MenuRowContent({
  icon: IconComponent,
  title,
  danger = false,
}: {
  icon: Icon;
  title: string;
  danger?: boolean;
}) {
  return (
    <>
      <IconComponent
        aria-hidden
        className={`h-6 w-6 shrink-0 text-[#b3b3b3] transition sm:h-7 sm:w-7 ${
          danger ? "group-hover:text-red-500" : "group-hover:text-[#57945a]"
        }`}
      />
      <span
        className={`min-w-0 flex-1 text-base font-medium text-[#858585] transition sm:text-lg ${
          danger ? "group-hover:text-red-500" : "group-hover:text-[#267b32]"
        }`}
      >
        {title}
      </span>
      <ChevronRight
        aria-hidden
        className="h-4 w-4 shrink-0 text-[#69a86e] transition group-hover:translate-x-1"
      />
    </>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  // Keyed on src so a failed image resets when a new one is uploaded.
  return <AvatarImage key={src ?? "none"} src={src} name={name} />;
}

function AvatarImage({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
        <User aria-hidden className="h-14 w-14" />
      </div>
    );
  }

  return (
    <Image
      src={avatarSrc(src)}
      alt={name}
      fill
      priority
      // Cloudinary already serves a resized image, so Next's optimizer is skipped.
      unoptimized
      sizes="160px"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function Modal({
  titleId,
  onClose,
  locked = false,
  children,
}: {
  titleId: string;
  onClose: () => void;
  locked?: boolean;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);

  useEffect(() => {
    onCloseRef.current = onClose;
    lockedRef.current = locked;
  });

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !lockedRef.current) onCloseRef.current();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !locked) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={locked}
          aria-label="Close dialog"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-800 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function PhotoDialog({
  hasPhoto,
  busy,
  onClose,
  onUpload,
  onRemove,
}: {
  hasPhoto: boolean;
  busy: PhotoBusy;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      input.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setError("Your image must be no larger than 5 MB.");
      input.value = "";
      return;
    }

    try {
      await onUpload(file);
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Upload failed. Please try again."));
    } finally {
      input.value = "";
    }
  }

  async function handleRemove() {
    setError("");

    try {
      await onRemove();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Could not remove your photo."));
    }
  }

  const isBusy = busy !== null;

  return (
    <Modal titleId={titleId} onClose={onClose} locked={isBusy}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-[#267b32]">
        <Camera className="h-6 w-6" />
      </div>

      <h3 id={titleId} className="mt-4 text-center text-lg font-semibold text-gray-900">
        Update profile picture
      </h3>

      <p className="mt-2 text-center text-sm leading-6 text-gray-500">
        Choose a new photo for your Parrot Picks account.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_PHOTO_TYPES.join(",")}
        className="sr-only"
        disabled={isBusy}
        onChange={handleChange}
      />

      <button
        type="button"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#267b32] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6027] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "upload" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {busy === "upload" ? "Uploading photo..." : "Choose photo"}
      </button>

      {hasPhoto && (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void handleRemove()}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "remove" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {busy === "remove" ? "Removing..." : "Remove current photo"}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        JPG, PNG or WebP. Maximum 5 MB.
      </p>
    </Modal>
  );
}

function LogoutDialog({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const titleId = useId();

  return (
    <Modal titleId={titleId} onClose={onClose} locked={loading}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <LogOut className="h-6 w-6" />
      </div>

      <h3 id={titleId} className="mt-4 text-center text-lg font-semibold text-gray-900">
        Log out of your account?
      </h3>

      <p className="mt-2 text-center text-sm leading-6 text-gray-500">
        Are you sure you want to log out of Parrot Picks?
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="h-11 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
        >
          {loading ? "Logging out..." : "Log Out"}
          {!loading && <ArrowRight className="h-3 w-3" />}
        </button>
      </div>
    </Modal>
  );
}

function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    const success = await copyToClipboard(code);

    setCopied(success);
    setCopyFailed(!success);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, COPIED_RESET_MS);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f1e7] text-[#267b32]">
        <Gift aria-hidden className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Your referral code
        </p>
        <p className="mt-0.5 break-all font-mono text-lg font-bold tracking-wider text-gray-900">
          {code}
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleCopy()}
        className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#a6cba2] bg-[#edf5e9] px-3 text-sm font-semibold text-[#267b32] transition hover:bg-white"
      >
        {copied ? (
          <CheckCircle2 aria-hidden className="h-4 w-4" />
        ) : (
          <Copy aria-hidden className="h-4 w-4" />
        )}
        <span aria-live="polite">
          {copied ? "Copied" : copyFailed ? "Copy failed" : "Copy"}
        </span>
      </button>
    </div>
  );
}

function InfoSkeleton() {
  return (
    <div aria-hidden className="mb-5 space-y-3">
      <div className="h-14 animate-pulse rounded-xl bg-white/70" />
      <div className="h-[74px] animate-pulse rounded-xl bg-white/70" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [dialog, setDialog] = useState<"photo" | "logout" | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoBusy, setPhotoBusy] = useState<PhotoBusy>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pageError, setPageError] = useState("");

  const closeDialog = useCallback(() => setDialog(null), []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await api<ProfileResponse>("/api/profile");
      setUser(result.user);
    } catch (error) {
      if (isAuthError(error)) {
        router.replace("/login");
        return;
      }
      setPageError(errorMessage(error, "Could not load your profile."));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const uploadPhoto = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);

      setPhotoBusy("upload");

      try {
        const result = await api<ProfileResponse>("/api/profile/photo", {
          method: "POST",
          body: formData,
        });
        setUser(result.user);
      } catch (error) {
        if (isAuthError(error)) router.replace("/login");
        throw error; // the dialog shows the message
      } finally {
        setPhotoBusy(null);
      }
    },
    [router],
  );

  const removePhoto = useCallback(async () => {
    setPhotoBusy("remove");

    try {
      await api("/api/profile/photo", { method: "DELETE" });
      setUser((current) => (current ? { ...current, profilePicture: null } : current));
    } catch (error) {
      if (isAuthError(error)) router.replace("/login");
      throw error;
    } finally {
      setPhotoBusy(null);
    }
  }, [router]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);

    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (error) {
      setPageError(errorMessage(error, "Could not log out."));
      setLoggingOut(false);
      setDialog(null);
      return;
    }

    router.replace("/login");
    router.refresh();
  }, [router]);

  const fullName = user ? `${user.firstname} ${user.surname}`.trim() : "Your profile";

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-20">
        <Image
          src={Football}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/45" />

      <section className="mx-auto max-w-3xl overflow-hidden rounded-xl border-[3px] border-[#57945a] bg-[#e8f1e7] shadow-sm">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-5 pb-10 pt-12 sm:min-h-[390px] sm:pt-14">
          <div className="relative">
            <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm sm:h-40 sm:w-40">
              <Avatar src={user?.profilePicture ?? null} name={fullName} />
            </div>

            <button
              type="button"
              disabled={!user || loading}
              onClick={() => setDialog("photo")}
              aria-label="Edit profile picture"
              className="absolute -bottom-8 left-1/2 flex h-[68px] w-[68px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#a6cba2] bg-[#edf5e9] text-[#267b32] shadow-sm transition hover:bg-white disabled:opacity-50"
            >
              <SquarePen className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-12 text-center" aria-busy={loading}>
            {loading ? (
              <div className="flex flex-col items-center gap-2" role="status">
                <span className="h-5 w-40 animate-pulse rounded bg-white/70" />
                <span className="h-3 w-24 animate-pulse rounded bg-white/70" />
                <span className="sr-only">Loading profile...</span>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold uppercase tracking-tight text-black">
                  {fullName}
                </h1>
                {user && (
                  <p className="mt-1 text-xs font-medium text-[#333]">@{user.username}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#e8f1e7] px-5 pb-3 pt-1 sm:px-7">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
            <User aria-hidden className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-xl font-normal text-[#454545] sm:text-2xl">User Information</h2>
        </div>

        <nav
          aria-label="Account"
          className="min-h-[420px] bg-[#d5d5db] px-4 py-8 sm:px-7 sm:py-10 lg:min-h-[480px]"
        >
          {pageError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              <span className="flex-1">{pageError}</span>
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="shrink-0 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {loading && <InfoSkeleton />}

          {user && !loading && (
            <div className="mb-5 space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-white p-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  {user.emailVerified ? (
                    <CheckCircle2 aria-hidden className="h-4 w-4 text-green-600" />
                  ) : (
                    <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                  {user.emailVerified ? "Email verified" : "Email not verified"}
                </span>
                <span className="break-all">{user.email}</span>
              </div>

              <ReferralCard code={user.referralCode} />
            </div>
          )}

          <ul className="space-y-3.5">
            {ACCOUNT_ITEMS.map(({ title, icon, href }) => (
              <li key={href}>
                <Link href={href} className={`${rowClasses} hover:bg-[#f7fbf6]`}>
                  <MenuRowContent icon={icon} title={title} />
                </Link>
              </li>
            ))}

            <li>
              <button
                type="button"
                onClick={() => setDialog("logout")}
                className={`${rowClasses} hover:bg-[#fff8f8]`}
              >
                <MenuRowContent icon={LogOut} title="Log Out" danger />
              </button>
            </li>
          </ul>
        </nav>
      </section>

      {dialog === "photo" && (
        <PhotoDialog
          hasPhoto={Boolean(user?.profilePicture)}
          busy={photoBusy}
          onClose={closeDialog}
          onUpload={uploadPhoto}
          onRemove={removePhoto}
        />
      )}

      {dialog === "logout" && (
        <LogoutDialog onClose={closeDialog} onConfirm={handleLogout} loading={loggingOut} />
      )}
    </main>
  );
}