import { NavLink, useLocation } from "react-router-dom";

import { toPathSafeProjectId } from "../../lib/projectRouting";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", Icon: OverviewIcon },
  { id: "design", label: "Design", Icon: DesignIcon },
  { id: "labeling", label: "Labeling", Icon: LabelingIcon },
  { id: "assemble", label: "Assemble", Icon: AssembleIcon },
];

export default function ProjectMiniNav({ projectId }) {
  const routeProjectId = toPathSafeProjectId(projectId);
  const location = useLocation();
  const isDesignWorkflow = location.pathname.endsWith("/new-entry");

  return (
    <nav aria-label="Project sections" className="project-subnav h-[51px] flex items-end gap-[23px]">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const href = resolveTabHref(id, routeProjectId);

        return (
          <NavLink
            key={id}
            to={href}
            end
            className={({ isActive }) => (
              `project-subnav__link relative h-[43px] inline-flex items-center gap-[7px] pt-[4px] pr-[2px] pb-0 pl-[2px] text-[#77797f] text-[12px] no-underline [&::after]:absolute [&::after]:right-0 [&::after]:bottom-[-1px] [&::after]:left-0 [&::after]:h-[1px] [&::after]:bg-transparent [&:hover]:text-[#c6c6c9] [&.is-active]:text-[#f0f0f2] [&.is-active::after]:bg-[#8e91e8]${isActive || (id === "design" && isDesignWorkflow) ? " is-active" : ""}`
            )}
          >
            {renderIcon(Icon)}
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function renderIcon(IconComponent) {
  return IconComponent({ className: "project-subnav__icon w-[15px] h-[15px]" });
}

function resolveTabHref(tabId, projectId) {
  if (tabId === "design") {
    return `/project/${projectId}`;
  }
  if (tabId === "overview") {
    return `/project/${projectId}/overview`;
  }
  if (tabId === "labeling") {
    return `/project/${projectId}/labeling`;
  }
  if (tabId === "assemble") {
    return `/project/${projectId}/assemble`;
  }
  return null;
}

function DesignIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5m-7.1-8.4c-.9 2.3 0 4.4 1.5 5.6 1.4 1.2 2.8 2.1 2.8 4.3a5.8 5.8 0 1 1-11.6 0c0-4.4 2.8-8.4 7.3-9.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OverviewIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M14.7 4.4A8 8 0 1 0 20 12m-5.3-7.6L20 4l-.5 5.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LabelingIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M5 7.5 12 4l7 3.5v8.9L12 20l-7-3.6Zm7-3.5v16m-7-12.5 7 3.5 7-3.5m-7 3.5v4.2m0 0h0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AssembleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 5.5h7v13H4zm9 0h7v6h-7zm0 8h7v5h-7zM7.5 8h0m0 3h0m9-2h0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
