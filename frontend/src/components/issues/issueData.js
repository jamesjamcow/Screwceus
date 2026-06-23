export const PROJECT_ISSUES = [
  {
    id: 184,
    issue: "Torque notes disappear after quantity is edited",
    description: "Editing a part count clears the operator's torque verification note before the assembly card is saved.",
    author: "Maya Owens",
    status: "in-progress",
  },
  {
    id: 181,
    issue: "Confirm alternate washer specification",
    description: "Thermal shield bracket revision B needs an approved washer substitution before fabrication begins.",
    author: "Ian Brooks",
    status: "blocked",
  },
  {
    id: 176,
    issue: "Model markers drift near edge geometry",
    description: "Overview click targets offset when a marker is placed within 12 px of a model edge.",
    author: "Riley Chen",
    status: "in-progress",
  },
  {
    id: 171,
    issue: "Document cable routing for the sensor rail",
    description: "Add the final routing diagram and strain-relief callouts to the assembly instructions.",
    author: "Nora Patel",
    status: "not-started",
  },
  {
    id: 169,
    issue: "Recheck enclosure clearance at full travel",
    description: "Validate the revised enclosure against the arm sweep in the latest uploaded CAD model.",
    author: "Devon Lee",
    status: "not-started",
  },
  {
    id: 168,
    issue: "Show issue status inside entry review",
    description: "The review panel now surfaces the linked issue and current workflow status.",
    author: "Sara Kim",
    status: "resolved",
  },
  {
    id: 160,
    issue: "Warn about low stock before final assembly",
    description: "Inventory validation now runs before the last assembly step instead of after submission.",
    author: "Devon Lee",
    status: "resolved",
  },
];

export function createTeamIssues(team) {
  const teamName = team?.name || "Team";
  const baseId = Number(team?.id || 1) * 100;

  return [
    {
      id: baseId + 12,
      issue: `Review open assembly exceptions for ${teamName}`,
      description: "Confirm owners and next actions for the exceptions raised during the latest build review.",
      author: "Maya Owens",
      status: "not-started",
    },
    {
      id: baseId + 9,
      issue: "Resolve model approval handoff",
      description: "The approved model is not reaching the fabrication queue after the final review step.",
      author: "Riley Chen",
      status: "in-progress",
    },
    {
      id: baseId + 5,
      issue: "Confirm supplier response for revised hardware",
      description: "Procurement is waiting on lead-time confirmation before the replacement parts can be scheduled.",
      author: "Ian Brooks",
      status: "blocked",
    },
    {
      id: baseId + 2,
      issue: "Publish updated inspection checklist",
      description: `The revised checklist is available to everyone in ${teamName}.`,
      author: "Sara Kim",
      status: "resolved",
    },
  ];
}
