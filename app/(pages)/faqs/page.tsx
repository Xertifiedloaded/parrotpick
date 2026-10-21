
"use client";

import { useState } from "react";

const navigation = [
  { icon: "⌂", label: "Home" },
  { icon: "♜", label: "Fixtures" },
  { icon: "⚒", label: "Leaderboard" },
  { icon: "♙", label: "User Dashboard" },
  { icon: "ϟ", label: "Results" },
  { icon: "ⓘ", label: "Help" },
  { icon: "◎", label: "Contact Us" },
];

const faqs = [
  {
    title: "What is 9ja parrot picks?",
    answer:
      "9ja Parrot Picks is a sports prediction platform where users can explore fixtures, review match information and make their preferred sports predictions.",
  },
  {
    title: "How to play?",
    answer:
      "Select a sport, choose a tournament or league, browse available fixtures, and select your preferred predictions. Review your selections before confirming.",
  },
  {
    title: "How to Register?",
    answer:
      "Click the registration option on the platform, complete the required details, and follow the instructions to set up your account.",
  },
  {
    title: "Do I need money to play?",
    answer:
      "Check the platform's current rules for available prediction modes, eligibility requirements and any applicable charges.",
  },
  {
    title: "Is there a 9ja Parrot picks app?",
    answer:
      "Visit the official 9ja Parrot Picks website for information about supported devices and any available mobile application.",
  },
  {
    title: "Can I edit my picks?",
    answer:
      "Review your selections before confirming. Whether a submitted pick can be changed depends on the platform's rules and the status of the event.",
  },
];

const cashOutFaqs = [
  {
    title: "What is cash out?",
    answer:
      "Cash out is a feature that may allow an eligible user to settle a qualifying selection before the event has finished, subject to the platform's terms.",
  },
  {
    title: "When can I cash out?",
    answer:
      "Cash out availability depends on the event, the status of your selection and whether the feature is offered at that time.",
  },
  {
    title: "Can I cash out on bonus funds?",
    answer:
      "Bonus-fund eligibility depends on the applicable bonus terms and conditions. Check the rules associated with your account.",
  },
  {
    title: "What ways can I cash out?",
    answer:
      "Available withdrawal or settlement methods depend on the services supported by the platform and your account eligibility.",
  },
  {
    title: "How can I cash out?",
    answer:
      "Open your eligible selection, check whether a cash-out option is available, review the displayed amount and confirm only if you wish to proceed.",
  },
];

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-green-800 ${
          footer ? "h-10 w-8" : "h-10 w-10"
        } bg-green-800 text-xl`}
      >
        <span className="absolute text-white">⚽</span>
        <span className="relative mt-3 text-sm">♟</span>
      </div>
      <span
        className={`font-medium leading-[1.05] text-green-700 ${
          footer ? "text-xl" : "text-xl"
        }`}
      >
        Parrot
        <br />
        Picks
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 border-b border-neutral-400 pb-2">
      <h2 className="text-xl font-normal text-green-900">{children}</h2>
    </div>
  );
}

function Accordion({
  items,
}: {
  items: { title: string; answer: string }[];
}) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openItems.includes(item.title);

        return (
          <div
            key={item.title}
            className="overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-sm"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() =>
                setOpenItems((current) =>
                  isOpen
                    ? current.filter((title) => title !== item.title)
                    : [...current, item.title]
                )
              }
              className="flex min-h-[48px] w-full items-center justify-between gap-4 px-4 py-3 text-left text-[15px] font-normal text-green-800 sm:min-h-[48px] sm:text-base"
            >
              <span>{item.title}</span>
              <svg
                className={`h-4 w-4 shrink-0 text-green-700 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="m6 9 6 6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-neutral-100 px-4 py-4 text-sm leading-6 text-neutral-600">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ParrotPicksHelpPage() {
  return (
    <div className="min-h-screen  bg-[#ededed] font-sans text-neutral-700">
      <main
        id="help"
        className="mx-auto max-w-7xl px-5 pb-20 pt-6 lg:px-7 lg:pt-6"
      >

        <section className="min-h-[510px] border border-[#e0e9df] bg-[#e8f0e8] px-3 py-8 sm:px-5 sm:py-9 lg:min-h-[510px]">
          <h1 className="mb-7 text-2xl font-normal tracking-tight text-neutral-700 sm:text-[26px]">
            How to Play
          </h1>

          <div className="space-y-5 px-2 text-[15px] leading-[1.45] text-neutral-600 sm:px-0 sm:text-base">
            <p>
              <strong className="mr-1 font-medium text-neutral-800">
                Step 1:
              </strong>{" "}
              Click on your preferred bet mode from the top menu.
            </p>

            <p>
              <strong className="mr-1 font-medium text-neutral-800">
                Step 2:
              </strong>{" "}
              Select your preferred sport, tournament, country or league and
              click on it.
              <br />
              <span className="sm:ml-[57px]">
                From there, you can select specific events, tournaments and
                leagues on that sport. For example, to bet on Champions League
                soccer, you have to select ‘soccer’ then ‘International Clubs’.
              </span>
            </p>

            <p>
              <strong className="mr-1 font-medium text-neutral-800">
                Step 3:
              </strong>{" "}
              View important prematch games in the ‘Highlights’ area.
            </p>

            <p>
              <strong className="mr-1 font-medium text-neutral-800">
                Step 4:
              </strong>{" "}
              Choose events you wish to play and select the odds by clicking
              on them.
              <br />
              <span className="sm:ml-[57px]">
                The chosen selections will be automatically added to the bet
                slip.
              </span>
            </p>

            <p>
              <strong className="mr-1 font-medium text-neutral-800">
                Step 5:
              </strong>{" "}
              Click on ‘Place Bet’ and ‘confirm’ the bet to place it.
            </p>

            <p>
              <strong className="mr-1 font-medium text-neutral-800">
                Step 6:
              </strong>{" "}
              A message will be displayed to inform whether a bet has been
              placed successfully or not.
            </p>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-6">
          <SectionTitle>FAQs</SectionTitle>
          <Accordion items={faqs} />
        </section>

        {/* Cash Out */}
        <section className="mt-6">
          <SectionTitle>Cash Out</SectionTitle>
          <Accordion items={cashOutFaqs} />
        </section>
      </main>


    </div>
  );
}
