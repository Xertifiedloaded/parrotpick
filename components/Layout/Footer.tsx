"use client";

import { useEffect, useState } from "react";
import {
  faArrowUpRightFromSquare,
  faEnvelope,
  faMedal,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "@/components/Logo";

const resourceLinks = [
  ["Home", "/#home"],
  ["About Us", "/#home"],
  ["Fixtures", "/#fixtures"],
  ["Leaderboard", "/#leaderboard"],
  ["Results", "/#results"],
  ["Refer a Friend", "/#predictions"],
  ["Contact Us", "#footer"],
  ["FAQs", "/#faqs"],
];

const legalLinks = [
  "Community Guidelines",
  "Privacy Policy",
  "Terms & Conditions",
  "Responsible Play",
];

const socialLinks = [
  { name: "Facebook", href: "https://facebook.com", icon: faFacebookF },
  { name: "Instagram", href: "https://instagram.com", icon: faInstagram },
  { name: "YouTube", href: "https://youtube.com", icon: faYoutube },
];

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer
      id="footer"
      className="border-t-[5px] border-[#d5b52b] bg-[#303130] text-white/70"
    >
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo light />

            <p className="mt-5 max-w-xs text-xs leading-6 text-white/50">
              Your home for football predictions, match-day excitement, and
              friendly competition. All for free.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-lime-400">
              <FontAwesomeIcon icon={faMedal} />
              All for free
            </span>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Resources</h3>
            <ul className="space-y-3 text-xs">
              {resourceLinks.map(([label, href]) => (
                <li key={label}>
                  <a className="transition hover:text-lime-300" href={href}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Legal</h3>
            <ul className="space-y-3 text-xs">
              {legalLinks.map((label) => (
                <li key={label}>
                  <a href="#footer" className="hover:text-lime-300">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">
              Connect with Us
            </h3>

            <p className="text-xs leading-6 text-white/50">
              Have a question or suggestion? We'd love to hear from you.
            </p>

            <a
              href="mailto:support@parrotpicks.com"
              className="mt-3 inline-flex items-center gap-2 text-xs text-lime-300 hover:text-white"
            >
              <FontAwesomeIcon icon={faEnvelope} />
              support@parrotpicks.com
            </a>

            <div className="mt-5 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-[#287d38] hover:text-white"
                >
                  <FontAwesomeIcon icon={social.icon} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year ?? 2026} Parrot Picks. All rights reserved.</p>

          <a href="/#home" className="flex items-center gap-2 hover:text-white">
            Back to top <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </a>
        </div>
      </div>
    </footer>
  );
}