import { BrandIcon, ChevronDownIcon } from "./HomeIcons";

export default function HomeTopNav({ userName = "James Jam Cow" }) {
  return (
    <header className="flex items-center justify-between border-b border-[#b8b0a5] bg-[#efefef] px-4 py-3 md:px-7">
      <div className="flex min-w-0 items-center gap-2">
        <BrandIcon className="h-[22px] w-[22px] shrink-0 text-[#121212]" />
        <span className="text-3xl font-medium tracking-[-0.02em] text-[#141414] md:text-[1.85rem]">
          Screwceus
        </span>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-[#141414] transition-opacity hover:opacity-80"
      >
        {userName}
        <ChevronDownIcon className="h-4 w-4" />
      </button>
    </header>
  );
}
