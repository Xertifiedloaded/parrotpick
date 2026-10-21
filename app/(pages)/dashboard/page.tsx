
"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  ChevronRight,
  CirclePlus,
  History,
  LogOut,
  SquarePen,
  User,
  Wallet,
  X,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import Football from "@/assets/images/football.jpg";
import { api, errorMessage } from "@/lib/api";
import type { ProfileResponse, UserProfile } from "@/types/profile";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=85";

type Icon = ComponentType<LucideProps>;

const ACCOUNT_ITEMS: ReadonlyArray<{
  title: string;
  icon: Icon;
  href: string;
}> = [
  {
    title: "Personal Details",
    icon: User,
    href: "/dashboard/personal-details",
  },
  {
    title: "Withdrawal Details",
    icon: Wallet,
    href: "/dashboard/withdrawal-details",
  },
  {
    title: "Total Points",
    icon: CirclePlus,
    href: "/dashboard/points",
  },
  {
    title: "Prediction History",
    icon: History,
    href: "/dashboard/prediction-history",
  },
];

const rowClasses =
  "group flex min-h-[54px] w-full items-center gap-3 rounded-xl bg-white px-3 py-3 text-left transition hover:shadow-sm sm:min-h-[58px] sm:px-4";

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

function Modal({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function PhotoDialog({
  onClose,
  onSelect,
  uploading,
}: {
  onClose: () => void;
  onSelect: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setError("Your image must be no larger than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      await onSelect(file);
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Upload failed. Please try again."));
    } finally {
      event.target.value = "";
    }
  }

  return (
    <Modal titleId={titleId} onClose={uploading ? () => {} : onClose}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-[#267b32]">
        <Camera className="h-6 w-6" />
      </div>

      <h3
        id={titleId}
        className="mt-4 text-center text-lg font-semibold text-gray-900"
      >
        Update profile picture
      </h3>

      <p className="mt-2 text-center text-sm leading-6 text-gray-500">
        Choose a new photo for your Parrot Picks account.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={uploading}
        onChange={handleChange}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#267b32] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6027] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {uploading ? "Uploading photo..." : "Choose photo"}
      </button>

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
    <Modal titleId={titleId} onClose={onClose}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <LogOut className="h-6 w-6" />
      </div>

      <h3
        id={titleId}
        className="mt-4 text-center text-lg font-semibold text-gray-900"
      >
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

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [dialog, setDialog] = useState<"photo" | "logout" | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      setPageError(errorMessage(error, "Could not load your profile."));

      if (error instanceof Error && "status" in error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handlePhotoSelect = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);

    setUploading(true);

    try {
      const result = await api<ProfileResponse>("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      setUser(result.user);
    } finally {
      setUploading(false);
    }
  }, []);

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

  const fullName = user
    ? `${user.firstname} ${user.surname}`.trim()
    : "Your profile";

  const profileImage = user?.profilePicture || DEFAULT_AVATAR;

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
              {user ? (
                <Image
                  src={profileImage}
                  alt={fullName}
                  fill
                  priority
                  unoptimized
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <User className="h-12 w-12" />
                </div>
              )}
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

          <div className="mt-12 text-center">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading profile...
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold uppercase tracking-tight text-black">
                  {fullName}
                </h1>
                <p className="mt-1 text-xs font-medium text-[#333]">
                  {user?.username}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#e8f1e7] px-5 pb-3 pt-1 sm:px-7">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
            <User aria-hidden className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-xl font-normal text-[#454545] sm:text-2xl">
            User Information
          </h2>
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

          {user && !loading && (
            <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-white p-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                {user.emailVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                )}
                {user.emailVerified ? "Email verified" : "Email not verified"}
              </span>
              <span className="break-all">{user.email}</span>
            </div>
          )}

          <ul className="space-y-3.5">
            {ACCOUNT_ITEMS.map(({ title, icon, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${rowClasses} hover:bg-[#f7fbf6]`}
                >
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
          onClose={closeDialog}
          onSelect={handlePhotoSelect}
          uploading={uploading}
        />
      )}

      {dialog === "logout" && (
        <LogoutDialog
          onClose={closeDialog}
          onConfirm={handleLogout}
          loading={loggingOut}
        />
      )}
    </main>
  );
}
