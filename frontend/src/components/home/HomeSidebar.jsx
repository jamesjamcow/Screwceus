import { OrganizationSwitcher, UserButton } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";

import { useCommandPalette } from "../search/CommandPaletteContext";
import { NavIcon } from "./HomeIcons";

const WORKSPACE_ITEMS = [
  { id: "projects", label: "Projects", icon: "projects" },
  { id: "issues", label: "Issues", icon: "issues" },
  { id: "inventory", label: "Inventory", icon: "inventory" },
];

function NavButton({ active, icon, label, onClick, subtle = false }) {
  return (
    <button
      type="button"
      className={`linear-nav-item w-full min-w-0 h-[33px] flex items-center gap-[9px] py-0 px-[9px] border-0 rounded-[6px] text-[#96979c] bg-transparent text-left cursor-pointer [&:hover]:text-[#ededee] [&:hover]:bg-[var(--linear-nav-hover)] [&.is-active]:text-[#f3f3f4] [&.is-active]:bg-[var(--linear-nav-current)] [&.is-active:hover]:bg-[var(--linear-nav-current)] [&.is-subtle]:text-[#76787d] [&.is-subtle:hover]:text-[#ededee] [&.is-subtle.is-active]:text-[#f3f3f4]${active ? " is-active" : ""}${subtle ? " is-subtle" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <NavIcon type={icon} className="linear-nav-icon w-[17px] h-[17px] flex-none" />
      <span>{label}</span>
    </button>
  );
}

export default function HomeSidebar({
  activeView,
  activeTeamId,
  onSelect,
  onDeleteTeam,
  deletingTeamId = null,
  teams = [],
}) {
  const { openPalette } = useCommandPalette();
  const [openTeamMenu, setOpenTeamMenu] = useState(null);
  const [confirmTeamId, setConfirmTeamId] = useState(null);
  const [menuError, setMenuError] = useState("");
  const teamMenuRef = useRef(null);

  useEffect(() => {
    if (!openTeamMenu) return undefined;

    function closeOnPointerDown(event) {
      if (!teamMenuRef.current?.contains(event.target)) {
        setOpenTeamMenu(null);
        setConfirmTeamId(null);
        setMenuError("");
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpenTeamMenu(null);
        setConfirmTeamId(null);
        setMenuError("");
      }
    }

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openTeamMenu]);

  function toggleTeamMenu(teamId) {
    setConfirmTeamId(null);
    setMenuError("");
    setOpenTeamMenu((current) => (current === teamId ? null : teamId));
  }

  async function deleteTeamSpace(team) {
    if (!onDeleteTeam) return;

    setMenuError("");
    try {
      await onDeleteTeam(team);
      setOpenTeamMenu(null);
      setConfirmTeamId(null);
    } catch (error) {
      setMenuError(error?.message || "Could not delete the team.");
    }
  }

  return (
    <aside className="linear-sidebar sticky top-0 h-screen flex flex-col min-w-0 pt-[18px] pr-[9px] pb-[11px] pl-[9px] border-r border-r-[#1c1d20] bg-[var(--linear-sidebar)] text-[14px] [@media_(max-width:720px)]:relative [@media_(max-width:720px)]:w-full [@media_(max-width:720px)]:h-auto [@media_(max-width:720px)]:min-h-0 [@media_(max-width:720px)]:pt-[13px] [@media_(max-width:720px)]:border-r-0 [@media_(max-width:720px)]:border-b [@media_(max-width:720px)]:border-b-[var(--linear-border)]">
      <div className="linear-sidebar__top grid items-center gap-[5px] min-h-[42px] pt-[2px] pr-0 pb-[6px] pl-[5px]">
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          appearance={{
            elements: {
              rootBox: "linear-org-root w-full min-w-0",
              organizationSwitcherTrigger: "linear-org-trigger",
              organizationPreviewMainIdentifier: "linear-org-name",
              organizationPreviewSecondaryIdentifier: "linear-org-secondary",
              organizationPreviewAvatarBox: "linear-org-avatar",
              organizationSwitcherTriggerIcon: "linear-org-chevron",
            },
          }}
        />
        <button
          type="button"
          className="linear-icon-button inline-grid place-items-center border-0 text-[#9a9ba0] bg-transparent cursor-pointer w-[31px] h-[31px] rounded-full [&:hover]:text-[#fff] [&:hover]:bg-[#26272b]"
          aria-label="Search workspace"
          title="Search workspace (Ctrl/⌘ K)"
          onClick={openPalette}
        >
          <NavIcon type="search" className="linear-top-icon w-[17px] h-[17px]" />
        </button>
      </div>

      <nav className="linear-sidebar__nav min-h-0 flex-1 overflow-y-auto pt-[14px] [&::-webkit-scrollbar]:hidden [@media_(max-width:720px)]:grid [@media_(max-width:720px)]:grid-cols-2 [@media_(max-width:720px)]:gap-[14px] [@media_(max-width:720px)]:max-h-[245px]" aria-label="Workspace navigation">
        <section className="linear-nav-section [&+.linear-nav-section]:mt-[27px] [@media_(max-width:720px)]:[&+.linear-nav-section]:mt-0">
          <div className="linear-section-label flex items-center gap-[4px] min-h-[30px] py-0 px-[8px] text-[#77797e] text-[14px]">
            <span>My workspace</span>
          </div>
          <div className="linear-nav-stack grid gap-[2px]">
            {WORKSPACE_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                {...item}
                active={activeView === item.id && !activeTeamId}
                onClick={() => onSelect(item.id)}
              />
            ))}
          </div>
        </section>

        <section className="linear-nav-section [&+.linear-nav-section]:mt-[27px] [@media_(max-width:720px)]:[&+.linear-nav-section]:mt-0 linear-teams-section [@media_(max-width:720px)]:col-span-full">
          <div className="linear-section-label flex items-center gap-[4px] min-h-[30px] py-0 px-[8px] rounded-[6px] text-[#77797e] text-[14px] bg-transparent linear-teams-heading [&:hover]:text-[#ededee] [&:hover]:bg-[var(--linear-nav-hover)] [&:focus-within]:text-[#ededee] [&:focus-within]:bg-[var(--linear-nav-hover)]">
            <span>Your teams</span>
            <button
              type="button"
              className="linear-teams-heading__create w-[25px] h-[25px] grid place-items-center ml-auto p-0 border-0 rounded-[6px] text-[#aaa] bg-transparent cursor-pointer [&:hover]:text-[#ededee] [&:hover]:bg-[#222327] [&_svg]:w-[14px] [&_svg]:h-[14px]"
              aria-label="Create a new team"
              title="Create a new team"
              onClick={() => onSelect("create-team")}
            >
              <NavIcon type="plus" />
            </button>
          </div>
          <div className="linear-team-list grid gap-[10px] [@media_(max-width:720px)]:grid-cols-2">
            {teams.map((team) => {
              const teamId = String(team.id);
              const isCurrent = activeView === "team" && String(activeTeamId) === teamId;
              const menuOpen = openTeamMenu === teamId;
              const confirmOpen = confirmTeamId === teamId;
              const canDelete = team.key !== "GENERAL" && team.role === "admin";
              const deleteDisabledReason = team.key === "GENERAL"
                ? "The default General team cannot be deleted."
                : "Only team admins can delete this team.";
              const isDeleting = String(deletingTeamId) === teamId;

              return (
                <div className={`linear-team relative [&:hover_.linear-team__more]:opacity-100 [&:hover_.linear-team__more]:pointer-events-auto [&:focus-within_.linear-team__more]:opacity-100 [&:focus-within_.linear-team__more]:pointer-events-auto [&.has-menu-open_.linear-team__more]:opacity-100 [&.has-menu-open_.linear-team__more]:pointer-events-auto [&.has-menu-open_.linear-team__more]:text-[#ededee] [&.has-menu-open_.linear-team__more]:bg-[#34353b]${menuOpen ? " has-menu-open" : ""}`} key={team.id}>
                  <button
                    type="button"
                    className={`linear-team__title w-full h-[31px] grid items-center gap-[8px] py-0 px-[9px] border-0 rounded-[6px] text-[#9c9da2] bg-transparent text-left cursor-pointer [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:overflow-hidden [&>span:nth-child(2)]:text-ellipsis [&>span:nth-child(2)]:whitespace-nowrap [&:hover]:text-[#ededee] [&:hover]:bg-[var(--linear-nav-hover)] [&.is-current]:text-[#f3f3f4] [&.is-current]:bg-[var(--linear-nav-current)] [&.is-current:hover]:text-[#f3f3f4] [&.is-current:hover]:bg-[var(--linear-nav-current)]${isCurrent ? " is-current" : ""}`}
                    onClick={() => onSelect("team", team.id)}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <span className="linear-team__mark w-[16px] h-[16px] grid place-items-center rounded-full text-[#fff] text-[9px] font-[750] uppercase" style={{ background: team.color }}>
                      {team.key.slice(0, 1)}
                    </span>
                    <span>{team.name}</span>
                  </button>

                  <div className="linear-team__actions absolute top-[3px] right-[5px] z-[20]" ref={menuOpen ? teamMenuRef : null}>
                    <button
                      type="button"
                      className="linear-team__more w-[25px] h-[25px] grid place-items-center p-0 border-0 rounded-[5px] text-[#85878d] bg-transparent cursor-pointer opacity-0 pointer-events-none [&:hover]:text-[#ededee] [&:hover]:bg-[#34353b] [&:focus-visible]:text-[#ededee] [&:focus-visible]:bg-[#34353b] [&_svg]:w-[15px] [&_svg]:h-[15px] [@media_(hover:none)]:opacity-100 [@media_(hover:none)]:pointer-events-auto"
                      aria-label={`Open actions for ${team.name}`}
                      aria-expanded={menuOpen}
                      aria-controls={menuOpen ? `linear-team-menu-${team.id}` : undefined}
                      title="Team actions"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTeamMenu(teamId);
                      }}
                    >
                      <NavIcon type="more" />
                    </button>

                    {menuOpen ? (
                      <div className="linear-team-menu absolute top-[30px] right-0 z-[40] w-[218px] p-[5px] border border-[#34363c] rounded-[8px] bg-[#18191c]" id={`linear-team-menu-${team.id}`} role="menu">
                        {confirmOpen ? (
                          <div className="linear-team-menu__confirm grid gap-[8px] p-[7px] [&_strong]:text-[#f0d4d7] [&_strong]:text-[12px] [&_strong]:font-[620] [&_span]:text-[#8b8d94] [&_span]:text-[11px] [&_span]:leading-[1.35] [&_div]:flex [&_div]:justify-end [&_div]:gap-[6px] [&_div]:pt-[2px] [&_button]:h-[28px] [&_button]:py-0 [&_button]:px-[9px] [&_button]:border [&_button]:border-[#34363c] [&_button]:rounded-[6px] [&_button]:text-[#d4d5d8] [&_button]:bg-[#202125] [&_button]:cursor-pointer [&_button:hover:not(:disabled)]:border-[#464850] [&_button:hover:not(:disabled)]:text-[#f0f0f2] [&_button:hover:not(:disabled)]:bg-[#2a2b31] [&_button.is-danger]:border-[#704046] [&_button.is-danger]:text-[#fff] [&_button.is-danger]:bg-[#a6404b] [&_button.is-danger:hover:not(:disabled)]:bg-[#bd4b58] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-[.62]">
                            <strong>Delete "{team.name}"?</strong>
                            <span>This permanently removes the team space and its workspace data.</span>
                            <div>
                              <button type="button" onClick={() => setConfirmTeamId(null)} disabled={isDeleting}>
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="is-danger"
                                onClick={() => deleteTeamSpace(team)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="linear-team-menu__item w-full h-[32px] flex items-center gap-[8px] py-0 px-[9px] border-0 rounded-[6px] text-[#d1d2d5] bg-transparent text-left cursor-pointer [&:hover:not(:disabled)]:bg-[#24252a] [&:disabled]:text-[#6d7077] [&:disabled]:cursor-not-allowed [&.is-danger]:text-[#e49aa2] [&_svg]:w-[15px] [&_svg]:h-[15px] is-danger"
                              role="menuitem"
                              disabled={!canDelete}
                              onClick={() => {
                                if (canDelete) setConfirmTeamId(teamId);
                              }}
                            >
                              <NavIcon type="trash" />
                              <span>Delete team space</span>
                            </button>
                            {!canDelete ? <div className="linear-team-menu__note text-[#8b8d94] text-[11px] leading-[1.35] mt-[5px] mr-[4px] mb-[3px] ml-[4px] py-[7px] px-[8px] rounded-[6px] bg-[#111214]">{deleteDisabledReason}</div> : null}
                          </>
                        )}
                        {menuError ? <div className="linear-team-menu__error mt-[5px] mr-[4px] mb-[3px] ml-[4px] py-[7px] px-[8px] rounded-[6px] bg-[#111214] border border-[#5d373c] text-[#e1a1a7] bg-[#291719] text-[11px] leading-[1.35]" role="alert">{menuError}</div> : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="linear-team__links grid gap-[2px] pl-[18px] [&_.linear-nav-item]:h-[31px]">
                    <NavButton
                      label="Projects"
                      icon="projects"
                      subtle
                      active={activeView === "team-projects" && String(activeTeamId) === teamId}
                      onClick={() => onSelect("team-projects", team.id)}
                    />
                    <NavButton
                      label="Issues"
                      icon="issues"
                      subtle
                      active={activeView === "team-issues" && String(activeTeamId) === teamId}
                      onClick={() => onSelect("team-issues", team.id)}
                    />
                    <NavButton
                      label="Inventory"
                      icon="inventory"
                      subtle
                      active={activeView === "team-inventory" && String(activeTeamId) === teamId}
                      onClick={() => onSelect("team-inventory", team.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </nav>

      <div className="linear-sidebar__account flex items-center gap-[9px] min-w-0 pt-[11px] pr-[6px] pb-[1px] pl-[6px] border-t border-t-[#1a1b1e] [@media_(max-width:720px)]:hidden">
        <UserButton
          showName
          appearance={{
            elements: {
              userButtonBox: "linear-user-button",
              userButtonAvatarBox: "linear-user-avatar",
              userButtonOuterIdentifier: "linear-user-name",
            },
          }}
        />
      </div>
    </aside>
  );
}
