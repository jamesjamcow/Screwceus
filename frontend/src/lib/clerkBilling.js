export function hasPaidOrganizationPlan(sessionClaims) {
  const plans = sessionClaims?.pla;
  if (typeof plans !== "string") return false;

  return plans.split(",").some((plan) => {
    const [scope, slug] = plan.trim().split(":", 2);
    return scope === "o" && Boolean(slug) && slug.toLowerCase() !== "free";
  });
}
