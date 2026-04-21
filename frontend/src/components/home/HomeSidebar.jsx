import { useEffect, useRef, useState } from "react";
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

export default function HomeSidebar({ onNewFolder, onNewProject }) {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target)) {
        setIsCreateMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleNewFolderClick() {
    setIsCreateMenuOpen(false);
    onNewFolder?.();
  }

  function handleNewProjectClick() {
    setIsCreateMenuOpen(false);
    onNewProject?.();
  }

  return (
    <aside className="border-b border-[#c9c1b6] px-4 py-6 md:border-b-0 md:border-r md:px-5">
      <div className="relative w-full max-w-[168px]" ref={createMenuRef}>
        <button
          type="button"
          className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-[7px] bg-[#7d6e5f] text-base font-semibold text-white transition-opacity hover:opacity-90"
          onClick={() => setIsCreateMenuOpen((prev) => !prev)}
          aria-expanded={isCreateMenuOpen}
          aria-haspopup="menu"
        >
          Create
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>

        {isCreateMenuOpen && (
          <div
            className="absolute left-0 z-20 mt-2 w-full rounded-[7px] border border-[#b8b0a5] bg-[#efefef] p-1 shadow-sm"
            role="menu"
            aria-label="Create menu"
          >
            <button
              type="button"
              className="w-full rounded-[5px] px-3 py-2 text-left text-[0.95rem] text-[#171717] transition-colors hover:bg-[#e7e5e2]"
              role="menuitem"
              onClick={handleNewFolderClick}
            >
              New Folder
            </button>
            <button
              type="button"
              className="w-full rounded-[5px] px-3 py-2 text-left text-[0.95rem] text-[#171717] transition-colors hover:bg-[#e7e5e2]"
              role="menuitem"
              onClick={handleNewProjectClick}
            >
              New Project
            </button>
          </div>
        )}
      </div>

      <nav className="mt-7 grid gap-1 sm:grid-cols-2 md:grid-cols-1" aria-label="Home sections">
        {navItems.map((item) => (
          <SidebarItem key={item.label} label={item.label} icon={item.icon} />
        ))}
      </nav>
    </aside>
  );
}
