import { PricingTable, useAuth, useOrganization, useUser } from "@clerk/clerk-react";
import { useMemo, useState } from "react";

import { NavIcon } from "../home/HomeIcons";
import { getCreateTeamErrorMessage, useCreateTeam } from "../../hooks/useDrive";
import { hasPaidOrganizationPlan } from "../../lib/clerkBilling";

const TEAM_COLORS = ["#5E6AD2", "#D95555", "#D88A3D", "#43A36D", "#338ACB", "#9B65C8"];

export default function CreateTeamPage({ onCancel, onTeamCreated }) {
  const { isLoaded: isAuthLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const isPaid = isAuthLoaded && hasPaidOrganizationPlan(sessionClaims);
  const { organization, memberships } = useOrganization({
    memberships: isPaid
      ? { pageSize: 100, infinite: true, keepPreviousData: true }
      : undefined,
  });
  const mutation = useCreateTeam();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyWasEdited, setKeyWasEdited] = useState(false);
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState(() => new Set());
  const [showPlans, setShowPlans] = useState(false);

  const organizationMembers = useMemo(() => memberships?.data ?? [], [memberships?.data]);

  function updateName(value) {
    setName(value);
    if (!keyWasEdited) setKey(createTeamKey(value));
  }

  function updateKey(value) {
    setKeyWasEdited(true);
    setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12));
  }

  function toggleMember(userId) {
    if (!userId || userId === user?.id) return;
    setSelectedMemberIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!isPaid || !name.trim() || !key) return;

    try {
      const team = await mutation.mutateAsync({
        name: name.trim(),
        key,
        color,
        memberIds: user?.id ? [user.id, ...selectedMemberIds] : [...selectedMemberIds],
      });
      onTeamCreated(team);
    } catch {
      // The mutation error is rendered below the form.
    }
  }

  if (showPlans && !isPaid) {
    return (
      <section className="team-create-page my-0 mx-auto [@media_(max-width:720px)]:pt-[44px] team-create-page--pricing [@media_(max-width:720px)]:pt-[44px]" aria-labelledby="team-pricing-title">
        <div className="team-create-page__intro max-w-[660px] ml-[14px] [&_h1]:m-0 [&_h1]:text-[#f0f0f2] [&_h1]:font-[560] [&_h1]:tracking-[-.035em] [&_p]:max-w-[560px] [&_p]:mt-[9px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#898a90] [&_p]:text-[13px] [&_p]:leading-[1.55]">
          <button type="button" className="team-create-page__back mt-0 mr-0 mb-[22px] ml-0 p-0 border-0 text-[#8d8f95] bg-transparent cursor-pointer [&:hover]:text-[#ededee]" onClick={() => setShowPlans(false)}>← Back</button>
          <span className="team-create-page__eyebrow block mb-[8px] text-[#6e7076] text-[10px] font-[680] tracking-[.1em] uppercase">Clerk Billing</span>
          <h1 id="team-pricing-title">Choose an organization plan</h1>
          <p>Upgrade {organization?.name || "this organization"} to create teams and assign organization members.</p>
        </div>
        <div className="team-create-pricing mt-[40px]">
          <PricingTable for="organization" newSubscriptionRedirectUrl="/?view=create-team" />
        </div>
      </section>
    );
  }

  return (
    <section className="team-create-page my-0 mx-auto [@media_(max-width:720px)]:pt-[44px]" aria-labelledby="team-create-title">
      <div className="team-create-page__intro max-w-[660px] ml-[14px] [&_h1]:m-0 [&_h1]:text-[#f0f0f2] [&_h1]:font-[560] [&_h1]:tracking-[-.035em] [&_p]:max-w-[560px] [&_p]:mt-[9px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#898a90] [&_p]:text-[13px] [&_p]:leading-[1.55]">
        <span className="team-create-page__eyebrow block mb-[8px] text-[#6e7076] text-[10px] font-[680] tracking-[.1em] uppercase">{organization?.name || "Organization"}</span>
        <h1 id="team-create-title">Create a new team</h1>
        <p>Create a focused space for projects, issues, inventory, and the people responsible for them.</p>
      </div>

      {!isPaid ? (
        <div className="team-create-upgrade min-h-[68px] grid items-center gap-[11px] mt-[32px] py-0 px-[16px] border border-[#2a2b2f] rounded-[10px] bg-[#17181a] [&>span:nth-child(2)]:grid [&>span:nth-child(2)]:gap-[4px] [&_strong]:text-[#d8d8db] [&_strong]:text-[12px] [&_strong]:font-[590] [&_small]:text-[#787a80] [&_small]:text-[11px] [&_small]:font-[400] [&_button]:h-[34px] [&_button]:py-0 [&_button]:px-[15px] [&_button]:border [&_button]:border-[#3c3e44] [&_button]:rounded-[18px] [&_button]:text-[#e9e9ea] [&_button]:bg-[#292a2e] [&_button]:font-[580] [&_button]:cursor-pointer [&_button:hover]:bg-[#34353a] [@media_(max-width:720px)]:py-[12px] [@media_(max-width:720px)]:px-[14px] [@media_(max-width:720px)]:[&_button]:col-span-full" role="status">
          <span className="team-create-upgrade__icon w-[32px] h-[32px] grid place-items-center border border-[#32343a] rounded-[8px] text-[#aeb0b6] bg-[#202125] [&_svg]:w-[14px] [&_svg]:h-[14px]"><NavIcon type="plus" /></span>
          <span>
            <strong>Create more teams</strong>
            <small>A paid Clerk organization plan is required to create additional teams.</small>
          </span>
          <button type="button" onClick={() => setShowPlans(true)}>View plans</button>
        </div>
      ) : (
        <div className="team-create-entitlement flex items-center gap-[7px] mt-[30px] mr-0 mb-0 ml-[14px] text-[#6f9e7f] text-[11px] [&_span]:w-[6px] [&_span]:h-[6px] [&_span]:rounded-full [&_span]:bg-[#55a873]">
          <span /> Paid organization plan active
        </div>
      )}

      <form className={`team-create-form mt-[24px] [&_fieldset]:min-w-0 [&_fieldset]:m-0 [&_fieldset]:p-0 [&_fieldset]:border-0 [&.is-locked]:opacity-[.34]${!isPaid ? " is-locked" : ""}`} onSubmit={submit}>
        <fieldset disabled={!isPaid || mutation.isPending}>
          <div className="team-create-fields overflow-hidden border border-[#212226] rounded-[10px] bg-[#141517]">
            <label className="team-create-field [&>span:first-child]:grid [&>span:first-child]:gap-[4px] [&_strong]:text-[#d8d8db] [&_strong]:text-[12px] [&_strong]:font-[590] [&_small]:text-[#787a80] [&_small]:text-[11px] [&_small]:font-[400] min-h-[74px] grid items-center gap-[24px] py-0 px-[16px] border-b border-b-[#1e1f22] [&:last-child]:border-b-0 [&>input]:w-full [&>input]:h-[34px] [&>input]:min-w-0 [&>input]:box-border [&>input]:py-0 [&>input]:px-[11px] [&>input]:border [&>input]:border-[#2b2c30] [&>input]:rounded-[7px] [&>input]:outline-0 [&>input]:text-[#dddde0] [&>input]:bg-[#121315] [&>input:focus]:border-[#54586e] [&_input::placeholder]:text-[#46484e] [@media_(max-width:720px)]:grid-cols-1 [@media_(max-width:720px)]:gap-[12px] [@media_(max-width:720px)]:p-[16px] team-create-field--name">
              <span>
                <strong>Icon &amp; name</strong>
                <small>Use a clear name your organization will recognize.</small>
              </span>
              <span className="team-create-name-control [&_input]:w-full [&_input]:h-[34px] [&_input]:min-w-0 [&_input]:box-border [&_input]:py-0 [&_input]:px-[11px] [&_input]:border [&_input]:border-[#2b2c30] [&_input]:rounded-[7px] [&_input]:outline-0 [&_input]:text-[#dddde0] [&_input]:bg-[#121315] [&_input:focus]:border-[#54586e] grid gap-[7px] [&_i]:w-[34px] [&_i]:h-[34px] [&_i]:grid [&_i]:place-items-center [&_i]:rounded-[8px] [&_i]:text-[#fff] [&_i]:text-[12px] [&_i]:not-italic [&_i]:font-[760] [&_i]:uppercase">
                <i style={{ background: color }}>{(key || name || "T").slice(0, 1)}</i>
                <input
                  value={name}
                  onChange={(event) => updateName(event.target.value)}
                  maxLength={255}
                  placeholder="e.g. Engineering"
                  autoFocus={isPaid}
                  required
                />
              </span>
            </label>

            <label className="team-create-field [&>span:first-child]:grid [&>span:first-child]:gap-[4px] [&_strong]:text-[#d8d8db] [&_strong]:text-[12px] [&_strong]:font-[590] [&_small]:text-[#787a80] [&_small]:text-[11px] [&_small]:font-[400] min-h-[74px] grid items-center gap-[24px] py-0 px-[16px] border-b border-b-[#1e1f22] [&:last-child]:border-b-0 [&>input]:w-full [&>input]:h-[34px] [&>input]:min-w-0 [&>input]:box-border [&>input]:py-0 [&>input]:px-[11px] [&>input]:border [&>input]:border-[#2b2c30] [&>input]:rounded-[7px] [&>input]:outline-0 [&>input]:text-[#dddde0] [&>input]:bg-[#121315] [&>input:focus]:border-[#54586e] [&_input::placeholder]:text-[#46484e] [@media_(max-width:720px)]:grid-cols-1 [@media_(max-width:720px)]:gap-[12px] [@media_(max-width:720px)]:p-[16px]">
              <span>
                <strong>Identifier</strong>
                <small>Used to identify issues from this team (e.g. ENG-123).</small>
              </span>
              <input
                value={key}
                onChange={(event) => updateKey(event.target.value)}
                minLength={1}
                maxLength={12}
                placeholder="e.g. ENG"
                required
              />
            </label>

            <div className="team-create-field [&>span:first-child]:grid [&>span:first-child]:gap-[4px] [&_strong]:text-[#d8d8db] [&_strong]:text-[12px] [&_strong]:font-[590] [&_small]:text-[#787a80] [&_small]:text-[11px] [&_small]:font-[400] min-h-[74px] grid items-center gap-[24px] py-0 px-[16px] border-b border-b-[#1e1f22] [&:last-child]:border-b-0 [&>input]:w-full [&>input]:h-[34px] [&>input]:min-w-0 [&>input]:box-border [&>input]:py-0 [&>input]:px-[11px] [&>input]:border [&>input]:border-[#2b2c30] [&>input]:rounded-[7px] [&>input]:outline-0 [&>input]:text-[#dddde0] [&>input]:bg-[#121315] [&>input:focus]:border-[#54586e] [&_input::placeholder]:text-[#46484e] [@media_(max-width:720px)]:grid-cols-1 [@media_(max-width:720px)]:gap-[12px] [@media_(max-width:720px)]:p-[16px] team-create-field--colors">
              <span>
                <strong>Team color</strong>
                <small>Displayed beside the team throughout the workspace.</small>
              </span>
              <div className="team-create-palette flex justify-start gap-[10px] [&_button]:w-[24px] [&_button]:h-[24px] [&_button]:p-0 [&_button]:rounded-full [&_button]:bg-[var(--team-option)] [&_button]:cursor-pointer" aria-label="Team color">
                {TEAM_COLORS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={color === option ? "is-selected" : ""}
                    style={{ "--team-option": option }}
                    aria-label={`Use color ${option}`}
                    aria-pressed={color === option}
                    onClick={() => setColor(option)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="team-create-members overflow-hidden border border-[#212226] rounded-[10px] bg-[#141517] mt-[14px]">
            <div className="team-create-members__heading [&>span]:grid [&>span]:gap-[4px] [&_strong]:text-[#d8d8db] [&_strong]:text-[12px] [&_strong]:font-[590] [&_small]:text-[#787a80] [&_small]:text-[11px] [&_small]:font-[400] min-h-[66px] flex items-center justify-between gap-[24px] py-0 px-[16px] border-b border-b-[#1e1f22] [&_b]:text-[#6e7076] [&_b]:text-[10px] [&_b]:font-[550]">
              <span>
                <strong>Add organization members</strong>
                <small>Selected people will see this team in their workspace.</small>
              </span>
              <b>{selectedMemberIds.size + (user?.id ? 1 : 0)} selected</b>
            </div>

            <div className="team-create-member-list max-h-[286px] overflow-y-auto">
              {memberships?.isLoading ? <div className="team-create-members__loading w-full min-h-[46px] grid place-items-center border-0 text-[#77797f] bg-transparent">Loading organization members…</div> : null}
              {isPaid && !memberships?.isLoading && organizationMembers.length === 0 ? (
                <div className="team-create-members__loading w-full min-h-[46px] grid place-items-center border-0 text-[#77797f] bg-transparent">No organization members were found.</div>
              ) : null}
              {organizationMembers.map((membership) => {
                const member = membership.publicUserData;
                const memberId = member?.userId;
                const isCreator = memberId === user?.id;
                const displayName = [member?.firstName, member?.lastName].filter(Boolean).join(" ") || member?.identifier;
                return (
                  <label className="team-create-member min-h-[54px] grid items-center gap-[11px] py-0 px-[16px] border-b border-b-[#1c1d20] cursor-pointer [&:hover]:bg-[#18191c] [&_input]:w-[15px] [&_input]:h-[15px]" key={membership.id}>
                    <span className="team-create-member__avatar w-[29px] h-[29px] grid place-items-center overflow-hidden border border-[#34363b] rounded-full text-[#c2c3c7] bg-[#25262a] text-[9px] font-[680] [&_img]:w-full [&_img]:h-full [&_img]:object-cover">
                      {member?.imageUrl ? <img src={member.imageUrl} alt="" /> : initials(displayName)}
                    </span>
                    <span className="team-create-member__identity min-w-0 grid gap-[3px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_strong]:text-[#d4d4d7] [&_strong]:text-[12px] [&_strong]:font-[560] [&_small]:text-[#67696f] [&_small]:text-[10px]">
                      <strong>{displayName || "Organization member"}</strong>
                      <small>{member?.identifier}{isCreator ? " · Team admin" : ""}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={isCreator || selectedMemberIds.has(memberId)}
                      disabled={isCreator}
                      onChange={() => toggleMember(memberId)}
                    />
                  </label>
                );
              })}
              {memberships?.hasNextPage ? (
                <button type="button" className="team-create-members__more w-full min-h-[46px] grid place-items-center border-0 text-[#77797f] bg-transparent cursor-pointer [&:hover]:text-[#d9d9db] [&:hover]:bg-[#18191c]" onClick={() => memberships.fetchNext()}>
                  Load more members
                </button>
              ) : null}
            </div>
          </div>
        </fieldset>

        {mutation.isError ? <div className="team-create-form__error mt-[12px] py-[10px] px-[12px] border border-[#633f43] rounded-[7px] text-[#ddb1b5] bg-[#28191b] text-[11px]">{getCreateTeamErrorMessage(mutation.error)}</div> : null}

        <div className="team-create-actions flex justify-end gap-[8px] mt-[28px] [&_button]:h-[34px] [&_button]:py-0 [&_button]:px-[14px] [&_button]:border [&_button]:border-[#6d75d2] [&_button]:rounded-[7px] [&_button]:text-[#fff] [&_button]:bg-[#5e6ad2] [&_button]:font-[580] [&_button]:cursor-pointer [&_button:hover:not(:disabled)]:bg-[#6873dc] [&_button:disabled]:border-[#3a3b3f] [&_button:disabled]:text-[#74767b] [&_button:disabled]:bg-[#303136] [&_button:disabled]:cursor-not-allowed [&_.team-create-actions__cancel]:border-transparent [&_.team-create-actions__cancel]:text-[#85878c] [&_.team-create-actions__cancel]:bg-transparent [&_.team-create-actions__cancel:hover]:text-[#e0e0e2] [&_.team-create-actions__cancel:hover]:bg-[#202125]">
          <button type="button" className="team-create-actions__cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" disabled={!isPaid || !name.trim() || !key || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create team"}
          </button>
        </div>
      </form>
    </section>
  );
}

function createTeamKey(value) {
  const words = value.toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length > 1) return words.map((word) => word[0]).join("").slice(0, 12);
  return (words[0] ?? "").slice(0, 3);
}

function initials(value = "") {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}
