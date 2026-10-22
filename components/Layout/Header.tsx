"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Gift,
  House,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Target,
  Trophy,
  UserPlus,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import Logo from "../Logo";
import { ROUTES, useAuthStore, type PublicUser } from "@/stores/auth.store";

type Icon = ComponentType<LucideProps>;

type NavLink = {
  label: string;
  href: string;
  icon: Icon;
};

const NAV_LINKS: readonly NavLink[] = [
  { label: "Home", href: "/#home", icon: House },
  { label: "Fixtures", href: "/#fixtures", icon: CalendarDays },
  { label: "Leaderboard", href: "/#leaderboard", icon: Trophy },
  { label: "Results", href: "/#results", icon: ClipboardList },
  { label: "Help", href: "/#faqs", icon: CircleHelp },
  { label: "Contact Us", href: "/#footer", icon: Mail },
];

const DASHBOARD_AFTER = "Leaderboard";

const DASHBOARD_LINKS: readonly NavLink[] = [
  { label: "User Information", href: ROUTES.dashboard, icon: UserRound },
  { label: "Prediction", href: `${ROUTES.dashboard}/prediction-history`, icon: Target },
  { label: "Referral", href: `${ROUTES.dashboard}/referral`, icon: Gift },
  { label: "Wallet", href: `${ROUTES.dashboard}/wallet`, icon: Wallet },
  { label: "Support", href: `${ROUTES.dashboard}/support`, icon: LifeBuoy },
];

function Avatar({ user, size = "h-9 w-9" }: { user: PublicUser; size?: string }) {
  const [failed, setFailed] = useState(false);
  const initials =
    `${user.firstname?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase() || "U";

  if (user.profilePicture && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.profilePicture}
        alt={`${user.firstname} ${user.surname}`}
        onError={() => setFailed(true)}
        className={`${size} rounded-full border-2 border-[#7dbb70] object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${size} grid place-items-center rounded-full border-2 border-[#7dbb70] bg-[#e3f1df] text-xs font-bold text-[#216e28]`}
    >
      {initials}
    </span>
  );
}

/** Closes an open popup on outside mousedown or Escape. */
function useDismiss(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close]);
}


function DesktopDashboardMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useDismiss(open, ref, close);

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition hover:bg-white/15 hover:text-lime-200 ${
          open ? "bg-white/15 text-lime-200" : "text-white"
        }`}
      >
        User Dashboard
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
<div
  role="menu"
  aria-label="User dashboard"
  className="absolute left-1/2 top-full z-50 mt-3 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-[#d9e6d6] bg-white px-2 py-1.5 shadow-xl"
>
  {DASHBOARD_LINKS.map(({ label, href }) => (
    <Link
      key={label}
      href={href}
      role="menuitem"
      onClick={close}
      className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[#216e28] transition hover:bg-[#edf3e9] hover:text-[#185b20]"
    >
      {label}
    </Link>
  ))}
</div>
      )}
    </div>
  );
}

function MobileDashboardMenu({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-dashboard-menu"
        className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-lime-200"
      >
        <LayoutDashboard aria-hidden className="h-4 w-4 shrink-0" />
        <span className="flex-1">User Dashboard</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id="mobile-dashboard-menu"
          className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-white/20 pl-2"
        >
          {DASHBOARD_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-lime-200"
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "idle") fetchMe();
  }, [status, fetchMe]);

  useDismiss(profileOpen, profileRef, () => setProfileOpen(false));

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const checking = status === "idle" || status === "loading";
  const loggedIn = status === "authenticated" && !!user;

  async function handleLogout() {
    setProfileOpen(false);
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <header id="home" className="relative z-40 w-full">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-10">
        <Logo />
        <nav
          aria-label="Main"
          className="hidden min-w-0 mx-auto items-center justify-center gap-0.5 rounded-full bg-[#1e712b] px-2 py-1.5 shadow-sm lg:flex"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Fragment key={label}>
              <a
                href={href}
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 hover:text-lime-200"
              >
                {label}
              </a>

              {loggedIn && label === DASHBOARD_AFTER && <DesktopDashboardMenu />}
            </Fragment>
          ))}
        </nav>

  
        <div className="hidden shrink-0 items-center xl:flex">
          {checking ? (
            <div className="flex items-center gap-2" aria-hidden="true">
              <div className="space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-[#cfe5cb]" />
                <div className="ml-auto h-2 w-16 animate-pulse rounded bg-[#e1eadf]" />
              </div>
              <div className="h-9 w-9 animate-pulse rounded-full bg-[#cfe5cb]" />
            </div>
          ) : loggedIn && user ? (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-2 text-xs font-semibold text-[#345e34]"
              >
                <span className="text-right">
                  <span className="block">
                    {user.firstname} {user.surname}
                  </span>
                  <span className="text-[10px] font-normal text-gray-500">Welcome back!</span>
                </span>
                <Avatar user={user} />
                <ChevronDown
                  aria-hidden
                  className={`h-4 w-4 text-[#345e34] transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 flex w-48 flex-col overflow-hidden rounded-lg border border-[#d9e6d6] bg-white py-1 shadow-xl"
                >
                  <Link
                    href={ROUTES.dashboard}
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition hover:bg-[#edf3e9]"
                  >
                    <LayoutDashboard aria-hidden className="h-4 w-4 text-[#216e28]" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut aria-hidden className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.login}
                className="flex items-center gap-2 rounded-md border border-[#216e28] px-4 py-2 text-sm font-semibold text-[#216e28] transition hover:bg-[#edf3e9]"
              >
                <LogIn aria-hidden className="h-4 w-4" />
                Login
              </Link>
              <Link
                href={ROUTES.register}
                className="flex items-center gap-2 rounded-md bg-[#216e28] px-4 py-2 text-sm font-semibold text-[#f3e83e] transition hover:bg-[#185b20]"
              >
                <UserPlus aria-hidden className="h-4 w-4" />
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#b5ceb4] bg-white/50 text-black transition hover:bg-white/80 lg:hidden"
        >
          {menuOpen ? (
            <X aria-hidden className="h-5 w-5" strokeWidth={2.25} />
          ) : (
            <Menu aria-hidden className="h-5 w-5" strokeWidth={2.25} />
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-4 top-full flex max-h-[80vh] flex-col gap-1 overflow-y-auto rounded-xl bg-[#1e712b] p-3 shadow-xl sm:inset-x-6 lg:hidden"
        >
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <Fragment key={label}>
              <a
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-lime-200"
              >
                <Icon aria-hidden className="h-4 w-4 shrink-0" />
                {label}
              </a>

              {loggedIn && label === DASHBOARD_AFTER && (
                <MobileDashboardMenu onNavigate={() => setMenuOpen(false)} />
              )}
            </Fragment>
          ))}

          <div className="mt-1 border-t border-white/15 pt-3">
            {checking ? (
              <div className="flex items-center gap-3 px-3" aria-hidden="true">
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
                <div className="h-3 w-28 animate-pulse rounded bg-white/20" />
              </div>
            ) : loggedIn && user ? (
              <>
                <Link
                  href={ROUTES.dashboard}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 text-white"
                >
                  <Avatar user={user} size="h-8 w-8" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {user.firstname} {user.surname}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-lime-200"
                >
                  <LogOut aria-hidden className="h-4 w-4 shrink-0" />
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1">
                <Link
                  href={ROUTES.login}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-md border border-white/40 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <LogIn aria-hidden className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href={ROUTES.register}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-md bg-[#f3e83e] px-4 py-2.5 text-sm font-semibold text-[#185b20] transition hover:bg-[#ede02a]"
                >
                  <UserPlus aria-hidden className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}