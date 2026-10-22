"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChartColumn, ChevronDown, ChevronUp, Goal } from "lucide-react";
import Football from "@/assets/images/football.jpg";
type Fixture = {
  id: number;
  league: "Premier League" | "LaLiga";
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  date: string;
};

type Prediction = {
  home: number;
  away: number;
};

const fixtures: Fixture[] = [
  {
    id: 1,
    league: "Premier League",
    home: "Chelsea",
    away: "Arsenal",
    homeLogo: "https://resources.premierleague.com/premierleague/badges/70/t8.png",
    awayLogo: "https://resources.premierleague.com/premierleague/badges/70/t3.png",
    date: "Sat 6 Apr, 17:00",
  },
  {
    id: 2,
    league: "Premier League",
    home: "Chelsea",
    away: "Arsenal",
    homeLogo: "https://resources.premierleague.com/premierleague/badges/70/t8.png",
    awayLogo: "https://resources.premierleague.com/premierleague/badges/70/t3.png",
    date: "Sat 6 Apr, 17:00",
  },
  {
    id: 3,
    league: "Premier League",
    home: "Chelsea",
    away: "Arsenal",
    homeLogo: "https://resources.premierleague.com/premierleague/badges/70/t8.png",
    awayLogo: "https://resources.premierleague.com/premierleague/badges/70/t3.png",
    date: "Sat 6 Apr, 17:00",
  },
  {
    id: 4,
    league: "Premier League",
    home: "Chelsea",
    away: "Arsenal",
    homeLogo: "https://resources.premierleague.com/premierleague/badges/70/t8.png",
    awayLogo: "https://resources.premierleague.com/premierleague/badges/70/t3.png",
    date: "Sat 6 Apr, 17:00",
  },
  {
    id: 5,
    league: "LaLiga",
    home: "Barcelona",
    away: "Osasuna",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/d/db/CA_Osasuna_logo.svg",
    date: "Sat 6 Apr, 17:00",
  },
  {
    id: 6,
    league: "LaLiga",
    home: "Barcelona",
    away: "Osasuna",
    homeLogo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    awayLogo: "https://upload.wikimedia.org/wikipedia/en/d/db/CA_Osasuna_logo.svg",
    date: "Sat 6 Apr, 17:00",
  },
];

function LeagueLogo({ league }: { league: Fixture["league"] }) {
  if (league === "LaLiga") {
    return <span className="font-[Impact,sans-serif] text-[24px] leading-none tracking-tight text-[#ff514e]">LALIGA</span>;
  }

  return (
    <div className="flex items-center gap-1.5 text-[#401044]">
      <span className="text-[27px] leading-none">♛</span>
      <span className="text-[10px] font-extrabold leading-[10px]">
        Premier
        <br />
        League
      </span>
    </div>
  );
}

function ScoreControl({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <div className="flex w-8 flex-col items-center">
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={value >= 20}
        className="flex h-5 w-8 items-center justify-center text-gray-800 transition hover:text-[#20772b] disabled:opacity-30"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>

      <span className="min-w-6 text-center text-[18px] font-normal leading-6 text-[#171717]">{value}</span>

      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className="flex h-5 w-8 items-center justify-center text-gray-500 transition hover:text-[#20772b] disabled:opacity-30"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FixtureCard({
  fixture,
  prediction,
  onPredictionChange,
}: {
  fixture: Fixture;
  prediction: Prediction;
  onPredictionChange: (prediction: Prediction) => void;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-xl bg-[#e8f1e7] px-3 py-3.5 shadow-sm transition hover:shadow-md sm:px-4 sm:py-4">
      {/* League and kickoff */}
      <div className="flex min-h-9 items-start justify-between gap-2">
        <LeagueLogo league={fixture.league} />
        <span className="pt-1 text-[8px] text-[#444] sm:text-[9px]">{fixture.date}</span>
      </div>

      {/* Match and score prediction */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 py-3 sm:gap-3 sm:py-4">
        <div className="flex min-w-0 flex-col items-center">
          <img src={fixture.homeLogo} alt={`${fixture.home} logo`} className="h-11 w-11 object-contain sm:h-14 sm:w-14" />
          <span className="mt-1 max-w-full truncate text-center text-xs text-[#292929] sm:text-sm">{fixture.home}</span>
        </div>

        <div className="flex items-center justify-center gap-1 sm:gap-3">
          <ScoreControl label={`${fixture.home} score`} value={prediction.home} onChange={(home) => onPredictionChange({ ...prediction, home })} />

          <span className="px-0.5 text-sm text-gray-500 sm:px-1 sm:text-lg">V</span>

          <ScoreControl label={`${fixture.away} score`} value={prediction.away} onChange={(away) => onPredictionChange({ ...prediction, away })} />
        </div>

        <div className="flex min-w-0 flex-col items-center">
          <img src={fixture.awayLogo} alt={`${fixture.away} logo`} className="h-11 w-11 object-contain sm:h-14 sm:w-14" />
          <span className="mt-1 max-w-full truncate text-center text-xs text-[#292929] sm:text-sm">{fixture.away}</span>
        </div>
      </div>

      {/* Card actions */}
      <div className="mt-1 flex items-center justify-between border-t border-[#d2e0d0] pt-3">
        <Link href={`/fixtures/${fixture.id}/stats`} className="group flex flex-col items-start text-[#9a7100] transition hover:text-[#216e28]">
          <ChartColumn className="ml-0.5 h-6 w-6 text-[#247b30] sm:h-7 sm:w-7" />
          <span className="mt-0.5 text-xs sm:text-sm">Stats</span>
        </Link>

        <Link href={`/fixtures/${fixture.id}`} className="group flex flex-col items-center text-[#9a7100] transition hover:text-[#216e28]">
          <Goal className="h-6 w-6 text-[#343a40] sm:h-7 sm:w-7" />
          <span className="mt-0.5 text-xs sm:text-sm">Matches</span>
        </Link>
      </div>
    </article>
  );
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Record<number, Prediction>>(() =>
    Object.fromEntries(fixtures.map((fixture) => [fixture.id, { home: 0, away: 0 }])),
  );

  const [remaining, setRemaining] = useState({
    days: 2,
    hours: 14,
    minutes: 48,
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        let { days, hours, minutes } = current;

        if (minutes > 0) {
          minutes -= 1;
        } else {
          minutes = 59;

          if (hours > 0) {
            hours -= 1;
          } else {
            hours = 23;
            days = Math.max(0, days - 1);
          }
        }

        return { days, hours, minutes };
      });
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  function updatePrediction(id: number, prediction: Prediction) {
    setPredictions((current) => ({
      ...current,
      [id]: prediction,
    }));
    setMessage("");
  }

  async function submitPicks() {
    setSubmitting(true);
    setMessage("");

    try {
      // Replace with your real predictions API endpoint.
      // const response = await fetch("/api/predictions", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ predictions }),
      // });
      //
      // if (!response.ok) throw new Error("Could not submit picks.");
      // setMessage("Your picks have been submitted successfully.");

      setMessage("Connect your predictions API to submit your picks.");
    } catch {
      setMessage("Unable to submit your picks. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 pb-24 pt-7 sm:px-6 sm:pb-32 lg:px-8">
      {/* Football background, behind content only */}
      <div className="pointer-events-none absolute inset-0 -z-20">
        <img src={Football.src} alt="football" className="h-full w-full object-cover object-center" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-white/55" />

      <div className="mx-auto max-w-[1100px]">
        {/* Introductory message */}
        <p className="mx-auto max-w-[390px] text-center text-sm font-semibold leading-[18px] text-[#648c39] sm:max-w-[430px] sm:text-base sm:leading-[21px]">
          This week&apos;s matchups are set. Are you ready to predict the scores? Your insight could lead you to the top of the leaderboard and win money for
          free! Show off your skills and score big!
        </p>

        {/* Heading and countdown */}
        <div className="mb-8 mt-7 flex flex-wrap items-start justify-between gap-4 sm:mb-10 sm:mt-8">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#4d914d] sm:text-2xl">PREDICTIONS</h1>
            <p className="mt-3 max-w-[340px] text-sm leading-5 text-gray-400">
              These are the top Picks of the week chosen from the top Major leagues in the World
            </p>
          </div>

          <div
            className="pt-0.5 text-xl font-semibold tracking-tight text-gray-400 sm:text-2xl"
            aria-label={`${remaining.days} days ${remaining.hours} hours ${remaining.minutes} minutes remaining`}
          >
            {String(remaining.days).padStart(2, "0")}d {String(remaining.hours).padStart(2, "0")}h {String(remaining.minutes).padStart(2, "0")}m
          </div>
        </div>

        {/* Predictions grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {fixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              prediction={predictions[fixture.id]}
              onPredictionChange={(prediction) => updatePrediction(fixture.id, prediction)}
            />
          ))}
        </div>

        {/* Submit predictions */}
        <div className="mt-9 flex flex-col items-center sm:mt-11">
          <button
            type="button"
            onClick={submitPicks}
            disabled={submitting}
            className="flex min-h-[58px] w-full max-w-[350px] items-center justify-center gap-3 rounded-lg bg-[#23772a] px-6 py-4 text-base font-semibold text-[#ffe32e] shadow-sm transition hover:bg-[#1b6522] focus:outline-none focus:ring-2 focus:ring-[#23772a] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[64px] sm:text-lg"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT YOUR PICKS"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>

          {message && (
            <p role="status" className="mt-4 max-w-md text-center text-sm font-medium text-[#216e28]">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
