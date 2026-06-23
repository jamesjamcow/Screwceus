import { OrganizationSwitcher, UserButton, useOrganization } from "@clerk/clerk-react";

import { NavIcon } from "./HomeIcons";

const PRIMARY_ITEMS = [
  { id: "inbox", label: "Inbox", icon: "inbox" },
  { id: "my-issues", label: "My issues", icon: "issues" },
];

const WORKSPACE_ITEMS = [
  { id: "projects", label: "Projects", icon: "projects" },
  { id: "inventory", label: "Inventory", icon: "inventory" },
  { id: "more", label: "More", icon: "more" },
];

function NavButton({ active, icon, label, onClick, subtle = false }) {
  return (
    <button
      type="button"
      className={`linear-nav-item${active ? " is-active" : ""}${subtle ? " is-subtle" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <NavIcon type={icon} className="linear-nav-icon" />
      <span>{label}</span>
    </button>
  );
}

export default function HomeSidebar({ activeView, activeTeamId, onSelect, teams = [] }) {
  const { organization } = useOrganization();

  return (
    <aside className="linear-sidebar">
      <div className="linear-sidebar__top">
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          appearance={{
            elements: {
              rootBox: "linear-org-root",
              organizationSwitcherTrigger: "linear-org-trigger",
              organizationPreviewMainIdentifier: "linear-org-name",
              organizationPreviewSecondaryIdentifier: "linear-org-secondary",
              organizationSwitcherTriggerIcon: "linear-org-chevron",
            },
          }}
        />
        <button type="button" className="linear-icon-button" aria-label="Search workspace">
          <NavIcon type="search" className="linear-top-icon" />
        </button>
        <button type="button" className="linear-compose-button" aria-label="Create new project" onClick={() => onSelect("new-project")}>
          <NavIcon type="compose" className="linear-top-icon" />
        </button>
      </div>

      <nav className="linear-sidebar__nav" aria-label="Workspace navigation">
        <div className="linear-nav-stack linear-nav-stack--primary">
          {PRIMARY_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              {...item}
              active={activeView === item.id}
              onClick={() => onSelect(item.id)}
            />
          ))}
        </div>

        <section className="linear-nav-section">
          <div className="linear-section-label">
            <span>Workspace</span>
            <NavIcon type="chevron-down" className="linear-section-chevron" />
          </div>
          <div className="linear-nav-stack">
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

        <section className="linear-nav-section linear-teams-section">
          <div className="linear-section-label">
            <span>Your teams</span>
            <NavIcon type="chevron-down" className="linear-section-chevron" />
          </div>
          <div className="linear-team-list">
            {teams.map((team) => (
              <div className="linear-team" key={team.id}>
                <button
                  type="button"
                  className={`linear-team__title${
                    activeView === "team" && String(activeTeamId) === String(team.id) ? " is-current" : ""
                  }`}
                  onClick={() => onSelect("team", team.id)}
                  aria-current={
                    activeView === "team" && String(activeTeamId) === String(team.id) ? "page" : undefined
                  }
                >
                  <span className="linear-team__mark" style={{ background: team.color }}>
                    {team.key.slice(0, 1)}
                  </span>
                  <span>{team.name}</span>
                  <NavIcon type="chevron-down" className="linear-team__chevron" />
                </button>
                <div className="linear-team__links">
                  <NavButton
                    label="Projects"
                    icon="projects"
                    subtle
                    active={activeView === "team-projects" && String(activeTeamId) === String(team.id)}
                    onClick={() => onSelect("team-projects", team.id)}
                  />
                  <NavButton
                    label="Issues"
                    icon="issues"
                    subtle
                    active={activeView === "team-issues" && String(activeTeamId) === String(team.id)}
                    onClick={() => onSelect("team-issues", team.id)}
                  />
                  <NavButton
                    label="Inventory"
                    icon="inventory"
                    subtle
                    active={activeView === "team-inventory" && String(activeTeamId) === String(team.id)}
                    onClick={() => onSelect("team-inventory", team.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </nav>

      <div className="linear-sidebar__account">
        <UserButton
          showName
          appearance={{
            elements: {
              userButtonBox: "linear-user-button",
              userButtonOuterIdentifier: "linear-user-name",
            },
          }}
        />
        <span className="linear-sidebar__org-hint">{organization?.name}</span>
      </div>
    </aside>
  );
}
