import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import { NavIcon } from "../components/home/HomeIcons";
import {
  getUpdateProjectErrorMessage,
  useProjectParts,
  useUpdateProject,
} from "../hooks/useDrive";

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned", tone: "slate" },
  { value: "in_progress", label: "In progress", tone: "blue" },
  { value: "on_hold", label: "On hold", tone: "amber" },
  { value: "completed", label: "Completed", tone: "green" },
];

const STATUS_DOT_TONE_CLASSES = {
  slate: "bg-[#878b96] shadow-[0_0_0_3px_rgba(135,139,150,.12)]",
  blue: "bg-[#6884e8] shadow-[0_0_0_3px_rgba(104,132,232,.12)]",
  amber: "bg-[#c8934d] shadow-[0_0_0_3px_rgba(200,147,77,.12)]",
  green: "bg-[#5da578] shadow-[0_0_0_3px_rgba(93,165,120,.12)]",
};

export default function ProjectOverviewPage() {
  const { project } = useOutletContext();
  const projectId = project.id;

  const [name, setName] = useState(project.name ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status ?? "planned");
  const [dueDate, setDueDate] = useState(project.due_date ?? "");
  const [detailsMessage, setDetailsMessage] = useState("");
  const [detailsError, setDetailsError] = useState("");

  const projectPartsQuery = useProjectParts(projectId);
  const updateProjectMutation = useUpdateProject();

  const labelCount = projectPartsQuery.data?.length ?? 0;
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const normalizedDueDate = dueDate || null;
  const isDetailsDirty = (
    trimmedName !== (project.name ?? "")
    || trimmedDescription !== (project.description ?? "")
    || status !== (project.status ?? "planned")
    || normalizedDueDate !== (project.due_date ?? null)
  );
  const isSavingDetails = updateProjectMutation.isPending;
  const detailsRequestError = updateProjectMutation.error
    ? getUpdateProjectErrorMessage(updateProjectMutation.error)
    : "";

  async function saveProjectDetails(event) {
    event.preventDefault();
    setDetailsMessage("");

    if (!trimmedName) {
      setDetailsError("Project name is required.");
      return;
    }
    if (trimmedName.length > 255) {
      setDetailsError("Use 255 characters or fewer for the name.");
      return;
    }
    if (trimmedDescription.length > 2000) {
      setDetailsError("Use 2000 characters or fewer for the description.");
      return;
    }

    setDetailsError("");
    try {
      await updateProjectMutation.mutateAsync({
        projectId,
        name: trimmedName,
        description: trimmedDescription,
        status,
        dueDate: dueDate || null,
      });
      setDetailsMessage("Saved");
    } catch {
      // The request error is rendered below the form.
    }
  }

  return (
    <div className="project-page min-h-full text-[#dddde0] project-overview-page">
      <main className="project-page__inner my-0 mx-auto pt-[36px] pr-0 pb-[64px] pl-0 [@media_(max-width:720px)]:pt-[26px] [@media_(max-width:720px)]:pr-0 [@media_(max-width:720px)]:pb-[44px] [@media_(max-width:720px)]:pl-0 project-overview-page__inner [@media_(max-width:720px)]:pt-[26px] [@media_(max-width:720px)]:pr-0 [@media_(max-width:720px)]:pb-[44px] [@media_(max-width:720px)]:pl-0">
        <form className="project-overview-grid grid items-start gap-[22px] [@media_(max-width:980px)]:grid-cols-1" onSubmit={saveProjectDetails} noValidate>
          <section className="project-overview-main min-w-0" aria-labelledby="project-overview-title-label">
            <div className="project-overview-title-block mb-[24px] pb-0 border-b-0 [&>span]:block [&>span]:mb-[9px] [&>span]:text-[#64666c] [&>span]:text-[10px] [&>span]:font-[680] [&>span]:tracking-[.1em] [&>span]:uppercase [&_input]:w-full [&_input]:min-w-0 [&_input]:p-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#f0f0f2] [&_input]:bg-transparent [&_input]:text-[42px] [&_input]:font-[620] [&_input]:tracking-[-.035em] [&_input]:leading-[1.04] [&_input:focus]:text-[#fff] [@media_(max-width:720px)]:[&_input]:text-[30px]">
              <span id="project-overview-title-label">Project overview</span>
              <label htmlFor="project-overview-name" className="sr-only">Project name</label>
              <input
                id="project-overview-name"
                type="text"
                value={name}
                maxLength={255}
                disabled={isSavingDetails}
                aria-invalid={Boolean(detailsError)}
                onChange={(event) => {
                  setName(event.target.value);
                  setDetailsError("");
                  setDetailsMessage("");
                }}
              />
            </div>

            <div className="project-overview-properties-row mb-[28px] flex flex-wrap items-end gap-[14px]">
              <label className="project-overview-field [&>span]:block [&>span]:mb-[7px] [&>span]:text-[#64666c] [&>span]:text-[10px] [&>span]:font-[680] [&>span]:tracking-[.1em] [&>span]:uppercase min-w-[180px]" htmlFor="project-overview-status">
                <span>Status</span>
                <div className="project-overview-select [&:focus-within]:border-[#5a5e9e] min-w-0 h-[34px] grid items-center gap-[8px] py-0 px-[10px] border border-[#303136] rounded-[7px] bg-[#151619] [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:text-[#77797f] [&_select]:w-full [&_select]:min-w-0 [&_select]:h-full [&_select]:p-0 [&_select]:border-0 [&_select]:outline-0 [&_select]:text-[#d7d7da] [&_select]:bg-transparent [&_select]:text-[12px] [&_select]:appearance-none [&_select]:cursor-pointer [&_select_option]:text-[#dddde0] [&_select_option]:bg-[#17181a]">
                  <i className={`status-dot w-[8px] h-[8px] rounded-full bg-[#777a82] ${STATUS_DOT_TONE_CLASSES[getStatusTone(status)] ?? ""}`} />
                  <select
                    id="project-overview-status"
                    value={status}
                    disabled={isSavingDetails}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setDetailsMessage("");
                    }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <NavIcon type="chevron-down" />
                </div>
              </label>

              <label className="project-overview-field [&>span]:block [&>span]:mb-[7px] [&>span]:text-[#64666c] [&>span]:text-[10px] [&>span]:font-[680] [&>span]:tracking-[.1em] [&>span]:uppercase min-w-[180px]" htmlFor="project-overview-due-date">
                <span>Due date</span>
                <div className="project-overview-date [&:focus-within]:border-[#5a5e9e] min-w-0 h-[34px] grid items-center gap-[8px] py-0 px-[10px] border border-[#303136] rounded-[7px] bg-[#151619] [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:text-[#77797f] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-full [&_input]:p-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#d7d7da] [&_input]:bg-transparent [&_input]:text-[12px] [&_input]:scheme-dark">
                  <NavIcon type="calendar" />
                  <input
                    id="project-overview-due-date"
                    type="date"
                    value={dueDate}
                    disabled={isSavingDetails}
                    onChange={(event) => {
                      setDueDate(event.target.value);
                      setDetailsMessage("");
                    }}
                  />
                </div>
              </label>

              <div className="project-overview-meta-list flex min-h-[34px] flex-wrap items-stretch overflow-hidden border border-[#2a2b30] rounded-[7px] [&>div]:min-w-[118px] [&>div]:grid [&>div]:items-center [&>div]:gap-[4px] [&>div]:py-[6px] [&>div]:px-[10px] [&>div]:border-r [&>div]:border-r-[#2a2b30] [&>div:last-child]:border-r-0 [&_span]:text-[#686a70] [&_span]:text-[10px] [&_span]:font-[660] [&_span]:tracking-[.065em] [&_span]:uppercase [&_strong]:overflow-hidden [&_strong]:text-[#d6d6d8] [&_strong]:text-[11px] [&_strong]:font-[520] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap">
                <div>
                  <span>Labels</span>
                  <strong>{labelCount}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{project.model_filename || "None"}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDateTime(project.updated_at)}</strong>
                </div>
              </div>

              <button
                type="submit"
                className="project-overview-save h-[34px] min-w-[138px] border border-[#6c72cf] rounded-[7px] text-[#fff] bg-[#5964c7] text-[12px] font-[590] cursor-pointer [&:hover]:border-[#7e84dc] [&:hover]:bg-[#6570d2] [&:disabled]:cursor-not-allowed [&:disabled]:opacity-[.52]"
                disabled={isSavingDetails || !isDetailsDirty || !trimmedName}
              >
                {isSavingDetails ? "Saving..." : "Save overview"}
              </button>
            </div>

            {detailsError || detailsRequestError ? (
              <p role="alert" className="project-overview-form-error mt-[-12px] mr-0 mb-[18px] ml-0 py-[8px] px-[9px] rounded-[6px] text-[11px] border border-[#5d373c] text-[#e1a1a7] bg-[#291719]">{detailsError || detailsRequestError}</p>
            ) : detailsMessage ? (
              <p className="project-overview-form-message mt-[-12px] mr-0 mb-[18px] ml-0 py-[8px] px-[9px] rounded-[6px] text-[11px] border border-[#31523d] text-[#a9d7b8] bg-[#17251c]">{detailsMessage}</p>
            ) : null}

            <label className="project-overview-description [&>span]:block [&>span]:mb-[7px] [&>span]:text-[#64666c] [&>span]:text-[10px] [&>span]:font-[680] [&>span]:tracking-[.1em] [&>span]:uppercase relative block mb-[28px] [&_textarea]:w-full [&_textarea]:min-h-[122px] [&_textarea]:box-border [&_textarea]:resize-y [&_textarea]:pt-[13px] [&_textarea]:pr-[14px] [&_textarea]:pb-[24px] [&_textarea]:pl-[14px] [&_textarea]:border [&_textarea]:border-[#303136] [&_textarea]:rounded-[8px] [&_textarea]:outline-0 [&_textarea]:text-[#d7d7da] [&_textarea]:bg-[#151619] [&_textarea]:text-[13px] [&_textarea]:leading-[1.55] [&_textarea::placeholder]:text-[#62646a] [&_textarea:focus]:border-[#5a5e9e] [&_small]:absolute [&_small]:right-[12px] [&_small]:bottom-[9px] [&_small]:text-[#666970] [&_small]:text-[10px]" htmlFor="project-overview-description">
              <span>Description</span>
              <textarea
                id="project-overview-description"
                value={description}
                maxLength={2000}
                placeholder="Add a description..."
                disabled={isSavingDetails}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setDetailsError("");
                  setDetailsMessage("");
                }}
              />
              <small>{description.length} / 2000</small>
            </label>
          </section>
        </form>
      </main>
    </div>
  );
}

function getStatusTone(status) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.tone ?? "slate";
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
