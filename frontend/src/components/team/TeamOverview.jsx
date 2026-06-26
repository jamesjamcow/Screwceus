import { useEffect, useRef, useState } from "react";

import {
  getTeamOverviewErrorMessage,
  useCreateTeamResource,
  useTeamResources,
  useUpdateTeam,
} from "../../hooks/useDrive";
import { NavIcon } from "../home/HomeIcons";

function TeamMark({ team, className = "" }) {
  return (
    <span
      className={`team-overview__mark w-[35px] h-[35px] grid flex-none place-items-center rounded-[8px] text-[#fff] bg-[var(--team-color)] text-[13px] font-[760] leading-none uppercase ${className}`}
      style={{ "--team-color": team.color }}
      aria-hidden="true"
    >
      {team.key.slice(0, 1)}
    </span>
  );
}

function MemberAvatar({ team, user }) {
  if (user?.imageUrl) {
    return <img className="team-overview__avatar w-[20px] h-[20px] grid place-items-center rounded-full object-cover" src={user.imageUrl} alt={user.fullName || "Team member"} />;
  }

  return (
    <span className="team-overview__avatar w-[20px] h-[20px] grid place-items-center rounded-full object-cover team-overview__avatar--fallback text-[#fff] bg-[var(--team-color)] text-[8px] font-[700]" style={{ "--team-color": team.color }}>
      {(user?.fullName || team.name).slice(0, 1).toUpperCase()}
    </span>
  );
}

function OverviewLink({ icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="team-overview__link w-full min-w-0 h-[27px] flex items-center gap-[8px] p-0 border-0 rounded-[4px] text-[#b3b4b7] bg-transparent text-[11px] font-[540] text-left cursor-pointer [&:hover]:text-[#eeeeef] [&:disabled]:text-[#87888d] [&:disabled]:cursor-not-allowed [&_svg]:w-[14px] [&_svg]:h-[14px] [&_svg]:flex-none [&_svg]:text-[#77797e] [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Integration not connected" : undefined}
    >
      <NavIcon type={icon} />
      <span>{label}</span>
    </button>
  );
}

function DescriptionEditor({ team }) {
  const mutation = useUpdateTeam();
  const [draft, setDraft] = useState(null);
  const isEditing = draft !== null;

  async function saveDescription(event) {
    event.preventDefault();
    try {
      await mutation.mutateAsync({
        teamId: team.id,
        description: draft.trim(),
      });
      setDraft(null);
    } catch {
      // The API error is shown below the editor.
    }
  }

  function cancelEdit() {
    setDraft(null);
    mutation.reset();
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        className={`team-overview__description block max-w-full mt-[7px] mr-0 mb-0 ml-0 p-0 border-0 text-[#4e5055] bg-transparent text-[12px] leading-[1.5] text-left whitespace-normal cursor-pointer [&:hover]:text-[#8f9095] [&.has-description]:text-[#8f9095] [&.has-description:hover]:text-[#c9c9cc]${team.description ? " has-description" : ""}`}
        onClick={() => setDraft(team.description || "")}
      >
        {team.description || "Add a description…"}
      </button>
    );
  }

  return (
    <form className="team-overview__description-editor mt-[10px] p-[9px] border border-[#34363b] rounded-[8px] bg-[#151619] [&_textarea]:w-full [&_textarea]:min-h-[94px] [&_textarea]:block [&_textarea]:resize-y [&_textarea]:py-[4px] [&_textarea]:px-[5px] [&_textarea]:border-0 [&_textarea]:outline-0 [&_textarea]:text-[#dedee0] [&_textarea]:bg-transparent [&_textarea]:text-[12px] [&_textarea]:leading-[1.55] [&_textarea::placeholder]:text-[#55575d]" onSubmit={saveDescription}>
      <label className="sr-only" htmlFor={`team-description-${team.id}`}>Team description</label>
      <textarea
        id={`team-description-${team.id}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="What does this team work on?"
        maxLength={2000}
        autoFocus
        disabled={mutation.isPending}
      />
      <div className="team-overview__description-footer flex items-center justify-between gap-[12px] pt-[8px] pr-[2px] pb-0 pl-[5px] border-t border-t-[#26282d] [&>span]:text-[#5f6167] [&>span]:text-[10px] [&>div]:flex [&>div]:gap-[7px] [&_button]:min-w-[56px] [&_button]:h-[28px] [&_button]:py-0 [&_button]:px-[10px] [&_button]:border [&_button]:border-[#34363b] [&_button]:rounded-[6px] [&_button]:text-[#a7a8ac] [&_button]:bg-[#1c1d21] [&_button]:text-[11px] [&_button]:font-[580] [&_button]:cursor-pointer [&_button:hover]:text-[#e9e9ea] [&_button:hover]:bg-[#24262a] [&_button.is-primary]:border-[#737ce7] [&_button.is-primary]:text-[#fff] [&_button.is-primary]:bg-[#6972dc] [&_button.is-primary:hover]:bg-[#7881e8] [&_button:disabled]:opacity-[0.55] [&_button:disabled]:cursor-wait">
        <span>{draft.length} / 2000</span>
        <div>
          <button type="button" onClick={cancelEdit} disabled={mutation.isPending}>Cancel</button>
          <button type="submit" className="is-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {mutation.error ? (
        <p className="team-overview__form-error mt-[9px] mr-0 mb-0 ml-0 text-[#df9299] text-[11px] leading-[1.4]" role="alert">
          {getTeamOverviewErrorMessage(mutation.error)}
        </p>
      ) : null}
    </form>
  );
}

function ResourceCard({ resource }) {
  let host = resource.url;
  try {
    host = new URL(resource.url).hostname.replace(/^www\./, "");
  } catch {
    // The backend validates URLs; retain the full URL if old data is malformed.
  }

  return (
    <a className="team-resource-card min-w-0 grid items-center gap-[11px] py-[11px] px-[12px] border border-[#25272b] rounded-[8px] bg-[#121316] no-underline [&:hover]:border-[#3a3d44] [&:hover]:bg-[#17181c] [&:hover_.team-resource-card__arrow]:text-[#a6aaf0]" href={resource.url} target="_blank" rel="noreferrer">
      <span className="team-resource-card__icon w-[32px] h-[32px] grid place-items-center border border-[#303238] rounded-[7px] text-[#8e94ef] bg-[#1b1d27] [&_svg]:w-[14px] [&_svg]:h-[14px]" aria-hidden="true"><NavIcon type="link" /></span>
      <span className="team-resource-card__body min-w-0 grid gap-[3px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_strong]:text-[#d9d9dc] [&_strong]:text-[12px] [&_strong]:font-[610] [&_span]:text-[#7a7c82] [&_span]:text-[11px] [&_small]:text-[#55575d] [&_small]:text-[10px]">
        <strong>{resource.name}</strong>
        <span>{resource.description}</span>
        <small>{host}</small>
      </span>
      <span className="team-resource-card__arrow text-[#505259] text-[13px]" aria-hidden="true">↗</span>
    </a>
  );
}

function AddResourceDialog({ team, onClose }) {
  const mutation = useCreateTeamResource(team.id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !mutation.isPending) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mutation.isPending, onClose]);

  async function submitResource(event) {
    event.preventDefault();
    if (!name.trim() || !description.trim() || !url.trim()) {
      setValidationError("Complete all three fields.");
      return;
    }
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

    try {
      const parsedUrl = new URL(normalizedUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
    } catch {
      setValidationError("Enter a valid web address.");
      return;
    }

    setValidationError("");
    try {
      await mutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        url: normalizedUrl,
      });
      onClose();
    } catch {
      // The API error is shown inside the dialog.
    }
  }

  return (
    <div
      className="team-resource-dialog-backdrop fixed z-[80] inset-0 grid place-items-center p-[20px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !mutation.isPending) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="team-resource-dialog [&_footer]:flex [&_footer]:gap-[7px] [&_footer_button]:min-w-[56px] [&_footer_button]:h-[28px] [&_footer_button]:py-0 [&_footer_button]:px-[10px] [&_footer_button]:border [&_footer_button]:border-[#34363b] [&_footer_button]:rounded-[6px] [&_footer_button]:text-[#a7a8ac] [&_footer_button]:bg-[#1c1d21] [&_footer_button]:text-[11px] [&_footer_button]:font-[580] [&_footer_button]:cursor-pointer [&_footer_button:hover]:text-[#e9e9ea] [&_footer_button:hover]:bg-[#24262a] [&_footer_button.is-primary]:border-[#737ce7] [&_footer_button.is-primary]:text-[#fff] [&_footer_button.is-primary]:bg-[#6972dc] [&_footer_button.is-primary:hover]:bg-[#7881e8] [&_button:disabled]:opacity-[0.55] [&_button:disabled]:cursor-wait overflow-hidden border border-[#34363c] rounded-[11px] bg-[#141518] [&>header]:flex [&>header]:items-start [&>header]:justify-between [&>header]:gap-[20px] [&>header]:pt-[20px] [&>header]:pr-[21px] [&>header]:pb-[17px] [&>header]:pl-[21px] [&>header]:border-b [&>header]:border-b-[#27292e] [&_h2]:m-0 [&_h2]:text-[#ececee] [&_h2]:text-[17px] [&_h2]:font-[650] [&_h2]:tracking-[-0.02em] [&_form]:grid [&_form]:gap-[15px] [&_form]:pt-[20px] [&_form]:pr-[21px] [&_form]:pb-[18px] [&_form]:pl-[21px] [&_label]:grid [&_label]:gap-[7px] [&_label>span]:text-[#9b9ca1] [&_label>span]:text-[11px] [&_label>span]:font-[590] [&_input]:w-full [&_input]:border [&_input]:border-[#303239] [&_input]:rounded-[7px] [&_input]:outline-0 [&_input]:text-[#e3e3e5] [&_input]:bg-[#0f1012] [&_input]:text-[12px] [&_textarea]:w-full [&_textarea]:border [&_textarea]:border-[#303239] [&_textarea]:rounded-[7px] [&_textarea]:outline-0 [&_textarea]:text-[#e3e3e5] [&_textarea]:bg-[#0f1012] [&_textarea]:text-[12px] [&_input]:h-[37px] [&_input]:py-0 [&_input]:px-[11px] [&_textarea]:min-h-[82px] [&_textarea]:resize-y [&_textarea]:py-[10px] [&_textarea]:px-[11px] [&_textarea]:leading-[1.45] [&_input:focus]:border-[#666fda] [&_textarea:focus]:border-[#666fda] [&_input::placeholder]:text-[#4e5055] [&_textarea::placeholder]:text-[#4e5055] [&_footer]:justify-end [&_footer]:mt-[2px] [&_footer]:pt-[15px] [&_footer]:border-t [&_footer]:border-t-[#27292e]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-resource-title"
      >
        <header>
          <div>
            <span className="team-resource-dialog__eyebrow block mb-[5px] text-[#73767d] text-[10px] font-[650] tracking-[0.06em] uppercase">{team.name}</span>
            <h2 id="add-resource-title">Pin a resource</h2>
          </div>
          <button type="button" className="team-resource-dialog__close w-[27px] h-[27px] p-0 border-0 rounded-[6px] text-[#77797e] bg-transparent text-[20px] leading-none cursor-pointer [&:hover]:text-[#e4e4e6] [&:hover]:bg-[#202125]" onClick={onClose} disabled={mutation.isPending} aria-label="Close resource form">×</button>
        </header>

        <form onSubmit={submitResource}>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Design system"
              maxLength={255}
              required
              autoFocus
              disabled={mutation.isPending}
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short note about what this resource contains"
              maxLength={1000}
              required
              disabled={mutation.isPending}
            />
          </label>
          <label>
            <span>Link</span>
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              maxLength={2048}
              required
              disabled={mutation.isPending}
            />
          </label>

          {validationError || mutation.error ? (
            <p className="team-overview__form-error mt-[9px] mr-0 mb-0 ml-0 text-[#df9299] text-[11px] leading-[1.4]" role="alert">
              {validationError || getTeamOverviewErrorMessage(mutation.error, "Could not add the resource.")}
            </p>
          ) : null}

          <footer>
            <button type="button" onClick={onClose} disabled={mutation.isPending}>Cancel</button>
            <button type="submit" className="is-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add resource"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function TeamOverview({ team, user, onSelect }) {
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const resourcesQuery = useTeamResources(team.id);
  const resources = resourcesQuery.data ?? [];

  return (
    <section className="team-overview min-h-screen text-[var(--linear-text)] bg-[var(--linear-bg)]" aria-labelledby="team-overview-title">
      <header className="team-overview__header h-[53px] flex items-center justify-between gap-[20px] pt-[7px] pr-[17px] pb-0 pl-[20px] border-b border-b-[var(--linear-border-soft)]">
        <div className="team-overview__identity min-w-0 flex items-center gap-[8px] [&_strong]:overflow-hidden [&_strong]:text-[#e5e5e7] [&_strong]:text-[13px] [&_strong]:font-[610] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap">
          <TeamMark team={team} className="team-overview__mark--small w-[18px] h-[18px] rounded-[5px] text-[8px]" />
          <strong>{team.name}</strong>
          <button type="button" className="team-overview__quiet-action w-[25px] h-[25px] grid flex-none place-items-center p-0 border-0 rounded-[5px] text-[#65676c] bg-transparent cursor-pointer [&:hover]:text-[#d9d9db] [&:hover]:bg-[#1c1d20] [&_svg]:w-[14px] [&_svg]:h-[14px]" aria-label={`Favorite ${team.name}`}>
            <NavIcon type="star" />
          </button>
          <button type="button" className="team-overview__quiet-action w-[25px] h-[25px] grid flex-none place-items-center p-0 border-0 rounded-[5px] text-[#65676c] bg-transparent cursor-pointer [&:hover]:text-[#d9d9db] [&:hover]:bg-[#1c1d20] [&_svg]:w-[14px] [&_svg]:h-[14px]" aria-label={`${team.name} menu`}>
            <NavIcon type="more" />
          </button>
        </div>

        <button type="button" className="team-overview__quiet-action w-[25px] h-[25px] grid flex-none place-items-center p-0 border-0 rounded-[5px] text-[#65676c] bg-transparent cursor-pointer [&:hover]:text-[#d9d9db] [&:hover]:bg-[#1c1d20] [&_svg]:w-[14px] [&_svg]:h-[14px]" aria-label={`Copy link to ${team.name}`}>
          <NavIcon type="link" />
        </button>
      </header>

      <div className="team-overview__body grid mt-[25px] mr-auto mb-0 ml-auto [@media_(max-width:720px)]:grid-cols-1 [@media_(max-width:720px)]:gap-[42px] [@media_(max-width:720px)]:mt-[24px] [@media_(max-width:720px)]:pb-[48px]">
        <div className="team-overview__content min-w-0">
          <div className="team-overview__intro flex items-start gap-[13px] [&_h1]:m-0 [&_h1]:text-[#eeeeef] [&_h1]:text-[20px] [&_h1]:font-[640] [&_h1]:tracking-[-0.025em]">
            <TeamMark team={team} />
            <div className="team-overview__intro-copy min-w-0 flex-1">
              <h1 id="team-overview-title">{team.name}</h1>
              <DescriptionEditor team={team} />
            </div>
          </div>

          <section className="team-overview__resources mt-[34px]" aria-labelledby="pinned-resources-title">
            <div className="team-overview__section-heading flex items-start justify-between gap-[24px] [&_h2]:m-0 [&_h2]:text-[#e5e5e7] [&_h2]:text-[13px] [&_h2]:font-[610] [&_h2]:tracking-[-0.01em] [&_p]:mt-[8px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#505157] [&_p]:text-[12px] [&_p]:leading-[1.45]">
              <div>
                <h2 id="pinned-resources-title">Pinned resources</h2>
                {!resources.length && !resourcesQuery.isPending ? <p>Add important links for everyone on this team.</p> : null}
              </div>
              <div className="team-overview__resource-actions flex gap-[6px] [&_button]:w-[27px] [&_button]:h-[27px] [&_button]:grid [&_button]:place-items-center [&_button]:p-0 [&_button]:border-0 [&_button]:rounded-[5px] [&_button]:text-[#717277] [&_button]:bg-transparent [&_button]:cursor-pointer [&_button:hover]:text-[#e6e6e7] [&_button:hover]:bg-[#242529] [&_svg]:w-[13px] [&_svg]:h-[13px]">
                <button type="button" onClick={() => setIsResourceDialogOpen(true)} aria-label="Add a pinned resource">
                  <NavIcon type="plus" />
                </button>
              </div>
            </div>

            {resourcesQuery.isPending ? (
              <div className="team-resource-list grid gap-[8px] mt-[17px] team-resource-list--loading [&_span]:h-[65px] [&_span]:border [&_span]:border-[#222428] [&_span]:rounded-[8px]" aria-label="Loading pinned resources">
                <span /><span />
              </div>
            ) : null}
            {resourcesQuery.error ? (
              <p className="team-overview__form-error mt-[9px] mr-0 mb-0 ml-0 text-[#df9299] text-[11px] leading-[1.4]" role="alert">
                {getTeamOverviewErrorMessage(resourcesQuery.error, "Could not load pinned resources.")}
              </p>
            ) : null}
            {resources.length ? (
              <div className="team-resource-list grid gap-[8px] mt-[17px]">
                {resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="team-overview__rail [&_h2]:m-0 [&_h2]:text-[#e5e5e7] [&_h2]:text-[13px] [&_h2]:font-[610] [&_h2]:tracking-[-0.01em] grid content-start gap-[27px] pt-[10px] [&_h2]:text-[#73757a] [&_h2]:text-[11px] [&_h2]:font-[560] [@media_(max-width:720px)]:grid-cols-2 [@media_(max-width:720px)]:gap-[30px] [@media_(max-width:720px)]:pt-[24px] [@media_(max-width:720px)]:border-t [@media_(max-width:720px)]:border-t-[var(--linear-border-soft)]" aria-label={`${team.name} details`}>
          <section className="team-overview__members rounded-[6px] outline-0">
            <h2>Members</h2>
            <div className="team-overview__member-row flex items-center gap-[8px] mt-[12px] text-[#8f9094] text-[11px]">
              <MemberAvatar team={team} user={user} />
              <span>{user?.fullName || "You"}</span>
            </div>
          </section>

          <section className="team-overview__destinations grid gap-[3px] [&_h2]:mb-[5px]">
            <h2>Go to</h2>
            <OverviewLink icon="slack" label="Connect Slack channel…" disabled />
            <OverviewLink icon="settings" label="Team settings" onClick={() => onSelect("more")} />
            <OverviewLink icon="issues" label="Issues" onClick={() => onSelect("team-issues", team.id)} />
            <OverviewLink icon="projects" label="Projects" onClick={() => onSelect("team-projects", team.id)} />
            <OverviewLink icon="inventory" label="Inventory" onClick={() => onSelect("team-inventory", team.id)} />
          </section>
        </aside>
      </div>

      {isResourceDialogOpen ? (
        <AddResourceDialog team={team} onClose={() => setIsResourceDialogOpen(false)} />
      ) : null}
    </section>
  );
}
