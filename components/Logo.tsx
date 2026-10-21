export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className="flex shrink-0 items-center gap-2">
      <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-white/30 bg-[#17682a]">
        <img
          src="https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=100&h=100&q=80"
          alt="Parrot Picks"
          className="h-full w-full object-cover"
        />
      </span>
      <span
        className={`text-xl font-extrabold leading-[1.05] tracking-tight ${
          light ? "text-lime-400" : "text-[#19752b]"
        }`}
      >
        Parrot
        <br />
        Picks
      </span>
    </a>
  );
}