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
  ChevronRight,
  CirclePlus,
  History,
  LogOut,
  SquarePen,
  User,
  Wallet,
  X,
  type LucideProps,
} from "lucide-react";
import Football from '@/assets/images/football.jpg'


const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=85";


const USER = {
  firstname: "Adeyemi",
  surname: "Biola",
  username: "Adeyemi001",
} as const;

type Icon = ComponentType<LucideProps>;

const ACCOUNT_ITEMS: ReadonlyArray<{
  title: string;
  icon: Icon;
  href: string;
}> = [
  { title: "Personal Details", icon: User, href: "/dashboard/personal-details" },
  { title: "Withdrawal Details", icon: Wallet, href: "/dashboard/withdrawal-details" },
  { title: "Total Points", icon: CirclePlus, href: "/dashboard/points" },
  { title: "Prediction History", icon: History, href: "/dashboard/prediction-history" },
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
  const hover = danger ? "group-hover:text-red-500" : "group-hover:text-[#57945a]";
  const textHover = danger ? "group-hover:text-red-500" : "group-hover:text-[#267b32]";

  return (
    <>
      <IconComponent
        aria-hidden
        className={`h-6 w-6 shrink-0 text-[#b3b3b3] transition sm:h-7 sm:w-7 ${hover}`}
      />
      <span
        className={`min-w-0 flex-1 text-base font-medium text-[#858585] transition sm:text-lg ${textHover}`}
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
  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
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
}: {
  onClose: () => void;
  onSelect: (file: File) => void;
}) {
  const titleId = useId();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    onClose();
  };

  return (
    <Modal titleId={titleId} onClose={onClose}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-[#267b32]">
        <Camera className="h-6 w-6" />
      </div>

      <h3 id={titleId} className="mt-4 text-center text-lg font-semibold text-gray-900">
        Update profile picture
      </h3>

      <p className="mt-2 text-center text-sm leading-6 text-gray-500">
        Choose a new photo for your Parrot Picks account.
      </p>

      <label className="mt-5 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#267b32] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6027]">
        <Camera className="h-4 w-4" />
        Choose photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleChange}
        />
      </label>

      <p className="mt-3 text-center text-xs text-gray-400">
        JPG, PNG or WebP. Maximum 5 MB.
      </p>
    </Modal>
  );
}

function LogoutDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();

  return (
    <Modal titleId={titleId} onClose={onClose}>
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
          onClick={onClose}
          className="h-11 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Log Out
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </Modal>
  );
}



export default function DashboardPage() {
  const router = useRouter();

  const [dialog, setDialog] = useState<"photo" | "logout" | null>(null);
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);

  // Track the current blob URL so it can be released when replaced/unmounted.
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const handlePhotoSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    if (file.size > MAX_PHOTO_SIZE) {
      alert("Please select an image smaller than 5 MB.");
      return;
    }

    // Object URLs avoid encoding the whole file to a base64 string in memory.
    const url = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
    setProfileImage(url);
  }, []);

  const handleLogout = useCallback(() => {
    router.push("/login");
  }, [router]);

  const fullName = `${USER.firstname} ${USER.surname}`;
  const isLocalImage = profileImage.startsWith("blob:");

  return (
    <main className="relative isolate overflow-hidden px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Football background */}
      <div className="pointer-events-none absolute inset-0 -z-20">
        <Image
          src={Football.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/45" />

      <section className="mx-auto max-w-3xl overflow-hidden rounded-xl border-[3px] border-[#57945a] bg-[#e8f1e7] shadow-sm">
        {/* Profile */}
        <div className="flex min-h-[360px] flex-col items-center justify-center px-5 pb-10 pt-12 sm:min-h-[390px] sm:pt-14">
          <div className="relative">
            <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-white shadow-sm sm:h-40 sm:w-40">
              <Image
                src={profileImage}
                alt={fullName}
                fill
                priority
                sizes="160px"
                // Blob URLs can't go through the Next.js image optimizer.
                unoptimized={isLocalImage}
                className="object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => setDialog("photo")}
              aria-label="Edit profile picture"
              className="absolute -bottom-8 left-1/2 flex h-[68px] w-[68px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#a6cba2] bg-[#edf5e9] text-[#267b32] shadow-sm transition hover:bg-white"
            >
              <SquarePen className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-12 text-center">
            <h1 className="text-xl font-bold uppercase tracking-tight text-black">
              {fullName}
            </h1>
            <p className="mt-1 text-xs font-medium text-[#333]">{USER.username}</p>
          </div>
        </div>

        {/* User information heading */}
        <div className="flex items-center gap-3 bg-[#e8f1e7] px-5 pb-3 pt-1 sm:px-7">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
            <User aria-hidden className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-xl font-normal text-[#454545] sm:text-2xl">
            User Information
          </h2>
        </div>

        {/* Account menu */}
        <nav
          aria-label="Account"
          className="min-h-[420px] bg-[#d5d5db] px-4 py-8 sm:px-7 sm:py-10 lg:min-h-[480px]"
        >
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
        <PhotoDialog onClose={closeDialog} onSelect={handlePhotoSelect} />
      )}
      {dialog === "logout" && (
        <LogoutDialog onClose={closeDialog} onConfirm={handleLogout} />
      )}
    </main>
  );
}