"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Goal, Play, Star } from "lucide-react";
import Football from "@/assets/images/football.jpg";
import Bro from "@/assets/images/bro.png";
import faqImage from "@/assets/images/faq_image.png";
const teams = {
  RMC: { name: "Real Madrid", crest: "86" },
  RST: { name: "Real Betis", crest: "90" },
  ARS: { name: "Arsenal", crest: "57" },
  CHE: { name: "Chelsea", crest: "61" },
  SEV: { name: "Sevilla", crest: "559" },
  BAR: { name: "Barcelona", crest: "81" },
  TOT: { name: "Tottenham", crest: "73" },
  LIV: { name: "Liverpool", crest: "64" },
  EVE: { name: "Everton", crest: "62" },
  BVB: { name: "Borussia Dortmund", crest: "4" },
};

type TeamCode = keyof typeof teams;

const fixtures: [TeamCode, TeamCode][] = [
  ["RMC", "RST"],
  ["ARS", "CHE"],
  ["SEV", "BAR"],
  ["TOT", "LIV"],
  ["EVE", "BVB"],
];

const results: [TeamCode, string, TeamCode][] = [
  ["SEV", "1 - 1", "BAR"],
  ["RMC", "4 - 2", "RST"],
  ["TOT", "1 - 3", "LIV"],
  ["EVE", "0 - 1", "BVB"],
  ["ARS", "6 - 1", "CHE"],
];

const leaderboard = [
  { name: "Adey O.", points: 718 },
  { name: "Kenny G.", points: 685 },
  { name: "Tolu A.", points: 615 },
  { name: "Favour J.", points: 592 },
  { name: "Emeka C.", points: 568 },
  { name: "David K.", points: 617 },
  { name: "Sarah M.", points: 552 },
  { name: "Blessing O.", points: 530 },
].sort((a, b) => b.points - a.points);

const highlights = [
  {
    title: "Perfect Finish",
    category: "GOALS & SKILLS",
    image: "https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=1000&q=85",
  },
  {
    title: "Match Day Moments",
    category: "MATCH HIGHLIGHTS",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85",
  },
  {
    title: "The Beautiful Game",
    category: "FOOTBALL STORIES",
    image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1000&q=85",
  },
];

const testimonials = [
  {
    name: "Agyemang_4110",
    avatar: "https://i.pravatar.cc/120?img=47",
    quote: "I've always loved football, and this platform makes following fixtures and predicting scores much more exciting. I love how easy it is to use.",
  },
  {
    name: "Ayanmi_4110",
    avatar: "https://i.pravatar.cc/120?img=44",
    quote: "The leaderboard gives me something to look forward to every match week. It's a great way to test my football knowledge against other fans.",
  },
  {
    name: "Ayodele_4110",
    avatar: "https://i.pravatar.cc/120?img=12",
    quote: "A simple and enjoyable experience for football lovers. I can make predictions, check results, and keep up with the competition in one place.",
  },
];

const faqs = [
  {
    question: "What is 9ja Parrot Picks?",
    answer:
      "9ja Parrot Picks is a football prediction platform where fans can predict match scores, follow fixtures, check results, and compete on a leaderboard.",
  },
  {
    question: "How to Play?",
    answer: "Create an account, select a match, enter your score prediction, and submit it before the prediction deadline. Check your points after the match.",
  },
  {
    question: "Is there a 9ja Parrot Picks app?",
    answer: "You can use the platform from your mobile phone or desktop browser. Check the official website for information about any dedicated app.",
  },
  {
    question: "Do I need money to play?",
    answer: "The platform is presented as free to use. Check the official terms and conditions for details about promotions, eligibility, and prizes.",
  },
  {
    question: "Can I edit my predictions?",
    answer: "Predictions can be edited before the match deadline if editing is enabled. Once the deadline passes, your prediction may be locked.",
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-9 text-center">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#3b8844]">{eyebrow}</p>}
      <h2 className="text-2xl font-bold tracking-tight text-[#215c28] sm:text-3xl">{title}</h2>
      {description && <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#788078]">{description}</p>}
    </div>
  );
}

function TeamLogo({ code, size = 30 }: { code: TeamCode; size?: number }) {
  const team = teams[code];

  return (
    <img
      src={`https://crests.football-data.org/${team.crest}.png`}
      alt={team.name}
      width={size}
      height={size}
      loading="lazy"
      title={team.name}
      className="shrink-0 object-contain"
    />
  );
}

function MatchPanel({ title, type }: { title: string; type: "fixtures" | "results" | "leaderboard" }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#70a979] bg-[#c1d9c0] shadow-sm transition hover:shadow-md">
      <div className="border-b border-[#9cbd9d] px-4 py-3 text-center">
        <h3 className="text-sm font-semibold text-[#234f27]">{title}</h3>
      </div>

      {type === "leaderboard" ? (
        <div className="px-3 pb-2">
          <div className="grid grid-cols-[28px_1fr_46px] gap-2 border-b border-[#a4c3a3] py-2 text-[10px] font-bold uppercase text-[#647464]">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Points</span>
          </div>

          {leaderboard.map((player, index) => (
            <div key={player.name} className="grid grid-cols-[28px_1fr_46px] items-center gap-2 border-b border-[#a4c3a3]/70 py-2 last:border-0">
              <span className="text-[11px] text-[#667166]">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-2">
                <img src={`https://i.pravatar.cc/64?img=${20 + index}`} alt="" className="h-6 w-6 rounded-full border border-white object-cover" />
                <span className="truncate text-[11px] font-medium text-[#34773b]">{player.name}</span>
              </div>
              <span className="text-right text-[11px] font-bold text-[#335c34]">{player.points}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1 px-3 py-2">
          {(type === "fixtures" ? fixtures : results).map((match, index) => {
            const home = match[0];
            const away = type === "fixtures" ? (match as [TeamCode, TeamCode])[1] : (match as [TeamCode, string, TeamCode])[2];

            const score = type === "results" ? (match as [TeamCode, string, TeamCode])[1] : "v";

            return (
              <div
                key={`${home}-${away}-${index}`}
                className="grid grid-cols-[1fr_36px_1fr] items-center gap-1 rounded-md px-1 py-2 transition hover:bg-white/30"
              >
                <div className="flex flex-col items-center gap-1">
                  <TeamLogo code={home} size={27} />
                  <span className="text-[9px] font-bold text-[#375d39]">{home}</span>
                </div>
                <span className="text-center text-[10px] font-semibold text-[#687a67]">{score}</span>
                <div className="flex flex-col items-center gap-1">
                  <TeamLogo code={away} size={27} />
                  <span className="text-[9px] font-bold text-[#375d39]">{away}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState(0);

  return (
    <main className="overflow-hidden">
      {/* Intro */}
      <section className="px-5 pb-8 pt-4 text-center sm:pt-7">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-[#c4ddc1] bg-white/50 px-3 py-1.5 text-[10px] font-semibold text-[#45834a]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          YOUR FOOTBALL. YOUR PREDICTIONS.
        </div>

        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#215d28] sm:text-4xl lg:text-5xl">
          STAY AHEAD OF THE GAME,
          <br />
          ALL FOR FREE
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#818a80]">
          From Analysis to Victory, Elevate your football
          <br className="hidden sm:block" />
          knowledge with our cutting-edge Prediction Platform.
        </p>

        <a
          href="#fixtures"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#21752f] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#165c25]"
        >
          Start Predicting <ArrowRight className="h-4 w-4" />
        </a>
      </section>

      <section className="relative isolate min-h-[330px] overflow-hidden border-y border-white/60 sm:min-h-[390px] lg:min-h-[440px]">
        <img src={Football.src} alt="Football stadium" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#e8f0e8]/90 via-[#e8f0e8]/80 to-[#e8f0e8]/55" />

        <div className="mx-auto grid min-h-[330px] max-w-7xl items-center gap-5 px-5 py-12 sm:min-h-[390px] sm:grid-cols-2 sm:px-10 lg:min-h-[440px] lg:px-16">
          <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
            <div className="flex h-full w-full rotate-[8deg] items-center justify-center p-2">
              <img src={Bro.src} alt="" className="h-full w-full object-contain object-center" />
            </div>
          </div>

          {/* Copy */}
          <div className="max-w-xl text-center sm:text-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#41854a]">THINK. PREDICT. WIN.</p>

            <h2 className="text-4xl font-black leading-tight text-[#205d29] sm:text-5xl lg:text-6xl">9JA PARROT PICKS</h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#677267] sm:mx-0">
              Correctly predict the final scores of 3 out of 5 football matches for a chance to win.
              <span className="font-extrabold text-red-600"> One million Naira</span> cash and other amazing consolation prizes.
            </p>

            <a
              href="#predictions"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1e702d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#165723]"
            >
              Explore Predictions
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-5 py-10 sm:grid-cols-4 sm:gap-5 sm:py-14 lg:px-10">
        {[
          { value: "100%", label: "Free to play" },
          { value: "5+", label: "Weekly fixtures" },
          { value: "1M+", label: "Prize opportunity" },
          { value: "24/7", label: "Football excitement" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#c8dec7] bg-white/50 px-4 py-5 text-center">
            <p className="text-2xl font-black text-[#287633] sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs text-[#758075]">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Match centre */}
      <section id="fixtures" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-8 lg:px-10 lg:py-12">
        <SectionHeading
          eyebrow="The competition starts here"
          title="Your Match Centre"
          description="Keep track of upcoming fixtures, climb the leaderboard, and review match results."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div id="predictions" className="scroll-mt-8">
            <MatchPanel title="Week 1 Fixtures" type="fixtures" />
          </div>

          <div id="leaderboard" className="scroll-mt-8">
            <MatchPanel title="Leaderboard" type="leaderboard" />
          </div>

          <div id="results" className="scroll-mt-8">
            <MatchPanel title="Latest Results" type="results" />
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#899389]">
          Sample demonstration data. Connect your football data API for live fixtures, scores, and rankings.
        </p>
      </section>

      {/* Highlights */}
      <section id="highlights" className="mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20">
        <SectionHeading
          eyebrow="Relive the action"
          title="Latest Highlights and Clips"
          description="Watch intriguing match highlights and the latest clips from the beautiful game."
        />

        <div className="relative">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, index) => (
              <article
                key={item.title}
                className={`group relative overflow-hidden rounded-xl bg-[#1a4221] transition ${index === 2 ? "hidden lg:block" : ""} ${
                  activeHighlight === index ? "ring-4 ring-[#287d38]" : "ring-0"
                }`}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-64 w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100 sm:h-72"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/5" />

                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[9px] font-extrabold tracking-wider text-[#267332]">
                  {item.category}
                </span>

                <div className="absolute inset-0 grid place-items-center">
                  <button
                    onClick={() => setActiveHighlight(index)}
                    aria-label={`Preview ${item.title}`}
                    className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-[#287d37]/80 text-white transition hover:scale-110"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-1 text-xs text-white/75">Football moments worth watching</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveHighlight((activeHighlight + highlights.length - 1) % highlights.length)}
              aria-label="Previous highlight"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#9abf9a] hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex gap-2">
              {highlights.map((item, index) => (
                <button
                  key={item.title}
                  aria-label={`Select highlight ${index + 1}`}
                  onClick={() => setActiveHighlight(index)}
                  className={`h-2 rounded-full transition-all ${activeHighlight === index ? "w-7 bg-[#287b36]" : "w-2 bg-[#b2cdb1]"}`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveHighlight((activeHighlight + 1) % highlights.length)}
              aria-label="Next highlight"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#9abf9a] hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-[#778477]">Selected: {highlights[activeHighlight].title}</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-10 lg:py-16">
        <SectionHeading
          eyebrow="Our community"
          title="Testimonials"
          description="We take pride in delivering an exceptional prediction experience. Here's what our community has to say."
        />

        <div className="grid gap-8 pt-3 md:grid-cols-3 md:gap-5">
          {testimonials.map((item) => (
            <article key={item.name} className="relative rounded-lg border border-[#b6d2b5] bg-white px-5 pb-6 pt-12 text-center shadow-sm">
              <img
                src={item.avatar}
                alt={item.name}
                className="absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-[#8dbb8b] object-cover"
                loading="lazy"
              />

              <p className="text-sm font-bold text-[#285c2e]">{item.name}</p>

              <div className="my-3 flex justify-center gap-1 text-[#e4b846]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-3 w-3 fill-current" />
                ))}
              </div>

              <p className="text-xs leading-6 text-[#858c83]">“{item.quote}”</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-14 lg:px-10 lg:py-20">
        <div className="mb-8 flex items-end justify-between border-b border-[#b8ceb7] pb-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#488b4c]">Need some help?</p>
            <h2 className="text-2xl font-bold text-[#245c2b] sm:text-3xl">Frequently Asked Questions</h2>
          </div>

          <CircleHelp className="mb-1 h-9 w-9 text-[#44854a]" />
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
            <img src={faqImage.src} alt="faq Logo" className="h-full w-full object-cover object-center" />
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-xl border transition ${
                  activeFaq === index ? "border-[#a5caa4] bg-white shadow-sm" : "border-transparent bg-white"
                }`}
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[#677167] transition hover:text-[#287632]"
                  aria-expanded={activeFaq === index}
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  {faq.question}

                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${activeFaq === index ? "rotate-180 text-[#278037]" : ""}`} />
                </button>

                {activeFaq === index && <p className="px-5 pb-5 text-sm leading-6 text-[#788278]">{faq.answer}</p>}
              </div>
            ))}

            <a
              href="mailto:support@parrotpicks.com"
              className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-md border border-[#aac5a8] px-4 py-2 text-xs font-semibold text-[#447448] transition hover:bg-white"
            >
              More FAQs <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-5 pb-14">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#1d6e2b] px-6 py-10 text-center text-white sm:px-12 sm:py-14">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[30px] border-white/5" />
          <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full border-[25px] border-white/5" />

          <p className="relative mb-3 text-xs font-bold uppercase tracking-[0.25em] text-lime-200">Every match tells a story</p>

          <h2 className="relative text-2xl font-extrabold sm:text-4xl">Ready to test your football knowledge?</h2>

          <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-white/75">Join the community, make your predictions, and see where you rank.</p>

          <a
            href="#fixtures"
            className="relative mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#206b2c] transition hover:bg-lime-100"
          >
            Explore Match Centre <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
