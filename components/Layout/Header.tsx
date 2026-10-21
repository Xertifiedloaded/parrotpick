"use client";

import { useState } from "react";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "../Logo";

const navLinks = [
  ["Home", "/#home"],
  ["Fixtures", "/#fixtures"],
  ["Leaderboard", "/#leaderboard"],
  ["Get Predictions", "/#predictions"],
  ["Results", "/#results"],
  ["Help", "/#faqs"],
  ["Contact Us", "#footer"],
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header id="home" className="relative z-40 w-full">
      {/* Inner container keeps the same width as the page sections (max-w-7xl, same padding) */}
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

        {/* Profile (xl and up) */}
        <a
          href="/#predictions"
          className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-[#345e34] xl:flex"
        >
          <span className="text-right">
            <span className="block">Ayomide Bola</span>
            <span className="text-[10px] font-normal text-gray-500">
              Welcome back!
            </span>
          </span>
          <img
            src="https://i.pravatar.cc/80?img=47"
            alt="Profile"
            className="h-9 w-9 rounded-full border-2 border-[#7dbb70]"
          />
        </a>

        {/* Hamburger (below lg) */}
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#b5ceb4] bg-white/50 lg:hidden"
        >
          <FontAwesomeIcon
            icon={menuOpen ? faXmark : faBars}
            className="h-5 w-5"
          />
        </button>
      </div>

      {/* Mobile / tablet menu */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="absolute inset-x-4 top-full flex flex-col gap-1 rounded-xl bg-[#1e712b] p-3 shadow-xl sm:inset-x-6 lg:hidden"
        >
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

          <a
            href="/#predictions"
            onClick={() => setMenuOpen(false)}
            className="mt-1 flex items-center gap-3 border-t border-white/15 px-3 pt-3 text-white"
          >
            <img
              src="https://i.pravatar.cc/80?img=47"
              alt=""
              className="h-8 w-8 rounded-full border-2 border-[#7dbb70]"
            />
            <span className="text-sm font-semibold">Ayomide Bola</span>
          </a>
        </nav>
      )}
    </header>
  );
}