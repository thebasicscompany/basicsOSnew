const WIZARD_COMPLETED_KEY = (userId: number | string) =>
  `crm:wizard-completed-steps:${userId}`;

export function saveWizardCompletedSteps(
  userId: number | string,
  stepIds: string[],
) {
  try {
    localStorage.setItem(WIZARD_COMPLETED_KEY(userId), JSON.stringify(stepIds));
  } catch {
    // ignore
  }
}

export function readWizardCompletedSteps(
  userId: number | string,
): string[] {
  try {
    const raw = localStorage.getItem(WIZARD_COMPLETED_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}
