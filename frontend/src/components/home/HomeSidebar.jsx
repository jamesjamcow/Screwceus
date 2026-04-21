import { ChevronDownIcon, SidebarIcon } from "./HomeIcons";

const navItems = [
  { label: "Owned by me", icon: "home" },
  { label: "Recently Edited", icon: "inbox" },
  { label: "Created by me", icon: "cube" },
  { label: "Inventory", icon: "grid" },
];

function SidebarItem({ label, icon }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded px-1 py-1.5 text-left text-[0.95rem] text-[#171717] transition-colors hover:bg-[#e7e5e2]"
    >
      <SidebarIcon type={icon} className="h-[14px] w-[14px] shrink-0 text-[#181818]" />
      <span>{label}</span>
    </button>
  );
}

export default function HomeSidebar() {
  return (
    <aside className="border-b border-[#c9c1b6] px-4 py-6 md:border-b-0 md:border-r md:px-5">
      <button
        type="button"
        className="inline-flex h-[46px] w-full max-w-[168px] items-center justify-center gap-2 rounded-[7px] bg-[#7d6e5f] text-base font-semibold text-white transition-opacity hover:opacity-90"
      >
        Create
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>

      <nav className="mt-7 grid gap-1 sm:grid-cols-2 md:grid-cols-1" aria-label="Home sections">
        {navItems.map((item) => (
          <SidebarItem key={item.label} label={item.label} icon={item.icon} />
        ))}
      </nav>
    </aside>
  );
}
