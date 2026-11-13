/** Features of each plan that the server gates (mirrors src/hooks/usePlanRestrictions). */
export function planAllows(plan: string | null, feature: "whatsapp" | "icalExport" | "icalImport"): boolean {
  if (plan === "premium" || plan === "unverified") return true;
  if (plan === "pro") return feature !== "icalImport";
  return false;
}
