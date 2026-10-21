"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "../Logo";
import { ROUTES, useAuthStore, type PublicUser } from "@/stores/auth.store";

const navLinks = [
  ["Home", "/#home"],
  ["Fixtures", "/#fixtures"],
  ["Leaderboard", "/#leaderboard"],
  ["Get Predictions", "/#predictions"],
  ["Results", "/#results"],
  ["Help", "/#faqs"],
  ["Contact Us", "#footer"],
];

function Avatar({ user, size = "h-9 w-9" }: { user: PublicUser; size?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = `${user.firstname?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase() || "U";

  if (user.profilePicture && !failed) {
    return (
      <img
        src={user.profilePicture}
        alt={`${user.firstname} ${user.surname}`}
        onError={() => setFailed(true)}
        className={`${size} rounded-full border-2 border-[#7dbb70] object-cover`}
      />
    );
  }

  return (
    <span aria-hidden="true" className={`${size} grid place-items-center rounded-full border-2 border-[#7dbb70] bg-[#e3f1df] text-xs font-bold text-[#216e28]`}>
      {initials}
    </span>
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

  // Restore the session from the httpOnly cookie once per app load
  useEffect(() => {
    if (status === "idle") fetchMe();
  }, [status, fetchMe]);

  // Close the profile dropdown on outside click / Escape
  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

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

        {/* Desktop nav (lg and up) */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {navLinks.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-[#24562a] transition hover:bg-[#1e712b] hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Account area (xl and up) */}
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
              </button>

              {profileOpen && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-lg border border-[#d9e6d6] bg-white py-1 shadow-xl">
                  <Link
                    href={ROUTES.dashboard}
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-[#edf3e9]"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.login}
                className="rounded-md border border-[#216e28] px-4 py-2 text-sm font-semibold text-[#216e28] transition hover:bg-[#edf3e9]"
              >
                Login
              </Link>
              <Link href={ROUTES.register} className="rounded-md bg-[#216e28] px-4 py-2 text-sm font-semibold text-[#f3e83e] transition hover:bg-[#185b20]">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger (below lg) */}
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#b5ceb4] bg-white/50 lg:hidden"
        >
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile / tablet menu */}
      {menuOpen && (
        <nav id="mobile-menu" className="absolute inset-x-4 top-full flex flex-col gap-1 rounded-xl bg-[#1e712b] p-3 shadow-xl sm:inset-x-6 lg:hidden">
          {navLinks.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-lime-200"
            >
              {label}
            </a>
          ))}

          <div className="mt-1 border-t border-white/15 pt-3">
            {checking ? (
              <div className="flex items-center gap-3 px-3" aria-hidden="true">
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
                <div className="h-3 w-28 animate-pulse rounded bg-white/20" />
              </div>
            ) : loggedIn && user ? (
              <>
                <Link href={ROUTES.dashboard} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 text-white">
                  <Avatar user={user} size="h-8 w-8" />
                  <span className="text-sm font-semibold">
                    {user.firstname} {user.surname}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 w-full rounded-md px-3 py-3 text-left text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-lime-200"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1">
                <Link
                  href={ROUTES.login}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-white/40 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.register}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md bg-[#f3e83e] px-4 py-2.5 text-center text-sm font-semibold text-[#185b20] transition hover:bg-[#ede02a]"
                >
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
